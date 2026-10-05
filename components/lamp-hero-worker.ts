// The lamp hero's film, played off the page's main thread. components/lamp-hero.tsx transfers a
// canvas here, then sends its pixel size on every resize, the art as bitmaps once, and 'play' on
// every click; the film plays when the art arrives and on each 'play', and the worker answers
// the settled face's position.
import { createPlayer, type Art, type Face, type Player } from './lamp-hero-film'

type Message = { canvas: OffscreenCanvas } | { width: number; height: number } | { art: Art } | 'play'
const scope = self as unknown as { onmessage: ((e: MessageEvent<Message>) => void) | null; postMessage(face: Face): void }

let player: Player | null = null
scope.onmessage = ({ data }) => {
  if (data === 'play') player?.play()
  else if ('canvas' in data) player = createPlayer(data.canvas, (face) => scope.postMessage(face))
  else if ('art' in data) {
    player?.setArt(data.art)
    player?.play()
  } else player?.resize(data.width, data.height)
}
