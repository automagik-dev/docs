# Wish: docs.automagik.dev on holocron: whole-site build and deploy pipeline

| Field | Value |
|-------|-------|
| **Status** | DRAFT |
| **Slug** | `docs-holocron` |
| **Date** | 2026-10-04 |
| **Author** | Felipe Rosa (plan drafted by Claude) |
| **Appetite** | medium |
| **Branch** | `feat/docs-holocron` |
| **Repos touched** | `automagik-dev/docs` |
| **Design** | _No brainstorm — direct wish_ |

## Summary

Moves docs.automagik.dev from Mintlify to holocron on Cloudflare Workers for all three products (Genie, Omni, mikro). This wish builds the whole site on holocron with strict validation and ships a GitHub Actions pipeline that builds every PR, deploys a preview per PR and deploys docs `main` to the `automagik-docs` Worker. It is the first of four sibling wishes, split because the full migration is about 68 file changes and 3,500 authored insertions (lockfiles excluded), past the 25-file and 2,000-insertion band: `docs-holocron` (this one, 20 files), `docs-holocron-brand` (24), `docs-holocron-chat` (14), `docs-holocron-cutover` (10).

## Scope

### IN

- Free Font Awesome icon names in the 11 public pages that use paid-tier names (Omni and mikro checked too).
- holocron toolchain at the repository root: `package.json`, `package-lock.json`, `vite.config.ts`, `wrangler.jsonc`, `.gitignore`.
- `docs.json` for holocron: a hidden group for unlisted pages, the mikro product icon, redirects, the assistant block pointed at the self-hosted gateway origin, and the powered-by attribution as a plain link.
- `scripts/verify-site.mjs` and a captured copy of the live Mintlify sitemap, proving every public page, redirect, retired URL and the `_internal` exclusion against a running build.
- `.github/workflows/site.yml`: strict build on every PR, a preview per same-repo PR, deploy on push to `main`, preview cleanup on close.

### OUT

- Logo, tokens, fonts, lamp hero and pet (`docs-holocron-brand`).
- The chat gateway Worker, rate limiting and spend cap (`docs-holocron-chat`).
- Pre-cutover end-to-end verification, DNS cutover, Mintlify removal and the README/AGENTS rewrite (`docs-holocron-cutover`).
- Content rewrites beyond icon names; the 58 `_internal` pages stay as they are.
- `holocron deploy`, holocron.so hosting or keys, Vercel.
- Changes in the genie repository (its CLAUDE.md text about `.mintignore`); a follow-up there after cutover.

## Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | holocron replaces Mintlify. | Owner decision (Felipe, 2026-10-03/04, final), chosen over docmd after a comparison and two spikes. |
| 2 | Hosting is Cloudflare Workers, for both the docs site and the chat gateway. | Owner decision, final. |
| 3 | docs.automagik.dev switches directly to the new site; there is no staging subdomain; a `workers.dev` URL serves pre-cutover checks. | Owner decision, final. Executed in `docs-holocron-cutover`. |
| 4 | Scope is the whole site: Genie, Omni and mikro. | Owner decision, final. |
| 5 | Design is the Automagik design system of the launch videos: neon design B `#0B0B12` / `#E8E6F0` / `#FF3FF5` / `#5EF2FF` / `#2A2438`; Geist and JetBrains Mono; the real logo (triskele plus GENIE wordmark, never the mascot face) with the dark-mode invert cancelled; the lamp play (film scene 3) as the Genie introduction hero; the sprite pet as a site-wide companion whose click opens the AI chat; the mascot's eyes always closed. Added 2026-10-04: the header logo follows the active product (GENIE, OMNI, MIKRO), the product switcher shows logos instead of names, and the AUTOMAGIK logo has one site-level place. | Owner decision, final. Executed in `docs-holocron-brand`. |
| 6 | AI chat is holocron's chat with a self-hosted gateway calling DeepSeek directly (`deepseek-flash`, thinking off). No holocron.so, Vercel or juice in the path. The key comes from bws (`DEEPSEEK_API_KEY`), is stored as a Worker secret and is never in git. | Owner decision, final. Executed in `docs-holocron-chat`. |
| 7 | Build and deploy path: `vite build` with `@cloudflare/vite-plugin` (plugin options `viteEnvironment: { name: 'rsc', childEnvironments: ['ssr'] }`), Worker `main` `spiceflow/cloudflare-entrypoint`, `npx wrangler deploy`. | This is upstream's documented Cloudflare path (`website/src/pages/docs/deploy/cloudflare.mdx`, `example-cloudflare/`) and the one holocron's own site runs on (`website/wrangler.jsonc`). `holocron deploy` uploads to holocron.so hosting, which decision 6 excludes. |
| 8 | Exact pins installed with `npm ci` from the committed lockfile: `@holocron.so/vite` 0.36.0, `vite` 8.3.2, `@cloudflare/vite-plugin` 1.62.5, `wrangler` 4.147.0, `react` and `react-dom` 19.3.0. | 0.36.0 is the spike's version and the newest on npm (2026-10-04). `wrangler preview` needs 4.135.0 or later. The brand wish hooks about 10 CSS rules to holocron internals, so an upgrade is its own PR gated by the verify script and the UI canary. |
| 9 | `vite.config.ts` sets `process.env.HOLOCRON_URL` to the gateway origin before `holocron()` reads it, unless the caller already set it. | `vite-plugin.ts:482` bakes `import.meta.env.HOLOCRON_URL` from `process.env` at build, and `holocronUrl()` serves chat, chat sessions, OG images, ai-logo and config-override. Baking it means every build (CI, previews, local) calls our gateway origin and never holocron.so; until the gateway exists those calls fail closed. |
| 10 | Paid-tier icons map to free Font Awesome glyphs in place: `shield-check` to `shield-halved`, `sparkles` to `wand-magic-sparkles`, `megaphone` to `bullhorn`, `webhook` to `plug`, `messages` to `comments`; the mikro product icon `brain-circuit` to `brain` in `docs.json`. | holocron ships only the free FA6 sets (`@iconify-json/fa6-*`) and fails the production build on an unresolved icon. Free names also render on Mintlify, so the content stays valid on the current Mintlify deployment; a `lucide:` prefix would not. The mapping is the spike's. |
| 11 | `genie/hacks` and `genie/security/key-rotation` go in a navigation group with `"hidden": true`. | holocron routes only pages listed in navigation; both pages are linked today and would 404. Proven in the spike. |
| 12 | Redirects: `/` to `/genie` (permanent) in `docs.json`; no rule for `/x/index` URLs; retired URLs that Mintlify serves today redirect to the nearest public page, with exact rules wherever a wildcard would shadow a live page. | holocron already answers every `<page>/index` with a 308 to `<page>` (`app-factory.tsx:2154-2171`). The live Mintlify sitemap (2026-10-04) lists 90 URLs, 49 of them pages that PR #89 moved to `_internal`; without rules they 404 after cutover. The target table is a proposal Felipe may change. |
| 13 | `_internal` stays private by construction and is proven by the verify script. | holocron renders, zips (`/docs.zip`) and lists (`/llms.txt`) only navigation pages, and the Worker serves only `dist/client`. The spike's `docs.zip` held 41 files and none under `_internal`. |
| 14 | `HOLOCRON_SKIP_BUILD_ERRORS` is never set anywhere. | The production build fails on MDX errors, broken links, invalid redirect destinations, broken assets and unresolved icons (`vite-plugin.ts:575-608`); that strict mode is the link check. |
| 15 | Mintlify's deployment does not track docs `main`, so merging this wish changes nothing on docs.automagik.dev until the cutover wish. This migration fixes that gap: from now on every push to `main` deploys. Before the first merge Felipe confirms that Mintlify still does not deploy from `main`. | Owner context (genie-launch design Decision 10; `genie` `.genie/wishes/genie-launch/WISH.md` OUT). It explains why the live site still serves the pre-#89 pages on 2026-10-04 (`/genie/workflows` 404, `/genie/cli/agents` 200) although #89 merged on 2026-10-03. |
| 16 | The CI token holds Account: Workers Scripts: Edit only, with no zone scope. | The custom domain is attached by Felipe in the cutover wish, so CI never needs DNS or route permissions. |
| 17 | Previews: `npx wrangler preview --name pr-<number>` for same-repo PRs; fork PRs get the build job only. Previews carry no gateway token, so their chat shows an error; chat is verified on the production Worker URL. | Cloudflare previews do not inherit production settings or secrets. This also closes the "no Mintlify preview" gap. |
| 18 | holocron's footer attribution stays, set through `poweredBy` to `{ "name": "Holocron", "url": "https://holocron.so" }`. | holocron is MIT and asks to keep the link. Without `poweredBy` the default link is built from `holocronUrl()` and would point at the gateway (`footer.tsx:251-253`). A link is not a service in the chat path. |
| 19 | **Needs Felipe's approval at plan approval (one pass for all four wishes).** A. Visitor IP (`docs-holocron-chat` decision 5): rate-limited in the site Worker, never forwarded; the gateway accepts only the site's token. B. Retired-URL redirect targets (`docs-holocron` decision 12): `/genie/architecture/:page`, `/genie/concepts/:page`, `/genie/observability/:page`, `/genie/contributing`, `/genie/features`, `/genie/onboarding` to `/genie`; `/genie/cli/:page` to `/genie/cli-reference`; `/genie/config/:page` to `/genie/installation`; `/genie/security/distribution-sovereignty` and `/genie/security/verifying-installs` to `/genie/security`; 12 retired skill pages (`brain`, `docs`, `dream`, `genie`, `genie-hacks`, `learn`, `loop-overview`, `pm`, `refine`, `report`, `trace`, `wizard`) to `/genie/skills`. C. PR-preview chat (`docs-holocron` decision 17): previews carry no gateway token, so their chat shows an error. | Each changes user-visible behavior or the brief, so Felipe decides it at approval; until then they are proposals. A change to B edits only the `redirects` table, to C adds a preview token, to A reopens the gateway design. |

## Simplicity Case

- **Simplest complete design:** holocron reads the existing Mintlify `docs.json` and MDX in place; the repository root becomes the Vite project; one Worker serves pages and static assets; one workflow file builds, previews and deploys.
- **Added machinery:** `scripts/verify-site.mjs` (dependency-free Node), because the strict build checks links and icons but not routing, redirects, retired URLs or the `_internal` exclusion of the running Worker. The workflow, because the owner asked for a GitHub Actions deploy with previews.
- **Deferred until measured:** OG image rendering (the brand wish sets a static `og:image`), a dependency-update bot for holocron, Lighthouse in CI.
- **Complexity removed:** all of the spike's dev-only Vite middleware (the `/index` rewrite, the raw `_internal` guard, pet HTML injection, the RSC proxy host fix, the federation dev CSS route), `holocron deploy` and any holocron.so account, a `base` path, a staging subdomain.

## Dependencies

**depends-on:** none
**blocks:** docs-holocron-brand, docs-holocron-chat, docs-holocron-cutover

Docs PR #89 (`feat/genie-v6-launch`) merged into docs `main` on 2026-10-03 at 20:09 UTC as `1275fce`, and `feat/docs-holocron` was rebased onto it on 2026-10-04, so this wish starts from docs `main`. Felipe's preconditions for Group 3 are listed in that group. Program order: this wish, then `docs-holocron-brand`, then `docs-holocron-chat`, then `docs-holocron-cutover`.

## Success Criteria

- [ ] `npm ci && npm run build` passes holocron's strict validation for all 41 public pages of Genie, Omni and mikro.
- [ ] Against the built Worker, every navigation page (the 2 hidden ones included) answers 200, `/` redirects to `/genie`, every `<page>/index` answers 308 to `<page>`, and each of the 90 captured Mintlify URLs answers 200 directly or after one redirect.
- [ ] No `_internal` page is reachable: its paths answer 404 and `/docs.zip` lists only navigation pages.
- [ ] Rendered HTML names holocron.so only in the powered-by link.
- [ ] A same-repo PR gets one comment with a preview URL that answers 200; a push to `main` deploys Worker `automagik-docs` and its `workers.dev` URL passes the verify script.
- [ ] docs.automagik.dev keeps serving Mintlify, unchanged, after this wish merges.
- [ ] No secret value appears in git or in CI logs.

## Execution Strategy

### Wave 1 (sequential)

| Group | Agent | Complexity | Model | Description |
|-------|-------|------------|-------|-------------|
| 1 | engineer | low: 11 one-token content edits, Mintlify-safe | inherit | Free Font Awesome icons in public pages |

### Wave 2 (sequential)

| Group | Agent | Complexity | Model | Description |
|-------|-------|------------|-------|-------------|
| 2 | engineer | medium: new toolchain, holocron config semantics, routing proof against a local Worker | inherit | holocron build of the whole site and the verify script |

### Wave 3 (sequential)

| Group | Agent | Complexity | Model | Description |
|-------|-------|------------|-------|-------------|
| 3 | engineer | medium: CI secrets, a new wrangler command, Felipe preconditions | inherit | GitHub Actions build, per-PR preview and deploy on `main` |

**Global constraints:**
- npm with the committed `package-lock.json`; CI and every validation run `npm ci`.
- Exact pins, no `^` or `~`: `@holocron.so/vite` 0.36.0, `vite` 8.3.2, `@cloudflare/vite-plugin` 1.62.5, `wrangler` 4.147.0, `react` 19.3.0, `react-dom` 19.3.0.
- Run wrangler as `npx wrangler`; it is not installed globally.
- Local commands work on Linux and macOS; Windows is not a target. CI uses `ubuntu-latest` with `actions/setup-node` `node-version: 24`.
- Worker names: site `automagik-docs`, gateway `automagik-docs-chat`.
- Gateway origin: `https://automagik-docs-chat.<workers-subdomain>.workers.dev`, where `<workers-subdomain>` is the account's workers.dev subdomain read in Group 2 and recorded once, as `GATEWAY_ORIGIN` in `vite.config.ts`.
- No secret in git, CI logs, command lines or repository files; secrets reach `wrangler secret put` on stdin from bws.
- `HOLOCRON_SKIP_BUILD_ERRORS` is never set.
- Outward or irreversible steps (pushes to `main`, DNS, secrets, production deploys, Mintlify settings) go to Felipe through the question harness first.
- `_internal/**` never reaches the public site, `docs.zip`, `llms.txt`, `llms-full.txt` or the chat.
- The `genie/` folder keeps its place and paths at the repository root; the genie repository's `docs` symlink reads it.
- New user-facing copy: no hashtags, no dash punctuation, no "not X, it's Y" construction.
- "Wishes in, PRs out" and "context framework" are never headings.

## Execution Groups

### Group 1: Free icons in public pages

**Goal:** Every icon name in the public pages resolves in holocron's free Font Awesome sets and still renders on Mintlify.

**Deliverables:**
1. Replace one token per file, nothing else: `shield-check` with `shield-halved` in `genie/index.mdx`, `genie/installation.mdx`, `genie/security/index.mdx`; `sparkles` with `wand-magic-sparkles` in `genie/skills/wish.mdx`, `genie/skills/brainstorm.mdx`; `megaphone` with `bullhorn` in `genie/release-notes.mdx`, `genie/cli-reference.mdx`; `webhook` with `plug` in `omni/cli/events.mdx`, `omni/cli/routes-persons-auth.mdx`, `omni/cli/system.mdx`; `messages` with `comments` in `omni/index.mdx`.
2. Leave mikro (`rlmx/`) pages untouched: every icon they use is in the free set (checked 2026-10-04 against `@iconify-json/fa6-solid`, `fa6-regular`, `fa6-brands` from holocron 0.36.0). Leave `_internal/` untouched: holocron never builds it.

**Interfaces:**
- Consumes: none.
- Produces: public MDX whose icon values are all free FA6 names; Group 2's strict build is the authoritative check (0 unresolved icons).

**Acceptance Criteria:**
- [ ] No public page uses `webhook`, `shield-check`, `sparkles`, `megaphone`, `messages`, `badge-check` or `brain-circuit` as an icon value.
- [ ] The diff against `origin/main` under `genie/`, `omni/`, `rlmx/` touches exactly 11 files with one changed line each.

**Validation:**
```bash
cd "$(git rev-parse --show-toplevel)"
! grep -rnE --include='*.mdx' 'icon(=|: ?)"(webhook|shield-check|sparkles|megaphone|messages|badge-check|brain-circuit)"' genie omni rlmx | grep -v '/_internal/'
test "$(git diff --numstat origin/main -- genie omni rlmx | awk '$1==1 && $2==1' | wc -l)" -eq 11
test "$(git diff --numstat origin/main -- genie omni rlmx | wc -l)" -eq 11
```

**depends-on:** none

---

### Group 2: holocron build of the whole site

**Goal:** The repository root builds as one holocron site for Genie, Omni and mikro, passes strict validation, and serves every public URL correctly from a local Worker.

**Deliverables:**
1. Precondition, read-only: find the account's workers.dev subdomain (`npx wrangler whoami` with the bws `CLOUDFLARE_API_TOKEN` in the environment, then `GET /accounts/<id>/workers/subdomain`). If none is registered, ask Felipe to register one before continuing.
2. `package.json`: private, `"type": "module"`, the exact pins above as dependencies or devDependencies; scripts `dev` (`vite`), `build` (`vite build`), `preview` (`vite preview`), `verify` (`node scripts/verify-site.mjs --serve`), `deploy` (`vite build && wrangler deploy`). `package-lock.json` generated by `npm install`.
3. `.gitignore`: `node_modules/`, `dist/`, `.wrangler/`, `.dev.vars*`, `.env*`, `.ui-check/` (screenshots the brand and cutover wishes write).
4. `vite.config.ts`: `const GATEWAY_ORIGIN = 'https://automagik-docs-chat.<workers-subdomain>.workers.dev'`; `process.env.HOLOCRON_URL ??= GATEWAY_ORIGIN` before the config; plugins `holocron()` then `cloudflare({ viteEnvironment: { name: 'rsc', childEnvironments: ['ssr'] } })`; `server.fs.deny` adds `'**/_internal/**'`. No other plugin.
5. `wrangler.jsonc`: `name` `automagik-docs`, `main` `spiceflow/cloudflare-entrypoint`, `compatibility_date` `2026-04-14`, `compatibility_flags` `["nodejs_compat", "global_fetch_strictly_public"]`, `workers_dev: true`, `observability: { "enabled": true }`. No `routes`, no `vars`, no secrets.
6. `docs.json`, keeping every existing Mintlify field: a group `{ "group": "Unlisted", "hidden": true, "pages": ["genie/hacks", "genie/security/key-rotation"] }` in the Genie product; mikro product icon `brain`; `assistant`: `{ "enabled": true, "display": "sidebar", "suggestions": ["How do I install Genie?", "How do I send a message with Omni?", "What does mikro do?"] }`; `poweredBy`: `{ "name": "Holocron", "url": "https://holocron.so" }`; `redirects`:
   - `/` to `/genie`, permanent;
   - `/genie/architecture/:page`, `/genie/concepts/:page`, `/genie/observability/:page` to `/genie`;
   - `/genie/cli/:page` to `/genie/cli-reference`;
   - `/genie/config/:page` to `/genie/installation`;
   - `/genie/security/distribution-sovereignty` and `/genie/security/verifying-installs` to `/genie/security`;
   - `/genie/contributing`, `/genie/features`, `/genie/onboarding` to `/genie`;
   - each of `/genie/skills/brain`, `docs`, `dream`, `genie`, `genie-hacks`, `learn`, `loop-overview`, `pm`, `refine`, `report`, `trace`, `wizard` to `/genie/skills`, as exact rules, because `/genie/skills/:page` would shadow the live skill pages.
7. `scripts/fixtures/mintlify-sitemap-2026-10-04.txt`: the 90 paths of `https://docs.automagik.dev/sitemap.xml` as served on the capture date, one per line, captured with `curl` at execution time.
8. `scripts/verify-site.mjs`, Node 22 or later, no dependencies. Usage `node scripts/verify-site.mjs <base-url> [flags]` or `--serve` (starts `npx vite preview --port 4173 --strictPort`, waits for `/genie`, runs the checks, stops the server). It exits 1 and prints one line per failure. Checks:
   - every page in `docs.json` navigation, hidden ones included, answers 200 at its href with no redirect;
   - `/` answers 301 or 308 to `/genie`; `/genie/index`, `/omni/index`, `/rlmx/index`, `/genie/skills/index`, `/genie/security/index` answer 308 to the folder URL, which answers 200;
   - every path in the fixture answers 200 directly or after exactly one redirect;
   - `/genie/_internal/observability/detectors`, the same path with `.md` and with `.mdx`, answer 404;
   - `/docs.zip` (entries listed with `unzip -Z1`) holds one entry per navigation page and none under `_internal`; `/llms.txt` and `/llms-full.txt` contain no `_internal`;
   - in the HTML of `/genie`, `/omni`, `/rlmx`, the only URL whose host is `holocron.so` is the powered-by link.

**Interfaces:**
- Consumes: Group 1's icon names.
- Produces: `npm run build` writes `dist/`; Worker `automagik-docs`; `GATEWAY_ORIGIN` in `vite.config.ts`; `node scripts/verify-site.mjs <base-url> | --serve` with exit 0 or 1, which `docs-holocron-chat` extends with `--chat-guard` and `--gateway-smoke` and `docs-holocron-cutover` with `--full`; the `docs.json` keys later wishes own: `colors`, `appearance`, `fonts`, `logo`, `favicon`, `seo` (brand) and `$schema` (cutover).

**Acceptance Criteria:**
- [ ] `npm ci && npm run build` exits 0 and reports 0 broken links, 0 invalid redirects, 0 broken assets, 0 unresolved icons, 0 MDX errors.
- [ ] Deleting one navigation page file makes `npm run build` fail (witnessed once, then restored), so strict validation is live.
- [ ] `npx wrangler deploy --dry-run --outdir .wrangler/dry-run` exits 0.
- [ ] `npm run verify` exits 0.
- [ ] Every dependency in `package.json` is pinned exactly.

**Validation:**
```bash
npm ci
npm run build
npx wrangler deploy --dry-run --outdir .wrangler/dry-run
npm run verify
! git grep -n HOLOCRON_SKIP_BUILD_ERRORS
node -e 'const p=require("./package.json");const d={...p.dependencies,...p.devDependencies};const bad=Object.entries(d).filter(([,v])=>/^[\^~]/.test(v));if(bad.length){console.error(bad);process.exit(1)}'
```

**depends-on:** Group 1

---

### Group 3: Deploy pipeline with previews

**Goal:** Every PR is built with strict validation, every same-repo PR gets a preview URL, and every push to `main` deploys Worker `automagik-docs` to workers.dev.

**Deliverables:**
1. Felipe preconditions, asked through the question harness before the first run:
   - create a Cloudflare API token on "Felipehowit@gmail.com's Account" with Account: Workers Scripts: Edit and no zone scope; store it in bws; add repository secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` to `automagik-dev/docs`;
   - confirm the Workers plan (Workers Paid is recommended: Workers Free allows 10 ms CPU per request, which request-time MDX rendering can exceed);
   - confirm in the Mintlify dashboard that its deployment still does not track `main` (decision 15).
2. `.github/workflows/site.yml`, triggered on `pull_request` (opened, synchronize, reopened, closed) and `push` to `main`; `permissions: contents: read` at the top, `pull-requests: write` only on the preview job; one concurrency group per ref; third-party actions pinned by commit SHA:
   - `build`: checkout, setup-node 24 with npm cache, `npm ci`, `npm run build`, `npm run verify`;
   - `preview` (needs `build`; runs when the event is `pull_request`, the action is not `closed`, and `github.event.pull_request.head.repo.full_name == github.repository`): `npm ci`, `npm run build`, `npx wrangler preview --name pr-${{ github.event.number }}`, read the preview URL from its output, `curl -fsS` it on `/genie`, then create or update one PR comment that holds the URL;
   - `deploy` (needs `build`; push to `main` only): `npm ci`, `npm run build`, `npx wrangler deploy`, then `node scripts/verify-site.mjs https://automagik-docs.<workers-subdomain>.workers.dev`;
   - `preview-cleanup` (PR closed, same repo): `npx wrangler preview delete --name pr-${{ github.event.number }}`;
   - the only secrets referenced are `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`, passed as environment variables.
3. Read `npx wrangler preview --help` at 4.147.0 first; if the command shape differs from Cloudflare's Previews docs, use the shape the CLI documents and record it in the PR body.

**Interfaces:**
- Consumes: `npm run build`, `npm run verify`, `scripts/verify-site.mjs <base-url>`, Worker `automagik-docs`.
- Produces: `.github/workflows/site.yml` with jobs `build`, `preview`, `deploy`, `preview-cleanup`. `docs-holocron-brand` adds a UI-check step to `build`; `docs-holocron-chat` adds a separate `.github/workflows/chat.yml` and does not edit this file.

**Acceptance Criteria:**
- [ ] On this wish's PR, `build` and `preview` succeed and the PR carries one comment with `https://pr-<n>-automagik-docs.<workers-subdomain>.workers.dev`, which answers 200 on `/genie`, `/omni`, `/rlmx`.
- [ ] The workflow references exactly two secrets and no action by a mutable tag.
- [ ] After Felipe merges to `main`, `deploy` succeeds and its verify step passes against the workers.dev URL.
- [ ] After that merge, `curl -sI https://docs.automagik.dev/genie` still shows Mintlify headers (`x-mintlify-client-version`).

**Validation:**
```bash
f=.github/workflows/site.yml
test "$(grep -oE 'secrets\.[A-Z_]+' "$f" | sort -u | tr '\n' ' ')" = "secrets.CLOUDFLARE_ACCOUNT_ID secrets.CLOUDFLARE_API_TOKEN "
grep -q 'github.event.pull_request.head.repo.full_name == github.repository' "$f"
! grep -nE 'uses: [^@]+@v?[0-9]+(\.[0-9]+)*$' "$f"
! grep -n HOLOCRON_SKIP_BUILD_ERRORS "$f"
pr=$(gh pr view --json number -q .number) && gh pr checks "$pr"
url=$(gh pr view "$pr" --json comments -q '[.comments[].body | capture("(?<u>https://pr-[0-9]+-automagik-docs\\.[a-z0-9-]+\\.workers\\.dev)").u] | last')
for p in genie omni rlmx; do curl -fsS -o /dev/null "$url/$p" || exit 1; done
```

**depends-on:** Group 2

---

## QA Criteria

_What must be verified on dev after merge. The QA agent tests each criterion._

- [ ] Functional: the workers.dev site shows Genie, Omni and mikro in the product switcher, every sidebar link opens its page, and the two unlisted pages open only by URL.
- [ ] Integration: a push to `main` redeploys `automagik-docs` within one workflow run, and a new PR gets a working preview URL.
- [ ] Regression: docs.automagik.dev keeps serving the current Mintlify deployment until `docs-holocron-cutover`.

---

## Assumptions / Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Mintlify starts deploying `main` with holocron files before cutover | Low | Its deployment does not track `main` (decision 15); Felipe confirms before the first merge; Group 3 checks Mintlify headers after the merge. |
| Workers Free's 10 ms CPU limit fails request-time MDX rendering | High | Felipe confirms Workers Paid before the first deploy; the deploy job's verify step catches 5xx on any page. |
| No workers.dev subdomain on the account (0 Workers today), so a non-interactive deploy fails | Medium | Group 2 reads it first; Felipe registers one if missing. |
| `wrangler preview` (new in 4.135.0) differs from the docs | Medium | Read `--help` at the pinned version; fallback `npx wrangler versions upload --preview-alias pr-<n>`. |
| A redirect shadows a live page | Medium | Exact rules for skills; the verify script requires every navigation page to answer 200 with no redirect. |
| A holocron upgrade changes routing or redirects | Medium | Exact pins and lockfile; upgrades are separate PRs gated by the verify script. |
| Retired-URL targets are a content call | Low | Proposed table in Group 2; Felipe may change targets; every captured URL must still reach a 200 page. |
| The dev server answers 500 on the first request after a restart | Low | Dev only; every validation uses `vite preview` or a deployed URL. |
| The spike's live copy sits in a session scratchpad | Low | Archived at `/home/genie/.genie/state-backups/holo-spike-2026-10-04/` (no `node_modules`, no upstream clone); `docs-holocron-brand` and `docs-holocron-chat` cite that path and record hashes verified against it. |

---

## Review Results

_The read-only reviewer returns evidence; the invoking orchestrator appends a timestamped block here after plan, execution, and PR reviews._

---

## Files to Create/Modify

```
genie/index.mdx                                  (modify: icon)
genie/installation.mdx                           (modify: icon)
genie/security/index.mdx                         (modify: icon)
genie/skills/wish.mdx                            (modify: icon)
genie/skills/brainstorm.mdx                      (modify: icon)
genie/release-notes.mdx                          (modify: icon)
genie/cli-reference.mdx                          (modify: icon)
omni/index.mdx                                   (modify: icon)
omni/cli/events.mdx                              (modify: icon)
omni/cli/routes-persons-auth.mdx                 (modify: icon)
omni/cli/system.mdx                              (modify: icon)
.gitignore                                       (create)
package.json                                     (create)
package-lock.json                                (create, generated)
vite.config.ts                                   (create)
wrangler.jsonc                                   (create)
docs.json                                        (modify)
scripts/verify-site.mjs                          (create)
scripts/fixtures/mintlify-sitemap-2026-10-04.txt (create)
.github/workflows/site.yml                       (create)
```
