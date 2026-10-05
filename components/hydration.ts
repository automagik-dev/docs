// When the site's client modules may touch the document: components/genie-pet.tsx and
// components/product-brand.tsx start from their own module code, not from a React effect,
// because on a 404 no component of this site renders (see src/server.tsx).

// React marks each DOM node it hydrates, or renders, with a `__reactFiber$<id>` key. Never touch
// a React-managed node before then: an inserted sibling fails hydration and React regenerates the
// whole document (a changed attribute is kept, but React's development build reports it).
export const hydrated = (el: Element | null): boolean =>
  !!el && Object.keys(el).some((key) => key.startsWith('__reactFiber$'))

const POLL_MS = 50
const MAX_POLLS = 300 // 15 s of running time

/**
 * Runs `run` once React has hydrated <body>, which it marks only after matching every one of
 * body's children, so a node appended to body from then on is never taken for one of React's.
 * Hydration changes no DOM, so nothing can be observed: this polls, and gives up on a page React
 * never hydrates. It counts polls, not wall time: a background tab whose scripts the browser
 * froze resumes hydrating where it stopped, and so does this.
 */
export function afterHydration(run: () => void): void {
  let polls = 0
  const poll = () => {
    if (hydrated(document.body)) run()
    else if (++polls < MAX_POLLS) setTimeout(poll, POLL_MS)
  }
  poll()
}
