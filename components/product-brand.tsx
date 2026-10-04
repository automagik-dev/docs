'use client'

// Product logos in the header and the product switcher.
//
// holocron has no per-product logo option (navigation.products takes a name, icon and
// href), and its switcher is a native <select>, whose open list is drawn by the OS and
// cannot show images. src/server.tsx renders <ProductBrand /> in the site-wide layout, and
// once per page lifetime it mounts this client piece, which:
//   - keeps html[data-product] in step with the URL after client navigation (the server and
//     the inline head script set it before first paint; style.css swaps the header logo from it);
//   - names the header logo after the product (alt), since the image now shows it, and points
//     the logo link at the product's landing page;
//   - replaces each "Select section" <select> with a logo menu that navigates with
//     spiceflow's router.push, the call holocron's NavSelect makes on change.
// Products, labels and hrefs are read from holocron's own <select> options, so the menu
// follows docs.json. Logos: public/brand/<product>-logo.png, trimmed copies of the drops.
import { useEffect } from 'react'
import { router } from 'spiceflow/react'

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

const chevron = () => {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('viewBox', '0 0 24 24')
  svg.setAttribute('aria-hidden', 'true')
  svg.classList.add('genie-switcher__chevron')
  svg.innerHTML = '<path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
  return svg
}

// Never touch a React-managed node before React has hydrated it: a changed attribute
// or an inserted sibling at that point fails hydration and React regenerates the whole
// document. A hydrated (or client-rendered) node carries React's __reactFiber$ key.
const hydrated = (el: Element | null) => !!el && Object.keys(el).some((k) => k.startsWith('__reactFiber$'))

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
      // the attribute keeps hover, copy-link and open-in-new-tab right.
      const landing = (window as BrandWindow).__genieProductLandings?.[active.slug]
      const logoLink = document.querySelector<HTMLAnchorElement>('a.slot-logo')
      if (landing && hydrated(logoLink) && logoLink!.getAttribute('href') !== landing) logoLink!.setAttribute('href', landing)
      if (location.pathname !== lastPath) { lastPath = location.pathname; openMenu?.() }
    }
    selects.filter(hydrated).forEach(enhance)
    for (const fn of syncers) fn() // cheap: a few attribute writes
  }

  // Navigation and React re-renders both mutate the DOM: one observer covers new selects
  // (the mobile menu renders its own) and URL changes, with no history patching.
  const observer = new MutationObserver(update)
  function onDocClick(e: MouseEvent) {
    if (openMenu && !(e.target as Element).closest?.('.genie-switcher')) openMenu()
  }
  // Lets the inline head script route the logo click through spiceflow's client router.
  // holocron answers a landing's `<folder>/index` form with a 308 to the folder URL; a full
  // load follows it, but a client navigation through it leaves `?__rsc=` in the address bar,
  // so the router is sent to the folder URL itself.
  ;(window as BrandWindow).__genieNavigate = (to) => router.push(to.replace(/\/index$/, '') || '/')

  let waitTimer = 0
  observer.observe(document.body, { childList: true, subtree: true })
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

let mounted = false // once per page lifetime: client navigation never mounts it again

export function ProductBrand(): null {
  useEffect(() => {
    if (mounted) return
    mounted = true
    const mount = () => setTimeout(() => mountProductBrand(), 0)
    if (document.readyState === 'complete') mount()
    else window.addEventListener('load', mount, { once: true })
  }, [])
  return null
}
