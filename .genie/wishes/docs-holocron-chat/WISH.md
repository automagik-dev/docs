# Wish: docs.automagik.dev on holocron: self-hosted chat gateway on DeepSeek

| Field | Value |
|-------|-------|
| **Status** | APPROVED |
| **Slug** | `docs-holocron-chat` |
| **Date** | 2026-10-04 |
| **Author** | Felipe Rosa (plan drafted by Claude) |
| **Appetite** | medium |
| **Branch** | `wish/docs-holocron-chat` |
| **Repos touched** | `automagik-dev/docs` |
| **Design** | _No brainstorm — direct wish_ |

## Summary

Gives the holocron site its AI chat through a small Worker, `automagik-docs-chat`, that speaks holocron's gateway protocol and calls DeepSeek directly (`deepseek-flash`, thinking off). It ports the spike's Bun gateway to Workers, keeps the DeepSeek key in that Worker alone, bounds each request at the site edge, enforces a hard daily spend cap by reserving each turn's worst case before calling DeepSeek, and allows no outbound host but DeepSeek and the site's own `docs.zip`. Fourth of five sibling wishes (`docs-holocron`, `docs-holocron-brand`, `docs-holocron-products`, this one, `docs-holocron-cutover`).

## Scope

### IN

- `gateway/`: a Worker package porting the frozen snapshot's `gateway/server.ts` and `gateway/chat-bash-tool.ts` (upstream `remorses/holocron` `website/src/gateway.ts` at `a71162e`, minus billing, D1, Durable Object sessions and Vercel): `GET /health`, `POST /api/chat`, `GET` and `DELETE /api/chat/session`; bearer authentication; an outbound allowlist with no redirect following; bounded turns; a `SpendLedger` Durable Object that reserves and settles; one usage log line per turn.
- Site wiring: `src/chat-guard.ts` on the canonical `POST /holocron-api/chat` path (a 64 KB body cap, no `system` role from the browser), registered in `src/server.tsx`.
- `.github/workflows/chat.yml`: checks on PRs that touch `gateway/**`, deploy on `main` behind the `production` environment.
- `scripts/verify-site.mjs` flags `--chat-guard` and `--gateway-smoke`.
- Provisioning with Felipe: the gateway token, Worker secrets, the first gateway deploy, a smoke test.

### OUT

- Conversation restore after a page reload (upstream's `ChatSessionDO`).
- holocron.so keys, billing, credits, D1, juice, Vercel AI Gateway, any provider but DeepSeek.
- Chat on PR previews (they carry no token; owner decision C, 2026-10-04).
- A per-visitor rate limit at the site edge (owner decision A, 2026-10-04: deferred; trigger to revisit: abuse or the spend cap being hit).
- Alerting channels beyond Workers Logs.
- Fetching `skillUrls`.

## Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | AI chat is holocron's chat with a self-hosted gateway calling DeepSeek directly (`deepseek-flash`, thinking off); no holocron.so, Vercel or juice in the path; the key comes from bws (`DEEPSEEK_API_KEY`), is stored as a Worker secret and is never in git. | Owner decision (Felipe, 2026-10-03/04, final). Thinking stays off because DeepSeek requires every earlier turn's `reasoning_content` back when tools are present, and holocron's round trip drops it (spike finding). |
| 2 | The gateway is its own Worker, hosted on Cloudflare Workers like the site. | Owner decision on hosting. A separate Worker keeps the DeepSeek key away from the site Worker, which runs holocron's whole dependency tree, and keeps content deploys from touching the gateway. |
| 3 | The site reaches the gateway over HTTPS at `HOLOCRON_URL` (baked by `docs-holocron`), with `global_fetch_strictly_public` on both Workers. | holocron's proxy calls `${HOLOCRON_URL}/api/chat` with the global `fetch` (`app-factory.tsx:1853-1879`). With the flag, a fetch to another Worker in the same zone goes through Cloudflare's front door like an Internet request, and after cutover the site sits on a Custom Domain, which other Workers may fetch without a binding (Cloudflare docs). A service binding would need a patched global fetch in the site. |
| 4 | Authentication: the site Worker holds secret `HOLOCRON_KEY`, the gateway holds secret `GATEWAY_TOKEN` with the same value, compared in constant time; any `/api/chat*` request without it gets 401. The value lives in bws as `DOCS_CHAT_GATEWAY_TOKEN`. | holocron sends `authorization: Bearer ${HOLOCRON_KEY}` whenever that variable is set (`app-factory.tsx:1856-1860`, `lib/holocron-url.ts:51-64`), and with `nodejs_compat` on a compatibility date after 2025-04-01 Worker secrets populate `process.env`. The gateway stays closed to direct callers. |
| 5 | `src/chat-guard.ts` runs in the site Worker on the canonical path: it decodes each segment, collapses repeated slashes and strips trailing slashes before matching `POST /holocron-api/chat`, so `/holocron-api/chat/` or `//holocron-api/chat` cannot bypass it. It bounds the request (decision 6) and applies no per-visitor rate limit. The visitor IP is neither limited nor forwarded to the gateway; the gateway accepts only the site's token (decision 4). | Owner decision A (Felipe, 2026-10-04): no per-IP rate limit for now, deferred by owner; trigger to revisit: abuse or the spend cap being hit. The cost and safety bounds stay: the token gate, the hard daily cap with its reservation ledger, the 64 KB body cap, no `system` role, `maxOutputTokens`, the step limit, `redirect: 'manual'` and this canonical-path guard. holocron's chat client shows the `error` field of a non-OK JSON response as is (`chat/chat-submit.ts:455-461`). |
| 6 | The daily cap is hard. Every input is bounded: the site guard rejects request bodies over 64 KB (413) and any `system` role inside `modelMessages` (400); the gateway rejects bodies over 256 KB, sets `maxOutputTokens` 1024 per step, stops at 6 steps, and truncates each bash tool result to 16 KB. Before calling DeepSeek, the gateway asks `SpendLedger` to reserve the turn's worst case, computed by `worstCaseUsd` from the actual request size, those bounds, peak rates, every input token a cache miss, one token per 2 bytes, and the title call; the reservation is refused once today's spend plus open reservations would pass `DAILY_USD_CAP` (default `"2.00"`), and the turn is answered with a notice and no DeepSeek call. After the turn the reservation settles to the measured cost; reservations left open by a crashed isolate expire after 10 minutes. A `spend-alert` log line marks the first crossing of 50% and 100% of the cap each day. A global `ratelimits` binding (120 per 60 s, key `all`) bounds bursts. | The plan review showed a soft cap: concurrent turns could each pass a check and overspend together. Reserving the bound before the call makes the cap hold under concurrency, because the Durable Object runs one request at a time and checks and records a reservation in one step. A typical request (about 15 KB) reserves about $0.06 against a measured $0.0003 to $0.001, so $2 a day still admits about 30 turns in flight. The spike's answers used one tool call, so 6 steps is ample. Cloudflare counts rate limits per location, so the ledger is the real cap. Felipe may change the amount. |
| 7 | `allowSystemInMessages` stays off. The gateway takes `messages[0]` as the system prompt only when it is the single `system` message and comes first (holocron's proxy puts its prompt there), passes it as `system`, and answers 400 if any other message has role `system`. | Closes the prompt-injection path the plan review found: a browser could append a `system` message to `modelMessages`, which holocron forwards. The site guard and the gateway check it independently. |
| 8 | One allowlisted `fetch` is passed to `createDeepSeek` and used by the docs loader. It allows `https://api.deepseek.com` and the exact origins in `ALLOWED_DOCS_ORIGINS` (`https://docs.automagik.dev`, `https://automagik-docs.<workers-subdomain>.workers.dev`), always sends `redirect: 'manual'`, and treats any 3xx as an error; anything else throws. just-bash runs with no network option, so `curl` does not exist in the tool. `skillUrls` are ignored. | The owner requires that the gateway talk only to `api.deepseek.com` and the site's own `docs.zip`. Following a redirect would let an allowed origin send the gateway anywhere. The log line per outbound host lets the cutover wish prove it from `wrangler tail`. |
| 9 | Chat sessions are not persisted on the server: `GET /api/chat/session` answers `{ "modelMessages": [] }` and `DELETE` answers `{ "deleted": true }`. | The client resends the conversation every turn, so a conversation works within a page session. Restore after a reload would need a Durable Object per site; deferred until asked. |
| 10 | The gateway uses the same `spiceflow` version as holocron 0.36.0 (`1.26.0-rsc.18`) and the snapshot's request schema and chunk types. | holocron's proxy decodes the gateway's stream with `createSpiceflowFetch`; one version on both sides keeps the wire format identical. |
| 11 | Secrets reach `npx wrangler secret put` on stdin from bws (the DeepSeek key through `~/.mikro/gate-env.sh` in a subshell), with shell tracing off. CI never sets secrets; `wrangler deploy` keeps existing ones. The gateway deploy job runs only on pushes to `main` (reviewed code), in the `production` environment. | No secret in git, logs or command lines. |
| 12 | DeepSeek model and cap are plain `vars` in `gateway/wrangler.jsonc`: `DEEPSEEK_MODEL` `deepseek-flash`, `DAILY_USD_CAP` `2.00`, `ALLOWED_DOCS_ORIGINS`. The bounds in decision 6 are constants in `src/ledger.ts`, used by both the gateway and `worstCaseUsd`. | Values Felipe may tune without code changes; none is secret. One source for the bounds keeps the reservation and the enforcement equal. |
| 13 | **Owner decisions at plan approval (Felipe, 2026-10-04, final; recorded through the question harness).** Hosting: Cloudflare Workers Paid ("Cloudflare Workers Paid (Recomendado)"); Vercel was considered and dropped because holocron has no Vercel target. A. Visitor IP: no per-IP rate limit for now, deferred by owner; trigger to revisit: abuse or the spend cap being hit. The gateway token gate, the hard daily spend cap with its reservation ledger, the input bounds (64 KB, no `system` role), `maxOutputTokens`, the step limit, `redirect: 'manual'` and the canonical-path guard stay. B. Retired-URL redirects: none ("não quero fazer redirect, consider this a fresh start; we will revamp the other product docs later"); only `/` goes to the Genie landing, as site navigation; retired pages answer 404. C. PR-preview chat: unchanged; previews carry no gateway token and their chat shows an error. D. mikro URLs: `rlmx/` moves to `mikro/` with no redirects; `/rlmx/*` answers 404. | Recorded as given; all five wishes are APPROVED on these terms. |

## Simplicity Case

- **Simplest complete design:** the spike's gateway, already reduced to one provider with no billing, moved from `Bun.serve` to a Worker `fetch` handler; one guard at the site edge; one tiny Durable Object that reserves and settles a daily budget.
- **Added machinery:** the `SpendLedger` Durable Object with reservations (only a single-writer counter that reserves before the call can make a daily cap hold under concurrency); input bounds on both sides (they make the worst case finite); the site-side guard (the browser's body reaches holocron's proxy only through it); a separate workflow for the gateway (different package, deploys only when `gateway/**` changes).
- **Deferred until measured:** session persistence, an alert channel such as email or Slack, per-question cost dashboards, prompt caching tweaks.
- **Complexity removed:** holocron.so keys and the hosted gateway, the in-memory session map and in-memory limiter (both unreliable across isolates), the global `fetch` patch, `process.exit`, the spike's fixed host and port, `allowSystemInMessages`.

## Dependencies

**depends-on:** docs-holocron, docs-holocron-brand, docs-holocron-products
**blocks:** docs-holocron-cutover

Starts after `docs-holocron-products` merges, because Group 2 edits the `src/server.tsx` that the brand and products wishes shape; Group 1 (all under `gateway/`) shares no file with them. Sources, from the frozen snapshot `/home/genie/.genie/state-backups/holo-spike-2026-10-04-frozen/`: `gateway/server.ts` (sha256 prefix `bb46a673e889ad9c`) and `gateway/chat-bash-tool.ts` (`7f50fbb0111a2945`), recorded on 2026-10-04 and checked in Group 1's validation. Upstream reference: `remorses/holocron` `website/src/gateway.ts` and `website/src/chat-bash-tool.ts` at `a71162e`.

## Success Criteria

- [ ] `cd gateway && npm ci && npm run check && npx wrangler deploy --dry-run --outdir .wrangler/dry-run` passes, including the concurrency test that holds the cap.
- [ ] The deployed gateway answers `GET /health` with 200, and `POST /api/chat` without the token with 401.
- [ ] With the token, the gateway answers a docs question from the site's `docs.zip`, and the only outbound hosts in its logs are `api.deepseek.com` and the site origin.
- [ ] On the site, a chat body over 64 KB gets 413 and a `system` message from the browser gets 400, and a trailing or doubled slash on the path changes neither.
- [ ] At or near the daily cap, a turn whose worst case does not fit returns the budget notice without calling DeepSeek (unit tests, serial and concurrent).
- [ ] No secret value in git, CI logs or any `wrangler.jsonc`.

## Execution Strategy

### Wave 1 (parallel)

| Group | Agent | Complexity | Model | Description |
|-------|-------|------------|-------|-------------|
| 1 | engineer | high: Workers port of a streaming AI gateway, reserve-and-settle Durable Object, security policy | inherit | Gateway Worker under `gateway/` |
| 2 | engineer | low: canonical path matching, body limits, one workflow, verify flags | inherit | Site-side chat guard and gateway workflow |

### Wave 2 (sequential)

| Group | Agent | Complexity | Model | Description |
|-------|-------|------------|-------|-------------|
| 3 | engineer | medium: secrets and the first production deploy, all Felipe-approved | inherit | Provision with Felipe and smoke on workers.dev |

**Global constraints:**
- npm with a committed lockfile per package (root and `gateway/`); every validation runs `npm ci`.
- Exact pins, no `^` or `~`. Gateway: `spiceflow` 1.26.0-rsc.18, `wrangler` 4.147.0, and the snapshot's resolved versions of `ai`, `@ai-sdk/deepseek` (2.0.71), `just-bash`, `fflate`, `zod`, plus `vitest` and `typescript`.
- Run wrangler as `npx wrangler` locally and as `npx --yes wrangler@4.147.0` in jobs that hold secrets; it is not installed globally.
- Source of truth for ported files: `/home/genie/.genie/state-backups/holo-spike-2026-10-04-frozen/`, read-only; hash-checked.
- Worker names: site `automagik-docs`, gateway `automagik-docs-chat`.
- Gateway origin: `https://automagik-docs-chat.<workers-subdomain>.workers.dev`, as recorded in `vite.config.ts` by `docs-holocron`.
- DeepSeek model `deepseek-flash`, thinking off; DeepSeek is called directly at `https://api.deepseek.com`.
- The gateway talks only to `api.deepseek.com` and the site's own `docs.zip`, and follows no redirect.
- The daily spend cap is hard: no DeepSeek call starts unless its worst case fits under the cap.
- The DeepSeek key comes from bws (`DEEPSEEK_API_KEY`), is stored as a Worker secret and is never in git.
- No secret in git, CI logs, command lines or repository files; secrets reach `wrangler secret put` on stdin.
- Outward or irreversible steps (secrets, production deploys, pushes to `main`) go to Felipe through the question harness first.
- `_internal/**` never reaches the chat: the gateway drops any `_internal` entry from `docs.zip` or `docsPages`.
- New user-facing copy (notices, limit messages): no hashtags, no dash punctuation, no "not X, it's Y" construction.
- "Wishes in, PRs out" and "context framework" are never headings.

## Execution Groups

### Group 1: Gateway Worker

**Goal:** `automagik-docs-chat` answers holocron's `/api/chat` protocol from DeepSeek, only for the site, within a hard daily budget, and talks to no other host.

**Deliverables:**
1. `gateway/package.json` (private, type module; scripts `check` = `tsc --noEmit && vitest run`, `deploy` = `wrangler deploy`), `gateway/package-lock.json`, `gateway/tsconfig.json` (Workers types).
2. `gateway/wrangler.jsonc`: `name` `automagik-docs-chat`; `main` `src/index.ts`; `compatibility_date` `2026-04-14`; `compatibility_flags` `["nodejs_compat", "global_fetch_strictly_public"]`; `workers_dev: true`; `observability: { "enabled": true }`; `vars` `DEEPSEEK_MODEL`, `DAILY_USD_CAP`, `ALLOWED_DOCS_ORIGINS`; `ratelimits` `[{ "name": "CHAT_GLOBAL_LIMITER", "namespace_id": "1002", "simple": { "limit": 120, "period": 60 } }]`; `durable_objects.bindings` `[{ "name": "SPEND_LEDGER", "class_name": "SpendLedger" }]`; `migrations` `[{ "tag": "v1", "new_sqlite_classes": ["SpendLedger"] }]`; `secrets.required` `["DEEPSEEK_API_KEY", "GATEWAY_TOKEN"]`.
3. `gateway/src/policy.ts` (pure): `isAuthorized`, `isAllowedOutbound`, `makeAllowlistedFetch` (`redirect: 'manual'`, 3xx is an error), `usageCost`, `utcDay`, `dropInternal`, `splitSystem`.
4. `gateway/src/ledger.ts` (pure): the bounds (`MAX_STEPS` 6, `MAX_OUTPUT_TOKENS` 1024, `MAX_TOOL_BYTES` 16384, `MAX_BODY_BYTES` 262144, `RESERVATION_TTL_MS` 600000), `worstCaseUsd`, and `SpendBook`, the reserve and settle accounting the Durable Object persists.
5. `gateway/src/spend-ledger.ts`: `SpendLedger`, one instance (`idFromName('spend')`), delegating to `SpendBook` and storing days and open reservations in SQLite.
6. `gateway/src/chat-bash-tool.ts`: the snapshot's file, with each command's output truncated to `MAX_TOOL_BYTES`.
7. `gateway/src/index.ts`: Spiceflow app with the snapshot's routes, request schema, notices and streaming loop; routing first (unknown paths 404), then the bearer check on `/api/chat*` (401), then the body size (413), then `splitSystem` (400 on a stray `system` message), then `CHAT_GLOBAL_LIMITER.limit({ key: 'all' })` (rate-limit notice), then `ledger.reserve(day, worstCaseUsd(...), cap)` (budget notice "The docs assistant has used today's budget. Please try again tomorrow." when refused), then the turn with `maxOutputTokens` and `stopWhen: stepCountIs(MAX_STEPS)`, then `ledger.settle(id, measuredUsd)` in `finally`, and one log line with tokens, reserved and measured cost; `export default { fetch }` and `export { SpendLedger }`.
8. `gateway/src/policy.test.ts` (vitest): the bearer accepts the exact token and rejects missing, wrong, prefixed and different-length values; the allowlist accepts `https://api.deepseek.com/chat/completions` and the listed origins and rejects `http://api.deepseek.com`, `https://api.deepseek.com.evil.example`, `https://api.deepseek.com@evil.example`, other hosts and ports; with a stub `fetch` that answers 302 to `https://evil.example/`, the allowlisted fetch passes `redirect: 'manual'`, throws, and never requests the second host; `usageCost` matches peak and off-peak rates; `dropInternal` removes `genie/_internal/...` entries; `splitSystem` accepts one leading `system` message and rejects a second one anywhere; the handler with a ledger that refuses returns the budget notice and never calls the provider.
9. `gateway/src/ledger.test.ts` (vitest): `worstCaseUsd` grows with body size and bounds and is never below the measured cost of the spike's logged turns; serial reservations stop at the cap; 200 concurrent `reserve` calls (`Promise.allSettled`) at a $2 cap accept a set whose total is at most $2; settling below the reservation frees the difference; an expired reservation is released; a settle above the reservation is recorded and logged.

**Interfaces:**
- Consumes: none from other groups.
- Produces: HTTP `GET /health` returning 200 `{ "ok": true, "model": string, "provider": "api.deepseek.com" }`; `POST /api/chat` with `authorization: Bearer <token>` and body `{ messages, docsZipUrl?, docsPages?, skillUrls?, pageSlug?, toolSchemas?, sessionId? }`, streaming AI SDK UI chunks plus `notice`, `model-messages` and `title` chunks; `GET` and `DELETE /api/chat/session` with headers `x-holocron-chat-session` and `x-holocron-site`; 401 without the token, 413 over the body cap, 400 on a stray `system` message, 404 elsewhere. Code: `isAuthorized(header: string | null, token: string): boolean`; `isAllowedOutbound(url: URL, docsOrigins: ReadonlySet<string>): boolean`; `makeAllowlistedFetch(docsOrigins: ReadonlySet<string>, log: (line: string) => void): typeof fetch`; `usageCost(usage: Usage | null | undefined, at?: Date): { input: number; cached: number; output: number; usd: number; period: 'peak' | 'off-peak' }`; `utcDay(at: Date): string`; `dropInternal(files: Record<string, string>): Record<string, string>`; `splitSystem(messages: ModelMessage[]): { system: string | undefined; messages: ModelMessage[] }` (throws on a stray `system`); `worstCaseUsd(input: { bodyBytes: number }): number`; `class SpendBook { reserve(day: string, usd: number, cap: number, now: number): string | null; settle(id: string, usd: number): void; total(day: string): number }`; `class SpendLedger extends DurableObject { reserve(day: string, usd: number, cap: number): Promise<string | null>; settle(id: string, usd: number): Promise<void>; total(day: string): Promise<number> }`.

**Acceptance Criteria:**
- [ ] `npm run check` in `gateway/` passes and covers every case in deliverables 8 and 9.
- [ ] `npx wrangler deploy --dry-run --outdir .wrangler/dry-run` bundles the Worker with no warning about unresolved modules.
- [ ] `gateway/src` holds no URL literal except `https://api.deepseek.com`, no `globalThis.fetch =` assignment, and no `allowSystemInMessages`.
- [ ] The snapshot sources match their hashes.

**Validation:**
```bash
SNAP=/home/genie/.genie/state-backups/holo-spike-2026-10-04-frozen node -e 'const c=require("crypto"),fs=require("fs"),S=process.env.SNAP;const h=b=>c.createHash("sha256").update(b).digest("hex").slice(0,16);const want={"gateway/server.ts":"bb46a673e889ad9c","gateway/chat-bash-tool.ts":"7f50fbb0111a2945"};let ok=true;for(const[f,w]of Object.entries(want))if(h(fs.readFileSync(S+"/"+f))!==w){console.error("snapshot",f);ok=false}process.exit(ok?0:1)'
cd gateway
npm ci
npm run check
npx wrangler deploy --dry-run --outdir .wrangler/dry-run
! grep -rnoE 'https?://[^"'"'"' )]+' src --include='*.ts' | grep -v '\.test\.ts' | grep -v 'https://api\.deepseek\.com'
! grep -rn 'globalThis.fetch *=' src
! grep -rn 'allowSystemInMessages' src
```

**depends-on:** none

---

### Group 2: Site-side chat guard and gateway workflow

**Goal:** The site stops oversized or injected chat requests before any reaches the gateway, whatever the path's spelling, and gateway changes deploy from `main` on their own.

**Deliverables:**
1. `src/chat-guard.ts`: `canonicalPath(pathname)` (decode each segment, collapse repeated slashes, strip trailing slashes); `export const chatGuard`, a Spiceflow middleware that, for `POST` when `canonicalPath` equals `/holocron-api/chat`: reads at most 65,536 bytes of a clone of the body and answers 413 `{"error": "Your question is too long. Please shorten it and ask again."}` beyond that; answers 400 `{"error": "This request cannot be answered."}` when the JSON is invalid or any `modelMessages` entry has role `system`. Every other request passes through untouched.
2. `src/server.tsx`: `.use(chatGuard)` before `.use(holocronApp)`; nothing else changes.
3. `.github/workflows/chat.yml`: on `pull_request` and `push` to `main`, both with `paths: ['gateway/**', '.github/workflows/chat.yml']`; job `check` (no secrets) runs `npm ci`, `npm run check` and the dry run in `gateway/`; job `deploy` (push to `main` only, needs `check`, `environment: production`) checks out `main`, runs `npm ci` and then `npx wrangler deploy` in `gateway/`, then `curl -fsS` on `/health`; it runs only reviewed code, and the Worker cannot be bundled without `node_modules`. Secrets referenced: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` only; actions pinned by commit SHA.
4. `scripts/verify-site.mjs`: `--chat-guard` against a local Worker sends a 70 KB body (413) and a body whose `modelMessages` holds a `system` message (400), each also on `/holocron-api/chat/` and `//holocron-api/chat` with the same outcome. `--gateway-smoke` posts one question straight to `GATEWAY_ORIGIN/api/chat` with `GATEWAY_TOKEN` read from the environment (never printed), `docsZipUrl` of the target site and `messages` of one user turn, and expects a `text-delta` chunk.

**Interfaces:**
- Consumes: `export const app` in `src/server.tsx` (shaped by `docs-holocron-brand` and `docs-holocron-products`); `scripts/verify-site.mjs` (from `docs-holocron`); the gateway HTTP contract from Group 1.
- Produces: `canonicalPath(pathname: string): string`; `chatGuard: (ctx: { request: Request }, next: () => Promise<Response | void>) => Promise<Response | void>`; workflow `.github/workflows/chat.yml` with jobs `check` and `deploy`; verify flags `--chat-guard` and `--gateway-smoke`.

**Acceptance Criteria:**
- [ ] `node scripts/verify-site.mjs --serve --chat-guard` passes against the local Worker.
- [ ] The strict build, `npm run verify` and `node scripts/ui-check.mjs --serve --all` still pass.
- [ ] `chat.yml` references exactly two secrets, its `check` job none, its `deploy` job runs only on pushes to `main` in `production`, and no action is pinned by a mutable tag.

**Validation:**
```bash
npm ci
npm run build
npm run verify
node scripts/verify-site.mjs --serve --chat-guard
! grep -q 'CHAT_IP_LIMITER' wrangler.jsonc
f=.github/workflows/chat.yml
test "$(grep -oE 'secrets\.[A-Z_]+' "$f" | sort -u | tr '\n' ' ')" = "secrets.CLOUDFLARE_ACCOUNT_ID secrets.CLOUDFLARE_API_TOKEN "
grep -q 'environment: production' "$f"
grep -q 'npx wrangler deploy' "$f"
! grep -nE 'uses: [^@]+@v?[0-9]+(\.[0-9]+)*$' "$f"
```

**depends-on:** none

---

### Group 3: Provision with Felipe and smoke on workers.dev

**Goal:** The gateway runs on workers.dev with its secrets, the site holds the matching token, and one real question is answered end to end.

**Deliverables:**
1. Felipe, through the question harness: create bws secret `DOCS_CHAT_GATEWAY_TOKEN` (48 random bytes, base64); confirm the daily cap (`2.00` USD by default).
2. With Felipe's approval, from a subshell with tracing off: `GATEWAY_TOKEN` and `DEEPSEEK_API_KEY` on `automagik-docs-chat`, and `HOLOCRON_KEY` on `automagik-docs`, each through `npx wrangler secret put <NAME> --name <worker>` reading stdin, and the first gateway deploy (`npx wrangler deploy` in `gateway/`). Later deploys run from `chat.yml`.
3. Smoke: `/health`; a 401 without the token; `verify-site --gateway-smoke` against the workers.dev site; one question through the site chat on the workers.dev URL; `npx wrangler tail automagik-docs-chat --format json` during the smoke shows outbound lines only for `api.deepseek.com` and the site origin, and one log line with reserved and measured cost. Evidence goes to Review Results.

**Interfaces:**
- Consumes: Group 1's Worker and Group 2's verify flags; Worker `automagik-docs` deployed from `main` by `site.yml`.
- Produces: live `https://automagik-docs-chat.<workers-subdomain>.workers.dev`; secrets `DEEPSEEK_API_KEY` and `GATEWAY_TOKEN` (gateway) and `HOLOCRON_KEY` (site); bws secret `DOCS_CHAT_GATEWAY_TOKEN`, which `docs-holocron-cutover` reads for its checks.

**Acceptance Criteria:**
- [ ] `/health` answers 200 with provider `api.deepseek.com`; `POST /api/chat` without the token answers 401; `/api/og` answers 404.
- [ ] `verify-site --gateway-smoke` passes; the site chat answers "How do I install Genie?" with a link to `/genie/installation`.
- [ ] `npx wrangler secret list` shows the three secret names on the two Workers, and no value appears in any log or file.

**Validation:**
```bash
G="https://automagik-docs-chat.<workers-subdomain>.workers.dev"
SITE="https://automagik-docs.<workers-subdomain>.workers.dev"
curl -fsS "$G/health" | grep -q '"provider":"api.deepseek.com"'
test "$(curl -s -o /dev/null -w '%{http_code}' -X POST "$G/api/chat" -H 'content-type: application/json' -d '{"messages":[]}')" = 401
test "$(curl -s -o /dev/null -w '%{http_code}' "$G/api/og?title=x")" = 404
npx wrangler secret list --name automagik-docs-chat | grep -q DEEPSEEK_API_KEY
npx wrangler secret list --name automagik-docs | grep -q HOLOCRON_KEY
( set +x; export GATEWAY_TOKEN="$(bws secret get <DOCS_CHAT_GATEWAY_TOKEN-id> | jq -r .value)"; node scripts/verify-site.mjs "$SITE" --gateway-smoke )
```

**depends-on:** Group 1, Group 2

---

## QA Criteria

_What must be verified on dev after merge. The QA agent tests each criterion._

- [ ] Functional: on the workers.dev site, asking each suggestion (Genie, Omni, mikro) returns an answer that links a page of that product.
- [ ] Integration: clicking the pet opens the drawer, and the pet shows waiting, running and review poses through one question.
- [ ] Regression: the site's pages and UI checks still pass; PR previews still deploy (their chat shows an error by design).

---

## Assumptions / Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Same-account workers.dev fetches between the two Workers are refused | Medium | `global_fetch_strictly_public` on both; Group 3's smoke proves it before cutover; fallback is a service binding plus a narrow fetch wrapper in the site, as a separate change. |
| `process.env.HOLOCRON_KEY` is not populated from the secret on Workers | Medium | Compatibility date 2026-04-14 with `nodejs_compat` populates it; Group 3's smoke fails with 401 if not; the fallback sets `process.env.HOLOCRON_KEY` once in `src/server.tsx` from `env` of `cloudflare:workers`. |
| The worst-case estimate undercounts a turn | Medium | One token per 2 bytes and all-miss peak pricing overestimate; `ledger.test.ts` checks it against the spike's logged turns; a settle above the reservation is logged so the bound can be raised. |
| Without a per-visitor limit, one abuser can use up the day's budget and stop the chat for everyone until the next UTC day | Medium | Owner decision A accepts it; the hard cap bounds the spend; the `spend-alert` log line is the trigger to revisit. |
| Reservations throttle legitimate traffic at peaks | Low | About 30 typical turns fit in flight at $2; Felipe can raise the cap. |
| The `ratelimits` binding is not available on the account's plan | Medium | Workers Paid is required by `docs-holocron`; Group 3's deploy fails visibly otherwise. |
| Cost estimate drifts from DeepSeek's real bill | Low | The cap is conservative; Felipe compares the ledger with the DeepSeek dashboard after the first week. |
| DeepSeek renames or retires `deepseek-flash` | Low | `DEEPSEEK_MODEL` is a var; the spike found `deepseek-flash` served for this key on 2026-10-04. |

---

## Review Results

_The read-only reviewer returns evidence; the invoking orchestrator appends a timestamped block here after plan, execution, and PR reviews._

---

## Files to Create/Modify

```
gateway/package.json              (create)
gateway/package-lock.json         (create, generated)
gateway/tsconfig.json             (create)
gateway/wrangler.jsonc            (create)
gateway/src/index.ts              (create)
gateway/src/policy.ts             (create)
gateway/src/ledger.ts             (create)
gateway/src/spend-ledger.ts       (create)
gateway/src/chat-bash-tool.ts     (create)
gateway/src/policy.test.ts        (create)
gateway/src/ledger.test.ts        (create)
src/chat-guard.ts                 (create)
src/server.tsx                    (modify: .use(chatGuard))
.github/workflows/chat.yml        (create)
scripts/verify-site.mjs           (modify: --chat-guard, --gateway-smoke)
```
