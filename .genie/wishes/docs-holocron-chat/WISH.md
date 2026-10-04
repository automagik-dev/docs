# Wish: docs.automagik.dev on holocron: self-hosted chat gateway on DeepSeek

| Field | Value |
|-------|-------|
| **Status** | DRAFT |
| **Slug** | `docs-holocron-chat` |
| **Date** | 2026-10-04 |
| **Author** | Felipe Rosa (plan drafted by Claude) |
| **Appetite** | medium |
| **Branch** | `wish/docs-holocron-chat` |
| **Repos touched** | `automagik-dev/docs` |
| **Design** | _No brainstorm — direct wish_ |

## Summary

Gives the holocron site its AI chat through a small Worker, `automagik-docs-chat`, that speaks holocron's gateway protocol and calls DeepSeek directly (`deepseek-flash`, thinking off). It ports the spike's Bun gateway to Workers, keeps the DeepSeek key in that Worker alone, limits each visitor at the site edge, caps daily spend and allows no outbound host but DeepSeek and the site's own `docs.zip`. Third of four sibling wishes (`docs-holocron`, `docs-holocron-brand`, this one, `docs-holocron-cutover`).

## Scope

### IN

- `gateway/`: a Worker package porting `holocron-spike/gateway/server.ts` and `chat-bash-tool.ts` (upstream `website/src/gateway.ts` at `a71162e` minus billing, D1, Durable Object sessions and Vercel): `GET /health`, `POST /api/chat`, `GET` and `DELETE /api/chat/session`; bearer authentication; an outbound allowlist; a global limiter; a `SpendLedger` Durable Object with a daily USD cap; one usage log line per turn.
- Site wiring: `src/chat-guard.ts`, a per-IP limiter on `POST /holocron-api/chat`, registered in `src/server.tsx`; the `ratelimits` binding in `wrangler.jsonc`.
- `.github/workflows/chat.yml`: checks on PRs that touch `gateway/**`, deploy on `main`.
- `scripts/verify-site.mjs` flags `--chat-guard` and `--gateway-smoke`.
- Provisioning with Felipe: the gateway token, Worker secrets, the first gateway deploy, a smoke test.

### OUT

- Conversation restore after a page reload (upstream's `ChatSessionDO`).
- holocron.so keys, billing, credits, D1, juice, Vercel AI Gateway, any provider but DeepSeek.
- Chat on PR previews (they carry no token).
- Alerting channels beyond Workers Logs.
- Fetching `skillUrls`.

## Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | AI chat is holocron's chat with a self-hosted gateway calling DeepSeek directly (`deepseek-flash`, thinking off); no holocron.so, Vercel or juice in the path; the key comes from bws (`DEEPSEEK_API_KEY`), is stored as a Worker secret and is never in git. | Owner decision (Felipe, 2026-10-03/04, final). Thinking stays off because DeepSeek requires every earlier turn's `reasoning_content` back when tools are present, and holocron's round trip drops it (spike finding). |
| 2 | The gateway is its own Worker, hosted on Cloudflare Workers like the site. | Owner decision on hosting. A separate Worker keeps the DeepSeek key away from the site Worker, which runs holocron's whole dependency tree, and keeps content deploys from touching the gateway. |
| 3 | The site reaches the gateway over HTTPS at `HOLOCRON_URL` (baked by `docs-holocron`), with `global_fetch_strictly_public` on both Workers. | holocron's proxy calls `${HOLOCRON_URL}/api/chat` with the global `fetch` (`app-factory.tsx:1853-1879`). With the flag, a fetch to another Worker in the same zone goes through Cloudflare's front door like an Internet request, and after cutover the site sits on a Custom Domain, which other Workers may fetch without a binding (Cloudflare docs). A service binding would need a patched global fetch in the site. |
| 4 | Authentication: the site Worker holds secret `HOLOCRON_KEY`, the gateway holds secret `GATEWAY_TOKEN` with the same value, compared in constant time; any `/api/chat*` request without it gets 401. The value lives in bws as `DOCS_CHAT_GATEWAY_TOKEN`. | holocron sends `authorization: Bearer ${HOLOCRON_KEY}` whenever that variable is set (`app-factory.tsx:1856-1860`, `lib/holocron-url.ts:51-64`), and with `nodejs_compat` on a compatibility date after 2025-04-01 Worker secrets populate `process.env`. The gateway stays closed to direct callers. |
| 5 | Per-visitor limiting runs in the site Worker: `src/chat-guard.ts` keys a `ratelimits` binding on `CF-Connecting-IP` (10 requests per 60 s) for `POST /holocron-api/chat` and answers 429 with `{"error": "You asked a lot of questions in a minute. Please wait a moment and ask again."}`. The visitor IP is not forwarded to the gateway. | holocron's chat client shows the `error` field of a non-OK JSON response as is (`chat/chat-submit.ts:455-461`). holocron's proxy builds the gateway request itself and sends only `authorization` and `x-holocron-site`, so forwarding the IP would need a patched global fetch inside a streamed generator, where request context is not dependable. This changes the brief's "visitor IP forwarded by the site"; Felipe confirms. |
| 6 | Spend cap: a SQLite-backed Durable Object `SpendLedger` stores estimated USD per UTC day from each turn's token usage at DeepSeek's public rates (the spike's `usageCost`). Once today's total reaches `DAILY_USD_CAP` (default `"2.00"`), a turn is answered with a notice and no DeepSeek call. A `spend-alert` log line is written the first time a day crosses 50% and 100%. A global `ratelimits` binding (120 per 60 s, key `all`) bounds bursts. | Spike turns cost about $0.0003 to $0.001, so $2 a day allows thousands of answers. Cloudflare counts rate limits per location, so the ledger is the real cap. Felipe may change the amount. |
| 7 | One allowlisted `fetch` is passed to `createDeepSeek` and used by the docs loader. It allows `https://api.deepseek.com` and the exact origins in `ALLOWED_DOCS_ORIGINS` (`https://docs.automagik.dev`, `https://automagik-docs.<workers-subdomain>.workers.dev`) and throws for anything else. just-bash runs with no network option, so `curl` does not exist in the tool. `skillUrls` are ignored. | The owner requires that the gateway talk only to `api.deepseek.com` and the site's own `docs.zip`; the log line per outbound host lets the cutover wish prove it from `wrangler tail`. |
| 8 | Chat sessions are not persisted on the server: `GET /api/chat/session` answers `{ "modelMessages": [] }` and `DELETE` answers `{ "deleted": true }`. | The client resends the conversation every turn, so a conversation works within a page session. Restore after a reload would need a Durable Object per site; deferred until asked. |
| 9 | The gateway uses the same `spiceflow` version as holocron 0.36.0 (`1.26.0-rsc.18`) and the spike's request schema and chunk types. | holocron's proxy decodes the gateway's stream with `createSpiceflowFetch`; one version on both sides keeps the wire format identical. |
| 10 | Secrets reach `npx wrangler secret put` on stdin from bws (the DeepSeek key through `~/.mikro/gate-env.sh` in a subshell), with shell tracing off. CI never sets secrets; `wrangler deploy` keeps existing ones. | No secret in git, logs or command lines. |
| 11 | DeepSeek model and limits are plain `vars` in `gateway/wrangler.jsonc`: `DEEPSEEK_MODEL` `deepseek-flash`, `DAILY_USD_CAP` `2.00`, `ALLOWED_DOCS_ORIGINS`; `MAX_STEPS` stays 12 in code. | Values Felipe may tune without code changes; none is secret. |

## Simplicity Case

- **Simplest complete design:** the spike's gateway, already reduced to one provider with no billing, moved from `Bun.serve` to a Worker `fetch` handler; one per-IP limiter at the site edge; one tiny Durable Object as the daily cap.
- **Added machinery:** the `SpendLedger` Durable Object (the brief requires a spend cap, and only a consistent counter can enforce a daily total); the site-side guard (the visitor IP is known only there); a separate workflow for the gateway (different package, deploys only when `gateway/**` changes).
- **Deferred until measured:** session persistence, an alert channel such as email or Slack, per-question cost dashboards, prompt caching tweaks.
- **Complexity removed:** holocron.so keys and the hosted gateway, the in-memory session map and in-memory limiter (both unreliable across isolates), the global `fetch` patch, `process.exit`, the spike's fixed host and port.

## Dependencies

**depends-on:** docs-holocron, docs-holocron-brand
**blocks:** docs-holocron-cutover

Starts after `docs-holocron-brand` merges, because Group 2 edits the `src/server.tsx` it creates; Group 1 (all under `gateway/`) shares no file with the brand wish. Sources: `/var/tmp/sofia-agents/claude-1001/-home-genie-workspace-repos-genie/065fdfff-9583-40b0-98b4-321e16c72e82/scratchpad/holo-spike/gateway/server.ts` (sha256 prefix `bb46a673e889ad9c`) and `chat-bash-tool.ts` (`7f50fbb0111a2945`); upstream reference `holo-spike/gateway-src/website/src/gateway.ts` and `chat-bash-tool.ts` at `a71162e`.

## Success Criteria

- [ ] `cd gateway && npm ci && npx tsc --noEmit && npx vitest run && npx wrangler deploy --dry-run --outdir .wrangler/dry-run` passes.
- [ ] The deployed gateway answers `GET /health` with 200, and `POST /api/chat` without the token with 401.
- [ ] With the token, the gateway answers a docs question from the site's `docs.zip`, and the only outbound hosts in its logs are `api.deepseek.com` and the site origin.
- [ ] On the workers.dev site, the 11th chat request from one address within a minute gets 429 and the chat shows the limit message.
- [ ] At the daily cap, a turn returns the budget notice without calling DeepSeek (unit test).
- [ ] No secret value in git, CI logs or any `wrangler.jsonc`.

## Execution Strategy

### Wave 1 (parallel)

| Group | Agent | Complexity | Model | Description |
|-------|-------|------------|-------|-------------|
| 1 | engineer | high: Workers port of a streaming AI gateway, Durable Object, security policy | inherit | Gateway Worker under `gateway/` |
| 2 | engineer | low: one middleware, one binding, one workflow, verify flags | inherit | Site-side chat guard and gateway workflow |

### Wave 2 (sequential)

| Group | Agent | Complexity | Model | Description |
|-------|-------|------------|-------|-------------|
| 3 | engineer | medium: secrets and the first production deploy, all Felipe-approved | inherit | Provision with Felipe and smoke on workers.dev |

**Global constraints:**
- npm with a committed lockfile per package (root and `gateway/`); every validation runs `npm ci`.
- Exact pins, no `^` or `~`. Gateway: `spiceflow` 1.26.0-rsc.18, `wrangler` 4.147.0, and the spike's resolved versions of `ai`, `@ai-sdk/deepseek` (2.0.71), `just-bash`, `fflate`, `zod`, plus `vitest` and `typescript`.
- Run wrangler as `npx wrangler`; it is not installed globally.
- Worker names: site `automagik-docs`, gateway `automagik-docs-chat`.
- Gateway origin: `https://automagik-docs-chat.<workers-subdomain>.workers.dev`, as recorded in `vite.config.ts` by `docs-holocron`.
- DeepSeek model `deepseek-flash`, thinking off; DeepSeek is called directly at `https://api.deepseek.com`.
- The gateway talks only to `api.deepseek.com` and the site's own `docs.zip`.
- The DeepSeek key comes from bws (`DEEPSEEK_API_KEY`), is stored as a Worker secret and is never in git.
- No secret in git, CI logs, command lines or repository files; secrets reach `wrangler secret put` on stdin.
- Outward or irreversible steps (secrets, production deploys, pushes to `main`) go to Felipe through the question harness first.
- `_internal/**` never reaches the chat: the gateway drops any `_internal` entry from `docs.zip` or `docsPages`.
- New user-facing copy (notices, limit messages): no hashtags, no dash punctuation, no "not X, it's Y" construction.
- "Wishes in, PRs out" and "context framework" are never headings.

## Execution Groups

### Group 1: Gateway Worker

**Goal:** `automagik-docs-chat` answers holocron's `/api/chat` protocol from DeepSeek, only for the site, within a daily budget, and talks to no other host.

**Deliverables:**
1. `gateway/package.json` (private, type module; scripts `check` = `tsc --noEmit && vitest run`, `deploy` = `wrangler deploy`), `gateway/package-lock.json`, `gateway/tsconfig.json` (Workers types).
2. `gateway/wrangler.jsonc`: `name` `automagik-docs-chat`; `main` `src/index.ts`; `compatibility_date` `2026-04-14`; `compatibility_flags` `["nodejs_compat", "global_fetch_strictly_public"]`; `workers_dev: true`; `observability: { "enabled": true }`; `vars` `DEEPSEEK_MODEL`, `DAILY_USD_CAP`, `ALLOWED_DOCS_ORIGINS`; `ratelimits` `[{ "name": "CHAT_GLOBAL_LIMITER", "namespace_id": "1002", "simple": { "limit": 120, "period": 60 } }]`; `durable_objects.bindings` `[{ "name": "SPEND_LEDGER", "class_name": "SpendLedger" }]`; `migrations` `[{ "tag": "v1", "new_sqlite_classes": ["SpendLedger"] }]`; `secrets.required` `["DEEPSEEK_API_KEY", "GATEWAY_TOKEN"]`.
3. `gateway/src/policy.ts` (pure, no `cloudflare:workers` import): `isAuthorized`, `isAllowedOutbound`, `makeAllowlistedFetch`, `usageCost`, `utcDay`, `dropInternal`.
4. `gateway/src/spend-ledger.ts`: `SpendLedger`, one instance (`idFromName('spend')`), one SQLite row per UTC day.
5. `gateway/src/chat-bash-tool.ts`: the spike's file (in-memory docs filesystem, no network, every command logged).
6. `gateway/src/index.ts`: Spiceflow app with the spike's routes, request schema, notices and streaming loop; routing first (unknown paths 404), then bearer check on `/api/chat*` (401), then `CHAT_GLOBAL_LIMITER.limit({ key: 'all' })` (rate-limit notice), then the ledger check (budget notice "The docs assistant has used today's budget. Please try again tomorrow."), then the turn; after the turn, `ledger.add(day, usd)` and one log line with tokens and cost; `export default { fetch }` and `export { SpendLedger }`.
7. `gateway/src/policy.test.ts` (vitest): the bearer accepts the exact token and rejects missing, wrong, prefixed and different-length values; the allowlist accepts `https://api.deepseek.com/chat/completions` and the listed origins and rejects `http://api.deepseek.com`, `https://api.deepseek.com.evil.example`, `https://api.deepseek.com@evil.example`, other hosts and ports; `usageCost` matches peak and off-peak rates; `dropInternal` removes `genie/_internal/...` entries; the request handler with a stubbed ledger at the cap returns the budget notice and never calls the provider.

**Interfaces:**
- Consumes: none from other groups.
- Produces: HTTP `GET /health` returning 200 `{ "ok": true, "model": string, "provider": "api.deepseek.com" }`; `POST /api/chat` with `authorization: Bearer <token>` and body `{ messages, docsZipUrl?, docsPages?, skillUrls?, pageSlug?, toolSchemas?, sessionId? }`, streaming AI SDK UI chunks plus `notice`, `model-messages` and `title` chunks; `GET` and `DELETE /api/chat/session` with headers `x-holocron-chat-session` and `x-holocron-site`; 401 without the token; 404 elsewhere. Code: `isAuthorized(header: string | null, token: string): boolean`; `isAllowedOutbound(url: URL, docsOrigins: ReadonlySet<string>): boolean`; `makeAllowlistedFetch(docsOrigins: ReadonlySet<string>, log: (line: string) => void): typeof fetch`; `usageCost(usage: Usage | null | undefined, at?: Date): { input: number; cached: number; output: number; usd: number; period: 'peak' | 'off-peak' }`; `utcDay(at: Date): string`; `dropInternal(files: Record<string, string>): Record<string, string>`; `class SpendLedger extends DurableObject { add(day: string, usd: number): Promise<number>; total(day: string): Promise<number> }`.

**Acceptance Criteria:**
- [ ] `npm run check` in `gateway/` passes and covers every case in deliverable 7.
- [ ] `npx wrangler deploy --dry-run --outdir .wrangler/dry-run` bundles the Worker with no warning about unresolved modules.
- [ ] `gateway/src` holds no URL literal except `https://api.deepseek.com`, and no `globalThis.fetch =` assignment.

**Validation:**
```bash
cd gateway
npm ci
npm run check
npx wrangler deploy --dry-run --outdir .wrangler/dry-run
! grep -rnoE 'https?://[^"'"'"' )]+' src --include='*.ts' | grep -v '\.test\.ts' | grep -v 'https://api\.deepseek\.com'
! grep -rn 'globalThis.fetch *=' src
```

**depends-on:** none

---

### Group 2: Site-side chat guard and gateway workflow

**Goal:** The site limits each visitor before any request reaches the gateway, and gateway changes deploy from `main` on their own.

**Deliverables:**
1. `src/chat-guard.ts`: `export const chatGuard`, a Spiceflow middleware that, for `POST` on `/holocron-api/chat`, calls `env.CHAT_IP_LIMITER.limit({ key: ip })` with `ip` from `CF-Connecting-IP` (literal `unknown` when absent) and answers 429 with `content-type: application/json` and the Decision 5 message when `success` is false; every other request passes through.
2. `src/server.tsx`: `.use(chatGuard)` before `.use(holocronApp)`; nothing else changes.
3. `wrangler.jsonc`: `ratelimits` `[{ "name": "CHAT_IP_LIMITER", "namespace_id": "1001", "simple": { "limit": 10, "period": 60 } }]`.
4. `.github/workflows/chat.yml`: on `pull_request` and `push` to `main`, both with `paths: ['gateway/**', '.github/workflows/chat.yml']`; job `check` runs `npm ci`, `npm run check` and the dry run in `gateway/`; job `deploy` (push to `main`, needs `check`) runs `npx wrangler deploy` in `gateway/`, then `curl -fsS` on `/health`. Secrets referenced: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` only; actions pinned by commit SHA.
5. `scripts/verify-site.mjs`: `--chat-guard` sends 11 minimal `POST /holocron-api/chat` requests in under a minute and expects the first 10 not to be 429 and the 11th to be 429 with a JSON `error`; `--gateway-smoke` posts one question straight to `GATEWAY_ORIGIN/api/chat` with `GATEWAY_TOKEN` read from the environment (never printed), `docsZipUrl` of the target site and `messages` of one user turn, and expects a `text-delta` chunk.

**Interfaces:**
- Consumes: `export const app` in `src/server.tsx` (from `docs-holocron-brand`); `scripts/verify-site.mjs` (from `docs-holocron`); the gateway HTTP contract from Group 1.
- Produces: `chatGuard: (ctx: { request: Request }, next: () => Promise<Response | void>) => Promise<Response | void>`; binding `CHAT_IP_LIMITER`; workflow `.github/workflows/chat.yml` with jobs `check` and `deploy`; verify flags `--chat-guard` and `--gateway-smoke`.

**Acceptance Criteria:**
- [ ] `node scripts/verify-site.mjs --serve --chat-guard` passes against the local Worker.
- [ ] The strict build, `npm run verify` and `node scripts/ui-check.mjs --serve --pet` still pass.
- [ ] `chat.yml` references exactly two secrets and no action by a mutable tag.

**Validation:**
```bash
npm ci
npm run build
npm run verify
node scripts/verify-site.mjs --serve --chat-guard
grep -q '"CHAT_IP_LIMITER"' wrangler.jsonc
f=.github/workflows/chat.yml
test "$(grep -oE 'secrets\.[A-Z_]+' "$f" | sort -u | tr '\n' ' ')" = "secrets.CLOUDFLARE_ACCOUNT_ID secrets.CLOUDFLARE_API_TOKEN "
! grep -nE 'uses: [^@]+@v?[0-9]+(\.[0-9]+)*$' "$f"
```

**depends-on:** none

---

### Group 3: Provision with Felipe and smoke on workers.dev

**Goal:** The gateway runs on workers.dev with its secrets, the site holds the matching token, and one real question is answered end to end.

**Deliverables:**
1. Felipe, through the question harness: create bws secret `DOCS_CHAT_GATEWAY_TOKEN` (48 random bytes, base64); confirm the daily cap (`2.00` USD by default) and the per-IP limit (10 per minute); accept or reject Decision 5 (no IP forwarding).
2. With Felipe's approval, from a subshell with tracing off: `GATEWAY_TOKEN` and `DEEPSEEK_API_KEY` on `automagik-docs-chat`, and `HOLOCRON_KEY` on `automagik-docs`, each through `npx wrangler secret put <NAME> --name <worker>` reading stdin, and the first gateway deploy (`npx wrangler deploy` in `gateway/`). Later deploys run from `chat.yml`.
3. Smoke: `/health`; a 401 without the token; `verify-site --gateway-smoke` against the workers.dev site; one question through the site chat on the workers.dev URL; `npx wrangler tail automagik-docs-chat --format json` during the smoke shows outbound lines only for `api.deepseek.com` and the site origin. Evidence goes to Review Results.

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
- [ ] Regression: the site's pages, redirects and UI checks still pass; PR previews still deploy (their chat shows an error by design).

---

## Assumptions / Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Same-account workers.dev fetches between the two Workers are refused | Medium | `global_fetch_strictly_public` on both; Group 3's smoke proves it before cutover; fallback is a service binding plus a narrow fetch wrapper in the site, as a separate change. |
| `process.env.HOLOCRON_KEY` is not populated from the secret on Workers | Medium | Compatibility date 2026-04-14 with `nodejs_compat` populates it; Group 3's smoke fails with 401 if not; the fallback sets `process.env.HOLOCRON_KEY` once in `src/server.tsx` from `env` of `cloudflare:workers`. |
| The `ratelimits` binding is not available on the account's plan | Medium | Group 3 deploy fails visibly; Felipe confirms the plan in `docs-holocron` Group 3. |
| Workers Free CPU limits fail a turn (unzip plus tool steps) | Medium | Workers Paid confirmed earlier; the smoke surfaces 1102 errors. |
| Cost estimate drifts from DeepSeek's real bill | Low | The cap is conservative; Felipe compares the ledger with the DeepSeek dashboard after the first week. |
| DeepSeek renames or retires `deepseek-flash` | Low | `DEEPSEEK_MODEL` is a var; the spike found `deepseek-flash` served for this key on 2026-10-04. |
| The spike scratchpad disappears before execution | Medium | Archive it first; the source hashes in Dependencies let a recovered copy be checked; upstream `a71162e` holds the original gateway. |

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
gateway/src/spend-ledger.ts       (create)
gateway/src/chat-bash-tool.ts     (create)
gateway/src/policy.test.ts        (create)
src/chat-guard.ts                 (create)
src/server.tsx                    (modify: .use(chatGuard))
wrangler.jsonc                    (modify: CHAT_IP_LIMITER)
.github/workflows/chat.yml        (create)
scripts/verify-site.mjs           (modify: --chat-guard, --gateway-smoke)
```
