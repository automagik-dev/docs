// The site's guard on holocron's chat proxy, POST /holocron-api/chat. holocron forwards what
// the browser sends there to the chat gateway with the site's token, so the gateway cannot
// tell a visitor's request from the site's own. Before holocron reads the body, this guard
// refuses:
//   - a body over 64 KB, with 413;
//   - a body that is not JSON, or whose modelMessages holds a `system` message, with 400.
//     holocron puts its own system prompt first and appends modelMessages as sent, so a
//     browser `system` message would reach the model as an instruction. The gateway checks
//     the same thing on its side.
// The path is compared in canonical form, so `/holocron-api/chat/` or `//holocron-api/chat`
// cannot step around the guard. Every other request passes through untouched. There is no
// per-visitor limit (owner decision A, docs-holocron-chat); the gateway's token, daily spend
// cap and bounds stay.

const CHAT_PATH = '/holocron-api/chat'
export const MAX_CHAT_BODY_BYTES = 65_536

const TOO_LONG = 'Your question is too long. Please shorten it and ask again.'
const UNANSWERABLE = 'This request cannot be answered.'

/** Decodes each segment, collapses repeated slashes and strips trailing slashes. */
export function canonicalPath(pathname: string): string {
  const segments = pathname.split('/').map((segment) => {
    try {
      return decodeURIComponent(segment)
    } catch {
      return segment
    }
  })
  return segments.join('/').replace(/\/{2,}/g, '/').replace(/\/+$/, '') || '/'
}

function jsonError(status: number, error: string): Response {
  return new Response(JSON.stringify({ error }), { status, headers: { 'content-type': 'application/json' } })
}

/** The body as text, read from a clone; null once it passes `limit` bytes, whatever it declares. */
async function readClonedBody(request: Request, limit: number): Promise<string | null> {
  if (Number(request.headers.get('content-length') ?? 0) > limit) return null
  const reader = request.clone().body?.getReader()
  if (!reader) return ''
  const decoder = new TextDecoder()
  let text = ''
  let bytes = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    bytes += value.byteLength
    if (bytes > limit) {
      await reader.cancel()
      return null
    }
    text += decoder.decode(value, { stream: true })
  }
  return text + decoder.decode()
}

export const chatGuard = async (
  { request }: { request: Request },
  next: () => Promise<Response | void>,
): Promise<Response | void> => {
  if (request.method !== 'POST' || canonicalPath(new URL(request.url).pathname) !== CHAT_PATH) return next()

  const text = await readClonedBody(request, MAX_CHAT_BODY_BYTES)
  if (text === null) return jsonError(413, TOO_LONG)
  let body: unknown
  try {
    body = JSON.parse(text)
  } catch {
    return jsonError(400, UNANSWERABLE)
  }
  const modelMessages = (body as { modelMessages?: unknown } | null)?.modelMessages
  if (Array.isArray(modelMessages) && modelMessages.some((m) => (m as { role?: unknown } | null)?.role === 'system'))
    return jsonError(400, UNANSWERABLE)
  return next()
}
