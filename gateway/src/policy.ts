// Pure policy for the docs chat gateway: who may call it, which hosts it may reach,
// what a turn costs, and which docs, messages and tool output a turn may carry.
// Nothing here reads the environment or touches the network except through the
// fetch a caller hands to makeAllowlistedFetch.

import type { ModelMessage } from 'ai'

/** The only provider origin the gateway may reach. */
export const DEEPSEEK_ORIGIN = 'https://api.deepseek.com'

/**
 * Bearer check, constant time over the expected value: the loop length depends on
 * the token, never on the header. An empty token admits no one, so a Worker
 * deployed without GATEWAY_TOKEN stays closed.
 */
export function isAuthorized(header: string | null, token: string): boolean {
  if (!token) return false
  const encoder = new TextEncoder()
  const got = encoder.encode(header ?? '')
  const want = encoder.encode(`Bearer ${token}`)
  let diff = got.length ^ want.length
  for (let i = 0; i < want.length; i++) diff |= (got[i] ?? 0) ^ want[i]!
  return diff === 0
}

/** Parses ALLOWED_DOCS_ORIGINS (comma separated) into exact origins; anything that is not a bare origin is dropped. */
export function parseOrigins(list: string | undefined): Set<string> {
  const origins = new Set<string>()
  for (const raw of (list ?? '').split(',')) {
    const entry = raw.trim()
    if (!entry) continue
    try {
      const url = new URL(entry)
      if (url.origin === entry.replace(/\/$/, '') && !url.username && !url.password) origins.add(url.origin)
    } catch {
      // not a URL: dropped
    }
  }
  return origins
}

/** DeepSeek, or one of the exact docs origins. Scheme, host and port must all match; credentials never pass. */
export function isAllowedOutbound(url: URL, docsOrigins: ReadonlySet<string>): boolean {
  if (url.username || url.password) return false
  return url.origin === DEEPSEEK_ORIGIN || docsOrigins.has(url.origin)
}

function requestUrl(input: RequestInfo | URL): URL {
  if (input instanceof URL) return input
  if (typeof input === 'string') return new URL(input)
  return new URL(input.url)
}

/**
 * The gateway's one outbound fetch. It refuses any host isAllowedOutbound rejects,
 * always sends `redirect: 'manual'` and treats every 3xx as an error, so an allowed
 * origin cannot send the gateway anywhere else. Each call logs its method, origin
 * and path (no query, no headers), which is how the outbound hosts are proven from
 * the Worker logs.
 */
export function makeAllowlistedFetch(
  docsOrigins: ReadonlySet<string>,
  log: (line: string) => void,
  base: typeof fetch = (input, init) => fetch(input, init),
): typeof fetch {
  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = requestUrl(input)
    const method = init?.method ?? (input instanceof Request ? input.method : 'GET')
    if (!isAllowedOutbound(url, docsOrigins)) {
      log(`outbound refused ${method} ${url.protocol}//${url.host}`)
      throw new Error(`Outbound host not allowed: ${url.host}`)
    }
    log(`outbound ${method} ${url.origin}${url.pathname}`)
    const response = await base(input, { ...init, redirect: 'manual' })
    if (response.status >= 300 && response.status < 400) {
      log(`outbound redirect refused status=${response.status} from=${url.origin}`)
      await response.body?.cancel()
      throw new Error(`Redirect refused: ${response.status} from ${url.origin}`)
    }
    return response
  }) as typeof fetch
}

// ---- cost (DeepSeek public rates, api-docs.deepseek.com/quick_start/pricing, 2026-10-04) ----

/** USD per 1M tokens at peak. Off-peak is half. */
export const PEAK_USD_PER_MTOK = { cacheHit: 0.006, cacheMiss: 0.3, output: 1.2 } as const

/** Peak: Monday to Friday, 01:00-04:00 and 06:00-10:00 UTC. */
export function isPeak(at: Date): boolean {
  const day = at.getUTCDay()
  const hour = at.getUTCHours()
  return day >= 1 && day <= 5 && ((hour >= 1 && hour < 4) || (hour >= 6 && hour < 10))
}

export type Usage = {
  inputTokens?: number
  outputTokens?: number
  cachedInputTokens?: number
  inputTokenDetails?: { cacheReadTokens?: number }
}

export function usageCost(
  usage: Usage | null | undefined,
  at: Date = new Date(),
): { input: number; cached: number; output: number; usd: number; period: 'peak' | 'off-peak' } {
  const input = usage?.inputTokens ?? 0
  const output = usage?.outputTokens ?? 0
  const cached = usage?.inputTokenDetails?.cacheReadTokens ?? usage?.cachedInputTokens ?? 0
  const peak = isPeak(at)
  const factor = peak ? 1 : 0.5
  const rates = PEAK_USD_PER_MTOK
  const usd = (factor * (cached * rates.cacheHit + (input - cached) * rates.cacheMiss + output * rates.output)) / 1e6
  return { input, cached, output, usd, period: peak ? 'peak' : 'off-peak' }
}

/** The ledger's day key: the UTC calendar day. */
export function utcDay(at: Date): string {
  return at.toISOString().slice(0, 10)
}

// ---- what a turn may see ----

const INTERNAL_PATH = /(^|\/)_internal(\/|$)/

/** `_internal/**` never reaches the chat, whether it comes from docs.zip or inline docsPages. */
export function dropInternal(files: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(files).filter(([path]) => !INTERNAL_PATH.test(path)))
}

export class StraySystemMessageError extends Error {
  constructor(index: number) {
    super(`A system message is only accepted first, as the only one (found at index ${index})`)
    this.name = 'StraySystemMessageError'
  }
}

export class UnsupportedPartError extends Error {
  constructor(index: number) {
    super(`Message ${index} carries a part the gateway does not accept`)
    this.name = 'UnsupportedPartError'
  }
}

/** The only part types a turn may carry: the docs chat is text and tool calls. */
const ALLOWED_PART_TYPES = new Set(['text', 'tool-call', 'tool-result'])

/**
 * Throws unless every part of `message` is text, a tool call or a tool result whose
 * output is not of type `content`. File and image parts, and `content` tool output,
 * can name a URL the AI SDK would download with the global fetch, around the
 * allowlist, or hand to DeepSeek as `image_url`.
 */
function checkParts(message: unknown, index: number): void {
  const content = (message as { content?: unknown } | null)?.content
  if (typeof content === 'string') return
  if (!Array.isArray(content)) throw new UnsupportedPartError(index)
  for (const part of content as unknown[]) {
    const { type, output } = (part ?? {}) as { type?: unknown; output?: { type?: unknown } | null }
    if (typeof type !== 'string' || !ALLOWED_PART_TYPES.has(type)) throw new UnsupportedPartError(index)
    if (type === 'tool-result' && output?.type === 'content') throw new UnsupportedPartError(index)
  }
}

/**
 * holocron's proxy sends its system prompt as messages[0]. That one message becomes
 * the `system` option; any other `system` message (a browser can append one to
 * `modelMessages`) throws, and the gateway answers 400. In the same pass, every
 * other message must hold only text, tool-call and tool-result parts (checkParts).
 */
export function splitSystem(messages: ModelMessage[]): { system: string | undefined; messages: ModelMessage[] } {
  let system: string | undefined
  const rest: ModelMessage[] = []
  messages.forEach((message, index) => {
    const role = (message as { role?: unknown } | null)?.role
    if (role !== 'system') {
      checkParts(message, index)
      rest.push(message)
      return
    }
    if (index !== 0 || typeof message.content !== 'string') throw new StraySystemMessageError(index)
    system = message.content
  })
  return { system, messages: rest }
}

// ---- tool output bound ----

const encoder = new TextEncoder()

/** UTF-8 size of a value as the model receives it (tool results are sent JSON encoded). */
export function jsonBytes(value: unknown): number {
  return encoder.encode(JSON.stringify(value)).byteLength
}

/** Longest prefix of `text` whose JSON-escaped UTF-8 size fits in `maxBytes`. */
function clipJsonString(text: string, maxBytes: number): string {
  let used = 0
  let end = 0
  for (const char of text) {
    const size = jsonBytes(char) - 2
    if (used + size > maxBytes) break
    used += size
    end += char.length
  }
  return text.slice(0, end)
}

export type ToolOutput = { stdout: string; stderr: string; exitCode: number; truncated?: true }

/**
 * Fits one bash result into `budget` bytes of JSON, cutting stdout first and then
 * stderr, and marks a cut result `truncated` so the model knows to narrow its
 * command. A result already within budget is returned unchanged.
 */
export function clipToolOutput(output: ToolOutput, budget: number): ToolOutput {
  if (jsonBytes(output) <= budget) return output
  const empty: ToolOutput = { stdout: '', stderr: '', exitCode: output.exitCode, truncated: true }
  let room = Math.max(0, budget - jsonBytes(empty))
  const stdout = clipJsonString(output.stdout, room)
  room -= jsonBytes(stdout) - 2
  const stderr = clipJsonString(output.stderr, room)
  return { stdout, stderr, exitCode: output.exitCode, truncated: true }
}
