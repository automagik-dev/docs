#!/usr/bin/env node
// Proves in a real browser that the Automagik brand lands on holocron's markup.
//
//   node scripts/ui-check.mjs <base-url> [flags]   check a running site (local or deployed)
//   node scripts/ui-check.mjs --serve [flags]      start `vite preview` on port 4174, check it, stop it
//
// Flags: --engine chromium|firefox|webkit (default chromium); --pet, --meta and --products add
// those groups; --all runs every check group this script knows. The brand group always runs: on
// /genie, /omni and /rlmx at 1440x900 it checks the body surface, text color and font, the code
// font, --primary, and that the header and footer logos carry no filter; it then runs every CSS
// canary whose action is available. The pet group, on two pages per product, checks that
// exactly one pet shows and stays through client navigation, that a click or Enter on it opens
// holocron's chat drawer and a second one closes it, the lamp hero on /genie, the neutral pose
// under reduced motion, that a question the site refuses (70 KB, which src/chat-guard.ts
// answers 413) shows the guard's message in the drawer and plays the pet's failed pose, and
// one <html> per document; it also makes the open-drawer canaries available.
// Every page fails on a console error (but, in WebKit, the upstream ones UPSTREAM_CONSOLE_ERRORS
// names), a hydration warning or a same-origin HTTP error (but the 413 the failed-pose check
// provokes).
// The meta group reads the raw HTML of each docs.json product's landing and one deep page:
// <meta charset> ends within the first 1024 bytes, <html data-product> names the product, the
// logo-link head script is there once, and exactly one og:image and one twitter:image point at
// the product's logo on the site's own origin, which answers 200 with the PNG in public/brand/;
// no meta tag points at the chat gateway, and the page's RSC payload carries none of the HTML
// rewrites. The products group, on the deep pages: the header logos differ pairwise and the
// footer's (AUTOMAGIK) differs from Genie's, no header, footer or switcher logo carries a
// filter, the native "Select section" pill is hidden and one logo menu shows instead, listing
// every product by its logo with the current one selected; once React has taken over the head,
// the live document holds exactly one og:image and one twitter:image, on the product's logo;
// Omni chosen by mouse and then mikro by keyboard navigate without a reload and swap
// data-product, the header logo and both share images; and on each product's deep page the
// header logo's href is the product's folder URL and a click on it lands there, showing the
// landing's own <h1>, once before hydration (every built script answered as an empty module)
// and once after it.
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
const QUIET_MS = 500 // Playwright's networkidle window
const ENGINES = { chromium, firefox, webkit }
const LANDINGS = ['/genie', '/omni', '/rlmx']
const PET_PAGES = ['/genie', '/genie/quickstart', '/omni', '/omni/quickstart', '/rlmx', '/rlmx/quickstart']
const PET_VISIBLE_MS = 8_000 // the hero hands the Genie over, or the pet shows after 6 s
const DRAWER_MS = 5_000
const FAILED_MS = 10_000 // the refused request, then the pet's one pass of its failed clip
const CHAT_PATH = '/holocron-api/chat'
const CHAT_TOO_LONG = 'Your question is too long. Please shorten it and ask again.' // src/chat-guard.ts
const NOT_FOUND_PAGE = '/genie/no-such-page'

// The products, read from docs.json the way src/server.tsx reads them: the first navigation
// page is the landing (holocron 308s `<folder>/index` to the folder URL) and the lowercased
// name is the slug. The deep page is the product's quickstart, or the page after its landing.
const DOCS = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs.json'), 'utf8'))
const PRODUCTS = DOCS.navigation.products.map(({ product, groups }) => {
  const pages = groups.flatMap((group) => group.pages ?? []).filter((page) => typeof page === 'string')
  const landing = `/${pages[0]}`
  const folder = landing.split('/')[1]
  const deep = pages.includes(`${folder}/quickstart`) ? `/${folder}/quickstart` : `/${pages[1]}`
  return { name: product, slug: product.toLowerCase(), landing, folderUrl: landing.replace(/\/index$/, ''), deep }
})
const productPage = (slug) => PRODUCTS.find((product) => product.slug === slug)?.folderUrl ?? `/no-product-${slug}`
const GATEWAY_ORIGIN = fs.readFileSync(path.join(ROOT, 'vite.config.ts'), 'utf8').match(/GATEWAY_ORIGIN = '([^']+)'/)?.[1]

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
  { id: 'logo-omni', selector: 'html[data-product="omni"] .slot-logo img', page: productPage('omni'), action: 'none' },
  { id: 'logo-mikro', selector: 'html[data-product="mikro"] .slot-logo img', page: productPage('mikro'), action: 'none' },
  { id: 'switcher-pill', selector: 'div:has(> select[data-genie-logos])', page: productPage('genie'), action: 'switcher' },
  { id: 'chat-drawer-panel', selector: '.holocron-chat-drawer-panel', page: '/genie', action: 'open-drawer' },
  { id: 'chat-inline-code', selector: '.slot-aside', page: '/genie', action: 'none' },
  { id: 'chat-link', selector: '.holocron-chat-drawer-messages', page: '/genie', action: 'open-drawer' },
  { id: 'chat-link-hover', selector: '.holocron-chat-drawer-messages', page: '/genie', action: 'open-drawer' },
]

// Optional check groups, each also run by --all. Later wishes add theirs here.
const GROUPS = { pet: { run: checkPet }, meta: { run: checkMeta }, products: { run: checkProducts } }

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

// Console errors that WebKit alone reports, from upstream holocron 0.36.0 markup, present before
// docs-holocron-products: its side nav passes size='var(--sidebar-icon-size)' to an <svg> as
// width and height attributes, and its document head carries <link rel="preload" as="stylesheet">.
// Each is matched on its exact text, in WebKit only; every other console error, and these in any
// other engine, still fails the page.
const UPSTREAM_CONSOLE_ERRORS = new Set([
  'Error: Invalid value for <svg> attribute width="var(--sidebar-icon-size)"',
  'Error: Invalid value for <svg> attribute height="var(--sidebar-icon-size)"',
  '<link rel=preload> must have a valid `as` value',
])

// `allowHttp` lists the same-origin error answers a check provokes on purpose, as
// { status, pathname }; each is excused both as a response and as the browser's console line
// about it.
async function openPage(browser, base, pathname, { waitUntil = 'networkidle', prepare, allowHttp = [], ...contextOptions } = {}) {
  const context = await browser.newContext({ viewport: VIEWPORT, ...contextOptions })
  await prepare?.(context)
  const page = await context.newPage()
  const errors = []
  const upstream = browser.browserType().name() === 'webkit' ? UPSTREAM_CONSOLE_ERRORS : new Set()
  const origin = new URL(base).origin
  const provoked = (status, url) => {
    try {
      const { origin: from, pathname: at } = new URL(url)
      return from === origin && allowHttp.some((allowed) => allowed.status === status && allowed.pathname === at)
    } catch {
      return false
    }
  }
  page.on('console', (message) => {
    const text = message.text()
    if (message.type() === 'error') {
      const status = /^Failed to load resource: the server responded with a status of (\d+)/.exec(text)?.[1]
      if (status && provoked(Number(status), message.location().url)) return
      if (!upstream.has(text)) errors.push(text)
    } else if (/hydrat/i.test(text)) errors.push(`hydration ${message.type()}: ${text}`)
  })
  page.on('pageerror', (error) => errors.push(`uncaught ${error.message}`))
  page.on('response', (res) => {
    if (res.status() >= 400 && new URL(res.url()).origin === origin && !provoked(res.status(), res.url()))
      errors.push(`HTTP ${res.status()} for ${res.url()}`)
  })
  // Playwright's networkidle never comes in Firefox on a page with a <video>: Firefox keeps the
  // media request open once it has buffered enough. So 'networkidle' here is load, then the same
  // quiet window over every request but media, in every engine.
  const inflight = new Set()
  page.on('request', (req) => req.resourceType() !== 'media' && inflight.add(req))
  page.on('requestfinished', (req) => inflight.delete(req))
  page.on('requestfailed', (req) => inflight.delete(req))
  const idle = waitUntil === 'networkidle'
  const res = await page.goto(new URL(pathname, base).href, { waitUntil: idle ? 'load' : waitUntil, timeout: NAV_TIMEOUT_MS })
  if (idle) {
    const deadline = Date.now() + NAV_TIMEOUT_MS
    let quietSince = Date.now()
    while (Date.now() - quietSince < QUIET_MS) {
      if (Date.now() > deadline) throw new Error(`${pathname}: the network never went quiet`)
      if (inflight.size) quietSince = Date.now()
      await new Promise((resolve) => setTimeout(resolve, 50))
    }
  }
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
      // WebKit serializes family names without quotes, as the body check above allows.
      if (!/^"?JetBrains Mono"?(,|$)/.test(seen.code)) fail(`${pathname}: pre code font-family ${seen.code}, expected "JetBrains Mono" first`)
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
  switcher: { available: () => true, run: (page) => page.locator(SWITCHER).waitFor({ timeout: SWITCHER_MS }) },
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

  // The drawer, open beside the docked pet; then a question the site refuses.
  const drawer = await openPage(browser, base, '/genie/quickstart', {
    waitUntil: 'load',
    allowHttp: [{ status: 413, pathname: CHAT_PATH }],
  })
  try {
    await openDrawer(drawer.page)
    await drawer.page.waitForTimeout(1_500) // the pet docks beside the panel
    await drawer.page.screenshot({ path: path.join(SHOTS, `${engine}-pet-drawer.png`) })
    await checkFailedPose(drawer.page, engine)
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

  return `pet ${PET_PAGES.length} pages, reduced motion, failed pose, 404 shell`
}

// A 70 KB question: the site's chat guard answers 413 before holocron's proxy, holocron shows
// the guard's message in the drawer and sets its errorMessage, and the pet, which reads that
// field from holocron's chat store, plays its failed clip once. The clips the pet shows are
// recorded from the moment of the question, so a pass between two polls is still seen.
async function checkFailedPose(page, engine) {
  await page.evaluate(() => {
    const pet = document.querySelector('.genie-pet')
    const clips = (window.__uiCheckClips = [])
    new MutationObserver(() => {
      if (clips.at(-1) !== pet.dataset.clip) clips.push(pet.dataset.clip)
    }).observe(pet, { attributes: true, attributeFilter: ['data-clip'] })
  })
  const input = page.locator('.holocron-chat-drawer-panel textarea').first()
  await input.fill('x'.repeat(70 * 1024))
  const answered = page.waitForResponse(
    (res) => res.request().method() === 'POST' && new URL(res.url()).pathname === CHAT_PATH,
    { timeout: FAILED_MS },
  )
  await input.press('Enter')
  const res = await answered
  if (res.status() !== 413) return fail(`/genie/quickstart: a 70 KB question answered ${res.status()}, expected 413 from the chat guard`)
  try {
    await page.locator('.holocron-chat-drawer-panel').getByText(CHAT_TOO_LONG).waitFor({ timeout: DRAWER_MS })
  } catch {
    fail(`/genie/quickstart: the drawer does not show "${CHAT_TOO_LONG}" after the refused question`)
  }
  try {
    await page.waitForFunction(() => window.__uiCheckClips.includes('failed'), null, { timeout: FAILED_MS })
  } catch {
    const clips = await page.evaluate(() => window.__uiCheckClips.join(' -> '))
    return fail(`/genie/quickstart: after the refused question the pet showed ${clips || 'no clip change'}, expected failed`)
  }
  await page.screenshot({ path: path.join(SHOTS, `${engine}-pet-failed.png`) })
}

// components/product-brand.tsx mounts after load and polls up to 15 s for hydration.
const SWITCHER = '.slot-navbar .genie-switcher'
const SWITCHER_MS = 20_000
const HEADER_LOGO = '.slot-logo img'
const FOOTER_LOGO = 'footer img[src$="/brand/genie-logo.png"]'
const SWAP_MS = 5_000

// The locator's screenshot once it differs from `from`, or null after SWAP_MS.
async function changedShot(locator, from) {
  const deadline = Date.now() + SWAP_MS
  do {
    const shot = await locator.screenshot()
    if (!shot.equals(from)) return shot
    await new Promise((resolve) => setTimeout(resolve, 200))
  } while (Date.now() < deadline)
  return null
}

// The share images in the live document. React adopts a server <meta> only when its content is
// unchanged, so at hydration it adds holocron's own og:image and twitter:image beside the
// server's, and it updates them on every client navigation. Once React has committed the head
// (a <meta> there is React's node), exactly one of each must remain, on the product's logo.
async function checkShareImages(page, where, product) {
  const expected = new URL(`/brand/${product.slug}-logo.png`, page.url()).href
  const read = () =>
    page.evaluate(() => {
      const contents = (selector) => [...document.querySelectorAll(selector)].map((meta) => meta.getAttribute('content'))
      return {
        committed: [...document.head.querySelectorAll('meta')].some((meta) => Object.keys(meta).some((key) => key.startsWith('__reactFiber$'))),
        'og:image': contents('meta[property="og:image"]'),
        'twitter:image': contents('meta[name="twitter:image"]'),
      }
    })
  const IMAGES = ['og:image', 'twitter:image']
  const right = (seen) => seen.committed && IMAGES.every((key) => seen[key].length === 1 && seen[key][0] === expected)
  const deadline = Date.now() + SWAP_MS
  let seen = await read()
  while (!right(seen) && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 200))
    seen = await read()
  }
  if (!seen.committed) return fail(`${where}: React never took over the head's <meta> tags`)
  for (const key of IMAGES)
    if (seen[key].length !== 1 || seen[key][0] !== expected) fail(`${where}: live ${key} ${JSON.stringify(seen[key])}, expected ["${expected}"]`)
}

async function checkProductPage(browser, base, engine, product, shots) {
  const where = product.deep
  const { page, close } = await openPage(browser, base, where, { waitUntil: 'load' })
  try {
    await page.locator(SWITCHER).waitFor({ timeout: SWITCHER_MS })
    const seen = await page.evaluate(
      ({ header, footer }) => {
        const shown = (el) => el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden'
        const filter = (el) => (el ? getComputedStyle(el).filter : 'missing')
        return {
          product: document.documentElement.getAttribute('data-product'),
          header: filter(document.querySelector(header)),
          footer: filter(document.querySelector(footer)),
          switcher: [...document.querySelectorAll('.genie-switcher img')].map(filter),
          pills: [...document.querySelectorAll('.slot-navbar select[aria-label="Select section"]')].filter(shown).length,
          switchers: [...document.querySelectorAll('.slot-navbar .genie-switcher')].filter(shown).length,
        }
      },
      { header: HEADER_LOGO, footer: FOOTER_LOGO },
    )
    if (seen.product !== product.slug) fail(`${where}: data-product ${seen.product}, expected ${product.slug}`)
    if (seen.header !== 'none') fail(`${where}: header logo filter ${seen.header}, expected none`)
    if (seen.footer !== 'none') fail(`${where}: footer logo filter ${seen.footer}, expected none`)
    const filtered = seen.switcher.filter((value) => value !== 'none')
    if (seen.switcher.length === 0 || filtered.length) fail(`${where}: switcher logo filters ${seen.switcher.join(', ') || 'none found'}, expected none`)
    if (seen.pills !== 0) fail(`${where}: the native Select section pill shows`)
    if (seen.switchers !== 1) fail(`${where}: ${seen.switchers} header logo menus show, expected 1`)
    await checkShareImages(page, where, product)
    await page.screenshot({ path: path.join(SHOTS, `${engine}-products-${product.slug}.png`) })
    shots.header.set(product.slug, await page.locator(HEADER_LOGO).screenshot())
    if (product === PRODUCTS[0]) {
      const footer = page.locator(FOOTER_LOGO)
      shots.footer = await footer.screenshot()
      await footer.scrollIntoViewIfNeeded()
      await page.screenshot({ path: path.join(SHOTS, `${engine}-products-footer.png`) })
    }

    // The open menu: every product by its logo, alt text its name, the current one selected.
    await page.locator(`${SWITCHER} .genie-switcher__button`).click()
    const menu = page.locator(`${SWITCHER} .genie-switcher__menu`)
    await menu.waitFor({ timeout: SWAP_MS })
    const options = await menu.locator('[role="option"]').evaluateAll((items) =>
      items.map((li) => ({ alt: li.querySelector('img')?.getAttribute('alt'), selected: li.getAttribute('aria-selected') })),
    )
    const alts = options.map((option) => option.alt).join(', ')
    const names = PRODUCTS.map((entry) => entry.name).join(', ')
    if (alts !== names) fail(`${where}: menu logos ${alts}, expected ${names}`)
    const selected = options.filter((option) => option.selected === 'true').map((option) => option.alt)
    if (selected.join() !== product.name) fail(`${where}: menu selects ${selected.join(', ') || 'nothing'}, expected ${product.name}`)
    await page.screenshot({ path: path.join(SHOTS, `${engine}-products-switcher-${product.slug}.png`) })
  } catch (error) {
    fail(`${where}: products ${error.message.split('\n')[0]}`)
  } finally {
    await close()
  }
}

// After a choice in the menu: the same document, on the product's pages, its logo in the header.
async function checkSwitched(page, product, how, before) {
  const where = `${how} to ${product.name}`
  await page.waitForURL((url) => url.pathname === product.folderUrl || url.pathname.startsWith(`${product.folderUrl}/`), {
    timeout: NAV_TIMEOUT_MS,
  })
  if (!(await page.evaluate(() => window.__uiCheckSameDocument))) fail(`${where}: the page reloaded`)
  try {
    await page.waitForFunction((slug) => document.documentElement.getAttribute('data-product') === slug, product.slug, {
      timeout: SWAP_MS,
    })
  } catch {
    fail(`${where}: data-product stayed ${await page.evaluate(() => document.documentElement.getAttribute('data-product'))}`)
  }
  const shot = await changedShot(page.locator(HEADER_LOGO), before)
  if (!shot) fail(`${where}: the header logo did not change`)
  await checkShareImages(page, where, product)
  const switchers = await page.locator(SWITCHER).count()
  if (switchers !== 1) fail(`${where}: ${switchers} header logo menus, expected 1`)
  return shot ?? before
}

async function checkSwitching(browser, base, engine) {
  const [from, byMouse, byKeyboard] = PRODUCTS
  if (!byKeyboard) return fail(`docs.json: ${PRODUCTS.length} products, the switching check needs 3`)
  const { page, close } = await openPage(browser, base, from.deep, { waitUntil: 'load' })
  try {
    await page.locator(SWITCHER).waitFor({ timeout: SWITCHER_MS })
    await page.evaluate(() => {
      window.__uiCheckSameDocument = true
    })
    let shot = await page.locator(HEADER_LOGO).screenshot()
    await page.locator(`${SWITCHER} .genie-switcher__button`).click()
    await page.locator(`${SWITCHER} [role="option"]:has(img[alt="${byMouse.name}"])`).click()
    shot = await checkSwitched(page, byMouse, 'mouse', shot)

    // ArrowDown opens the menu on the current product; each further ArrowDown moves one down.
    await page.locator(`${SWITCHER} .genie-switcher__button`).focus()
    await page.keyboard.press('ArrowDown')
    for (let i = PRODUCTS.indexOf(byMouse); i < PRODUCTS.indexOf(byKeyboard); i++) await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Enter')
    await checkSwitched(page, byKeyboard, 'keyboard', shot)
    await page.screenshot({ path: path.join(SHOTS, `${engine}-products-switched.png`) })
  } catch (error) {
    fail(`switching from ${from.deep}: ${error.message.split('\n')[0]}`)
  } finally {
    await close()
  }
}

// The text of a landing's own <h1>, read from its raw HTML: a logo click has landed only once
// that heading shows, not when the URL changes.
const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: '\u00a0' }
const decodeText = (text) =>
  text.replace(/&(?:#(\d+)|#x([\da-f]+)|([a-z]+));/gi, (entity, dec, hex, name) =>
    dec ? String.fromCodePoint(Number(dec)) : hex ? String.fromCodePoint(parseInt(hex, 16)) : (ENTITIES[name] ?? entity),
  )
const headings = new Map()
async function landingHeading(base, product) {
  if (!headings.has(product.slug)) {
    const html = await (await fetch(new URL(product.folderUrl, base), { headers: { accept: 'text/html' } })).text()
    const inner = /<h1\b[^>]*>([\s\S]*?)<\/h1>/i.exec(html)?.[1]
    headings.set(product.slug, inner === undefined ? null : decodeText(inner.replace(/<[^>]*>/g, '')).trim())
  }
  return headings.get(product.slug)
}

// The header logo's href on a product's deep page is that product's folder URL, so a
// middle-click, a new tab or a copied link goes there too, and a click lands there with a clean
// query, showing the landing's own <h1>. Before hydration every built script answers as an
// empty module, so nothing hydrates: the href is the server's, and only the inline head script
// can route the click. After hydration the click goes through spiceflow's router, in the same
// document.
async function checkLogoLink(browser, base, engine, product, phase) {
  const where = `${product.deep} logo (${phase})`
  const heading = await landingHeading(base, product)
  if (!heading) return fail(`${where}: ${product.folderUrl} has no <h1> in its raw HTML`)
  let holding = phase === 'before hydration'
  const prepare = (context) =>
    context.route(/\/assets\/[^?#]*\.js(?:[?#]|$)/, (route) =>
      holding ? route.fulfill({ status: 200, contentType: 'text/javascript', body: '' }) : route.continue(),
    )
  const waitUntil = holding ? 'domcontentloaded' : 'load'
  const { page, close } = await openPage(browser, base, product.deep, { waitUntil, prepare })
  try {
    if (holding) {
      const state = await page.evaluate(() => ({ landings: !!window.__genieProductLandings, navigate: typeof window.__genieNavigate }))
      if (!state.landings || state.navigate !== 'undefined') fail(`${where}: expected the head script alone, saw ${JSON.stringify(state)}`)
      holding = false
    } else {
      await page.locator(SWITCHER).waitFor({ timeout: SWITCHER_MS })
      await page.evaluate(() => {
        window.__uiCheckSameDocument = true
      })
    }
    const href = await page.locator('a.slot-logo').getAttribute('href')
    if (href !== product.folderUrl) fail(`${where}: logo href ${href}, expected ${product.folderUrl}`)
    await page.locator('.slot-logo').click()
    await page.waitForURL((url) => url.pathname === product.folderUrl, { timeout: NAV_TIMEOUT_MS })
    await page.waitForLoadState('load')
    try {
      await page.waitForFunction((text) => document.querySelector('h1')?.textContent?.trim() === text, heading, {
        timeout: NAV_TIMEOUT_MS,
      })
    } catch {
      const shown = await page.evaluate(() => document.querySelector('h1')?.textContent?.trim() ?? null)
      fail(`${where}: landed on ${product.folderUrl} showing <h1> ${JSON.stringify(shown)}, expected ${JSON.stringify(heading)}`)
    }
    const url = new URL(page.url())
    if (url.search || url.hash) fail(`${where}: landed on ${url.pathname}${url.search}${url.hash}, expected ${product.folderUrl}`)
    const marked = await page.evaluate(() => document.documentElement.getAttribute('data-product'))
    if (marked !== product.slug) fail(`${where}: landed with data-product ${marked}, expected ${product.slug}`)
    if (phase === 'after hydration' && !(await page.evaluate(() => window.__uiCheckSameDocument))) fail(`${where}: the click reloaded the page`)
    await page.screenshot({ path: path.join(SHOTS, `${engine}-products-logo-${product.slug}-${phase.replace(' ', '-')}.png`) })
  } catch (error) {
    fail(`${where}: ${error.message.split('\n')[0]}`)
  } finally {
    await close()
  }
}

async function checkProducts(browser, base, engine) {
  const shots = { header: new Map(), footer: null }
  for (const product of PRODUCTS) await checkProductPage(browser, base, engine, product, shots)
  const headers = [...shots.header]
  headers.forEach(([slug, shot], i) => {
    for (const [other, otherShot] of headers.slice(i + 1))
      if (shot.equals(otherShot)) fail(`products: the ${slug} and ${other} header logos look the same`)
  })
  const first = shots.header.get(PRODUCTS[0].slug)
  if (shots.footer && first?.equals(shots.footer)) fail(`products: the footer logo looks like the ${PRODUCTS[0].slug} header logo`)
  await checkSwitching(browser, base, engine)
  for (const product of PRODUCTS)
    for (const phase of ['before hydration', 'after hydration']) await checkLogoLink(browser, base, engine, product, phase)
  return `products ${PRODUCTS.map((product) => product.slug).join(', ')}: logos, menu, share images, switching, logo link`
}

const attribute = (tag, name) =>
  tag.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1]?.replaceAll('&amp;', '&').replaceAll('&quot;', '"')

// A browser reads the encoding only from a <meta charset> serialized within the first 1024 bytes.
const CHARSET_BYTES = 1024

async function checkMeta(_browser, base) {
  if (!GATEWAY_ORIGIN) fail("vite.config.ts: no GATEWAY_ORIGIN = '<url>' to check the meta tags against")
  const pages = PRODUCTS.flatMap((product) => [product.folderUrl, product.deep].map((where) => ({ product, where })))
  for (const { product, where } of pages) {
    const res = await fetch(new URL(where, base), { headers: { accept: 'text/html' }, redirect: 'manual' })
    const html = await res.text()
    if (res.status !== 200) {
      fail(`${where}: answered ${res.status}, expected 200`)
      continue
    }
    const charset = /<meta\b[^>]*\bcharset\s*=[^>]*>/i.exec(html)
    const charsetEnd = charset && Buffer.byteLength(html.slice(0, charset.index + charset[0].length))
    if (!charset) fail(`${where}: no <meta charset>`)
    else if (charsetEnd > CHARSET_BYTES) fail(`${where}: <meta charset> ends at byte ${charsetEnd}, past the first ${CHARSET_BYTES}`)
    const marked = attribute(html.match(/<html\b[^>]*>/i)?.[0] ?? '', 'data-product')
    if (marked !== product.slug) fail(`${where}: <html data-product="${marked}">, expected ${product.slug}`)
    const scripts = html.match(/window\.__genieProductLandings=/g)?.length ?? 0
    if (scripts !== 1) fail(`${where}: ${scripts} __genieProductLandings head scripts, expected 1`)

    const metas = html.match(/<meta\b[^>]*>/gi) ?? []
    const expected = new URL(`/brand/${product.slug}-logo.png`, base).href
    for (const [key, value] of [['property', 'og:image'], ['name', 'twitter:image']]) {
      const tags = metas.filter((tag) => attribute(tag, key) === value)
      if (tags.length !== 1) {
        fail(`${where}: ${tags.length} ${value} tags, expected 1`)
        continue
      }
      const url = attribute(tags[0], 'content')
      if (url !== expected) fail(`${where}: ${value} ${url}, expected ${expected}`)
      if (!url) continue
      let image, bytes
      try {
        image = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(30_000) })
        bytes = Buffer.from(await image.arrayBuffer())
      } catch (error) {
        fail(`${where}: ${value} ${url} could not be fetched (${error.cause?.code ?? error.message})`)
        continue
      }
      const type = image.headers.get('content-type') ?? ''
      if (image.status !== 200 || !type.startsWith('image/png')) fail(`${where}: ${value} ${url} answered ${image.status} ${type}, expected 200 image/png`)
      else if (url === expected && !bytes.equals(fs.readFileSync(path.join(ROOT, 'public/brand', `${product.slug}-logo.png`))))
        fail(`${where}: ${value} ${url} is not public/brand/${product.slug}-logo.png`)
    }
    if (GATEWAY_ORIGIN)
      for (const tag of metas)
        if (attribute(tag, 'content')?.includes(GATEWAY_ORIGIN)) fail(`${where}: meta on the gateway origin: ${tag.slice(0, 200)}`)

    // RSC payloads are not HTML: the middleware hands them back as they came.
    const rsc = await fetch(new URL(`${where}.rsc`, base), { redirect: 'manual' })
    const payload = await rsc.text()
    const rscType = rsc.headers.get('content-type') ?? ''
    if (rsc.status !== 200 || !rscType.startsWith('text/x-component')) fail(`${where}.rsc: answered ${rsc.status} ${rscType}, expected 200 text/x-component`)
    else if (payload.includes('__genieProductLandings') || payload.includes('data-product')) fail(`${where}.rsc: carries an HTML rewrite`)
  }
  return `meta ${pages.map(({ where }) => where).join(', ')}`
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
