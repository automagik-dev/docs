// automagik-docs-chat: holocron's /api/chat gateway protocol on a Worker, calling
// DeepSeek directly. Ported from the frozen spike's gateway/server.ts, itself a port of
// remorses/holocron website/src/gateway.ts at a71162e.
//
// Kept from the spike: the routes, the request schema, the streamed chunk protocol (AI
// SDK UI chunks plus `notice`, `model-messages` and `title`), docs from `docsZipUrl` or
// inline `docsPages`, the docs bash tool, client tools, the curated provider-error
// notices, `_internal` dropped, and DeepSeek's thinking mode off (it requires every
// earlier turn's reasoning_content back whenever tools are present, and the site's
// round trip drops it).
//
// Changed: a Worker fetch handler instead of Bun.serve; a bearer token gate; Worker
// secrets instead of the process environment; one allowlisted fetch (DeepSeek and the
// site's docs.zip only, no redirects) handed to the provider and the docs loader instead
// of a patched global fetch; the system prompt passed as `system`, never inside
// `messages`; bounded bodies, output tokens, steps and tool output; one global rate
// limit instead of a per-IP one; a hard daily spend cap through the SpendLedger Durable
// Object, reserved before DeepSeek is called and settled after; no server-side sessions.
//
// Checks run in this order: routing (unknown paths 404), the bearer on /api/chat* (401),
// the body size (413), the request shape, system messages and part types (400), the
// global limiter (notice), the spend reservation (notice), then the turn.

import { createDeepSeek } from '@ai-sdk/deepseek'
import {
  generateText,
  jsonSchema,
  type ModelMessage,
  stepCountIs,
  streamText,
  tool as aiTool,
  type UIMessageChunk,
} from 'ai'
import { strFromU8, unzipSync } from 'fflate'
import { Spiceflow } from 'spiceflow'
import { z } from 'zod'
import { createChatBashTool } from './chat-bash-tool.ts'
import {
  MAX_BODY_BYTES,
  MAX_OUTPUT_TOKENS,
  MAX_STEPS,
  RESERVATION_TTL_MS,
  stepWorstCaseUsd,
  TITLE_MAX_OUTPUT_TOKENS,
  TITLE_QUESTION_CHARS,
  TITLE_WORST_CASE_USD,
  worstCaseUsd,
} from './ledger.ts'
import {
  DEEPSEEK_ORIGIN,
  dropInternal,
  isAllowedOutbound,
  isAuthorized,
  makeAllowlistedFetch,
  parseOrigins,
  splitSystem,
  type Usage,
  usageCost,
  utcDay,
} from './policy.ts'
import type { SpendLedger } from './spend-ledger.ts'

export { SpendLedger } from './spend-ledger.ts'

export interface Env {
  DEEPSEEK_API_KEY: string
  GATEWAY_TOKEN: string
  DEEPSEEK_MODEL: string
  DAILY_USD_CAP: string
  ALLOWED_DOCS_ORIGINS: string
  CHAT_GLOBAL_LIMITER: RateLimit
  SPEND_LEDGER: DurableObjectNamespace<SpendLedger>
}

export type Ledger = {
  reserve(day: string, usd: number, cap: number): Promise<string | null>
  settle(id: string, usd: number): Promise<void>
}

export type GatewayDeps = {
  token: string
  apiKey: string
  model: string
  /** Daily cap in USD; 0 refuses every turn. */
  cap: number
  docsOrigins: ReadonlySet<string>
  limiter: { limit(options: { key: string }): Promise<{ success: boolean }> }
  ledger: Ledger
  log?: (line: string) => void
  /** The network under the allowlist; tests pass a stub. */
  fetch?: typeof fetch
  now?: () => Date
}

const DEFAULT_MODEL = 'deepseek-flash'
const DEFAULT_CAP = '2.00'
const DOCS_ZIP_CACHE_MS = 5 * 60 * 1000
const PROVIDER_OPTIONS = { deepseek: { thinking: { type: 'disabled' as const } } }

// ---- notices (shapes mirror upstream and the site's chat-store `notice` part) ----

type Notice = {
  type: 'notice'
  code: string
  title: string
  message: string
  severity?: 'info' | 'error' | 'promotion'
  display?: 'once' | 'always'
}

function safeProviderMessage(raw: string): string {
  if (/no output generated/i.test(raw))
    return 'The AI model did not return a response. This usually means the provider is temporarily unavailable. Please try again.'
  if (/rate.?limit|429|too many requests/i.test(raw))
    return 'The AI provider is rate limited right now. Please try again in a moment.'
  if (/timeout|timed out|etimedout/i.test(raw)) return 'The AI provider timed out. Please try again.'
  if (/abort/i.test(raw)) return 'The response was interrupted before it finished.'
  return 'The AI provider failed to return a response. Please try again.'
}

function streamErrorNotice(raw: string): Notice {
  const noOutput = /no output generated/i.test(raw)
  return {
    type: 'notice',
    severity: 'error',
    display: 'always',
    code: 'HOLOCRON_STREAM_ERROR',
    title: noOutput ? 'AI model unavailable' : 'Something went wrong',
    message: safeProviderMessage(raw),
  }
}

export const NOTICE_RATE_LIMIT_REACHED: Notice = {
  type: 'notice',
  severity: 'info',
  display: 'always',
  code: 'HOLOCRON_RATE_LIMIT_REACHED',
  title: 'Rate limit reached',
  message: 'Too many AI chat requests. Wait a minute and try again.',
}

export const NOTICE_DAILY_BUDGET_REACHED: Notice = {
  type: 'notice',
  severity: 'info',
  display: 'always',
  code: 'HOLOCRON_USAGE_LIMIT_REACHED',
  title: 'Daily limit reached',
  message: "The docs assistant has used today's budget. Please try again tomorrow.",
}

// ---- request shape ----

const toolSchemaItem = z.object({
  name: z.string().regex(/^[a-zA-Z0-9_-]{1,64}$/),
  description: z.string(),
  inputJsonSchema: z.record(z.string(), z.any()),
})
const sessionIdSchema = z.string().regex(/^chs_[A-Za-z0-9_-]{43}$/)
const chatRequestSchema = z.object({
  messages: z.array(z.any()),
  docsZipUrl: z.string().url().optional(),
  docsPages: z.record(z.string(), z.string()).optional(),
  skillUrls: z.array(z.string().url()).optional(),
  pageSlug: z.string().optional(),
  toolSchemas: z.array(toolSchemaItem).optional(),
  sessionId: sessionIdSchema.optional(),
})

type ChatChunk =
  | UIMessageChunk
  | Notice
  | { type: 'title'; title: string }
  | { type: 'model-messages'; messages: ModelMessage[] }

function jsonError(status: number, error: string): Response {
  return new Response(JSON.stringify({ error }), { status, headers: { 'content-type': 'application/json' } })
}
const UNAUTHORIZED = () => jsonError(401, 'Unauthorized.')
const TOO_LONG = () => jsonError(413, 'Your question is too long. Please shorten it and ask again.')
const UNANSWERABLE = () => jsonError(400, 'This request cannot be answered.')

function requireAuth(request: { headers: Headers }, token: string): void {
  if (!isAuthorized(request.headers.get('authorization'), token)) throw UNAUTHORIZED()
}

/** Reads the body, stopping at `limit` bytes (413), whatever content-length claims. */
async function readBoundedBody(
  request: { headers: Headers; body: ReadableStream<Uint8Array> | null },
  limit: number,
): Promise<{ text: string; bytes: number }> {
  if (Number(request.headers.get('content-length') ?? 0) > limit) throw TOO_LONG()
  const reader = request.body?.getReader()
  if (!reader) return { text: '', bytes: 0 }
  const chunks: Uint8Array[] = []
  let bytes = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    bytes += value.byteLength
    if (bytes > limit) {
      await reader.cancel()
      throw TOO_LONG()
    }
    chunks.push(value)
  }
  const joined = new Uint8Array(bytes)
  let offset = 0
  for (const chunk of chunks) {
    joined.set(chunk, offset)
    offset += chunk.byteLength
  }
  return { text: new TextDecoder().decode(joined), bytes }
}

function requireSessionHeaders(request: { headers: Headers }): void {
  if (!sessionIdSchema.safeParse(request.headers.get('x-holocron-chat-session')).success)
    throw jsonError(400, 'Invalid or missing x-holocron-chat-session header')
  if (!request.headers.get('x-holocron-site')) throw jsonError(400, 'Missing x-holocron-site header')
}

function firstUserText(messages: ModelMessage[]): string {
  const first = messages.find((m) => m.role === 'user')
  if (!first) return ''
  if (typeof first.content === 'string') return first.content
  return first.content
    .filter((part) => part.type === 'text')
    .map((part) => (part as { text: string }).text)
    .join(' ')
}

function addUsage(total: Required<Pick<Usage, 'inputTokens' | 'outputTokens' | 'cachedInputTokens'>>, usage: Usage) {
  total.inputTokens += usage.inputTokens ?? 0
  total.outputTokens += usage.outputTokens ?? 0
  total.cachedInputTokens += usage.inputTokenDetails?.cacheReadTokens ?? usage.cachedInputTokens ?? 0
}

export function createGateway(deps: GatewayDeps) {
  const log = deps.log ?? ((line: string) => console.log(line))
  const now = deps.now ?? (() => new Date())
  const outboundFetch = makeAllowlistedFetch(deps.docsOrigins, log, deps.fetch)
  const deepseek = createDeepSeek({ apiKey: deps.apiKey, baseURL: DEEPSEEK_ORIGIN, fetch: outboundFetch })

  const docsZipCache = new Map<string, { expiresAt: number; promise: Promise<Record<string, string>> }>()
  async function fetchDocsZip(url: URL): Promise<Record<string, string>> {
    const response = await outboundFetch(url, { headers: { accept: 'application/zip' } })
    if (!response.ok) throw new Error(`Failed to fetch docs.zip: ${response.status} ${response.statusText}`)
    const zip = unzipSync(new Uint8Array(await response.arrayBuffer()))
    const entries = Object.entries(zip).filter(([name]) => !name.endsWith('/'))
    const files = dropInternal(
      Object.fromEntries(entries.map(([name, bytes]) => [`/docs/${name.replace(/\.mdx?$/, '')}.mdx`, strFromU8(bytes)])),
    )
    const dropped = entries.length - Object.keys(files).length
    log(`docs.zip ${url.origin}: ${entries.length} files, ${dropped} under _internal dropped`)
    return files
  }
  function getDocsZipFiles(url: URL): Promise<Record<string, string>> {
    const at = Date.now()
    const cached = docsZipCache.get(url.href)
    if (cached && cached.expiresAt > at) return cached.promise
    const promise = fetchDocsZip(url)
    docsZipCache.set(url.href, { expiresAt: at + DOCS_ZIP_CACHE_MS, promise })
    promise.catch(() => docsZipCache.delete(url.href))
    return promise
  }

  return new Spiceflow()
    .onError(({ error }) => {
      log(`unhandled error: ${String((error as Error)?.message ?? error).slice(0, 300)}`)
      return jsonError(500, 'The docs assistant failed. Please try again.')
    })
    .route({
      method: 'GET',
      path: '/health',
      handler: () => ({ ok: true, model: deps.model, provider: 'api.deepseek.com' }),
    })
    .route({
      method: 'POST',
      path: '/api/chat',
      request: chatRequestSchema,
      async *handler({ request, waitUntil }): AsyncGenerator<ChatChunk> {
        requireAuth(request, deps.token)
        const { text, bytes: bodyBytes } = await readBoundedBody(request, MAX_BODY_BYTES)

        let body: z.infer<typeof chatRequestSchema>
        let split: ReturnType<typeof splitSystem>
        try {
          body = chatRequestSchema.parse(JSON.parse(text))
          split = splitSystem(body.messages as ModelMessage[])
        } catch (error) {
          // The name only: the message can quote what the caller sent.
          log(`rejected request: ${error instanceof Error ? error.name : 'non-error'}`)
          throw UNANSWERABLE()
        }
        const docsZipUrl = body.docsZipUrl ? new URL(body.docsZipUrl) : undefined
        if (!body.docsPages && !docsZipUrl) throw jsonError(400, 'Missing docsZipUrl or docsPages.')
        if (docsZipUrl && !(deps.docsOrigins.has(docsZipUrl.origin) && isAllowedOutbound(docsZipUrl, deps.docsOrigins))) {
          log(`rejected docsZipUrl origin=${docsZipUrl.origin}`)
          throw jsonError(400, 'docsZipUrl origin not allowed.')
        }

        const { success } = await deps.limiter.limit({ key: 'all' })
        if (!success) {
          log('rate-limited key=all')
          yield NOTICE_RATE_LIMIT_REACHED
          return
        }

        const startedAt = now()
        const reservedUsd = worstCaseUsd({ bodyBytes })
        const reservation = await deps.ledger.reserve(utcDay(startedAt), reservedUsd, deps.cap)
        if (!reservation) {
          log(`budget refused reservedUsd=${reservedUsd.toFixed(6)} bodyBytes=${bodyBytes}`)
          yield NOTICE_DAILY_BUDGET_REACHED
          return
        }

        const turnId = crypto.randomUUID().slice(0, 8)
        const tlog = (line: string) => log(`[${turnId}] ${line}`)
        const messages = split.messages
        const site = request.headers.get('x-holocron-site') ?? docsZipUrl?.host ?? 'unknown'
        const turnUsage = { inputTokens: 0, outputTokens: 0, cachedInputTokens: 0 }
        const turn = {
          textChars: 0,
          toolCalls: 0,
          ttftMs: -1,
          errorText: '',
          sawErrorChunk: false,
          started: false,
          finished: false,
          stepsFinished: 0,
          unmeasuredUsd: 0,
        }
        let titlePromise: Promise<{ title: string | null; usage: Usage | null }> | null = null
        // Aborts whatever is still running when the turn ends early (client gone, error).
        const abort = new AbortController()
        const onClientAbort = () => abort.abort()
        request.signal?.addEventListener('abort', onClientAbort)
        // A turn that never ends would never settle: stop it well before its
        // reservation expires (expiry charges the whole reservation).
        const turnSignal = AbortSignal.any([abort.signal, AbortSignal.timeout(RESERVATION_TTL_MS / 2)])

        try {
          const files = body.docsPages ? dropInternal(body.docsPages) : await getDocsZipFiles(docsZipUrl!)
          tlog(
            `turn start site=${site} page=${body.pageSlug || '/'} docs=${Object.keys(files).length} via=${body.docsPages ? 'inline' : 'docs.zip'} bodyBytes=${bodyBytes} reservedUsd=${reservedUsd.toFixed(6)}`,
          )
          const bash = createChatBashTool({ files, log: tlog })
          const model = deepseek(deps.model)

          const isFirstTurn = messages.filter((m) => m.role === 'user').length === 1
          titlePromise =
            body.sessionId && isFirstTurn
              ? generateText({
                  model,
                  providerOptions: PROVIDER_OPTIONS,
                  prompt: `Write a short title (at most 6 words) summarizing this documentation question. Reply with the title only — no quotes, no trailing punctuation.\n\nQuestion: ${firstUserText(messages).slice(0, TITLE_QUESTION_CHARS)}`,
                  maxOutputTokens: TITLE_MAX_OUTPUT_TOKENS,
                  abortSignal: turnSignal,
                })
                  .then((r) => ({
                    title:
                      r.text
                        .trim()
                        .replace(/^["']|["']$/g, '')
                        .slice(0, 80) || null,
                    usage: r.usage as Usage,
                  }))
                  .catch(() => ({ title: null, usage: null }))
              : null

          const RESERVED = new Set(['bash'])
          const clientTools = Object.fromEntries(
            (body.toolSchemas ?? [])
              .filter((t) => !RESERVED.has(t.name))
              .map((t) => [
                t.name,
                aiTool({
                  description: t.description,
                  inputSchema: jsonSchema(t.inputJsonSchema as Parameters<typeof jsonSchema>[0]),
                }),
              ]),
          )

          turn.started = true
          const result = streamText({
            model,
            system: split.system,
            messages,
            tools: { bash, ...clientTools },
            maxOutputTokens: MAX_OUTPUT_TOKENS,
            stopWhen: stepCountIs(MAX_STEPS),
            providerOptions: PROVIDER_OPTIONS,
            abortSignal: turnSignal,
            // Never download: attachment parts are refused at the door (splitSystem), and
            // the SDK would fetch any that slipped through with the global fetch.
            experimental_download: async (requests) => {
              if (requests.length) throw new Error('downloads refused')
              return []
            },
            // Replaces the SDK's default console.error of the whole error, which carries
            // the request body, headers and URLs.
            onError: ({ error }) => {
              const { name, statusCode } = (error ?? {}) as { name?: unknown; statusCode?: unknown }
              tlog(
                `stream error name=${typeof name === 'string' ? name.slice(0, 60) : 'unknown'} status=${typeof statusCode === 'number' ? statusCode : '-'}`,
              )
            },
            onStepFinish: ({ usage }) => {
              // A step whose usage is missing is charged at its bound.
              if (usage.inputTokens === undefined) turn.unmeasuredUsd += stepWorstCaseUsd(bodyBytes, turn.stepsFinished)
              else addUsage(turnUsage, usage as Usage)
              turn.stepsFinished += 1
            },
          })

          for await (const chunk of result.toUIMessageStream({
            onError: (error) => {
              const err = error instanceof Error ? error : new Error(String(error))
              turn.errorText = err.message
              turn.sawErrorChunk = true
              tlog(`provider error: ${err.message.slice(0, 300)}`)
              return safeProviderMessage(err.message)
            },
          })) {
            if (chunk.type === 'text-delta') {
              if (turn.ttftMs < 0) turn.ttftMs = Date.now() - startedAt.getTime()
              turn.textChars += chunk.delta?.length ?? 0
            } else if (chunk.type === 'tool-input-available') {
              turn.toolCalls += 1
            }
            yield chunk
          }
          const responseMessages = (await result.response).messages
          turn.finished = true
          yield { type: 'model-messages', messages: responseMessages }
          const titled = titlePromise ? await titlePromise : null
          if (titled?.title) yield { type: 'title', title: titled.title }
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error))
          turn.errorText ||= err.message
          tlog(`turn error: ${err.message.slice(0, 300)}`)
          if (turn.textChars === 0 && !turn.sawErrorChunk) yield streamErrorNotice(err.message)
        } finally {
          request.signal?.removeEventListener('abort', onClientAbort)
          abort.abort()
          tlog(
            `turn end ms=${Date.now() - startedAt.getTime()} ttft=${turn.ttftMs} textChars=${turn.textChars} toolCalls=${turn.toolCalls} steps=${turn.stepsFinished}${turn.errorText ? ` error=${JSON.stringify(turn.errorText.slice(0, 160))}` : ''}`,
          )
          // Settles on every path, after the response if need be. A turn that stopped
          // before its last step finished is charged that step's bound, and a title call
          // with no usage its bound, so the cap stays hard.
          const pendingTitle = titlePromise
          const settle = async () => {
            const titled = pendingTitle ? await pendingTitle : null
            if (turn.started && !turn.finished && turn.stepsFinished < MAX_STEPS)
              turn.unmeasuredUsd += stepWorstCaseUsd(bodyBytes, turn.stepsFinished)
            if (pendingTitle && !titled?.usage) turn.unmeasuredUsd += TITLE_WORST_CASE_USD
            const main = usageCost(turnUsage, startedAt)
            const extra = usageCost(titled?.usage, startedAt)
            const measuredUsd = main.usd + extra.usd
            tlog(
              `usage model=${deps.model} input=${main.input + extra.input} cached=${main.cached + extra.cached} output=${main.output + extra.output} reservedUsd=${reservedUsd.toFixed(6)} measuredUsd=${measuredUsd.toFixed(6)} unmeasuredUsd=${turn.unmeasuredUsd.toFixed(6)} (${main.period} rates, title call included)`,
            )
            await deps.ledger.settle(reservation, measuredUsd + turn.unmeasuredUsd)
          }
          waitUntil(settle().catch((error) => tlog(`settle failed: ${String(error?.message ?? error).slice(0, 200)}`)))
        }
      },
    })
    .route({
      method: 'GET',
      path: '/api/chat/session',
      handler({ request }) {
        requireAuth(request, deps.token)
        requireSessionHeaders(request)
        // Sessions are not persisted: the client resends the conversation every turn.
        return { modelMessages: [] as Record<string, unknown>[] }
      },
    })
    .route({
      method: 'DELETE',
      path: '/api/chat/session',
      handler({ request }) {
        requireAuth(request, deps.token)
        requireSessionHeaders(request)
        return { deleted: true }
      },
    })
}

function depsFromEnv(env: Env): GatewayDeps {
  const cap = Number(env.DAILY_USD_CAP || DEFAULT_CAP)
  const ledgerId = env.SPEND_LEDGER.idFromName('spend')
  return {
    token: env.GATEWAY_TOKEN ?? '',
    apiKey: env.DEEPSEEK_API_KEY ?? '',
    model: env.DEEPSEEK_MODEL || DEFAULT_MODEL,
    // A cap that is not a number fails closed.
    cap: Number.isFinite(cap) && cap >= 0 ? cap : 0,
    docsOrigins: parseOrigins(env.ALLOWED_DOCS_ORIGINS),
    limiter: env.CHAT_GLOBAL_LIMITER,
    ledger: {
      reserve: (day, usd, cap) => env.SPEND_LEDGER.get(ledgerId).reserve(day, usd, cap),
      settle: (id, usd) => env.SPEND_LEDGER.get(ledgerId).settle(id, usd),
    },
  }
}

let current: { env: Env; app: ReturnType<typeof createGateway> } | undefined

export default {
  fetch(request: Request, env: Env): Promise<Response> {
    if (current?.env !== env) current = { env, app: createGateway(depsFromEnv(env)) }
    return current.app.handle(request)
  },
} satisfies ExportedHandler<Env>
