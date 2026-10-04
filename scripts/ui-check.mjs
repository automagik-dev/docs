#!/usr/bin/env node
// Proves in a real browser that the Automagik brand lands on holocron's markup.
//
//   node scripts/ui-check.mjs <base-url> [flags]   check a running site (local or deployed)
//   node scripts/ui-check.mjs --serve [flags]      start `vite preview` on port 4174, check it, stop it
//
// Flags: --engine chromium|firefox|webkit (default chromium); --pet adds the pet group; --all
// runs every check group this script knows. The brand group always runs: on /genie, /omni and
// /rlmx at 1440x900 it checks the body surface, text color and font, the code font, --primary,
// and that the header and footer logos carry no filter; it then runs every CSS canary whose
// action is available. The pet group, on two pages per product, checks that exactly one pet
// shows and stays through client navigation, that a click or Enter on it opens holocron's chat
// drawer and a second one closes it, the lamp hero on /genie, the neutral pose under reduced
// motion, and one <html> per document; it also makes the open-drawer canaries available.
// Every page fails on a console error, a hydration warning or a same-origin HTTP error.
//
// Canaries: each rule in style.css that reaches into holocron's markup carries a
// `/* holocron-internal: <id> */` tag, and CANARIES holds one entry per tag. A canary's
// selector must appear in its tagged rule's selector, so renaming a hook in style.css fails
// here; after its action, the selector (minus the pseudo-classes and pseudo-elements a query
// cannot match) must match at least one element on its page, so a holocron upgrade that
// renames a hook fails here too. A tag without a canary, or a canary without a tag, fails.
//
// Screenshots go to .ui-check/. Prints one line per failure and exits 1; exits 0 when all
// pass; exits 2 on a usage error. Node 22 or later; needs `npx playwright install <engine>`.

import { spawn } from 'node:child_process'
import fs from 'node:fs'
import net from 'node:net'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium, firefox, webkit } from 'playwright'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SHOTS = path.join(ROOT, '.ui-check')
const PREVIEW_PORT = 4174
const VIEWPORT = { width: 1440, height: 900 }
const NAV_TIMEOUT_MS = 60_000
const ENGINES = { chromium, firefox, webkit }
const LANDINGS = ['/genie', '/omni', '/rlmx']
const PET_PAGES = ['/genie', '/genie/quickstart', '/omni', '/omni/quickstart', '/rlmx', '/rlmx/quickstart']
const PET_VISIBLE_MS = 8_000 // the hero hands the Genie over, or the pet shows after 6 s
const DRAWER_MS = 5_000
const NOT_FOUND_PAGE = '/genie/no-such-page'

const BRAND = {
  background: 'rgb(11, 11, 18)', // #0B0B12
  text: 'rgb(232, 230, 240)', // #E8E6F0
  primary: '#ff3ff5',
}

// `selector` is copied from the tagged rule. Selectors that only match after a chat answer are
// checked through their structural container (.slot-aside, .holocron-chat-drawer-messages).
const TOKEN = (...kinds) => kinds.map((kind) => `figure[class~="group/code"] .token.${kind}`).join(', ')
const CANARIES = [
  { id: 'link', selector: '.slot-main a[style*="var(--primary)"]', page: '/genie', action: 'none' },
  { id: 'link-hover', selector: '.slot-main a[style*="var(--primary)"]:hover', page: '/genie', action: 'none' },
  { id: 'inline-code', selector: '.slot-main code:not(pre code)', page: '/genie', action: 'none' },
  {
    id: 'heading-code',
    selector: '.slot-main h1 code:not(pre code), .slot-main h2 code:not(pre code)',
    page: '/genie/quickstart',
    action: 'none',
  },
  { id: 'code-frame', selector: 'figure[class~="group/code"]', page: '/genie', action: 'none' },
  { id: 'code-frame-bar', selector: 'figure[class~="group/code"]::before', page: '/genie', action: 'none' },
  { id: 'code-text', selector: 'figure[class~="group/code"] code', page: '/genie', action: 'none' },
  { id: 'token-cyan', selector: TOKEN('function', 'class-name', 'method', 'builtin'), page: '/genie', action: 'none' },
  {
    id: 'token-magenta',
    selector: TOKEN('keyword', 'parameter', 'operator', 'important', 'property', 'tag'),
    page: '/genie',
    action: 'none',
  },
  {
    id: 'token-amber',
    selector: TOKEN('string', 'url', 'attr-value', 'number', 'boolean', 'constant'),
    page: '/omni',
    action: 'none',
  },
  { id: 'token-dim', selector: TOKEN('comment', 'prolog', 'punctuation'), page: '/genie/installation', action: 'none' },
  {
    id: 'steps-badge',
    selector: 'li[class*="counter-increment"] div[class*="size-7"][class*="rounded-full"]',
    page: '/genie/quickstart',
    action: 'none',
  },
  {
    id: 'callout',
    selector: '.slot-main div[style*="color-mix(in srgb, var(--background) 9"]',
    page: '/genie/installation',
    action: 'none',
  },
  {
    id: 'callout-body',
    selector: '.slot-main div[style*="color-mix(in srgb, var(--background) 9"] > :not(:first-child)',
    page: '/genie/installation',
    action: 'none',
  },
  { id: 'frame', selector: '[data-name="frame"]', page: '/genie/quickstart', action: 'none' },
  {
    id: 'frame-caption',
    selector: '[data-name="frame"] [data-component-part="frame-description"]',
    page: '/genie/quickstart',
    action: 'none',
  },
  { id: 'card-hover', selector: '[class~="group/card"]:has(a):hover', page: '/genie', action: 'none' },
  { id: 'table-head', selector: '.slot-main thead [data-slot="table-cell"]', page: '/genie', action: 'none' },
  { id: 'table-row', selector: '.slot-main [data-slot="table-row"]', page: '/genie', action: 'none' },
  {
    id: 'sidebar-group-label',
    selector:
      '.slot-sidebar-nav div[style*="text-transform:uppercase"], .slot-sidebar-nav div[style*="text-transform: uppercase"]',
    page: '/genie',
    action: 'none',
  },
  { id: 'sidebar-current', selector: '.slot-sidebar-nav a[aria-current="page"]', page: '/genie', action: 'none' },
  { id: 'navbar-primary', selector: '.slot-navbar-primary', page: '/genie', action: 'none' },
  {
    id: 'skill-slash',
    selector:
      '.slot-page:has(.slot-sidebar-nav a[aria-current="page"][href^="/genie/skills/"]) h1.editorial-h1 > span:first-child::before',
    page: '/genie/skills/wish',
    action: 'none',
  },
  { id: 'logo', selector: '.slot-logo img', page: '/genie', action: 'none' },
  { id: 'chat-drawer-panel', selector: '.holocron-chat-drawer-panel', page: '/genie', action: 'open-drawer' },
  { id: 'chat-inline-code', selector: '.slot-aside', page: '/genie', action: 'none' },
  { id: 'chat-link', selector: '.holocron-chat-drawer-messages', page: '/genie', action: 'open-drawer' },
  { id: 'chat-link-hover', selector: '.holocron-chat-drawer-messages', page: '/genie', action: 'open-drawer' },
]

// Optional check groups, each also run by --all. Later wishes add theirs here.
const GROUPS = { pet: { run: checkPet } }

const failures = []
const fail = (line) => failures.push(line)

function usage(message) {
  console.error(`ui-check: ${message}`)
  console.error(
    `usage: node scripts/ui-check.mjs <base-url> | --serve [--engine chromium|firefox|webkit] ${Object.keys(GROUPS)
      .map((group) => `[--${group}] `)
      .join('')}[--all]`,
  )
  process.exit(2)
}

const normalize = (selector) => selector.replace(/\s+/g, ' ').replace(/\s*,\s*/g, ', ').trim()
const UNQUERYABLE = /::?(?:hover|focus-visible|focus-within|focus|active|visited|before|after)(?![\w-])/g
const queryable = (selector) => selector.replace(UNQUERYABLE, '')

// The tag ids in style.css, each with the selector of the rule it precedes.
function cssTags() {
  const css = fs.readFileSync(path.join(ROOT, 'style.css'), 'utf8')
  const tags = new Map()
  const tagged = [...css.matchAll(/\/\*\s*holocron-internal:\s*([^\s*]+)\s*\*\/\s*([^{}]+?)\s*\{/g)]
  const written = css.match(/holocron-internal:/g)?.length ?? 0
  if (written !== tagged.length) fail(`style.css: ${written - tagged.length} holocron-internal tag(s) not followed by a rule`)
  for (const [, id, selector] of tagged) {
    if (tags.has(id)) fail(`style.css: tag ${id} appears more than once`)
    tags.set(id, normalize(selector))
  }
  return tags
}

function checkTags() {
  const tags = cssTags()
  const ids = new Set(CANARIES.map((canary) => canary.id))
  if (ids.size !== CANARIES.length) fail('canaries: duplicate id')
  for (const id of tags.keys()) if (!ids.has(id)) fail(`style.css: tag ${id} has no canary`)
  for (const canary of CANARIES) {
    const rule = tags.get(canary.id)
    if (rule === undefined) fail(`canary ${canary.id}: no holocron-internal tag in style.css`)
    else if (!rule.includes(normalize(canary.selector)))
      fail(`canary ${canary.id}: selector ${canary.selector} is not in its tagged rule (${rule})`)
  }
}

const slug = (pathname) => pathname.replace(/^\//, '').replaceAll('/', '-') || 'root'

async function openPage(browser, base, pathname, { waitUntil = 'networkidle', ...contextOptions } = {}) {
  const context = await browser.newContext({ viewport: VIEWPORT, ...contextOptions })
  const page = await context.newPage()
  const errors = []
  const origin = new URL(base).origin
  page.on('console', (message) => {
    const text = message.text()
    if (message.type() === 'error') errors.push(text)
    else if (/hydrat/i.test(text)) errors.push(`hydration ${message.type()}: ${text}`)
  })
  page.on('pageerror', (error) => errors.push(`uncaught ${error.message}`))
  page.on('response', (res) => {
    if (res.status() >= 400 && new URL(res.url()).origin === origin) errors.push(`HTTP ${res.status()} for ${res.url()}`)
  })
  const res = await page.goto(new URL(pathname, base).href, { waitUntil, timeout: NAV_TIMEOUT_MS })
  if (res?.status() !== 200) fail(`${pathname}: answered ${res?.status()}, expected 200`)
  await page.evaluate(() => document.fonts.ready)
  const close = async () => {
    for (const error of errors) fail(`${pathname}: console ${error.split('\n')[0].slice(0, 240)}`)
    await context.close()
  }
  return { page, html: (await res?.text()) ?? '', close }
}

async function checkLanding(browser, base, engine, pathname, codeFonts) {
  const { page, close } = await openPage(browser, base, pathname)
  try {
    const seen = await page.evaluate(() => {
      const body = getComputedStyle(document.body)
      const code = document.querySelector('pre code')
      const header = document.querySelector('.slot-logo img')
      const footer = document.querySelector('footer img[src$="/brand/genie-logo.png"]')
      return {
        background: body.backgroundColor,
        text: body.color,
        font: body.fontFamily,
        code: code ? getComputedStyle(code).fontFamily : null,
        primary: getComputedStyle(document.documentElement).getPropertyValue('--primary').trim(),
        header: header ? { src: header.getAttribute('src'), filter: getComputedStyle(header).filter } : null,
        footer: footer ? getComputedStyle(footer).filter : null,
      }
    })
    if (seen.background !== BRAND.background) fail(`${pathname}: body background ${seen.background}, expected ${BRAND.background}`)
    if (seen.text !== BRAND.text) fail(`${pathname}: body color ${seen.text}, expected ${BRAND.text}`)
    if (!/^"?Geist"?(,|$)/.test(seen.font)) fail(`${pathname}: body font-family ${seen.font}, expected Geist first`)
    if (seen.code !== null) {
      codeFonts.push(pathname)
      if (!seen.code.startsWith('"JetBrains Mono"')) fail(`${pathname}: pre code font-family ${seen.code}, expected "JetBrains Mono" first`)
    }
    if (seen.primary.toLowerCase() !== BRAND.primary) fail(`${pathname}: --primary ${seen.primary}, expected ${BRAND.primary}`)
    if (!seen.header) fail(`${pathname}: no header logo (.slot-logo img)`)
    else {
      if (seen.header.src !== '/brand/genie-logo.png') fail(`${pathname}: header logo ${seen.header.src}, expected /brand/genie-logo.png`)
      if (seen.header.filter !== 'none') fail(`${pathname}: header logo filter ${seen.header.filter}, expected none`)
    }
    if (seen.footer === null) fail(`${pathname}: no footer logo (footer img[src$="/brand/genie-logo.png"])`)
    else if (seen.footer !== 'none') fail(`${pathname}: footer logo filter ${seen.footer}, expected none`)
    await page.screenshot({ path: path.join(SHOTS, `${engine}-brand-${slug(pathname)}.png`) })
  } finally {
    await close()
  }
}

// Canary actions; a canary whose action is not available is reported as deferred, never passed.
const ACTIONS = {
  none: { available: () => true, run: async () => {} },
  'open-drawer': { available: (groups) => groups.has('pet'), run: openDrawer, deferredTo: '--pet' },
}

// Click the pet and wait for holocron's chat drawer, the same click a visitor makes.
async function openDrawer(page) {
  const pet = page.locator('.genie-pet.is-visible')
  await pet.waitFor({ timeout: PET_VISIBLE_MS })
  await pet.click()
  await page.locator('.holocron-chat-drawer-panel').waitFor({ timeout: DRAWER_MS })
}

async function checkCanaries(browser, base, groups) {
  const runnable = CANARIES.filter((canary) => ACTIONS[canary.action]?.available(groups))
  const deferred = CANARIES.filter((canary) => !runnable.includes(canary))
  for (const canary of deferred) if (!ACTIONS[canary.action]) fail(`canary ${canary.id}: unknown action ${canary.action}`)

  const visits = new Map() // `${page} ${action}` -> canaries
  for (const canary of runnable) {
    const key = `${canary.page} ${canary.action}`
    visits.set(key, [...(visits.get(key) ?? []), canary])
  }
  for (const canaries of visits.values()) {
    const { page: pathname, action } = canaries[0]
    const { page, close } = await openPage(browser, base, pathname)
    try {
      await ACTIONS[action].run(page)
      const counts = await page.evaluate(
        (selectors) =>
          selectors.map((selector) => {
            try {
              return document.querySelectorAll(selector).length
            } catch (error) {
              return `invalid selector (${error.message})`
            }
          }),
        canaries.map((canary) => queryable(canary.selector)),
      )
      canaries.forEach((canary, i) => {
        if (counts[i] === 0) fail(`canary ${canary.id}: ${queryable(canary.selector)} matches nothing on ${pathname}`)
        else if (typeof counts[i] !== 'number') fail(`canary ${canary.id}: ${counts[i]}`)
      })
    } catch (error) {
      fail(`canaries on ${pathname} (${action}): ${error.message.split('\n')[0]}`)
    } finally {
      await close()
    }
  }
  return { matched: runnable.length, deferred }
}

// One pass of activate (click or Enter) must open the drawer and a second one close it.
async function checkToggle(page, pathname, how, activate) {
  const pet = page.locator('.genie-pet')
  const panel = page.locator('.holocron-chat-drawer-panel')
  for (const [expanded, state] of [['true', 'visible'], ['false', 'detached']]) {
    await activate(pet)
    try {
      await panel.waitFor({ state, timeout: DRAWER_MS })
    } catch {
      return fail(`${pathname}: ${how} did not ${expanded === 'true' ? 'open' : 'close'} the chat drawer`)
    }
    const aria = await pet.getAttribute('aria-expanded')
    if (aria !== expanded) return fail(`${pathname}: after ${how} aria-expanded is ${aria}, expected ${expanded}`)
  }
}

async function checkPetPage(browser, base, engine, pathname) {
  const { page, html, close } = await openPage(browser, base, pathname, { waitUntil: 'load' })
  try {
    const htmlTags = html.match(/<html[\s>]/gi)?.length ?? 0
    if (htmlTags !== 1) fail(`${pathname}: ${htmlTags} <html> elements in the document, expected 1`)
    if (pathname === '/genie' && (await page.locator('[data-genie-hero]').count()) !== 1) fail('/genie: no lamp hero ([data-genie-hero])')
    try {
      await page.locator('.genie-pet.is-visible').waitFor({ timeout: PET_VISIBLE_MS })
    } catch {
      return fail(`${pathname}: no visible pet within ${PET_VISIBLE_MS / 1000}s`)
    }
    const pets = await page.locator('.genie-pet').count()
    if (pets !== 1) fail(`${pathname}: ${pets} pets, expected 1`)
    await page.screenshot({ path: path.join(SHOTS, `${engine}-pet-${slug(pathname)}.png`) })

    await checkToggle(page, pathname, 'a click', (pet) => pet.click())
    await checkToggle(page, pathname, 'Enter', async (pet) => {
      await pet.focus()
      await page.keyboard.press('Enter')
    })

    // Client navigation through the sidebar keeps the one pet and its link to the chat.
    await page.evaluate(() => {
      window.__uiCheckSameDocument = true
    })
    const link = page.locator('.slot-sidebar-nav a[href^="/"]:not([aria-current="page"]):not([href*="#"])').first()
    const href = await link.getAttribute('href')
    await link.click()
    await page.waitForURL((url) => url.pathname === href, { timeout: NAV_TIMEOUT_MS })
    await page.waitForTimeout(1_000)
    if (!(await page.evaluate(() => window.__uiCheckSameDocument))) fail(`${pathname}: the sidebar link to ${href} reloaded the page`)
    const after = await page.locator('.genie-pet').count()
    const visible = await page.locator('.genie-pet.is-visible').count()
    if (after !== 1 || visible !== 1) fail(`${pathname}: after navigating to ${href}, ${after} pets and ${visible} visible, expected 1 and 1`)
    else await checkToggle(page, `${pathname} -> ${href}`, 'a click', (pet) => pet.click())
  } catch (error) {
    fail(`${pathname}: pet ${error.message.split('\n')[0]}`)
  } finally {
    await close()
  }
}

async function checkPet(browser, base, engine) {
  for (const pathname of PET_PAGES) await checkPetPage(browser, base, engine, pathname)

  // Reduced motion: the hero shows its settled frame and the pet its neutral pose at once.
  const reduced = await openPage(browser, base, '/genie', { waitUntil: 'load', reducedMotion: 'reduce' })
  try {
    await reduced.page.locator('.genie-pet.is-visible').waitFor({ timeout: PET_VISIBLE_MS })
    const clip = await reduced.page.locator('.genie-pet').getAttribute('data-clip')
    if (clip !== 'neutral') fail(`/genie with reduced motion: pet data-clip ${clip}, expected neutral`)
  } catch (error) {
    fail(`/genie with reduced motion: ${error.message.split('\n')[0]}`)
  } finally {
    await reduced.close()
  }

  // The drawer, open beside the docked pet.
  const drawer = await openPage(browser, base, '/genie/quickstart', { waitUntil: 'load' })
  try {
    await openDrawer(drawer.page)
    await drawer.page.waitForTimeout(1_500) // the pet docks beside the panel
    await drawer.page.screenshot({ path: path.join(SHOTS, `${engine}-pet-drawer.png`) })
  } catch (error) {
    fail(`/genie/quickstart drawer: ${error.message.split('\n')[0]}`)
  } finally {
    await drawer.close()
  }

  // A route with no page still gets holocron's not-found document, and only one <html>.
  const res = await fetch(new URL(NOT_FOUND_PAGE, base), { headers: { accept: 'text/html' }, redirect: 'manual' })
  const body = await res.text()
  const notFoundHtml = body.match(/<html[\s>]/gi)?.length ?? 0
  if (res.status !== 404 || notFoundHtml !== 1 || !body.includes('Page not found'))
    fail(`${NOT_FOUND_PAGE}: ${res.status} with ${notFoundHtml} <html> elements, expected 404 with holocron's not-found page`)

  return `pet ${PET_PAGES.length} pages, reduced motion, 404 shell`
}

// True when anything accepts a TCP connection on the preview port, over IPv4 or IPv6.
async function portTaken() {
  const answers = (host) =>
    new Promise((resolve) => {
      const socket = net.connect({ host, port: PREVIEW_PORT })
      socket.setTimeout(2_000)
      socket.once('connect', () => (socket.destroy(), resolve(true)))
      socket.once('timeout', () => (socket.destroy(), resolve(false)))
      socket.once('error', () => resolve(false))
    })
  return (await Promise.all(['127.0.0.1', '::1'].map(answers))).some(Boolean)
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
    try {
      const res = await fetch(new URL(pathname, base), { redirect: 'manual', signal: AbortSignal.timeout(5_000) })
      await res.body?.cancel()
      if (res.status === 200) return null
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  return `${pathname} did not answer 200 within ${timeoutMs / 1000}s`
}

function parseArgs(args) {
  const options = { serve: false, engine: 'chromium', groups: new Set(), base: null }
  const positional = []
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg === '--serve') options.serve = true
    else if (arg === '--all') for (const group of Object.keys(GROUPS)) options.groups.add(group)
    else if (arg === '--engine') {
      options.engine = args[++i]
      if (!ENGINES[options.engine]) usage(`unknown engine ${options.engine}`)
    } else if (arg.startsWith('--') && GROUPS[arg.slice(2)]) options.groups.add(arg.slice(2))
    else if (arg.startsWith('--')) usage(`unknown flag ${arg}`)
    else positional.push(arg)
  }
  if (options.serve === (positional.length === 1) || positional.length > 1) usage('give exactly one of <base-url> or --serve')
  if (!options.serve) {
    try {
      options.base = new URL(positional[0]).href
    } catch {
      usage(`not a URL: ${positional[0]}`)
    }
  }
  return options
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  checkTags()

  let base = options.base
  let preview = null
  if (options.serve) {
    base = `http://localhost:${PREVIEW_PORT}`
    if (await portTaken()) {
      console.error(`ui-check: port ${PREVIEW_PORT} is already in use; stop that server or pass its URL instead of --serve`)
      process.exit(2)
    }
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
  }

  fs.mkdirSync(SHOTS, { recursive: true })
  const summary = []
  let browser
  try {
    browser = await ENGINES[options.engine].launch()
    const codeFonts = []
    for (const landing of LANDINGS) await checkLanding(browser, base, options.engine, landing, codeFonts)
    if (codeFonts.length === 0) fail(`no code block on ${LANDINGS.join(', ')}, so the code font went unchecked`)
    const missing = LANDINGS.filter((landing) => !codeFonts.includes(landing))
    summary.push(`brand ${LANDINGS.length} landings${missing.length ? ` (no code block on ${missing.join(', ')})` : ''}`)
    const { matched, deferred } = await checkCanaries(browser, base, options.groups)
    summary.push(`${matched} canaries matched`)
    if (deferred.length) {
      summary.push(
        `${deferred.length} deferred (${deferred.map((canary) => `${canary.id} to ${ACTIONS[canary.action]?.deferredTo}`).join(', ')})`,
      )
    }
    for (const group of options.groups) summary.push(await GROUPS[group].run(browser, base, options.engine))
  } catch (error) {
    fail(`run: ${error.message.split('\n')[0]}`)
  } finally {
    await browser?.close()
    await preview?.stop()
  }

  for (const line of failures) console.error(`FAIL ${line}`)
  if (failures.length) {
    console.error(`ui-check: ${failures.length} failure${failures.length === 1 ? '' : 's'} against ${base} (${options.engine})`)
    process.exit(1)
  }
  console.log(`ui-check: ok against ${base} (${options.engine}): ${summary.join('; ')}`)
}

await main()
