// The lamp hero's film: scene 3 of the launch film (render-src/film.html, 0:13-0:17), ported
// to a canvas. The lamp lights, dust leaves the spout and forms the Genie, the logo arrives.
// Like the film, every frame is a pure function of t (film seconds), drawn in film coordinates
// (1920x1080) through one transform, so the geometry, easing, hash, dust and bloom below are
// the film's own. Art is the real lamp.png, genie_add.png and the official logo crop, never
// redrawn. The player draws on a page canvas or, in components/lamp-hero-worker.ts, on an
// OffscreenCanvas; components/lamp-hero.tsx decides which canvas plays and which holds a frame.

// ---- film constants (film.html: palette, SCENE 3, logo crop) ----
const MAGP = '#FF4FF0'
const CYA = '#5EF2FF'
const W = 1920
const H = 1080
const LAMP3 = { x: 960, y: 691, w: 461 }
const SPOUT = [1156, 644] as const
const FACE3 = { x: 960, y: 346, w: 365 }
export const T0 = 13.0 // scene 3 starts at 0:13
export const T_SETTLED = 15.6 // everything has landed by 14.75; this is the held frame
const VIEW = { cx: 960, cy: 590, span: 960 } // crop 110..1070: face top (~164) to logo bottom (~1011), with margin

// ---- film helpers, verbatim ----
const cl = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x))
const lerp = (a: number, b: number, k: number) => a + (b - a) * k
const eo = (k: number) => 1 - Math.pow(1 - k, 3)
function h(n: number) {
  n = (n ^ 61) ^ (n >>> 16); n = Math.imul(n, 9); n ^= n >>> 4; n = Math.imul(n, 0x27d4eb2d); n ^= n >>> 15
  return (n >>> 0) / 4294967296
}
const STARS = [...Array(900)].map((_, i) => [h(i * 3 + 1) * W, h(i * 3 + 2) * H, h(i * 3 + 3)] as const)

type Ctx = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D
type Picture = HTMLImageElement | ImageBitmap
export type Art = { lamp: Picture; face: Picture; logo: Picture; pts: number[][] }

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image()
    i.onload = () => resolve(i)
    i.onerror = () => reject(new Error(`image failed: ${src}`))
    i.src = src
  })
}

export async function loadArt(): Promise<Art> {
  const [lamp, face, logo, pts] = await Promise.all([
    loadImage('/genie-hero/lamp.png'),
    loadImage('/genie-hero/face.png'),
    loadImage('/brand/genie-logo.png'),
    fetch('/genie-hero/face-points.json').then((r) => r.json() as Promise<number[][]>),
  ])
  return { lamp, face, logo, pts }
}

// A worker cannot hold an <img>, so it gets the same art as bitmaps. Chrome draws a scaled bitmap
// a shade sharper than the scaled image, so the held frame is always drawn from the images.
export async function toBitmaps({ lamp, face, logo, pts }: Art): Promise<Art & { lamp: ImageBitmap; face: ImageBitmap; logo: ImageBitmap }> {
  const bitmaps = await Promise.all([createImageBitmap(lamp), createImageBitmap(face), createImageBitmap(logo)])
  return { lamp: bitmaps[0], face: bitmaps[1], logo: bitmaps[2], pts }
}

function render(g: Ctx, f: Ctx, art: Art, t: number) {
  const cw = g.canvas.width
  const ch = g.canvas.height
  const s = ch / VIEW.span
  const tx = cw / 2 - VIEW.cx * s
  const ty = ch / 2 - VIEW.cy * s
  const film = (ctx: Ctx) => ctx.setTransform(s, 0, 0, s, tx, ty)

  // cosmos (film.html cosmos(t))
  g.setTransform(1, 0, 0, 1, 0, 0)
  g.globalCompositeOperation = 'source-over'
  g.globalAlpha = 1
  g.filter = 'none'
  g.fillStyle = '#030208'
  g.fillRect(0, 0, cw, ch)
  film(g)
  const neb: Array<[number, number, string, number, number]> = [[0.22, 0.25, MAGP, 0.1, 700], [0.8, 0.7, CYA, 0.07, 760], [0.55, 0.92, '#7A1F80', 0.12, 900]]
  for (const [x, y, col, a, r] of neb) {
    const cx = x * W + Math.sin(t * 0.07 + x * 9) * 60
    const cy = y * H + Math.cos(t * 0.05 + y * 7) * 40
    const gr = g.createRadialGradient(cx, cy, 0, cx, cy, r)
    gr.addColorStop(0, col + Math.round(a * 255).toString(16).padStart(2, '0'))
    gr.addColorStop(1, '#00000000')
    g.fillStyle = gr
    g.fillRect(0, 0, W, H)
  }
  for (const [x, y, z] of STARS) {
    const tw = 0.35 + 0.65 * Math.abs(Math.sin(t * (0.6 + z * 1.7) + z * 40))
    g.fillStyle = `rgba(232,230,240,${(0.12 + 0.5 * z) * tw})`
    const sz = z > 0.93 ? 2 : 1.2
    g.fillRect((x + t * z * 6) % W, y, sz, sz)
  }

  // SCENE 3 (film.html scene3(t)); the hero holds instead of fading out at 0:17
  const a = cl((t - 13.0) / 0.25)
  const la = cl((t - 13.05) / 0.45)
  const pulse = 0.5 + 0.5 * Math.sin((t - 13) * 4.5)
  if (a * la > 0) {
    const glow = 0.35 + pulse * 0.35 * la
    g.save()
    g.globalCompositeOperation = 'lighter'
    g.filter = `blur(${18 * s}px)`
    g.globalAlpha = a * la * glow
    g.drawImage(art.lamp, LAMP3.x - LAMP3.w / 2, LAMP3.y - LAMP3.w / 2, LAMP3.w, LAMP3.w)
    g.filter = 'none'
    g.globalAlpha = a * la
    g.drawImage(art.lamp, LAMP3.x - LAMP3.w / 2, LAMP3.y - LAMP3.w / 2, LAMP3.w, LAMP3.w)
    g.restore()
  }
  const k = cl((t - 13.35) / 1.25)
  const fa = eo(cl((t - 14.25) / 0.5))
  const fx0 = FACE3.x - FACE3.w / 2
  const fy0 = FACE3.y - FACE3.w / 2 + Math.sin((t - 13) * 1.6) * 5 * fa
  f.setTransform(1, 0, 0, 1, 0, 0)
  f.clearRect(0, 0, cw, ch)
  if (k > 0) {
    film(f)
    const P = art.pts
    for (let i = 0; i < P.length; i++) {
      const p = P[i]!
      const hi = h(i * 13 + 5)
      let x = fx0 + p[0]! * FACE3.w
      let y = fy0 + p[1]! * FACE3.w
      const d = h(i * 17 + 3) * 0.55
      const kk = eo(cl((k - d) / 0.45))
      const ang = hi * 6.283 + (1 - kk) * 5.5
      const rad = (1 - kk) * (90 + hi * 120)
      x = lerp(SPOUT[0], x, kk) + Math.cos(ang) * rad
      y = lerp(SPOUT[1], y, kk) + Math.sin(ang) * rad * 0.6
      x += Math.sin(t * 2.1 + hi * 40) * 0.7
      y += Math.cos(t * 1.7 + hi * 50) * 0.7
      let al = a * (0.5 + 0.5 * p[3]!) * cl(kk * 1.2 + 0.45) * (1 - fa * 0.85)
      if (kk <= 0) al *= cl((k - d * 0.9) * 6)
      f.fillStyle = p[2] ? CYA : MAGP
      f.globalAlpha = al
      const sz = hi > 0.985 ? 2.8 : 1.7
      f.fillRect(x - sz / 2, y - sz / 2, sz, sz)
      if (fa > 0 && hi < 0.05) {
        const ph = (t * 0.32 + h(i * 5 + 1)) % 1
        f.globalAlpha = a * fa * (1 - ph) * 0.6
        f.fillRect(x + Math.sin(ph * 6 + hi * 90) * 14, y - ph * 70, 1.6, 1.6)
      }
    }
    f.globalAlpha = 1
    // bloom (film.html flushFX): two blurred additive passes, then the crisp pass
    g.save()
    g.setTransform(1, 0, 0, 1, 0, 0)
    g.globalCompositeOperation = 'lighter'
    g.filter = `blur(${14 * s}px)`
    g.globalAlpha = 0.9
    g.drawImage(f.canvas, 0, 0)
    g.filter = `blur(${4 * s}px)`
    g.drawImage(f.canvas, 0, 0)
    g.filter = 'none'
    g.globalAlpha = 1
    g.drawImage(f.canvas, 0, 0)
    g.restore()
  }
  if (fa > 0) {
    g.save()
    g.globalCompositeOperation = 'lighter'
    g.globalAlpha = a * fa
    g.drawImage(art.face, fx0, fy0, FACE3.w, FACE3.w)
    g.restore()
  }
  const ls = eo(cl((t - 14.15) / 0.45))
  if (a * ls > 0) {
    const lw = 420
    const lh = (lw * art.logo.height) / art.logo.width
    g.save()
    g.globalAlpha = a * ls
    g.imageSmoothingQuality = 'high'
    g.drawImage(art.logo, 960 - lw / 2, 950 + (1 - ls) * 16 - lh / 2, lw, lh)
    g.restore()
  }

  // vignette (film.html vignette())
  const vg = g.createRadialGradient(W / 2, H / 2, H * 0.62, W / 2, H / 2, H * 1.12)
  vg.addColorStop(0, '#00000000')
  vg.addColorStop(1, '#00000070')
  g.fillStyle = vg
  g.globalCompositeOperation = 'source-over'
  g.fillRect(-W, -H, W * 3, H * 3)
}

// ---- the player: one canvas and its bloom buffer, driven by film time ----
// The settled Genie's face, from the canvas center in canvas heights: the pet takes over there.
export type Face = { x: number; y: number; size: number }
const FACE_AT: Face = { x: (FACE3.x - VIEW.cx) / VIEW.span, y: (FACE3.y - VIEW.cy) / VIEW.span, size: FACE3.w / VIEW.span }

export type Player = {
  resize(width: number, height: number): void
  setArt(art: Art): void
  draw(time: number): void // holds the frame at film time `time`
  play(): void // T0 to the settled frame, then onSettled
  stop(): void
}

export function createPlayer(canvas: HTMLCanvasElement | OffscreenCanvas, onSettled: (face: Face) => void): Player {
  const g = canvas.getContext('2d') as Ctx
  const fx = typeof document === 'undefined' ? new OffscreenCanvas(1, 1) : document.createElement('canvas')
  const f = fx.getContext('2d') as Ctx
  // A worker without requestAnimationFrame steps on a timer.
  const frame = typeof requestAnimationFrame === 'function'
    ? requestAnimationFrame
    : (cb: FrameRequestCallback) => setTimeout(() => cb(performance.now()), 16)
  let art: Art | null = null
  let t = T0
  let run = 0 // each draw(), play() and stop() ends the loop before it

  return {
    resize(width, height) {
      canvas.width = fx.width = width
      canvas.height = fx.height = height
      g.imageSmoothingQuality = 'high'
      if (art) render(g, f, art, t)
    },
    setArt(loaded) {
      art = loaded
    },
    draw(time) {
      run++
      t = time
      if (art) render(g, f, art, t)
    },
    play() {
      if (!art) return
      const current = ++run
      let start = 0
      const loop = (now: number) => {
        if (current !== run || !art) return
        if (!start) start = now
        t = Math.min(T0 + (now - start) / 1000, T_SETTLED)
        render(g, f, art, t)
        if (t < T_SETTLED) frame(loop)
        else onSettled(FACE_AT)
      }
      frame(loop)
    },
    stop() {
      run++
      art = null
    },
  }
}
