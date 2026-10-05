'use client'

// Product logos in the header and the product switcher.
//
// holocron has no per-product logo option (navigation.products takes a name, icon and
// href), and its switcher is a native <select>, whose open list is drawn by the OS and
// cannot show images. src/server.tsx renders <ProductBrand />, which renders nothing, in the
// site-wide layout so that every page loads this module, a 404 included (it says why), and
// once per page lifetime the module itself mounts this client piece, which:
//   - keeps html[data-product] in step with the URL after client navigation (the server and
//     the inline head script set it before first paint; style.css swaps the header logo from it);
//   - names the header logo after the product (alt), since the image now shows it, and points
//     the logo link at the product's landing page;
//   - leaves one og:image and one twitter:image in <head>, on the current product's logo;
//   - replaces each "Select section" <select> with a logo menu that navigates with
//     spiceflow's router.push, the call holocron's NavSelect makes on change.
// Products, labels and hrefs are read from holocron's own <select> options, so the menu
// follows docs.json. Logos: public/brand/<product>-logo.png, trimmed copies of the drops.
import { router } from 'spiceflow/react'
import { afterHydration, hydrated } from './hydration.ts'

type Product = { href: string; label: string; slug: string; logo: string }
type BrandWindow = Window & {
  __genieProductLandings?: Record<string, string>
  __genieNavigate?: (to: string) => void
}
const SELECT = 'select[aria-label="Select section"]'

function productsFrom(select: HTMLSelectElement): Product[] {
  return [...select.options].map((o) => {
    const slug = o.text.trim().toLowerCase()
    return { href: o.value, label: o.text.trim(), slug, logo: `/brand/${slug}-logo.png` }
  })
}
function activeOf(products: Product[], pathname = location.pathname): Product {
  return products.find((p) => pathname === p.href || pathname.startsWith(`${p.href}/`)) ?? products[0]!
}

const SVG_NS = 'http://www.w3.org/2000/svg'
const CHEVRON_PATH = {
  d: 'm6 9 6 6 6-6',
  fill: 'none',
  stroke: 'currentColor',
  'stroke-width': '2',
  'stroke-linecap': 'round',
  'stroke-linejoin': 'round',
}
const chevron = () => {
  const svg = document.createElementNS(SVG_NS, 'svg')
  svg.setAttribute('viewBox', '0 0 24 24')
  svg.setAttribute('aria-hidden', 'true')
  svg.classList.add('genie-switcher__chevron')
  const path = document.createElementNS(SVG_NS, 'path')
  for (const [name, value] of Object.entries(CHEVRON_PATH)) path.setAttribute(name, value)
  svg.append(path)
  return svg
}

// A landing as a visitor sees it: holocron answers a landing's `<folder>/index` form with a 308
// to the folder URL. src/server.tsx gives the header logo's link the same href.
const folderUrl = (landing: string) => landing.replace(/\/index$/, '') || '/'

// The share images React renders. src/server.tsx points the server's og:image and twitter:image
// at the product's logo, but React adopts a server <meta> only when its content is unchanged:
// at hydration it adds holocron's own pair, on an /api/og renderer this site does not run, and
// it updates only that pair on client navigation. Once React's pair is there, the server's copies
// go (React never knew them) and React's pair points at the current product's logo; React writes
// a <meta> attribute again only when its own value for it changes, and this runs again then.
const SHARE_IMAGES = 'meta[property="og:image"], meta[name="twitter:image"]'
function syncShareImages(slug: string) {
  const metas = [...document.head.querySelectorAll<HTMLMetaElement>(SHARE_IMAGES)]
  if (!metas.some(hydrated)) return // before hydration the server's tags are the right ones
  const logo = new URL(`/brand/${slug}-logo.png`, location.origin).href
  for (const meta of metas) {
    if (!hydrated(meta)) meta.remove()
    else if (meta.getAttribute('content') !== logo) meta.setAttribute('content', logo)
  }
}

// Every React-managed node this touches is first checked with hydrated() (./hydration.ts).
export function mountProductBrand(): () => void {
  let openMenu: (() => void) | null = null // closes whichever menu is open
  const syncers = new Set<() => void>()

  function enhance(select: HTMLSelectElement) {
    if (select.dataset.genieLogos) return
    const pill = select.parentElement
    if (!pill) return
    select.dataset.genieLogos = '1' // style.css hides the native pill from this marker
    const products = productsFrom(select)
    const compact = !!select.closest('.slot-navbar') // header: the logo beside it is the closed face

    const wrap = document.createElement('div')
    wrap.className = `genie-switcher${compact ? ' genie-switcher--compact' : ''}`
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'genie-switcher__button'
    button.setAttribute('aria-haspopup', 'listbox')
    button.setAttribute('aria-expanded', 'false')
    const current = document.createElement('img')
    current.className = 'genie-switcher__current'
    current.alt = ''
    if (!compact) button.append(current)
    button.append(chevron())

    const menu = document.createElement('ul')
    menu.className = 'genie-switcher__menu'
    menu.setAttribute('role', 'listbox')
    menu.setAttribute('aria-label', 'Products')
    menu.hidden = true
    const options = products.map((p) => {
      const li = document.createElement('li')
      li.setAttribute('role', 'option')
      li.tabIndex = -1
      li.dataset.href = p.href
      const img = document.createElement('img')
      img.src = p.logo
      img.alt = p.label // the accessible name stays "Genie", "Omni", "mikro"
      img.className = 'genie-switcher__logo'
      li.append(img)
      li.addEventListener('click', () => choose(p))
      menu.append(li)
      return li
    })
    wrap.append(button, menu)
    pill.after(wrap)

    function sync() {
      if (!wrap.isConnected) { syncers.delete(sync); return } // React unmounted this switcher
      const active = activeOf(products)
      current.src = active.logo
      button.setAttribute('aria-label', `Switch product (current: ${active.label})`)
      options.forEach((li, i) => li.setAttribute('aria-selected', String(products[i] === active)))
    }
    function setOpen(open: boolean, focusFirst = false) {
      if (open) openMenu?.()
      menu.hidden = !open
      button.setAttribute('aria-expanded', String(open))
      openMenu = open ? () => setOpen(false) : null
      if (open) {
        const sel = options.find((li) => li.getAttribute('aria-selected') === 'true') ?? options[0]
        if (focusFirst) sel?.focus()
      }
    }
    function choose(p: Product) {
      setOpen(false)
      button.focus()
      if (p !== activeOf(products)) router.push(p.href)
    }
    button.addEventListener('click', () => setOpen(menu.hidden))
    button.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(true, true) }
    })
    menu.addEventListener('keydown', (e) => {
      const i = options.indexOf(document.activeElement as HTMLLIElement)
      if (e.key === 'ArrowDown') { e.preventDefault(); options[(i + 1) % options.length]?.focus() }
      else if (e.key === 'ArrowUp') { e.preventDefault(); options[(i - 1 + options.length) % options.length]?.focus() }
      else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (i >= 0) choose(products[i]!) }
      else if (e.key === 'Escape' || e.key === 'Tab') { setOpen(false); if (e.key === 'Escape') button.focus() }
    })
    sync()
    syncers.add(sync)
  }

  let lastPath = location.pathname
  function update() {
    const selects = [...document.querySelectorAll<HTMLSelectElement>(SELECT)]
    const first = selects[0]
    if (first) {
      const active = activeOf(productsFrom(first))
      // <html> has suppressHydrationWarning, so this is safe before hydration too.
      const root = document.documentElement
      if (root.getAttribute('data-product') !== active.slug) root.setAttribute('data-product', active.slug)
      const headerLogo = document.querySelector<HTMLImageElement>('.slot-logo img')
      if (hydrated(headerLogo) && headerLogo!.alt !== active.label) headerLogo!.alt = active.label
      // The logo link follows the product too. Clicks are routed by the inline head script;
      // the attribute keeps hover, copy-link and open-in-new-tab right. The server sets it for
      // the first page; this follows client navigation.
      const landing = (window as BrandWindow).__genieProductLandings?.[active.slug]
      const logoLink = document.querySelector<HTMLAnchorElement>('a.slot-logo')
      const href = landing && folderUrl(landing)
      if (href && hydrated(logoLink) && logoLink!.getAttribute('href') !== href) logoLink!.setAttribute('href', href)
      if (location.pathname !== lastPath) { lastPath = location.pathname; openMenu?.() }
    }
    const product = document.documentElement.getAttribute('data-product')
    if (product) syncShareImages(product)
    selects.filter(hydrated).forEach(enhance)
    for (const fn of syncers) fn() // cheap: a few attribute writes
  }

  // Navigation and React re-renders both mutate the DOM: one observer covers new selects
  // (the mobile menu renders its own), URL changes and React's share images in <head>, with
  // no history patching.
  const observer = new MutationObserver(update)
  function onDocClick(e: MouseEvent) {
    if (openMenu && !(e.target as Element).closest?.('.genie-switcher')) openMenu()
  }
  // Lets the inline head script route the logo click through spiceflow's client router.
  // holocron answers a landing's `<folder>/index` form with a 308 to the folder URL; a full
  // load follows it, but a client navigation through it leaves `?__rsc=` in the address bar,
  // so the router is sent to the folder URL itself.
  ;(window as BrandWindow).__genieNavigate = (to) => router.push(folderUrl(to))

  let waitTimer = 0
  observer.observe(document.body, { childList: true, subtree: true })
  observer.observe(document.head, { childList: true, subtree: true, attributes: true, attributeFilter: ['content'] })
  window.addEventListener('popstate', update)
  document.addEventListener('click', onDocClick)
  // Hydration mutates no DOM, so the observer cannot see it finish: poll briefly.
  const deadline = Date.now() + 15000
  const wait = () => {
    update()
    if (!hydrated(document.querySelector(SELECT)) && Date.now() < deadline) waitTimer = window.setTimeout(wait, 100)
  }
  wait()

  return () => {
    delete (window as BrandWindow).__genieNavigate
    window.clearTimeout(waitTimer)
    observer.disconnect()
    window.removeEventListener('popstate', update)
    document.removeEventListener('click', onDocClick)
    document.querySelectorAll('.genie-switcher').forEach((el) => el.remove())
    document.querySelectorAll<HTMLSelectElement>(SELECT).forEach((s) => delete s.dataset.genieLogos)
    syncers.clear()
  }
}

// Once per page lifetime, after hydration and the load event: a module runs once, so client
// navigation never mounts it again.
if (typeof document !== 'undefined') {
  afterHydration(() => {
    const mount = () => setTimeout(() => mountProductBrand(), 0)
    if (document.readyState === 'complete') mount()
    else window.addEventListener('load', mount, { once: true })
  })
}

/** Renders nothing: the site layout renders it so that every page loads this module. */
export function ProductBrand(): null {
  return null
}
