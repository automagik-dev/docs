#!/usr/bin/env node
// Proves a built docs site serves what docs.json promises, against a running Worker.
//
//   node scripts/verify-site.mjs <base-url>   check a running site (local or deployed)
//   node scripts/verify-site.mjs --serve      start `vite preview` on port 4173, check it, stop it
//
// Checks: every navigation page (hidden ones included) answers 200 at its href; every
// root-relative file those pages reference answers 200; _internal paths answer 404;
// /docs.zip, /llms.txt and /llms-full.txt hold no _internal content and the zip holds one
// entry per navigation page; the only holocron.so URL in the product landings is the
// powered-by link. Prints one line per failure and exits 1; exits 0 when all pass.
// Node 22 or later, no dependencies; `unzip` must be on PATH.

import { execFileSync, spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PREVIEW_PORT = 4173
const REQUEST_TIMEOUT_MS = 30_000
const CONCURRENCY = 8
const INTERNAL_PATHS = [
  '/genie/_internal/observability/detectors',
  '/genie/_internal/observability/detectors.md',
  '/genie/_internal/observability/detectors.mdx',
  '/genie/images/_internal/',
]
const LANDINGS = ['/genie', '/omni', '/rlmx']

const failures = []
const fail = (line) => failures.push(line)

function usage(message) {
  console.error(`verify-site: ${message}`)
  console.error('usage: node scripts/verify-site.mjs <base-url> | --serve')
  process.exit(2)
}

function navigationPages(docs) {
  const pages = new Set()
  const walk = (node, key) => {
    if (Array.isArray(node)) {
      for (const item of node) {
        if (typeof item === 'string' && key === 'pages') pages.add(item)
        else walk(item, key)
      }
    } else if (node && typeof node === 'object') {
      for (const [k, v] of Object.entries(node)) walk(v, k)
    }
  }
  walk(docs.navigation, 'navigation')
  return [...pages]
}

// holocron serves `<dir>/index` at `/<dir>`.
const hrefOf = (page) => `/${page.replace(/(^|\/)index$/, '')}`.replace(/\/$/, '') || '/'

async function request(base, pathname) {
  const res = await fetch(new URL(pathname, base), {
    redirect: 'manual',
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })
  return res
}

async function status(base, pathname) {
  try {
    const res = await request(base, pathname)
    await res.body?.cancel()
    return res.status
  } catch (error) {
    return `error ${error.cause?.code ?? error.name}`
  }
}

async function text(base, pathname) {
  try {
    const res = await request(base, pathname)
    return { status: res.status, body: await res.text() }
  } catch (error) {
    return { status: `error ${error.cause?.code ?? error.name}`, body: '' }
  }
}

async function pool(items, worker) {
  const queue = [...items]
  const run = async () => {
    while (queue.length) await worker(queue.shift())
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, queue.length) }, run))
}

const decodeEntities = (value) =>
  value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')

const isRootRelative = (url) => url.startsWith('/') && !url.startsWith('//')

// Root-relative URLs in src, poster and srcset, plus root-relative hrefs to a file.
function referencedFiles(html) {
  const files = new Set()
  for (const match of html.matchAll(/\s(src|poster|srcset|href)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi)) {
    const attribute = match[1].toLowerCase()
    const value = decodeEntities(match[2] ?? match[3] ?? '').trim()
    const urls = attribute === 'srcset' ? value.split(/,\s+/).map((candidate) => candidate.trim().split(/\s+/)[0]) : [value]
    for (const url of urls) {
      if (!url || !isRootRelative(url)) continue
      if (attribute === 'href') {
        const pathname = url.split(/[?#]/)[0]
        const last = pathname.slice(pathname.lastIndexOf('/') + 1)
        if (!/\.[a-z0-9]+$/i.test(last)) continue
      }
      files.add(url.split('#')[0])
    }
  }
  return files
}

async function checkSite(base, docs) {
  const pages = navigationPages(docs)
  if (pages.length === 0) fail('docs.json: no navigation pages found')
  const files = new Map() // url -> first page that references it

  await pool(pages, async (page) => {
    const href = hrefOf(page)
    const { status: code, body } = await text(base, href)
    if (code !== 200) return fail(`page ${href} (${page}): ${code}, expected 200`)
    for (const url of referencedFiles(body)) if (!files.has(url)) files.set(url, href)
  })

  await pool([...files.keys()], async (url) => {
    const code = await status(base, url)
    if (code !== 200) fail(`file ${url} (referenced on ${files.get(url)}): ${code}, expected 200`)
  })

  await pool(INTERNAL_PATHS, async (pathname) => {
    const code = await status(base, pathname)
    if (code !== 404) fail(`internal ${pathname}: ${code}, expected 404`)
  })

  await checkZip(base, pages)

  for (const pathname of ['/llms.txt', '/llms-full.txt']) {
    const { status: code, body } = await text(base, pathname)
    if (code !== 200) fail(`${pathname}: ${code}, expected 200`)
    else if (body.includes('_internal')) fail(`${pathname}: mentions _internal`)
  }

  const poweredBy = [docs.poweredBy ?? []].flat().map((link) => link.url)
  for (const landing of LANDINGS) {
    const { status: code, body } = await text(base, landing)
    if (code !== 200) {
      fail(`landing ${landing}: ${code}, expected 200`)
      continue
    }
    const html = body.replaceAll('\\/', '/')
    for (const match of html.matchAll(/(?:https?:)?\/\/(?:[a-z0-9-]+\.)*holocron\.so(?![a-z0-9.-])[^\s"'<>\\)]*/gi)) {
      const url = match[0].replace(/\/$/, '')
      if (!poweredBy.includes(url)) fail(`landing ${landing}: holocron.so URL outside the powered-by link: ${match[0]}`)
    }
    if (!poweredBy.some((url) => html.includes(`href="${url}"`))) fail(`landing ${landing}: powered-by link missing`)
  }

  return { pages: pages.length, files: files.size }
}

async function checkZip(base, pages) {
  let res
  try {
    res = await request(base, '/docs.zip')
  } catch (error) {
    return fail(`/docs.zip: error ${error.cause?.code ?? error.name}`)
  }
  if (res.status !== 200) {
    await res.body?.cancel()
    return fail(`/docs.zip: ${res.status}, expected 200`)
  }
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'verify-site-'))
  try {
    const zip = path.join(dir, 'docs.zip')
    fs.writeFileSync(zip, Buffer.from(await res.arrayBuffer()))
    const entries = execFileSync('unzip', ['-Z1', zip], { encoding: 'utf8' })
      .split('\n')
      .filter((entry) => entry && !entry.endsWith('/'))
    for (const entry of entries) if (entry.includes('_internal')) fail(`/docs.zip: holds ${entry}`)
    const byPage = new Map(pages.map((page) => [page, 0]))
    for (const entry of entries) {
      const page = entry.replace(/\.mdx?$/, '')
      if (byPage.has(page)) byPage.set(page, byPage.get(page) + 1)
      else if (!entry.includes('_internal')) fail(`/docs.zip: holds ${entry}, which is not a navigation page`)
    }
    for (const [page, count] of byPage) if (count !== 1) fail(`/docs.zip: ${count} entries for ${page}, expected 1`)
  } catch (error) {
    fail(`/docs.zip: could not list entries (${error.message.split('\n')[0]})`)
  } finally {
    fs.rmSync(dir, { recursive: true, force: true })
  }
}

function startPreview() {
  const child = spawn('npx', ['vite', 'preview', '--port', String(PREVIEW_PORT), '--strictPort'], {
    cwd: ROOT,
    detached: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  let output = ''
  child.stdout.on('data', (chunk) => (output += chunk))
  child.stderr.on('data', (chunk) => (output += chunk))
  const exited = new Promise((resolve) => child.once('exit', (code) => resolve(code ?? 'signal')))
  const stop = async () => {
    if (child.exitCode !== null || child.signalCode !== null) return
    try {
      process.kill(-child.pid, 'SIGTERM')
    } catch {}
    const timer = setTimeout(() => {
      try {
        process.kill(-child.pid, 'SIGKILL')
      } catch {}
    }, 5_000)
    await exited
    clearTimeout(timer)
  }
  return { exited, stop, output: () => output }
}

async function waitFor(base, pathname, exited, timeoutMs) {
  const deadline = Date.now() + timeoutMs
  let early = null
  exited.then((code) => (early = code))
  while (Date.now() < deadline) {
    if (early !== null) return `preview exited with ${early} before ${pathname} answered`
    if ((await status(base, pathname)) === 200) return null
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  return `${pathname} did not answer 200 within ${timeoutMs / 1000}s`
}

async function main() {
  const args = process.argv.slice(2)
  const serve = args.includes('--serve')
  const unknown = args.filter((arg) => arg.startsWith('--') && arg !== '--serve')
  const positional = args.filter((arg) => !arg.startsWith('--'))
  if (unknown.length) usage(`unknown flag ${unknown[0]}`)
  if (serve === (positional.length === 1) || positional.length > 1) usage('give exactly one of <base-url> or --serve')

  const docs = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs.json'), 'utf8'))
  let base = positional[0]
  let preview = null
  if (serve) {
    base = `http://localhost:${PREVIEW_PORT}`
    preview = startPreview()
    const onSignal = () => preview.stop().then(() => process.exit(130))
    process.once('SIGINT', onSignal)
    process.once('SIGTERM', onSignal)
    const problem = await waitFor(base, '/genie', preview.exited, 90_000)
    if (problem) {
      await preview.stop()
      console.error(preview.output().trimEnd())
      console.error(`FAIL serve: ${problem}`)
      process.exit(1)
    }
  } else {
    try {
      base = new URL(base).href
    } catch {
      usage(`not a URL: ${base}`)
    }
  }

  let summary
  try {
    summary = await checkSite(base, docs)
  } finally {
    await preview?.stop()
  }

  for (const line of failures) console.error(`FAIL ${line}`)
  if (failures.length) {
    console.error(`verify-site: ${failures.length} failure${failures.length === 1 ? '' : 's'} against ${base}`)
    process.exit(1)
  }
  console.log(
    `verify-site: ok against ${base}: ${summary.pages} navigation pages 200, ${summary.files} referenced files 200, ` +
      `${INTERNAL_PATHS.length} _internal paths 404, docs.zip/llms clean, holocron.so only in powered-by`,
  )
}

await main()
