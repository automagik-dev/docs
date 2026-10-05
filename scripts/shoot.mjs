#!/usr/bin/env node
// Screenshots of a running site for the owner's visual sign-off: the brand, the product logos,
// the hero, the pet and its closed eyes, which no script can judge.
//
//   node scripts/shoot.mjs <base-url> <out-dir>
//
// Every shot is taken at 1440x900 (desktop-<name>.png) and at 390x844 as a touch phone
// (mobile-<name>.png), both at device scale factor 2 so the pet's face stays legible:
//   genie                 the Genie landing once the lamp hero has settled and handed the Genie
//                         to the pet
//   genie-skills-wish     /genie/skills/wish
//   <product>             every other product's landing, as the site itself publishes them
//                         (window.__genieProductLandings, else this checkout's docs.json)
//   switcher              the product logo menu open on the Genie quickstart (on a phone, inside
//                         the navigation menu)
//   genie-reduced-motion  the Genie landing with prefers-reduced-motion: reduce
//   not-found             /genie/does-not-exist, which has no pet (the site layout stays out of
//                         the 404); shot so the owner can rule on it
//   chat                  the Genie quickstart with the chat drawer open after one real answer
//                         to Genie's own chat suggestion. That is one chat turn on the site's
//                         gateway; the mobile shot is the same answer with the window resized.
//
// Prints one line per file written and one per shot that could not be made as described;
// exits 1 when any could not, 0 otherwise; exits 2 on a usage error. Node 22 or later; needs
// `npx playwright install chromium`.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const VIEWPORTS = {
  desktop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 },
  mobile: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
}
const NAV_TIMEOUT_MS = 60_000
const HERO_SETTLED_MS = 20_000 // the hero plays 2.6 s once its art has loaded
const PET_MS = 10_000 // the hero hands the Genie over, or the pet shows after 6 s
const HYDRATED_MS = 20_000 // components/product-brand.tsx mounts the logo menu once React runs
const ANSWER_MS = 60_000 // a screenshot tool, not a gate: verify-site --full holds the 20 s bound
const SETTLE_MS = 1_500 // the pet's arrival, docking and the drawer's own animations
const NOT_FOUND_PATH = '/genie/does-not-exist'
const SIDEBAR_CHAT = '[data-chat-shell="sidebar"] textarea'
// holocron draws an assistant message's copy button once that message stops streaming.
const ANSWER_MESSAGE = '.holocron-chat-drawer-messages [data-message-id="msg-1"]'
const ANSWER_DONE = `${ANSWER_MESSAGE} button[aria-label="Copy message"]`

const failures = []
const fail = (line) => failures.push(line)

// The browser inherits no variable that names a credential, nor wrangler's CLOUDFLARE_* ones:
// a shell that has just run verify-site --full may still hold them, and nothing here needs one.
const SECRET_NAME = /(?:^|_)(?:TOKEN|KEY|SECRET|PASSWORD|CREDENTIALS?)$/i
const browserEnv = () =>
  Object.fromEntries(Object.entries(process.env).filter(([name]) => !(SECRET_NAME.test(name) || name.startsWith('CLOUDFLARE_'))))

function usage(message) {
  console.error(`shoot: ${message}`)
  console.error('usage: node scripts/shoot.mjs <base-url> <out-dir>')
  process.exit(2)
}

const hrefOf = (page) => `/${page.replace(/(^|\/)index$/, '')}`.replace(/\/$/, '') || '/'
const productAt = (slug, landing) => ({ slug, prefix: `/${landing.split('/')[1]}`, landing: hrefOf(landing.slice(1)) })

// The products as the site publishes them, and its chat suggestions (holocron ships the site
// config to the client as a JSON string, so their quotes arrive escaped once).
async function siteProducts(browser, base) {
  const context = await browser.newContext(VIEWPORTS.desktop)
  try {
    const page = await context.newPage()
    const res = await page.goto(new URL('/', base).href, { waitUntil: 'load', timeout: NAV_TIMEOUT_MS })
    const landings = await page.evaluate(() => window.__genieProductLandings ?? null)
    const docs = () => JSON.parse(fs.readFileSync(path.join(ROOT, 'docs.json'), 'utf8'))
    const products = landings
      ? Object.entries(landings).map(([slug, landing]) => productAt(slug, landing))
      : (docs().navigation?.products ?? []).map((product) => productAt(product.product.toLowerCase(), `/${product.groups?.[0]?.pages?.[0] ?? ''}`))
    const listed = /suggestions\\*"\s*:\s*(\[[^\]]*\])/.exec((await res?.text()) ?? '')?.[1]
    let suggestions = []
    for (const candidate of listed ? [listed.replaceAll('\\"', '"'), listed] : []) {
      try {
        suggestions = JSON.parse(candidate)
        break
      } catch {}
    }
    return { products, suggestions: Array.isArray(suggestions) ? suggestions.filter((item) => typeof item === 'string') : [] }
  } finally {
    await context.close()
  }
}

// The Genie landing's hero dispatches genie:handoff on the frame it settles on.
const heroSettled = async (page) => {
  await page.waitForFunction(() => window.__shootHandoff === true, null, { timeout: HERO_SETTLED_MS })
  await page.locator('.genie-pet.is-visible').waitFor({ timeout: PET_MS })
}
const petShown = async (page) => {
  await page.locator('.slot-navbar .genie-switcher').waitFor({ state: 'attached', timeout: HYDRATED_MS })
  await page.locator('.genie-pet.is-visible').waitFor({ timeout: PET_MS })
}
const loaded = async () => {}

// The logo menu open: the header's on a wide screen, the navigation menu's on a phone.
async function openSwitcher(page) {
  const button = page.locator('.genie-switcher__button:visible').first()
  if ((await button.count()) === 0) {
    await page.getByRole('button', { name: 'Menu' }).click()
    await button.waitFor({ timeout: 5_000 })
  }
  await button.click()
  await page.locator('.genie-switcher__menu:visible').first().waitFor({ timeout: 5_000 })
}

async function shoot(browser, base, outDir, kind, shot) {
  const file = path.join(outDir, `${kind}-${shot.name}.png`)
  const context = await browser.newContext({ ...VIEWPORTS[kind], ...shot.context })
  await context.addInitScript(() => addEventListener('genie:handoff', () => (window.__shootHandoff = true)))
  try {
    const page = await context.newPage()
    const res = await page.goto(new URL(shot.path, base).href, { waitUntil: 'load', timeout: NAV_TIMEOUT_MS })
    const expected = shot.status ?? 200
    if (res?.status() !== expected) fail(`${kind}-${shot.name}: ${shot.path} answered ${res?.status()}, expected ${expected}`)
    await page.evaluate(() => document.fonts.ready)
    await shot.ready(page)
    await shot.act?.(page)
    await page.waitForTimeout(SETTLE_MS)
    await page.screenshot({ path: file })
    console.log(`shoot: ${path.relative(process.cwd(), file)}`)
  } catch (error) {
    fail(`${kind}-${shot.name} (${shot.path}): ${error.message.split('\n')[0]}`)
  } finally {
    await context.close()
  }
}

// One real answer, then both shots of the same drawer.
async function shootChat(browser, base, outDir, where, question) {
  const context = await browser.newContext(VIEWPORTS.desktop)
  try {
    const page = await context.newPage()
    await page.goto(new URL(where, base).href, { waitUntil: 'load', timeout: NAV_TIMEOUT_MS })
    await petShown(page)
    const input = page.locator(SIDEBAR_CHAT)
    await input.fill(question)
    const started = Date.now()
    await input.press('Enter')
    try {
      await page.locator(ANSWER_DONE).waitFor({ timeout: ANSWER_MS })
      const notices = await page.locator(`${ANSWER_MESSAGE} [data-notice-code]:not([data-notice-severity="promotion"])`).allInnerTexts()
      if (notices.length) fail(`chat on ${where}: the answer to "${question}" is a notice: ${notices.join(' ').replace(/\s+/g, ' ').slice(0, 200)}`)
      else console.log(`shoot: chat on ${where}: "${question}" answered in ${((Date.now() - started) / 1000).toFixed(1)}s`)
    } catch {
      fail(`chat on ${where}: no finished answer to "${question}" within ${ANSWER_MS / 1000}s; shot as it stands`)
    }
    await page.waitForTimeout(SETTLE_MS)
    const desktop = path.join(outDir, 'desktop-chat.png')
    await page.screenshot({ path: desktop })
    console.log(`shoot: ${path.relative(process.cwd(), desktop)}`)
    await page.setViewportSize(VIEWPORTS.mobile.viewport)
    await page.waitForTimeout(SETTLE_MS)
    const mobile = path.join(outDir, 'mobile-chat.png')
    await page.screenshot({ path: mobile })
    console.log(`shoot: ${path.relative(process.cwd(), mobile)} (the same answer, window resized)`)
  } catch (error) {
    fail(`chat on ${where}: ${error.message.split('\n')[0]}`)
  } finally {
    await context.close()
  }
}

async function main() {
  const [baseArg, outArg, ...extra] = process.argv.slice(2)
  if (!baseArg || !outArg || extra.length || baseArg.startsWith('--') || outArg.startsWith('--')) usage('give <base-url> and <out-dir>')
  let base
  try {
    base = new URL(baseArg).href
  } catch {
    usage(`not a URL: ${baseArg}`)
  }
  const outDir = path.resolve(outArg)
  fs.mkdirSync(outDir, { recursive: true })

  const browser = await chromium.launch({ env: browserEnv() })
  try {
    const { products, suggestions } = await siteProducts(browser, base)
    const genie = products.find((product) => product.slug === 'genie') ?? products[0]
    if (!genie) throw new Error('the site publishes no products')
    const quickstart = `${genie.prefix}/quickstart`
    const shots = [
      { name: genie.slug, path: genie.landing, ready: heroSettled },
      { name: 'genie-skills-wish', path: '/genie/skills/wish', ready: petShown },
      ...products.filter((product) => product !== genie).map((product) => ({ name: product.slug, path: product.landing, ready: petShown })),
      { name: 'switcher', path: quickstart, ready: petShown, act: openSwitcher },
      { name: 'genie-reduced-motion', path: genie.landing, ready: petShown, context: { reducedMotion: 'reduce' } },
      { name: 'not-found', path: NOT_FOUND_PATH, ready: loaded, status: 404 },
    ]
    for (const kind of Object.keys(VIEWPORTS)) for (const shot of shots) await shoot(browser, base, outDir, kind, shot)
    const name = new RegExp(`\\b${genie.slug}\\b`, 'i')
    await shootChat(browser, base, outDir, quickstart, suggestions.find((suggestion) => name.test(suggestion)) ?? `What is ${genie.slug}?`)
  } catch (error) {
    fail(`run: ${error.message.split('\n')[0]}`)
  } finally {
    await browser.close()
  }

  for (const line of failures) console.error(`FAIL ${line}`)
  if (failures.length) {
    console.error(`shoot: ${failures.length} shot(s) not as described against ${base}; files in ${outDir}`)
    process.exit(1)
  }
  console.log(`shoot: ok against ${base}: files in ${outDir}`)
}

try {
  await main()
} catch (error) {
  for (const line of failures) console.error(`FAIL ${line}`)
  console.error(`shoot: stopped by an error: ${error?.message?.split('\n')[0] ?? error}`)
  process.exit(1)
}
