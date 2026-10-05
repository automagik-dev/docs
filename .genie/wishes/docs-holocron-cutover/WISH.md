# Wish: docs.automagik.dev on holocron: mikro URLs, verification, cutover and Mintlify retirement

| Field | Value |
|-------|-------|
| **Status** | APPROVED |
| **Slug** | `docs-holocron-cutover` |
| **Date** | 2026-10-04 |
| **Author** | Felipe Rosa (plan drafted by Claude) |
| **Appetite** | small |
| **Branch** | `wish/docs-holocron-cutover` |
| **Repos touched** | `automagik-dev/docs` |
| **Design** | _No brainstorm — direct wish_ |

## Summary

Moves mikro's pages to `/mikro/...`, proves the holocron site end to end on its workers.dev URL, switches docs.automagik.dev from Mintlify to the `automagik-docs` Worker in one approved call that replaces the Mintlify CNAME, and retires Mintlify after a seven-day soak. Last of five sibling wishes (`docs-holocron`, `docs-holocron-brand`, `docs-holocron-products`, `docs-holocron-chat`, this one). Every DNS and Mintlify action is Felipe's or approved by him, with exact instructions and a rollback.

## Scope

### IN

- Owner decision D (2026-10-04): `rlmx/` moves to `mikro/` with no redirects; `/rlmx` URLs answer 404 (Group 1).
- `scripts/verify-site.mjs --full`: every earlier check plus chat through the real UI for each product, a browser host audit, a gateway outbound audit from `wrangler tail`, and Lighthouse thresholds through `npx --yes lighthouse@13.5.0`.
- `scripts/shoot.mjs`: screenshots for Felipe's visual sign-off.
- The cutover runbook (Group 3): record, attach with DNS override in one call, check, roll back.
- Post-cutover checks on docs.automagik.dev; the `site.yml` deploy check pointed at the live domain.
- After the soak: Felipe removes the domain from Mintlify; the repository's Mintlify starter docs and `.mintignore` go.

### OUT

- Any DNS or Mintlify change made by the agent without Felipe's approval.
- Content changes beyond the mikro move and its links.
- genie repository follow-ups: its CLAUDE.md text about Mintlify and `.mintignore`, and the `.docs-vendor` bump after these docs PRs merge (a genie PR).
- Mintlify billing or account closure.

## Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | docs.automagik.dev switches directly to the new site, with no staging subdomain; the `workers.dev` URL serves pre-cutover checks. | Owner decision (Felipe, 2026-10-03/04, final). |
| 2 | The DNS cutover is executed or approved by Felipe, with exact instructions and a rollback that points the CNAME back to Mintlify; removing the domain from Mintlify after cutover is Felipe's step. | Owner decision. Since 2026-10-04 the orchestrator holds the orchestrator's Cloudflare OAuth token (wrangler's public client, PKCE; account `c8bd8f96…`; stored 0600 at `~/.genie/secrets/cf-oauth.json`; used as `CLOUDFLARE_API_TOKEN` taken from the orchestrator's OAuth helper on the orchestrating host) with `workers_routes:write` and `ssl_certs:write` but no DNS:Edit (Felipe: "you do it, I'll give you any access"). Steps through the Workers API are the orchestrator's after Felipe's approval; plain DNS edits are Felipe's in the dashboard. |
| 3 | The main path is one atomic, approved call: `npx --yes wrangler@4.147.0 deploy --domain docs.automagik.dev` from the deployed commit's build, which attaches the Worker Custom Domain and replaces the Mintlify CNAME in a single `PUT …/domains/records` with `override_existing_dns_record: true`. The dashboard path (delete the CNAME, then add the Custom Domain) is the fallback only. | Deleting the CNAME first leaves a window in which resolvers can cache a negative answer for up to the zone's SOA minimum (1800 s), an outage the domain would keep after the new record exists. In wrangler 4.147.0 `publishCustomDomains` asks to override a conflicting DNS record in a terminal and sets the override without asking in a non-interactive shell, which is why the call needs Felipe's approval first. `--domain` is the deploy flag's alias for custom domains (verified in the 4.147.0 source). The orchestrator runs it with its OAuth token; the override goes through the Workers domains API, so no DNS scope is expected; if the API refuses it for lack of DNS permission, the fallback is used. |
| 4 | The Custom Domain is never declared in `wrangler.jsonc`, so CI deploys keep a token with no zone scope. | wrangler publishes custom domains only when the deploy names some (`customDomainsOnly.length > 0` in 4.147.0), so a CI deploy without `--domain` leaves the attached domain alone; Group 3 still checks it after the next CI deploy. |
| 5 | Rollback is DNS only, prepared before the window, in two steps done back to back: (1) the orchestrator deletes the Worker Custom Domain `docs.automagik.dev` through the Workers API (OAuth, `workers_routes:write`); (2) Felipe, already on the dashboard's DNS page, creates the CNAME `docs` to `cname.mintlify-dns.com`, DNS only (grey cloud), with the recorded TTL. Step 2 is the only one that needs dashboard DNS access. Once the rollback is final, the orchestrator deletes the leftover Advanced Certificate (`ssl_certs:write`). Mintlify keeps the domain and its current deployment through a seven-day soak. | A Worker-managed DNS record cannot be turned into a CNAME in place, and the OAuth token has no DNS scope, so the CNAME is Felipe's; timing both steps together keeps the gap to seconds. Cloudflare does not delete a Custom Domain's Advanced Certificate with the domain (custom-domains docs). Nothing on Mintlify changes until the soak ends. |
| 6 | Lighthouse runs as `npx --yes lighthouse@13.5.0` with Playwright's Chromium as `CHROME_PATH`, mobile, on `/genie`, `/omni` and the mikro landing: accessibility 90, best practices 90, performance 50, SEO 90. A miss is reported to Felipe, who decides. | Load sanity with numbers on record, and no Lighthouse dependency in the repository. |
| 7 | The verify script reads the gateway token from the environment only (bws, `DOCS_CHAT_GATEWAY_TOKEN`), never from a file or a command line. | No secret in git, logs or command lines. |
| 8 | After the soak, `README.md`, `AGENTS.md` and `CONTRIBUTING.md` (Mintlify starter text today) describe the holocron workflow, `.mintignore` is deleted, and `docs.json` `$schema` points at holocron's schema. | Mintlify config with no reader is dead config. `_internal` stays private because holocron builds only navigation pages. |
| 9 | The live Mintlify site still serves the pre-#89 pages because its deployment does not track docs `main`; the cutover fixes that, since the new site deploys on every push to `main`. | Owner context (genie-launch design Decision 10). The old pages are not redirected: owner decision B (2026-10-04) makes this a fresh start. |
| 10 | The mikro move (owner decision D, 2026-10-04, no redirects) is its own group in this wish, ahead of verification. | It touches 6 pages, `docs.json` and the two check scripts that name `/rlmx`; `docs-holocron` would pass the 25-file band with them. Here it lands right before the verification that proves it. Everything earlier reads paths from `docs.json`, so the product logos, landings and share images follow with no code change. |
| 11 | **Owner decisions at plan approval (Felipe, 2026-10-04, final; recorded through the question harness).** Hosting: Cloudflare Workers Paid ("Cloudflare Workers Paid (Recomendado)"); Vercel was considered and dropped because holocron has no Vercel target. A. Visitor IP: no per-IP rate limit for now, deferred by owner; trigger to revisit: abuse or the spend cap being hit. The gateway token gate, the hard daily spend cap with its reservation ledger, the input bounds (64 KB, no `system` role), `maxOutputTokens`, the step limit, `redirect: 'manual'` and the canonical-path guard stay. B. Retired-URL redirects: none ("não quero fazer redirect, consider this a fresh start; we will revamp the other product docs later"); only `/` goes to the Genie landing, as site navigation; retired pages answer 404. C. PR previews: none ("Sem previews", 2026-10-04); PRs run only `build` and `verify` with no secrets, so the preview-chat question is moot. D. mikro URLs: `rlmx/` moves to `mikro/` with no redirects; `/rlmx/*` answers 404. | Recorded as given; all five wishes are APPROVED on these terms. |

## Simplicity Case

- **Simplest complete design:** a folder rename with no redirects, one verify script grown flag by flag across the five wishes, one screenshot script, one approved wrangler call for the switch, and a prepared two-call rollback.
- **Added machinery:** `scripts/shoot.mjs` (Felipe's visual sign-off needs images, and eyes-closed art cannot be asserted by a script).
- **Deferred until measured:** synthetic uptime monitoring, CSP headers, search console resubmission.
- **Complexity removed:** a staging subdomain, a delete-then-add switch on the main path, a permanent DNS token, a Lighthouse dependency, keeping Mintlify and holocron both live.

## Dependencies

**depends-on:** docs-holocron, docs-holocron-brand, docs-holocron-products, docs-holocron-chat
**blocks:** none

Starts after `docs-holocron-chat` merges and its Group 3 smoke passes. Group 3 needs Felipe at the keyboard or approving each step; schedule it in a window where he can watch the post-checks and roll back.

## Success Criteria

- [ ] mikro's pages answer 200 at `/mikro/...`, and `/rlmx` URLs answer 404 (owner decision D).
- [ ] Before cutover, `node scripts/verify-site.mjs https://automagik-docs.felipehowit.workers.dev --full` passes and Felipe signs off the screenshots.
- [ ] The recorded `docs` CNAME values and the prepared rollback steps are in Review Results before the switch.
- [ ] The switch is one approved call; afterwards docs.automagik.dev answers from the Worker (`server: cloudflare`, no `x-mintlify-client-version`, no `x-vercel-id`), TLS is valid, and `verify-site --full` passes against it.
- [ ] The first CI deploy after cutover leaves the Custom Domain attached and verifies the live domain.
- [ ] After the soak, Mintlify no longer lists the domain, the site still passes, and the repository has no Mintlify instructions or `.mintignore`.

## Execution Strategy

### Wave 1 (sequential)

| Group | Agent | Complexity | Model | Description |
|-------|-------|------------|-------|-------------|
| 1 | engineer | low: one folder rename, its links and two scripts' page lists, no redirects | inherit | mikro URLs under `/mikro` |

### Wave 2 (sequential)

| Group | Agent | Complexity | Model | Description |
|-------|-------|------------|-------|-------------|
| 2 | engineer | medium: browser automation, log tailing, Lighthouse | inherit | Pre-cutover verification on workers.dev |

### Wave 3 (sequential)

| Group | Agent | Complexity | Model | Description |
|-------|-------|------------|-------|-------------|
| 3 | engineer | high: irreversible public change, Felipe-approved, rollback prepared | inherit | Atomic DNS cutover with Felipe and post-checks |

### Wave 4 (sequential)

| Group | Agent | Complexity | Model | Description |
|-------|-------|------------|-------|-------------|
| 4 | engineer | low: docs text and one deletion after a soak | inherit | Mintlify retirement and repository docs |

**Global constraints:**
- npm with the committed `package-lock.json`; every validation runs `npm ci`.
- Exact pins, no `^` or `~`; tools without a dependency entry run pinned: `npx --yes wrangler@4.147.0`, `npx --yes lighthouse@13.5.0`.
- Worker names: site `automagik-docs`, gateway `automagik-docs-chat`.
- docs.automagik.dev switches directly to the new site; no staging subdomain.
- DNS, Custom Domain, Mintlify settings, secrets, pushes to `main` and production deploys go to Felipe through the question harness first; the agent's own actions in this wish are read-only checks unless Felipe approves a step.
- Rollback restores the CNAME `docs` to `cname.mintlify-dns.com` with the recorded settings.
- No secret in git, CI logs, command lines or repository files.
- `_internal/**` never reaches the public site, `docs.zip`, `llms.txt`, `llms-full.txt` or the chat.
- New user-facing copy: no hashtags, no dash punctuation, no "not X, it's Y" construction.
- A change that alters the generated deploy config (`wrangler.jsonc`, the Cloudflare Vite plugin, wrangler or the build entry) regenerates `scripts/expected-wrangler.json` with `node scripts/check-deploy-config.mjs . --write` in the same PR; the `build` job's drift check fails otherwise.
- "Wishes in, PRs out" and "context framework" are never headings.

## Execution Groups

### Group 1: mikro URLs under `/mikro`

**Goal:** mikro's pages live at `/mikro/...`; old `/rlmx` URLs are not redirected and answer 404 (owner decision D, 2026-10-04).

**Deliverables:**
1. `git mv rlmx mikro` (6 pages: `index`, `quickstart`, `cli/reference`, `config`, `batch`, `cache`), and in those pages every link `/rlmx/...` becomes `/mikro/...`.
2. `docs.json`: every `rlmx/...` page in navigation becomes `mikro/...`; `redirects` gain nothing.
3. `scripts/verify-site.mjs` (from `docs-holocron` Group 2) and `scripts/ui-check.mjs` (from `docs-holocron-brand` Group 1): every hard-coded `/rlmx` path becomes `/mikro`, because with no redirect `/rlmx` answers 404 and both scripts would fail.

**Interfaces:**
- Consumes: `docs.json` navigation from `docs-holocron`; `scripts/verify-site.mjs` and `scripts/ui-check.mjs`, whose page lists name `/rlmx`.
- Produces: mikro landing `mikro/index`, so `docs-holocron-products`' prefix becomes `/mikro` and its landing `/mikro/index`.

**Acceptance Criteria:**
- [ ] The strict build passes with the new paths; no public page and neither check script names `/rlmx`.
- [ ] Against a local Worker, every mikro navigation page answers 200 at `/mikro/...`, and `/rlmx/config` answers 404.
- [ ] `ui-check --all` passes (the mikro header logo and landing follow).

**Validation:**
```bash
test -d mikro && test ! -e rlmx
! grep -rn '/rlmx' --include='*.mdx' genie omni mikro | grep -v '/_internal/'
! grep -n '/rlmx' scripts/verify-site.mjs scripts/ui-check.mjs
npm ci
npm run build
npm run verify
mkdir -p .wrangler && (npx vite preview --port 4174 --strictPort >/dev/null 2>&1 & echo $! > .wrangler/preview.pid)
for i in $(seq 60); do curl -fs -o /dev/null http://localhost:4174/mikro && break; sleep 1; done
test "$(curl -s -o /dev/null -w '%{http_code}' http://localhost:4174/mikro/config)" = 200
test "$(curl -s -o /dev/null -w '%{http_code}' http://localhost:4174/rlmx/config)" = 404
kill "$(cat .wrangler/preview.pid)"
npx playwright install chromium
node scripts/ui-check.mjs --serve --all
```

**depends-on:** none

---

### Group 2: Pre-cutover verification on workers.dev

**Goal:** One command proves the workers.dev site is ready to take the domain, and Felipe has screenshots to sign off.

**Deliverables:**
1. `scripts/verify-site.mjs --full`: runs every earlier check (navigation pages, referenced files, `_internal`, holocron.so only in the powered-by link, `--chat-guard`), then:
   - chat through the real UI with Playwright on the Genie, Omni and mikro landings: type the product's suggestion into the sidebar chat, wait up to 20 s, and require answer text containing a link to a page of that product;
   - browser host audit during those turns: every request goes to the site origin;
   - gateway outbound audit: run `npx --yes wrangler@4.147.0 tail automagik-docs-chat --format json` during the turns and require outbound log lines for `api.deepseek.com` and the site origin only;
   - Lighthouse per decision 6, scores printed;
   - a missing page (`/genie/does-not-exist`) answers 404 with the site chrome and the pet.
2. `scripts/shoot.mjs <base-url> <out-dir>`: 1440x900 and 390x844 screenshots of `/genie` (hero settled), `/genie/skills/wish`, the Omni and mikro landings, a page with the chat drawer open after one answer, the product switcher open, and a reduced-motion `/genie`.
3. Run both against `https://automagik-docs.felipehowit.workers.dev`, append results and Lighthouse scores to Review Results, and ask Felipe through the question harness to sign off the screenshots (brand, product logos, hero, pet, closed eyes).

**Interfaces:**
- Consumes: `scripts/verify-site.mjs` with `--gateway-smoke` (from `docs-holocron-chat`), `scripts/ui-check.mjs` (from `docs-holocron-brand` and `docs-holocron-products`), the live Workers from `docs-holocron-chat` Group 3, `GATEWAY_TOKEN` from bws in the environment.
- Produces: `node scripts/verify-site.mjs <base-url> --full` (exit 0 or 1); `node scripts/shoot.mjs <base-url> <out-dir>`; Felipe's sign-off recorded in Review Results.

**Acceptance Criteria:**
- [ ] `verify-site --full` passes against the workers.dev URL.
- [ ] Lighthouse scores are recorded and meet decision 6, or Felipe accepts a miss in writing.
- [ ] Felipe signs off the screenshots.

**Validation:**
```bash
SITE="https://automagik-docs.felipehowit.workers.dev"
npm ci
npx playwright install chromium
( set +x; export GATEWAY_TOKEN="$(bws secret get <DOCS_CHAT_GATEWAY_TOKEN-id> | jq -r .value)"; node scripts/verify-site.mjs "$SITE" --full )
node scripts/shoot.mjs "$SITE" .ui-check/precutover
```

**depends-on:** Group 1

---

### Group 3: Atomic DNS cutover with Felipe

**Goal:** docs.automagik.dev serves the `automagik-docs` Worker after one approved call, checked end to end, with a prepared path back to Mintlify.

**Deliverables:**
1. Agent, read-only, before the window: Group 2 still passes on the commit deployed from `main` (`npx --yes wrangler@4.147.0 deployments list --name automagik-docs`); the gateway's `ALLOWED_DOCS_ORIGINS` includes `https://docs.automagik.dev`; `curl -sI https://docs.automagik.dev/genie` shows `x-mintlify-client-version` (baseline).
2. Record the current `docs` record in Review Results: public DNS shows a DNS-only CNAME to `cname.mintlify-dns.com` (2026-10-04, `dig docs.automagik.dev CNAME`); Felipe confirms its TTL in the dashboard.
3. Orchestrator, read-only with its OAuth token: prepare the rollback (decision 5): the Workers API call that deletes the Custom Domain (domain id read beforehand) and Felipe's dashboard steps for the CNAME, printed into Review Results.
4. The switch, one call, approved by Felipe through the question harness: at the commit deployed from `main`, `npm ci && npm run build && node scripts/check-deploy-config.mjs .`, then the orchestrator runs `npx --yes wrangler@4.147.0 deploy --name automagik-docs --domain docs.automagik.dev` with its OAuth token, which attaches the Custom Domain, replaces the CNAME and issues the hostname's certificate in one request.
5. Fallback, only if step 4 fails without attaching the domain (for example, the override is refused for lack of DNS permission): Felipe deletes the `docs` CNAME in the dashboard and the orchestrator immediately reruns step 4; the negative-cache risk of decision 3 applies.
6. Agent post-checks, polling up to 15 minutes: `curl -sI https://docs.automagik.dev/genie` returns 200 with `server: cloudflare` and without `x-mintlify-client-version` or `x-vercel-id`; the certificate validates; `/` redirects to `/genie`; then `verify-site --full` against `https://docs.automagik.dev`, whose chat run is the gate for the same-zone site to gateway fetch (`docs-holocron-chat` decision 3).
7. Rollback, when a post-check still fails 30 minutes after the switch, or whenever Felipe calls it: the orchestrator deletes the Custom Domain and Felipe creates the CNAME, back to back (decision 5); the orchestrator confirms `x-mintlify-client-version` is back on `https://docs.automagik.dev/genie` and an old Mintlify URL such as `/genie/cli/agents` answers 200, and records the outcome.
8. Once the post-checks pass, Felipe merges this wish's PR; the next `site.yml` deploy must leave the Custom Domain attached (step 6's header test after that deploy).

**Interfaces:**
- Consumes: `node scripts/verify-site.mjs <base-url> --full` from Group 2; Worker `automagik-docs`; gateway origins from `docs-holocron-chat`.
- Produces: docs.automagik.dev on the Worker; the recorded CNAME values, the rollback steps and the cutover log in Review Results.

**Acceptance Criteria:**
- [ ] The CNAME values and the rollback steps are recorded before step 4.
- [ ] The switch is one approved call (or the recorded fallback), and the post-checks pass on docs.automagik.dev, or the rollback is executed and confirmed.
- [ ] After the first CI deploy that follows, the header check still passes.

**Validation:**
```bash
H="$(curl -sI https://docs.automagik.dev/genie)"
printf '%s\n' "$H" | head -1 | grep -q ' 200'
printf '%s\n' "$H" | grep -qi '^server: cloudflare'
! printf '%s\n' "$H" | grep -qiE '^(x-mintlify-client-version|x-vercel-id):'
( set +x; export GATEWAY_TOKEN="$(bws secret get <DOCS_CHAT_GATEWAY_TOKEN-id> | jq -r .value)"; node scripts/verify-site.mjs https://docs.automagik.dev --full )
```

**depends-on:** Group 2

---

### Group 4: Mintlify retirement and repository docs

**Goal:** After a clean seven-day soak, Mintlify no longer holds the domain and the repository explains the holocron workflow only.

**Deliverables:**
1. Felipe, after seven days without a rollback: Mintlify dashboard, remove the custom domain `docs.automagik.dev`; disconnect Mintlify's GitHub app from `automagik-dev/docs`.
2. `README.md`, `AGENTS.md`, `CONTRIBUTING.md`: replace the Mintlify starter text with the holocron workflow: `npm ci`, `npm run dev`, `npm run build` (strict validation), `npm run verify`, `node scripts/ui-check.mjs --serve --all`, build and verify on PRs with no previews, a deploy on every merge into `main`, the deploy-config guard and how to regenerate its expected copy, `_internal/` stays out of navigation, the `docs.json` hidden group for unlisted pages, product landings and logos read from `docs.json`, the chat gateway under `gateway/`, and the note that the first request after a dev server restart can fail once.
3. Delete `.mintignore`.
4. `docs.json`: `$schema` set to holocron's published schema.
5. `.github/workflows/site.yml`: the `deploy` job verifies `https://docs.automagik.dev` instead of the workers.dev URL.

**Interfaces:**
- Consumes: the live site from Group 3.
- Produces: repository docs for contributors; the genie repository follow-up list (its CLAUDE.md docs section, the `.docs-vendor` bump) handed to Felipe.

**Acceptance Criteria:**
- [ ] `https://docs.automagik.dev/genie` still answers from the Worker after Felipe removes the domain from Mintlify.
- [ ] No Mintlify instruction remains in `README.md`, `AGENTS.md`, `CONTRIBUTING.md`; `.mintignore` is gone.
- [ ] The strict build, `npm run verify` and the UI check pass.

**Validation:**
```bash
test ! -e .mintignore
! grep -qiE 'mintlify|mint dev|mint broken-links' README.md AGENTS.md CONTRIBUTING.md
grep -q 'npm run dev' README.md
grep -q 'https://docs.automagik.dev' .github/workflows/site.yml
npm ci && npm run build && npm run verify
curl -sI https://docs.automagik.dev/genie | grep -qi '^server: cloudflare'
```

**depends-on:** Group 3

---

## QA Criteria

_What must be verified on dev after merge. The QA agent tests each criterion._

- [ ] Functional: on docs.automagik.dev, every product's pages open, the hero, pet and product logos work, and the chat answers.
- [ ] Integration: merging a docs PR into `main` updates docs.automagik.dev within one workflow run.
- [ ] Regression: every navigation page answers 200 on docs.automagik.dev; retired pages and `/rlmx` URLs answer 404 by owner decision.

---

## Assumptions / Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| The certificate for the Custom Domain takes longer than expected | Medium | Poll for 15 minutes; roll back at 30 minutes; do the switch in a window Felipe watches. |
| The single call fails halfway, attaching nothing or leaving the CNAME | Medium | Step 1's baseline and step 6's header checks show which state the domain is in; the fallback or the rollback covers both. |
| A CI deploy after cutover detaches the Custom Domain | Low | wrangler 4.147.0 publishes custom domains only when the deploy names some; step 8 checks after the next deploy. |
| Cached Mintlify responses or HSTS confuse the post-checks | Low | Checks use `curl` without a cache and test Mintlify headers explicitly. |
| Old URLs 404 after cutover, including `/rlmx` and the retired pages | Low | Owner decisions B and D (2026-10-04): a fresh start; the other products' docs are revamped later. |
| Mintlify loses the domain configuration before the soak ends | Medium | Nothing on Mintlify changes until Group 4; Felipe removes the domain only after seven clean days. |
| The genie repository still describes Mintlify | Low | Follow-up list handed to Felipe in Group 4; changed in a genie PR. |

---

## Review Results

_The read-only reviewer returns evidence; the invoking orchestrator appends a timestamped block here after plan, execution, and PR reviews._

### Group 1 and the mikro copy — 2026-10-05

**Owner decision (2026-10-05, through the question harness): "Atualiza antes da virada".** The six mikro pages describe mikro as it is today before the cutover. This is a scope addition to Group 1 recorded here: the install via `scripts/install.sh` (mikro is not on npm), the real commands, flags, keys and paths, and corrections where the source contradicted the old pages. The `.rlmx/` fallback is mentioned once, on the config page.

**Review round 0 (6878581): FIX-FIRST.** Group 1 met its criteria. The reviewer sampled 48 copy claims against mikro 1.260909.1, the source and isolated runs; 44 were correct. Findings:
- F1: the Anthropic and OpenAI quickstart tabs broke `llm_query()`, because the scaffolded `mikro.yaml` names a Gemini sub-call model.
- F2: the plan's `/rlmx` grep failed on the fallback note.
- F3: the RLM paper link pointed at arXiv 2501.12599 (Kimi k1.5). The same error exists on main and in mikro's README.
- F4 to F9: OpenAI cache retention, the Gemini TTL wording, cache arithmetic, the `.mikro/` location, the `sub_call_model` help key, and `station/` with the `/genie` link.
- The plan's preview `kill` stops the `npx` wrapper and leaves vite on port 4174. Known plan error.

**Repair round 1 (b33c8ce), re-review: SHIP.**
- F1 was re-run end to end with the page's exact tab steps against a stand-in provider. Before the repair: `Unknown model`. After: the sub-call reaches the endpoint as `claude-sonnet-5` / `gpt-4o`.
- F2 to F9 were verified against the source. The `/rlmx` grep exits 0.
- Strict build passes (41 pages), and so do verify, `ui-check --all`, `--chat-guard` and `check-deploy-config`.
- Status codes: `/mikro/*` 200, `/mikro/index` 308 to `/mikro`, `/rlmx/*` 404.
- All authored links and anchors resolve. The copy rules hold on the changed lines.
- Two optional nits are left: `quickstart.mdx:63` "any other provider", and `cli/reference.mdx:130` `SYSTEM.md` against microagent packs.

**Ruling (orchestrator):** Group 1 ships in its own PR ahead of the rest of this wish, so Group 2's final `verify-site --full` runs against a workers.dev site that serves `/mikro`. Group 3 step 8 still merges the rest of the wish after the cutover.

**Upstream mikro issues found (not filed; owner's call):**
- `mikro config` help lists keys mikro never reads;
- `--batch-api` is never passed to the batch runner;
- `--parallel` is ignored;
- the README's `echo data | mikro "query"` drops the data;
- `cache.ttl` and `expire-time` are never sent;
- the README cites the wrong RLM arXiv id.

### Group 2 — 2026-10-05

**Owner sign-off (question harness, 2026-10-05):**
- the screenshots were "Aprovado";
- for the `/genie` Lighthouse performance miss (39): "Vira e otimiza depois";
- the 404 without a pet: "Quero o pet na 404".

The last two shipped as #99 (worker-played hero, live `/genie` performance 70 to 76) and #98 (the pet and the logo menu on every 404).

**Round 0 (b136cb7): FIX-FIRST.**
- F1: secrets reached child processes. wrangler tail got `GATEWAY_TOKEN`; Lighthouse and Chrome got both tokens.
- F2: some output lines were not redacted.
- F3: a Lighthouse timeout orphaned Chrome.
- F4: the host-audit gaps (popups, workers, WebSockets).
- F5: chat turns were spent when the tail failed to connect.

Every check was shown to fail for the right reason.

**Repair round 1 (237f789), re-review: SHIP.** Each child process gets an explicit environment: the tail gets only `CLOUDFLARE_*`, and Lighthouse and both Chromiums get no credential variable. Stub-env proofs back this. Redaction everywhere, process-group kills, a context-level host audit, and the paid parts skipped when the tail fails.

**Follow-up (05c5e1e..baec0aa), re-review: SHIP.**
- Main was merged.
- The 404 check now requires the pet, a drawer open, and the logo menu.
- Outbound-audit ruling: Workers tail is best-effort and dropped events in one live run ("saw 2 of 4"). The audit passes on at least 1 chat request seen when every host seen is allowed and both allowed hosts appear. Zero requests seen, or any foreign host, fails. The reviewer showed it cannot pass vacuously (8 tail scenarios).
- `LIGHTHOUSE_ACCEPTED` is emptied because #99 met the target. Decision 6's 50 applies to all three landings, and a faked 45 fails.

**Live `--full` against workers.dev at 8664f74: exit 0.**
- 41 pages, 57 files, 21 chat-guard requests.
- Chat answers 2.9 to 3.5 s, each linking its own product.
- Outbound: the site origin and api.deepseek.com only.
- 131 browser requests, all to the site origin.
- The 404 shows the pet and the logo menu.
- Lighthouse `/genie` 70 to 76, `/omni` 72 to 78, `/mikro` 70 to 73; accessibility 95, best practices 96, SEO 100.
- No token appears in any of 438 scanned files.

### Group 3 — attempt 1 (2026-10-05 05:02 UTC)

The owner approved: "Pode virar".
- The exact artifact main deployed was staged and checked with `check-deploy-config`.
- `wrangler@4.147.0 deploy --name automagik-docs --domain docs.automagik.dev` ran non-TTY, so wrangler sent `override_existing_dns_record: true`. The Worker redeployed unchanged.
- The Custom Domain was refused: "Hostname 'docs.automagik.dev' already has externally managed DNS records … Delete them first" [code 100117].
- Nothing changed; docs.automagik.dev is still on Mintlify.
- Plan error: decision 3 assumed the override replaces a CNAME created outside Workers. Cloudflare refuses that, so step 5's fallback (delete the CNAME first) is the only path.
- The orchestrator's OAuth token has no DNS scope, and no bws token has DNS on automagik.dev: `CLOUDFLARE_TOKEN` and `CLOUDFLARE_API_TOKEN` have DNS on khal.ai only.
- The owner declined the dashboard step at 4 am. Pending: either the owner deletes the `docs` CNAME, or he adds Zone DNS:Edit for automagik.dev to a bws token, so the orchestrator deletes and attaches back to back.


---

## Files to Create/Modify

```
rlmx/index.mdx -> mikro/index.mdx                  (rename, links)
rlmx/quickstart.mdx -> mikro/quickstart.mdx        (rename, links)
rlmx/cli/reference.mdx -> mikro/cli/reference.mdx  (rename, links)
rlmx/config.mdx -> mikro/config.mdx                (rename, links)
rlmx/batch.mdx -> mikro/batch.mdx                  (rename, links)
rlmx/cache.mdx -> mikro/cache.mdx                  (rename, links)
docs.json                                          (modify: mikro paths, $schema)
scripts/verify-site.mjs                            (modify: /mikro paths, --full)
scripts/ui-check.mjs                               (modify: /mikro paths)
scripts/shoot.mjs                                  (create)
README.md                                          (modify)
AGENTS.md                                          (modify)
CONTRIBUTING.md                                    (modify)
.mintignore                                        (delete)
.github/workflows/site.yml                         (modify: deploy verifies the live domain)
```
