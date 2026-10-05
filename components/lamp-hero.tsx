'use client'

// Introduction hero: scene 3 of the launch film (components/lamp-hero-film.ts). The lamp lights,
// dust leaves the spout and forms the Genie, the logo arrives. Plays once, settles, hands the
// Genie to the site pet (components/genie-pet.tsx) and replays on click. Reduced motion: the
// settled frame only.
//
// The page comes first: the film's code and art load after the first contentful paint, on idle.
// A frame costs tens of milliseconds of drawing and canvas blur, so where the browser can hand a
// canvas to a worker, the film plays on a layer that components/lamp-hero-worker.ts draws, over
// the page's canvas, which holds the settled frame drawn from the images as before. The layer
// hides when the film settles, and a click shows it and replays. Elsewhere the page's canvas plays.
import { useEffect, useRef } from 'react'
import type { Face, Player } from './lamp-hero-film'

// A worker draws what the page would only when its OffscreenCanvas has the page canvas's blur.
const canPlayOffscreen = (el: HTMLCanvasElement) =>
  'transferControlToOffscreen' in el &&
  typeof OffscreenCanvasRenderingContext2D === 'function' &&
  ('filter' in OffscreenCanvasRenderingContext2D.prototype) === ('filter' in CanvasRenderingContext2D.prototype)

// After the first contentful paint (the landing's largest paint is its text), on idle; a browser
// without paint timing waits for load instead.
function afterFirstPaint(start: () => void) {
  const idle = () => ('requestIdleCallback' in window ? requestIdleCallback(() => start(), { timeout: 1000 }) : setTimeout(start, 0))
  if (PerformanceObserver.supportedEntryTypes?.includes('paint')) {
    new PerformanceObserver((list, observer) => {
      if (list.getEntriesByName('first-contentful-paint').length === 0) return
      observer.disconnect()
      idle()
    }).observe({ type: 'paint', buffered: true })
  } else if (document.readyState === 'complete') idle()
  else window.addEventListener('load', idle, { once: true })
}

export function LampHero() {
  const button = useRef<HTMLButtonElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const btn = button.current!
    const el = canvas.current!
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const seekParam = new URLSearchParams(location.search).get('hero-t')
    const seek = seekParam === null ? null : Number(seekParam)
    let still: Player | null = null // the page's canvas
    let film: { layer: HTMLCanvasElement; worker: Worker } | null = null
    let handedOff = false
    let disposed = false

    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const r = el.getBoundingClientRect()
      const width = Math.max(1, Math.round(r.width * dpr))
      const height = Math.max(1, Math.round(r.height * dpr))
      still?.resize(width, height)
      film?.worker.postMessage({ width, height })
    }
    const ro = new ResizeObserver(size)

    // Chrome keeps the hero's rounded corners as they were drawn around the film's layer until the
    // hero itself repaints, so hiding the layer repaints it once: a transparent extra shadow for
    // one frame.
    const hideFilm = () => {
      if (!film) return
      film.layer.hidden = true
      btn.style.boxShadow = `${getComputedStyle(btn).boxShadow}, 0 0 0 0 transparent`
      requestAnimationFrame(() => requestAnimationFrame(() => { btn.style.boxShadow = '' }))
    }
    // A worker that fails, such as one whose file a rolling deploy answers 404, leaves the film to
    // the page's canvas: it plays there unless it already settled (play waits for the art).
    const dropFilm = () => {
      if (!film) return
      hideFilm()
      film.worker.terminate()
      film.layer.remove()
      film = null
      if (!handedOff) still?.play()
    }
    const settled = (face: Face) => {
      hideFilm()
      if (handedOff || seek !== null) return
      handedOff = true
      const r = el.getBoundingClientRect()
      window.dispatchEvent(new CustomEvent('genie:handoff', {
        detail: { x: r.left + r.width / 2 + face.x * r.height, y: r.top + r.height / 2 + face.y * r.height, size: face.size * r.height },
      }))
    }

    afterFirstPaint(() => {
      if (disposed) return
      import('./lamp-hero-film').then(({ createPlayer, loadArt, toBitmaps, T0, T_SETTLED }) => {
        if (disposed) return
        const page = createPlayer(el, settled)
        still = page
        if (seek === null && !reduce && canPlayOffscreen(el)) {
          // The layer is opaque from its first paint, so the frame held under it never shows early.
          const layer = btn.appendChild(document.createElement('canvas'))
          layer.className = 'genie-hero__film'
          layer.setAttribute('aria-hidden', 'true')
          let worker: Worker | null = null
          try {
            worker = new Worker(new URL('./lamp-hero-worker.ts', import.meta.url), { type: 'module' })
            worker.onmessage = (e: MessageEvent<Face>) => settled(e.data)
            worker.onerror = dropFilm
            const offscreen = layer.transferControlToOffscreen()
            worker.postMessage({ canvas: offscreen }, [offscreen])
            film = { layer, worker }
          } catch {
            // A worker the browser refuses outright, before the layer ever paints: the page's canvas plays.
            worker?.terminate()
            layer.remove()
          }
        }
        size()
        ro.observe(el)
        loadArt().then(async (art) => {
          if (disposed) return
          page.setArt(art)
          if (film) {
            const bitmaps = await toBitmaps(art)
            if (disposed || !film) return // the worker failed meanwhile, and dropFilm started the page's canvas
            film.worker.postMessage({ art: bitmaps }, [bitmaps.lamp, bitmaps.face, bitmaps.logo])
            page.draw(T_SETTLED)
          } else if (seek !== null) page.draw(Number.isFinite(seek) ? seek : reduce ? T_SETTLED : T0)
          else if (reduce) page.draw(T_SETTLED)
          else {
            page.draw(T0)
            page.play()
          }
        })
      })
    })

    const play = () => {
      if (film) {
        film.layer.hidden = false
        film.worker.postMessage('play')
      } else if (!reduce && seek === null) still?.play()
    }
    btn.addEventListener('click', play)
    return () => {
      disposed = true
      still?.stop()
      film?.worker.terminate()
      film?.layer.remove()
      ro.disconnect()
      btn.removeEventListener('click', play)
    }
  }, [])

  return (
    <button
      ref={button}
      type='button'
      className='genie-hero'
      data-genie-hero=''
      aria-label='The lamp lights up, dust leaves the spout and forms the Genie, eyes closed and smiling, then the GENIE logo arrives. Click to replay.'
      title='Click to replay'
    >
      <canvas ref={canvas} className='genie-hero__canvas' aria-hidden='true' />
    </button>
  )
}
