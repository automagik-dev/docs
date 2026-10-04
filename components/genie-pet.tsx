'use client'

// Genie, the site-wide companion. src/server.tsx renders <GeniePet /> in a layout on every
// route; it renders nothing and mounts the plain-DOM pet on document.body once per page
// lifetime, so client-side navigation never remounts it.
//
// Art and timing come only from the pet bundle (assets/render/genie-render):
//   - spritesheet.webp: 8 x 11 cells of 192 x 208, drawn whole (never trimmed),
//     anchored center/bottom, closed eyes in every cell;
//   - animation.json: authoritative frame order and durationMs per clip;
//   - look cells: 16 directions, 22.5 deg steps, 0 deg = up, clockwise;
//     neutral = row 0 col 6 (also used for the pointer dead zone and reduced motion).
import { useEffect } from 'react'
// holocron's documented chat hook, from its source: the app is built from src/, so only this
// path shares the app's chat store (the ./chat export resolves to dist/, a second store).
import { useChatWidget } from '@holocron.so/vite/src/chat/use-chat-widget.ts'
import anim from './pet/animation.json'

export type ChatSnapshot = { open: boolean; generating: boolean; failed: boolean }
export type ChatPort = {
  isOpen(): boolean
  toggle(): void
  onChange(listener: (s: ChatSnapshot) => void): () => void
}

type Cell = { x: number; y: number; w: number; h: number; durationMs?: number }
type Clip = { row: number; loop: boolean; frames: Cell[] }
type Play = { name: string; frame: number; acc: number; loopsLeft: number }
type ChatMessages = ReturnType<typeof useChatWidget>['messages']

const SHEET = '/pet/spritesheet.webp'
const COLS = anim.atlas.columns
const ROWS = anim.atlas.rows
const CW = anim.atlas.cellWidth
const CH = anim.atlas.cellHeight
const CLIPS = anim.animations as Record<string, Clip>
const LOOKS = anim.lookDirections.frames as Cell[]
const NEUTRAL = anim.neutral as Cell
const STEP = anim.lookDirections.stepDegrees

const LOOK_HOLD_MS = 2500 // pointer still for this long -> back to idle
const WAVE_LOOPS = 2 // one greeting = two passes of the 4-frame wave clip
const HANDOFF_TIMEOUT_MS = 6000
const WAVED_KEY = 'genie-pet:waved'
const GREET_DELAY_MS = 700 // let the page settle so the wave is actually seen
// Note/Info (blue) and Tip/Check (green) callouts. React writes `color:var(--blue)` on the
// server and `color: var(--blue)` on the client, so match the var and the tinted background.
const CALLOUT_NOTE_TIP = ['blue', 'green']
  .map((c) => `.slot-main div[style*="var(--${c})"][style*="color-mix(in srgb, var(--background)"]`)
  .join(', ')
const REDUCE_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

// Wave once per browser session; storage may be unavailable (private mode), then wave every load.
function wavedThisSession(): boolean {
  try { return sessionStorage.getItem(WAVED_KEY) === '1' } catch { return false }
}
function markWaved() {
  try { sessionStorage.setItem(WAVED_KEY, '1') } catch {}
}

function canonicalPath(p: string) {
  const path = p.replace(/[?#].*$/, '').replace(/\/index$/, '')
  return path === '' ? '/' : path
}

export function mountPet(chat: ChatPort): () => void {
  const reduceMotion = window.matchMedia(REDUCE_MOTION_QUERY)
  const root = document.createElement('div')
  root.className = 'genie-pet'
  // The pet is the chat trigger: a real button for keyboards and screen readers.
  root.setAttribute('role', 'button')
  root.setAttribute('aria-label', 'Ask Genie')
  root.setAttribute('aria-haspopup', 'dialog')
  root.title = 'Ask Genie'
  const sprite = document.createElement('div')
  sprite.className = 'genie-pet__sprite'
  sprite.style.backgroundSize = `${COLS * 100}% ${ROWS * 100}%`
  root.appendChild(sprite)
  document.body.appendChild(root)

  // The 1.8 MB sheet never competes with first paint; the browser caches it across pages.
  const loadSheet = () => { sprite.style.backgroundImage = `url(${SHEET})` }
  if (document.readyState === 'complete') loadSheet()
  else window.addEventListener('load', loadSheet, { once: true })

  let shown = '' // last drawn cell key, so we only touch the DOM on change
  function draw(cell: Cell, label: string) {
    const col = cell.x / CW
    const row = cell.y / CH
    const key = `${col},${row}`
    if (key !== shown) {
      sprite.style.backgroundPosition = `${(col / (COLS - 1)) * 100}% ${(row / (ROWS - 1)) * 100}%`
      shown = key
    }
    root.dataset.pose = label
  }

  // ---------------- chat: clicking the pet toggles holocron's chat drawer ----------------
  // Opening is all the drawer needs: it focuses its own textarea 100 ms after it opens.
  let onActivate: () => void = () => {} // motion mode adds the jump
  function activate() {
    onActivate()
    chat.toggle()
  }
  function onKey(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate() }
  }
  root.addEventListener('click', activate)
  root.addEventListener('keydown', onKey)

  // On wide screens the drawer covers the pet's corner, so while it is open the pet
  // docks just left of the panel (following its open animation) and slides back after.
  let dockRaf = 0
  function dock(open: boolean) {
    cancelAnimationFrame(dockRaf)
    if (!open || window.matchMedia('(max-width: 640px)').matches) { root.style.right = ''; return }
    const until = performance.now() + 1200
    let lastLeft = Number.NaN
    let stable = 0
    const follow = () => {
      const r = document.querySelector('.holocron-chat-drawer-panel')?.getBoundingClientRect()
      if (r && r.width > 0) {
        root.style.right = `${Math.round(document.documentElement.clientWidth - r.left + 12)}px`
        stable = Math.abs(r.left - lastLeft) < 0.5 ? stable + 1 : 0
        lastLeft = r.left
      }
      if (stable < 3 && performance.now() < until) dockRaf = requestAnimationFrame(follow)
    }
    dockRaf = requestAnimationFrame(follow)
  }
  const onResize = () => { if (chat.isOpen()) dock(true) }
  window.addEventListener('resize', onResize, { passive: true })

  let onChatChange: ((s: ChatSnapshot, prev: ChatSnapshot) => void) | null = null
  // The pet mounts on a fresh page load, when no answer is streaming.
  let lastChat: ChatSnapshot = { open: chat.isOpen(), generating: false, failed: false }
  const unsubscribeChat = chat.onChange((s) => {
    const prev = lastChat
    lastChat = s
    root.setAttribute('aria-expanded', String(s.open))
    if (s.open !== prev.open) dock(s.open)
    onChatChange?.(s, prev)
  })
  root.setAttribute('aria-expanded', String(chat.isOpen()))
  if (chat.isOpen()) dock(true)
  function disposeChat() {
    unsubscribeChat()
    cancelAnimationFrame(dockRaf)
    window.removeEventListener('load', loadSheet)
    window.removeEventListener('resize', onResize)
    root.removeEventListener('click', activate)
    root.removeEventListener('keydown', onKey)
  }

  // ---------------- reduced motion: the static neutral pose; the chat still opens ----------------
  if (reduceMotion.matches) {
    draw(NEUTRAL, 'neutral')
    root.dataset.clip = 'neutral'
    root.tabIndex = 0
    root.classList.add('is-visible')
    return () => { disposeChat(); root.remove() }
  }

  // ---------------- clip player (exact durationMs from animation.json) ----------------
  let oneShot: Play | null = null // wave / jump / glide: wins over everything
  let base: Play = { name: 'idle', frame: 0, acc: 0, loopsLeft: Infinity }
  let context: 'review' | 'waiting' | null = null
  let pointer = { x: 0, y: 0, t: -Infinity }
  let visible = false
  const waiters: Array<() => void> = []

  // Chat phases from holocron's store: open -> waiting, streaming -> running, the answer
  // lands -> review once (failed once on an error notice), then back to idle.
  let chatPhase: 'closed' | 'waiting' | 'running' | 'answered' = chat.isOpen() ? 'waiting' : 'closed'
  onChatChange = (s, prev) => {
    if (s.generating && !prev.generating) chatPhase = 'running'
    else if (!s.generating && prev.generating) {
      chatPhase = s.open ? 'answered' : 'closed'
      play(s.failed ? 'failed' : 'review', 1)
    }
    if (s.open !== prev.open && !s.generating) chatPhase = s.open ? 'waiting' : 'closed'
  }
  onActivate = () => { if (visible) play('jumping', 1) }

  function advance(p: Play, dt: number): boolean {
    const frames = CLIPS[p.name]!.frames
    p.acc += dt
    while (p.acc >= frames[p.frame]!.durationMs!) {
      p.acc -= frames[p.frame]!.durationMs!
      p.frame++
      if (p.frame === frames.length) {
        p.loopsLeft--
        if (p.loopsLeft <= 0) return false
        p.frame = 0
      }
    }
    return true
  }

  function play(name: string, loops: number, then?: () => void) {
    oneShot = { name, frame: 0, acc: 0, loopsLeft: loops }
    if (then) waiters.push(then)
  }

  function lookCell(): { cell: Cell; label: string } {
    const r = root.getBoundingClientRect()
    const hx = r.left + r.width / 2
    const hy = r.top + r.height * 0.32 // the head sits in the upper third of the cell
    const dx = pointer.x - hx
    const dy = pointer.y - hy
    if (Math.hypot(dx, dy) < Math.max(56, r.width * 0.75)) return { cell: NEUTRAL, label: 'neutral' }
    const deg = ((Math.atan2(dx, -dy) * 180) / Math.PI + 360) % 360
    const i = Math.round(deg / STEP) % LOOKS.length
    return { cell: LOOKS[i]!, label: `look-${i}` }
  }

  let last = performance.now()
  let raf = 0
  function tick(now: number) {
    const dt = Math.min(now - last, 500)
    last = now
    if (oneShot) {
      if (!advance(oneShot, dt)) {
        oneShot = null
        base = { name: 'idle', frame: 0, acc: 0, loopsLeft: Infinity }
        waiters.splice(0).forEach((fn) => fn())
      }
    }
    if (oneShot) {
      draw(CLIPS[oneShot.name]!.frames[oneShot.frame]!, `${oneShot.name}-${oneShot.frame}`)
      root.dataset.clip = oneShot.name
    } else if (chatPhase === 'running' || chatPhase === 'waiting') {
      if (base.name !== chatPhase) base = { name: chatPhase, frame: 0, acc: 0, loopsLeft: Infinity }
      advance(base, dt)
      draw(CLIPS[base.name]!.frames[base.frame]!, `${base.name}-${base.frame}`)
      root.dataset.clip = base.name
    } else if (context) {
      if (base.name !== context) base = { name: context, frame: 0, acc: 0, loopsLeft: Infinity }
      advance(base, dt)
      draw(CLIPS[base.name]!.frames[base.frame]!, `${base.name}-${base.frame}`)
      root.dataset.clip = base.name
    } else if (now - pointer.t < LOOK_HOLD_MS) {
      const { cell, label } = lookCell()
      draw(cell, label)
      root.dataset.clip = 'look'
      base = { name: 'idle', frame: 0, acc: 0, loopsLeft: Infinity }
    } else {
      if (base.name !== 'idle') base = { name: 'idle', frame: 0, acc: 0, loopsLeft: Infinity }
      advance(base, dt)
      draw(CLIPS.idle!.frames[base.frame]!, `idle-${base.frame}`)
      root.dataset.clip = 'idle'
    }
    root.dataset.chat = chatPhase
    raf = requestAnimationFrame(tick)
  }

  function greet() {
    if (wavedThisSession()) return
    markWaved()
    play('waving', WAVE_LOOPS)
  }

  function show() {
    if (visible) return
    visible = true
    root.tabIndex = 0
    root.classList.add('is-visible')
  }

  // ---------------- arrival: hand-off from the lamp hero on /genie, or a plain fade-in ----------------
  const hero = document.querySelector('[data-genie-hero]')
  let handoffTimer = 0
  let greetTimer = 0
  function onHandoff(e: Event) {
    if (visible) return
    window.clearTimeout(handoffTimer)
    const d = (e as CustomEvent<{ x: number; y: number; size: number }>).detail
    show()
    const r = root.getBoundingClientRect()
    const cx = r.left + r.width / 2
    const cy = r.top + r.height * 0.32
    const s0 = Math.max(0.6, Math.min(1.8, d.size / r.width))
    play(d.x < cx ? 'running-right' : 'running-left', 1, greet)
    root.animate(
      [
        { transform: `translate(${d.x - cx}px, ${d.y - cy}px) scale(${s0})`, opacity: 0 },
        { opacity: 1, offset: 0.2 },
        { transform: 'translate(0, 0) scale(1)', opacity: 1 },
      ],
      { duration: 1060, easing: 'cubic-bezier(.3,.7,.2,1)' },
    )
  }
  window.addEventListener('genie:handoff', onHandoff)
  if (hero) {
    handoffTimer = window.setTimeout(() => { show(); greetTimer = window.setTimeout(greet, GREET_DELAY_MS) }, HANDOFF_TIMEOUT_MS)
  } else {
    show()
    greetTimer = window.setTimeout(greet, GREET_DELAY_MS)
  }

  // ---------------- interactions ----------------
  function onPointerMove(e: PointerEvent) {
    if (e.pointerType === 'touch') return
    pointer = { x: e.clientX, y: e.clientY, t: performance.now() }
  }
  function onPointerLeave() { pointer.t = -Infinity }
  function onOver(e: Event) {
    const t = e.target as Element | null
    if (!t || !t.closest) return
    if (t.closest('figure[class~="group/code"]')) context = 'review'
    else if (t.closest(CALLOUT_NOTE_TIP)) context = 'waiting'
    else context = null
  }

  // Navigation: spiceflow routes with history.pushState; popstate covers back/forward.
  const navOrder = () =>
    [...document.querySelectorAll<HTMLAnchorElement>('.slot-sidebar-nav a[href^="/"]')].map((a) => canonicalPath(a.getAttribute('href')!))
  let current = canonicalPath(location.pathname)
  function onNavigate() {
    const next = canonicalPath(location.pathname)
    if (next === current || !visible) { current = next; return }
    const order = navOrder()
    const dir = order.indexOf(next) < order.indexOf(current) ? -1 : 1
    current = next
    play(dir > 0 ? 'running-right' : 'running-left', 1)
    root.animate(
      [{ transform: 'translateX(0)' }, { transform: `translateX(${dir * 22}px)`, offset: 0.45 }, { transform: 'translateX(0)' }],
      { duration: 1060, easing: 'ease-in-out' },
    )
  }
  const origPush = history.pushState
  history.pushState = function (this: History, ...args: Parameters<History['pushState']>) {
    const r = origPush.apply(this, args)
    queueMicrotask(onNavigate)
    return r
  } as History['pushState']

  window.addEventListener('pointermove', onPointerMove, { passive: true })
  document.documentElement.addEventListener('pointerleave', onPointerLeave)
  document.addEventListener('pointerover', onOver, { passive: true })
  window.addEventListener('popstate', onNavigate)
  raf = requestAnimationFrame(tick)

  return () => {
    cancelAnimationFrame(raf)
    window.clearTimeout(handoffTimer)
    window.clearTimeout(greetTimer)
    history.pushState = origPush
    window.removeEventListener('genie:handoff', onHandoff)
    window.removeEventListener('pointermove', onPointerMove)
    document.documentElement.removeEventListener('pointerleave', onPointerLeave)
    document.removeEventListener('pointerover', onOver)
    window.removeEventListener('popstate', onNavigate)
    disposeChat()
    root.remove()
  }
}

// ---------------- the React side: one port and one pet per page lifetime ----------------
// The port lives at module level, so the pet keeps a live chat even if the layout remounts
// <GeniePet />: whichever instance is mounted publishes the hook's state into it.
let chatState: ChatSnapshot = { open: false, generating: false, failed: false }
let toggleChat: () => void = () => {}
const chatListeners = new Set<(s: ChatSnapshot) => void>()
const port: ChatPort = {
  isOpen: () => chatState.open,
  toggle: () => toggleChat(),
  onChange(listener) {
    chatListeners.add(listener)
    return () => { chatListeners.delete(listener) }
  },
}
let disposePet: (() => void) | null = null
function startPet() {
  disposePet?.()
  disposePet = mountPet(port)
}

// An answer failed when the last assistant message carries an error notice.
function lastAnswerFailed(messages: ChatMessages): boolean {
  const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant')
  return !!lastAssistant?.parts.some((p) => p.type === 'notice' && p.severity === 'error')
}

export function GeniePet(): null {
  const { isOpen, isGenerating, messages, toggle } = useChatWidget()
  const failed = lastAnswerFailed(messages)

  useEffect(() => {
    toggleChat = toggle
    const prev = chatState
    chatState = { open: isOpen, generating: isGenerating, failed }
    if (prev.open !== isOpen || prev.generating !== isGenerating || prev.failed !== failed) {
      for (const listener of chatListeners) listener(chatState)
    }
  }, [isOpen, isGenerating, failed, toggle])

  useEffect(() => {
    if (disposePet) return
    startPet()
    // A reduced-motion change remounts the pet in the matching mode.
    window.matchMedia(REDUCE_MOTION_QUERY).addEventListener('change', startPet)
  }, [])

  return null
}
