# Wish: docs.automagik.dev on holocron: verification, cutover and Mintlify retirement

| Field | Value |
|-------|-------|
| **Status** | DRAFT |
| **Slug** | `docs-holocron-cutover` |
| **Date** | 2026-10-04 |
| **Author** | Felipe Rosa (plan drafted by Claude) |
| **Appetite** | small |
| **Branch** | `wish/docs-holocron-cutover` |
| **Repos touched** | `automagik-dev/docs` |
| **Design** | _No brainstorm — direct wish_ |

## Summary

Proves the holocron site end to end on its workers.dev URL, switches docs.automagik.dev from Mintlify to the `automagik-docs` Worker together with Felipe, and retires Mintlify after a seven-day soak. Last of four sibling wishes (`docs-holocron`, `docs-holocron-brand`, `docs-holocron-chat`, this one). Every DNS and Mintlify action is Felipe's, with exact instructions and a DNS-only rollback.

## Scope

### IN

- `scripts/verify-site.mjs --full`: every earlier check plus chat through the real UI for each product, a browser host audit, a gateway outbound audit from `wrangler tail`, and Lighthouse thresholds.
- `scripts/shoot.mjs`: screenshots for Felipe's visual sign-off.
- The cutover runbook (Group 2): record, delete, attach, check, roll back.
- Post-cutover checks on docs.automagik.dev; the `site.yml` deploy check pointed at the live domain.
- After the soak: Felipe removes the domain from Mintlify; the repository's Mintlify starter docs and `.mintignore` go.

### OUT

- Any DNS or Mintlify change made by the agent without Felipe (he executes in the dashboard, or approves a scoped token).
- Content changes.
- genie repository follow-ups: its CLAUDE.md text about Mintlify and `.mintignore`, and the `.docs-vendor` bump after these docs PRs merge (a genie PR).
- Mintlify billing or account closure.

## Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | docs.automagik.dev switches directly to the new site, with no staging subdomain; the `workers.dev` URL serves pre-cutover checks. | Owner decision (Felipe, 2026-10-03/04, final). |
| 2 | The DNS cutover is executed or approved by Felipe, with exact instructions and a rollback that points the CNAME back to Mintlify; removing the domain from Mintlify after cutover is Felipe's step. | Owner decision. Neither bws Cloudflare token (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_TOKEN`) can read or edit DNS for the zone (verified read-only 2026-10-04). |
| 3 | The domain is a Worker Custom Domain on `automagik-docs` (Workers & Pages, Settings, Domains & Routes), not a route over a proxied record. | Cloudflare creates the DNS record and the certificate, and other Workers may fetch a Custom Domain Worker in the same zone without a binding. Cloudflare refuses a Custom Domain on a hostname that still has a CNAME, so the Mintlify CNAME is deleted first; the gap lasts until the new certificate is active, usually minutes. |
| 4 | The Custom Domain is attached in the dashboard, not declared in `wrangler.jsonc`. | The CI token keeps Workers Scripts: Edit only, with no zone scope. Group 2 checks that the next CI deploy leaves the domain attached. |
| 5 | Rollback is DNS only: Mintlify keeps the domain and its current deployment through a seven-day soak, so recreating the CNAME restores the old site. | The quickest safe undo; nothing on Mintlify changes until the soak ends. |
| 6 | Lighthouse (mobile) thresholds on `/genie`, `/omni`, `/rlmx`: accessibility 90, best practices 90, performance 50, SEO 90. A miss is reported to Felipe, who decides. | Load sanity with numbers on record; the 1.8 MB spritesheet loads after `load`, so it should not move the score much. |
| 7 | The verify script reads the gateway token from the environment only (bws, `DOCS_CHAT_GATEWAY_TOKEN`), never from a file or a command line. | No secret in git, logs or command lines. |
| 8 | After the soak, `README.md`, `AGENTS.md` and `CONTRIBUTING.md` (Mintlify starter text today) describe the holocron workflow, `.mintignore` is deleted, and `docs.json` `$schema` points at holocron's schema. | Mintlify config with no reader is dead config. `_internal` stays private because holocron builds only navigation pages. |
| 9 | The live Mintlify site still serves the pre-#89 pages because its deployment does not track docs `main`; the cutover fixes that, since the new site deploys on every push to `main`. | Owner context (genie-launch design Decision 10). The captured sitemap of the old pages is why `docs-holocron` adds retired-URL redirects. |
| 10 | **Needs Felipe's approval at plan approval (one pass for all four wishes).** A. Visitor IP (`docs-holocron-chat` decision 5): rate-limited in the site Worker, never forwarded; the gateway accepts only the site's token. B. Retired-URL redirect targets (`docs-holocron` decision 12): `/genie/architecture/:page`, `/genie/concepts/:page`, `/genie/observability/:page`, `/genie/contributing`, `/genie/features`, `/genie/onboarding` to `/genie`; `/genie/cli/:page` to `/genie/cli-reference`; `/genie/config/:page` to `/genie/installation`; `/genie/security/distribution-sovereignty` and `/genie/security/verifying-installs` to `/genie/security`; 12 retired skill pages (`brain`, `docs`, `dream`, `genie`, `genie-hacks`, `learn`, `loop-overview`, `pm`, `refine`, `report`, `trace`, `wizard`) to `/genie/skills`. C. PR-preview chat (`docs-holocron` decision 17): previews carry no gateway token, so their chat shows an error. | Each changes user-visible behavior or the brief, so Felipe decides it at approval; until then they are proposals. |

## Simplicity Case

- **Simplest complete design:** one verify script grown flag by flag across the four wishes, one screenshot script, one dashboard change by Felipe, and a rollback that only touches DNS.
- **Added machinery:** `scripts/shoot.mjs` (Felipe's visual sign-off needs images, and eyes-closed art cannot be asserted by a script) and Lighthouse as a pinned devDependency (the brief asks for Lighthouse or load sanity).
- **Deferred until measured:** synthetic uptime monitoring, CSP headers, search console resubmission.
- **Complexity removed:** a staging subdomain, a DNS token for the agent, keeping Mintlify and holocron both live.

## Dependencies

**depends-on:** docs-holocron, docs-holocron-brand, docs-holocron-chat
**blocks:** none

Starts after `docs-holocron-chat` merges and its Group 3 smoke passes. The cutover itself (Group 2) needs Felipe at the dashboard; schedule it in a window where he can watch the post-checks and roll back.

## Success Criteria

- [ ] Before cutover, `node scripts/verify-site.mjs https://automagik-docs.<workers-subdomain>.workers.dev --full` passes and Felipe signs off the screenshots.
- [ ] The recorded `docs` CNAME values and the rollback steps are in Review Results before the switch.
- [ ] After cutover, docs.automagik.dev answers from the Worker (`server: cloudflare`, no `x-mintlify-client-version`, no `x-vercel-id`), TLS is valid, and `verify-site --full` passes against it.
- [ ] The first CI deploy after cutover leaves the Custom Domain attached and verifies the live domain.
- [ ] After the soak, Mintlify no longer lists the domain, the site still passes, and the repository has no Mintlify instructions or `.mintignore`.

## Execution Strategy

### Wave 1 (sequential)

| Group | Agent | Complexity | Model | Description |
|-------|-------|------------|-------|-------------|
| 1 | engineer | medium: browser automation, log tailing, Lighthouse | inherit | Pre-cutover verification on workers.dev |

### Wave 2 (sequential)

| Group | Agent | Complexity | Model | Description |
|-------|-------|------------|-------|-------------|
| 2 | engineer | high: irreversible public change, Felipe-executed | inherit | DNS cutover with Felipe, post-checks, rollback ready |

### Wave 3 (sequential)

| Group | Agent | Complexity | Model | Description |
|-------|-------|------------|-------|-------------|
| 3 | engineer | low: docs text and one deletion after a soak | inherit | Mintlify retirement and repository docs |

**Global constraints:**
- npm with the committed `package-lock.json`; every validation runs `npm ci`.
- Exact pins, no `^` or `~`; `lighthouse` pinned exactly when added.
- Run wrangler as `npx wrangler`; it is not installed globally.
- Worker names: site `automagik-docs`, gateway `automagik-docs-chat`.
- docs.automagik.dev switches directly to the new site; no staging subdomain.
- DNS, Custom Domain, Mintlify settings, secrets, pushes to `main` and production deploys go to Felipe through the question harness first; the agent's own actions in this wish are read-only checks.
- Rollback restores the CNAME `docs` to `cname.mintlify-dns.com` with the recorded settings.
- No secret in git, CI logs, command lines or repository files.
- `_internal/**` never reaches the public site, `docs.zip`, `llms.txt`, `llms-full.txt` or the chat.
- New user-facing copy: no hashtags, no dash punctuation, no "not X, it's Y" construction.
- "Wishes in, PRs out" and "context framework" are never headings.

## Execution Groups

### Group 1: Pre-cutover verification on workers.dev

**Goal:** One command proves the workers.dev site is ready to take the domain, and Felipe has screenshots to sign off.

**Deliverables:**
1. `scripts/verify-site.mjs --full`: runs every earlier check (pages, redirects, the 90 captured Mintlify URLs, `_internal`, holocron.so only in the powered-by link), then:
   - chat through the real UI with Playwright on `/genie`, `/omni`, `/rlmx`: type the product's suggestion into the sidebar chat, wait up to 20 s, and require answer text containing a link to a page of that product;
   - browser host audit during those turns: every request goes to the site origin;
   - gateway outbound audit: run `npx wrangler tail automagik-docs-chat --format json` during the turns and require outbound log lines for `api.deepseek.com` and the site origin only;
   - Lighthouse (mobile) on `/genie`, `/omni`, `/rlmx` with Playwright's Chromium as `CHROME_PATH`, thresholds as in Decision 6, scores printed;
   - a missing page (`/genie/does-not-exist`) answers 404 with the site chrome and the pet.
2. `scripts/shoot.mjs <base-url> <out-dir>`: 1440x900 and 390x844 screenshots of `/genie` (hero settled), `/genie/skills/wish`, `/omni`, `/rlmx`, a page with the chat drawer open after one answer, and a reduced-motion `/genie`.
3. `package.json` and `package-lock.json`: devDependency `lighthouse` (exact); scripts `verify:full` and `shoot`.
4. Run both against `https://automagik-docs.<workers-subdomain>.workers.dev`, append results and Lighthouse scores to Review Results, and ask Felipe through the question harness to sign off the screenshots (brand, logo, hero, pet, closed eyes).

**Interfaces:**
- Consumes: `scripts/verify-site.mjs` with `--chat-guard` and `--gateway-smoke` (from `docs-holocron-chat`), `scripts/ui-check.mjs` (from `docs-holocron-brand`), the live Workers from `docs-holocron-chat` Group 3, `GATEWAY_TOKEN` from bws in the environment.
- Produces: `node scripts/verify-site.mjs <base-url> --full` (exit 0 or 1); `node scripts/shoot.mjs <base-url> <out-dir>`; Felipe's sign-off recorded in Review Results.

**Acceptance Criteria:**
- [ ] `verify-site --full` passes against the workers.dev URL.
- [ ] Lighthouse scores are recorded and meet Decision 6, or Felipe accepts a miss in writing.
- [ ] Felipe signs off the screenshots.

**Validation:**
```bash
SITE="https://automagik-docs.<workers-subdomain>.workers.dev"
npm ci
npx playwright install chromium
( set +x; export GATEWAY_TOKEN="$(bws secret get <DOCS_CHAT_GATEWAY_TOKEN-id> | jq -r .value)"; node scripts/verify-site.mjs "$SITE" --full )
node scripts/shoot.mjs "$SITE" .ui-check/precutover
```

**depends-on:** none

---

### Group 2: DNS cutover with Felipe

**Goal:** docs.automagik.dev serves the `automagik-docs` Worker, checked end to end, with a tested path back to Mintlify.

**Deliverables:**
1. Agent, read-only, right before the window: Group 1 still passes on the deployed commit (`npx wrangler deployments list --name automagik-docs`); the gateway's `ALLOWED_DOCS_ORIGINS` includes `https://docs.automagik.dev`; `curl -sI https://docs.automagik.dev/genie` shows `x-mintlify-client-version` (baseline).
2. Felipe, Cloudflare dashboard, account "Felipehowit@gmail.com's Account", zone `automagik.dev`, DNS, Records: write down the current `docs` record (type `CNAME`, target `cname.mintlify-dns.com`, proxy status, TTL) and paste it into Review Results.
3. Felipe: delete that `docs` CNAME record.
4. Felipe: Workers & Pages, `automagik-docs`, Settings, Domains & Routes, Add, Custom Domain, `docs.automagik.dev`, Add Custom Domain. (Alternative: Felipe gives the agent a token with Zone DNS: Edit and Workers Routes: Edit on `automagik.dev` and approves each call; steps 3 and 4 stay the same.)
5. Agent post-checks, polling up to 15 minutes: `curl -sI https://docs.automagik.dev/genie` returns 200 with `server: cloudflare` and without `x-mintlify-client-version` or `x-vercel-id`; the certificate validates; `/` redirects to `/genie`; then `verify-site --full` against `https://docs.automagik.dev`.
6. Rollback, when a post-check still fails 30 minutes after step 4, or whenever Felipe calls it. Felipe: Workers & Pages, `automagik-docs`, Settings, Domains & Routes, remove `docs.automagik.dev`; then DNS, add record `CNAME` `docs` to `cname.mintlify-dns.com` with the proxy status and TTL recorded in step 2. Agent: confirm `x-mintlify-client-version` is back on `https://docs.automagik.dev/genie` and a captured old URL such as `/genie/cli/agents` answers 200. Record the outcome in Review Results.
7. Once the post-checks pass, Felipe merges this wish's PR; the next `site.yml` deploy must leave the Custom Domain attached (checked by step 5's header test after that deploy).

**Interfaces:**
- Consumes: `node scripts/verify-site.mjs <base-url> --full` from Group 1; Worker `automagik-docs`; gateway origins from `docs-holocron-chat`.
- Produces: docs.automagik.dev on the Worker; the recorded CNAME values and the cutover log in Review Results.

**Acceptance Criteria:**
- [ ] The CNAME values are recorded before step 3.
- [ ] The post-checks pass on docs.automagik.dev, or the rollback is executed and confirmed.
- [ ] After the first CI deploy that follows, the header check still passes.

**Validation:**
```bash
H="$(curl -sI https://docs.automagik.dev/genie)"
printf '%s\n' "$H" | head -1 | grep -q ' 200'
printf '%s\n' "$H" | grep -qi '^server: cloudflare'
! printf '%s\n' "$H" | grep -qiE '^(x-mintlify-client-version|x-vercel-id):'
( set +x; export GATEWAY_TOKEN="$(bws secret get <DOCS_CHAT_GATEWAY_TOKEN-id> | jq -r .value)"; node scripts/verify-site.mjs https://docs.automagik.dev --full )
```

**depends-on:** Group 1

---

### Group 3: Mintlify retirement and repository docs

**Goal:** After a clean seven-day soak, Mintlify no longer holds the domain and the repository explains the holocron workflow only.

**Deliverables:**
1. Felipe, after seven days without a rollback: Mintlify dashboard, remove the custom domain `docs.automagik.dev`; disconnect Mintlify's GitHub app from `automagik-dev/docs`.
2. `README.md`, `AGENTS.md`, `CONTRIBUTING.md`: replace the Mintlify starter text with the holocron workflow: `npm ci`, `npm run dev`, `npm run build` (strict validation), `npm run verify`, `node scripts/ui-check.mjs --serve`, previews on PRs, deploy on `main`, `_internal/` stays out of navigation, the `docs.json` hidden group for unlisted pages, the chat gateway under `gateway/`, and the note that the first request after a dev server restart can fail once.
3. Delete `.mintignore`.
4. `docs.json`: `$schema` set to holocron's published schema.
5. `.github/workflows/site.yml`: the `deploy` job verifies `https://docs.automagik.dev` instead of the workers.dev URL.

**Interfaces:**
- Consumes: the live site from Group 2.
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

**depends-on:** Group 2

---

## QA Criteria

_What must be verified on dev after merge. The QA agent tests each criterion._

- [ ] Functional: on docs.automagik.dev, every product's pages open, the hero and pet work, and the chat answers.
- [ ] Integration: a docs PR gets a preview, and merging it updates docs.automagik.dev within one workflow run.
- [ ] Regression: every URL in the captured Mintlify sitemap still reaches a 200 page on docs.automagik.dev.

---

## Assumptions / Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| The certificate for the Custom Domain takes longer than expected | Medium | Poll for 15 minutes; roll back at 30 minutes; do the switch in a window Felipe watches. |
| A CI deploy after cutover detaches the Custom Domain | Medium | `wrangler.jsonc` has no `routes`; Group 2 step 7 checks the domain after the next deploy; fallback is declaring it in `wrangler.jsonc` with a zone-scoped token Felipe creates. |
| Cached Mintlify responses or HSTS confuse the post-checks | Low | Checks use `curl` without a cache and test Mintlify headers explicitly. |
| Search engines index old URLs | Low | The retired-URL redirects from `docs-holocron` keep them reachable. |
| Mintlify loses the domain configuration before the soak ends | Medium | Nothing on Mintlify changes until Group 3; Felipe removes the domain only after seven clean days. |
| The genie repository still describes Mintlify | Low | Follow-up list handed to Felipe in Group 3; changed in a genie PR. |

---

## Review Results

_The read-only reviewer returns evidence; the invoking orchestrator appends a timestamped block here after plan, execution, and PR reviews._

---

## Files to Create/Modify

```
scripts/verify-site.mjs      (modify: --full)
scripts/shoot.mjs            (create)
package.json                 (modify: lighthouse, scripts)
package-lock.json            (modify, generated)
README.md                    (modify)
AGENTS.md                    (modify)
CONTRIBUTING.md              (modify)
.mintignore                  (delete)
docs.json                    (modify: $schema)
.github/workflows/site.yml   (modify: deploy verifies the live domain)
```
