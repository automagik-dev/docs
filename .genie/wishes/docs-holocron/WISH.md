# Wish: docs.automagik.dev on holocron: whole-site build and deploy pipeline

| Field | Value |
|-------|-------|
| **Status** | IN_PROGRESS |
| **Slug** | `docs-holocron` |
| **Date** | 2026-10-04 |
| **Author** | Felipe Rosa (plan drafted by Claude) |
| **Appetite** | medium |
| **Branch** | `feat/docs-holocron` |
| **Repos touched** | `automagik-dev/docs` |
| **Design** | _No brainstorm — direct wish_ |

## Summary

Moves docs.automagik.dev from Mintlify to holocron on Cloudflare Workers for all three products (Genie, Omni, mikro). This wish builds the whole site on holocron with strict validation, ships every page's images, videos and transcripts, and adds a GitHub Actions pipeline: a secret-free build on every PR, a preview per same-repo PR, and a deploy of docs `main` to the `automagik-docs` Worker. It is the first of five sibling wishes, split because the full migration is about 76 file changes and 3,935 authored insertions (lockfiles excluded), past the 25-file and 2,000-insertion band: `docs-holocron` (this one, 19 files, about 600 insertions), `docs-holocron-brand` (20, about 1,450), `docs-holocron-products` (7, about 500), `docs-holocron-chat` (15, about 1,000), `docs-holocron-cutover` (15, about 385).

## Scope

### IN

- Free Font Awesome icon names in the 11 public pages that use paid-tier names (Omni and mikro checked too).
- holocron toolchain at the repository root: `package.json`, `package-lock.json`, `vite.config.ts` (with a copy of the docs' own static folders into the client build), `wrangler.jsonc`, `.gitignore`.
- `docs.json` for holocron: a hidden group for unlisted pages, the mikro product icon, one navigation redirect from `/` to the Genie landing, the assistant block pointed at the self-hosted gateway origin, and the powered-by attribution as a plain link.
- `scripts/verify-site.mjs`, proving that every navigation page answers 200, every static file a page references is served, and `_internal` stays out, against a running build.
- `.github/workflows/site.yml`: strict build with no secrets on every PR, a preview published from the built artifact for same-repo PRs, deploy on push to `main` behind a `production` environment, preview cleanup on close.

### OUT

- Logo, tokens, fonts, lamp hero and pet (`docs-holocron-brand`).
- Product logos, the logo link per product, share images (`docs-holocron-products`).
- The chat gateway Worker, request bounds and spend cap (`docs-holocron-chat`).
- The mikro URL move, pre-cutover end-to-end verification, DNS cutover, Mintlify removal and the README/AGENTS rewrite (`docs-holocron-cutover`).
- Content rewrites beyond icon names; the 58 `_internal` pages stay as they are.
- Redirects for retired or old URLs: owner decision B, a fresh start; they answer 404.
- `holocron deploy`, holocron.so hosting or keys, Vercel.
- Changes in the genie repository (its CLAUDE.md text about `.mintignore`); a follow-up there after cutover.

## Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | holocron replaces Mintlify. | Owner decision (Felipe, 2026-10-03/04, final), chosen over docmd after a comparison and two spikes. |
| 2 | Hosting is Cloudflare Workers, for both the docs site and the chat gateway. | Owner decision, final. |
| 3 | docs.automagik.dev switches directly to the new site; there is no staging subdomain; a `workers.dev` URL serves pre-cutover checks. | Owner decision, final. Executed in `docs-holocron-cutover`. |
| 4 | Scope is the whole site: Genie, Omni and mikro. | Owner decision, final. |
| 5 | Design is the Automagik design system of the launch videos: neon design B `#0B0B12` / `#E8E6F0` / `#FF3FF5` / `#5EF2FF` / `#2A2438`; Geist and JetBrains Mono; the real logo (triskele plus GENIE wordmark, never the mascot face) with the dark-mode invert cancelled; the lamp play (film scene 3) as the Genie introduction hero; the sprite pet as a site-wide companion whose click opens the AI chat; the mascot's eyes always closed. Added 2026-10-04: the header logo and its link follow the active product (GENIE, OMNI, MIKRO), the product switcher shows logos instead of names, and the AUTOMAGIK logo has one site-level place. | Owner decision, final. Felipe asked for the logo link on 2026-10-04: "when you click the logo it fallsback to genie". Executed in `docs-holocron-brand` and `docs-holocron-products`. |
| 6 | AI chat is holocron's chat with a self-hosted gateway calling DeepSeek directly (`deepseek-flash`, thinking off). No holocron.so, Vercel or juice in the path. The key comes from bws (`DEEPSEEK_API_KEY`), is stored as a Worker secret and is never in git. | Owner decision, final. Executed in `docs-holocron-chat`. |
| 7 | Build and deploy path: `vite build` with `@cloudflare/vite-plugin` (plugin options `viteEnvironment: { name: 'rsc', childEnvironments: ['ssr'] }`), Worker `main` `spiceflow/cloudflare-entrypoint`, `wrangler deploy` from the built output. | This is upstream's documented Cloudflare path (`website/src/pages/docs/deploy/cloudflare.mdx`, `example-cloudflare/`) and the one holocron's own site runs on (`website/wrangler.jsonc`). `holocron deploy` uploads to holocron.so hosting, which decision 6 excludes. |
| 8 | Exact pins installed with `npm ci` from the committed lockfile: `@holocron.so/vite` 0.36.0, `vite` 8.3.2, `@cloudflare/vite-plugin` 1.62.5, `wrangler` 4.147.0, `react` and `react-dom` 19.3.0. CI jobs that hold secrets run wrangler as `npx --yes wrangler@4.147.0` with no install step. | 0.36.0 is the spike's version and the newest on npm (2026-10-04). `wrangler preview` needs 4.135.0 or later. The brand and products wishes hook 27 CSS rules to holocron internals, so an upgrade is its own PR gated by the verify script and the UI canaries. |
| 9 | `vite.config.ts` sets `process.env.HOLOCRON_URL` to the gateway origin before `holocron()` reads it, unless the caller already set it. | `vite-plugin.ts:482` bakes `import.meta.env.HOLOCRON_URL` from `process.env` at build, and `holocronUrl()` serves chat, chat sessions, OG images, ai-logo and config-override. Baking it means every build (CI, previews, local) calls our gateway origin and never holocron.so; until the gateway exists those calls fail closed. |
| 10 | Paid-tier icons map to free Font Awesome glyphs in place: `shield-check` to `shield-halved`, `sparkles` to `wand-magic-sparkles`, `megaphone` to `bullhorn`, `webhook` to `plug`, `messages` to `comments`; the mikro product icon `brain-circuit` to `brain` in `docs.json`. | holocron ships only the free FA6 sets (`@iconify-json/fa6-*`) and fails the production build on an unresolved icon. Free names also render on Mintlify, so the content stays valid on the current Mintlify deployment; a `lucide:` prefix would not. The mapping is the spike's. |
| 11 | `genie/hacks` and `genie/security/key-rotation` go in a navigation group with `"hidden": true`. | holocron routes only pages listed in navigation; both pages are linked today and would 404. Proven in the spike. |
| 12 | The only redirect is `/` to `/genie` (`"permanent": false`), as site navigation. There are no retired-URL redirects: the 49 pages PR #89 moved to `_internal` and any other old URL answer 404, and nothing is tested beyond navigation pages answering 200. holocron itself still answers `<page>/index` with a 308 to `<page>` (`app-factory.tsx:2154-2171`); that is built in, not configured here, and not checked. | Owner decision B (Felipe, 2026-10-04): "não quero fazer redirect, consider this a fresh start; we will revamp the other product docs later". The `/` rule is navigation, so it stays temporary in case a site landing page replaces it. |
| 13 | `_internal` stays private by construction and is proven by the verify script. | holocron renders, zips (`/docs.zip`) and lists (`/llms.txt`) only navigation pages; the Worker serves only `dist/client`; the static-folder copy (decision 20) skips any `_internal` path. The spike's `docs.zip` held 41 files and none under `_internal`. |
| 14 | `HOLOCRON_SKIP_BUILD_ERRORS` is never set anywhere. | The production build fails on MDX errors, broken links, invalid redirect destinations, broken assets and unresolved icons (`vite-plugin.ts:575-608`); that strict mode is the link check. It does not prove a referenced file is served, which is why decision 20 and the verify script exist. |
| 15 | Mintlify's deployment does not track docs `main`, so merging this wish changes nothing on docs.automagik.dev until the cutover wish. This migration fixes that gap: from now on every push to `main` deploys. Before the first merge Felipe confirms that Mintlify still does not deploy from `main`. | Owner context (genie-launch design Decision 10; `genie` `.genie/wishes/genie-launch/WISH.md` OUT). It explains why the live site still serves the pre-#89 pages on 2026-10-04 (`/genie/workflows` 404, `/genie/cli/agents` 200) although #89 merged on 2026-10-03. |
| 16 | The CI token holds Account: Workers Scripts: Edit only, with no zone scope. It lives in two places: as the `production` GitHub Environment's secret, restricted to `main`, and as a repository secret used only by the preview-publish and preview-cleanup jobs, which run no PR code. | The custom domain is attached by Felipe in the cutover wish, so CI never needs DNS or route permissions. The environment keeps the deploy token away from any branch but `main`. |
| 17 | Previews: the `build` job runs PR code with no secrets and uploads the built output as an artifact; a separate `preview-publish` job, with no checkout and no install, downloads it and runs `npx --yes wrangler@4.147.0 preview --name pr-<number> --json`; fork PRs get the build job only. Previews carry no gateway token, so their chat shows an error; chat is verified on the production Worker URL. There is no `wrangler versions upload --preview-alias` fallback. | PR code never runs next to the deploy token. Cloudflare previews do not inherit production settings or secrets, while a version upload of the production Worker would inherit its secrets, so that fallback is dropped. This also closes the "no Mintlify preview" gap. The chat behavior is owner decision C (2026-10-04). |
| 18 | holocron's footer attribution stays, set through `poweredBy` to `{ "name": "Holocron", "url": "https://holocron.so" }`. | holocron is MIT and asks to keep the link. Without `poweredBy` the default link is built from `holocronUrl()` and would point at the gateway (`footer.tsx:251-253`). A link is not a service in the chat path. |
| 19 | **Owner decisions at plan approval (Felipe, 2026-10-04, final; recorded through the question harness).** Hosting: Cloudflare Workers Paid ("Cloudflare Workers Paid (Recomendado)"); Vercel was considered and dropped because holocron has no Vercel target. A. Visitor IP: no per-IP rate limit for now, deferred by owner; trigger to revisit: abuse or the spend cap being hit. The gateway token gate, the hard daily spend cap with its reservation ledger, the input bounds (64 KB, no `system` role), `maxOutputTokens`, the step limit, `redirect: 'manual'` and the canonical-path guard stay. B. Retired-URL redirects: none ("não quero fazer redirect, consider this a fresh start; we will revamp the other product docs later"); only `/` goes to the Genie landing, as site navigation; retired pages answer 404. C. PR-preview chat: unchanged; previews carry no gateway token and their chat shows an error. D. mikro URLs: `rlmx/` moves to `mikro/` with no redirects; `/rlmx/*` answers 404. | Recorded as given; all five wishes are APPROVED on these terms. |
| 20 | `vite.config.ts` copies exactly `genie/images`, `genie/videos`, `captures/genie`, `logo` and `favicon.png` into the client build output, skipping any path containing `_internal`. | Vite serves only `public/`, so in the spike's production build every page image, video and capture transcript answered 404 while the strict build still passed (plan review probe). These are the five static roots the public pages reference (`/genie/videos/*.mp4`, `/captures/genie/*.capture.txt`, `/genie/images/**`, `/logo/*.svg`, `/favicon.png`); every file is under the 25 MiB Workers asset limit (largest video 6.2 MB). |
| 21 | Workers Paid is required and approved by Felipe (2026-10-04). Group 3 confirms the plan is active on the account before the first deploy. | holocron renders MDX on every request (SSR), which does not fit Workers Free's 10 ms CPU per request. |

## Simplicity Case

- **Simplest complete design:** holocron reads the existing Mintlify `docs.json` and MDX in place; the repository root becomes the Vite project; one Worker serves pages and static assets; one workflow file builds, previews and deploys.
- **Added machinery:** a 20-line copy step in `vite.config.ts` (Vite would otherwise drop the docs' own static folders); `scripts/verify-site.mjs` (dependency-free Node), because the strict build checks links and icons but not routing, served files or the `_internal` exclusion of the running Worker; the build-then-publish split in the workflow, because PR code must not run beside the deploy token.
- **Deferred until measured:** a dependency-update bot for holocron, Lighthouse in CI.
- **Complexity removed:** all of the spike's dev-only Vite middleware (the `/index` rewrite, the raw `_internal` guard, pet HTML injection, the RSC proxy host fix, the federation dev CSS route), `holocron deploy` and any holocron.so account, a `base` path, a staging subdomain, a second static-asset tree (no files moved into `public/`).

## Dependencies

**depends-on:** none
**blocks:** docs-holocron-brand, docs-holocron-products, docs-holocron-chat, docs-holocron-cutover

Docs PR #89 (`feat/genie-v6-launch`) merged into docs `main` on 2026-10-03 at 20:09 UTC as `1275fce`, and `feat/docs-holocron` was rebased onto it on 2026-10-04, so this wish starts from docs `main`. Felipe's preconditions for Group 3 are listed in that group; declining Workers Paid stops the plan. Program order: this wish, then `docs-holocron-brand`, `docs-holocron-products`, `docs-holocron-chat`, `docs-holocron-cutover`. The spike's source of truth is the frozen, read-only snapshot `/home/genie/.genie/state-backups/holo-spike-2026-10-04-frozen/`; this wish ports no file from it.

## Success Criteria

- [ ] `npm ci && npm run build` passes holocron's strict validation for all 41 public pages of Genie, Omni and mikro.
- [ ] Against the built Worker, every navigation page (the 2 hidden ones included) answers 200, and every root-relative image, video, poster and file link on those pages answers 200.
- [ ] No `_internal` page or file is reachable: its paths answer 404 and `/docs.zip` lists only navigation pages.
- [ ] Rendered HTML names holocron.so only in the powered-by link.
- [ ] PR code runs only in a job with no secrets; a same-repo PR gets one comment with a preview URL that answers 200; a push to `main` deploys Worker `automagik-docs` through the `production` environment and its `workers.dev` URL passes the verify script.
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
| 2 | engineer | medium: new toolchain, holocron config semantics, static-file copy, routing proof against a local Worker | inherit | holocron build of the whole site and the verify script |

### Wave 3 (sequential)

| Group | Agent | Complexity | Model | Description |
|-------|-------|------------|-------|-------------|
| 3 | engineer | medium: secret isolation across jobs, a new wrangler command, Felipe preconditions that can stop the plan | inherit | GitHub Actions build, artifact preview and deploy on `main` |

**Global constraints:**
- npm with the committed `package-lock.json`; CI build jobs and every validation run `npm ci`.
- Exact pins, no `^` or `~`: `@holocron.so/vite` 0.36.0, `vite` 8.3.2, `@cloudflare/vite-plugin` 1.62.5, `wrangler` 4.147.0, `react` 19.3.0, `react-dom` 19.3.0.
- Run wrangler as `npx wrangler` locally and as `npx --yes wrangler@4.147.0` in jobs that hold secrets; it is not installed globally.
- Local commands work on Linux and macOS; Windows is not a target. CI uses `ubuntu-latest` with `actions/setup-node` `node-version: 24`.
- Worker names: site `automagik-docs`, gateway `automagik-docs-chat`.
- Gateway origin: `https://automagik-docs-chat.<workers-subdomain>.workers.dev`, where `<workers-subdomain>` is the account's workers.dev subdomain read in Group 2 and recorded once, as `GATEWAY_ORIGIN` in `vite.config.ts`.
- Workers Paid is required and approved (Felipe, 2026-10-04).
- No secret in git, CI logs, command lines or repository files; secrets reach `wrangler secret put` on stdin from bws. No job that runs PR code holds a secret.
- `HOLOCRON_SKIP_BUILD_ERRORS` is never set.
- Outward or irreversible steps (pushes to `main`, DNS, secrets, production deploys, Mintlify settings, GitHub environments) go to Felipe through the question harness first.
- `_internal/**` never reaches the public site, `docs.zip`, `llms.txt`, `llms-full.txt`, the copied static files or the chat.
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

**Goal:** The repository root builds as one holocron site for Genie, Omni and mikro, passes strict validation, and serves every public URL and every file those pages reference from a local Worker.

**Deliverables:**
1. Precondition, read-only: find the account's workers.dev subdomain (`npx wrangler whoami` with the bws `CLOUDFLARE_API_TOKEN` in the environment, then `GET /accounts/<id>/workers/subdomain`). If none is registered, ask Felipe to register one before continuing.
2. `package.json`: private, `"type": "module"`, the exact pins above as dependencies or devDependencies; scripts `dev` (`vite`), `build` (`vite build`), `preview` (`vite preview`), `verify` (`node scripts/verify-site.mjs --serve`). `package-lock.json` generated by `npm install`.
3. `.gitignore`: `node_modules/`, `dist/`, `.wrangler/`, `.dev.vars*`, `.env*`, `.ui-check/` (screenshots the later wishes write).
4. `vite.config.ts`: `const GATEWAY_ORIGIN = 'https://automagik-docs-chat.<workers-subdomain>.workers.dev'`; `process.env.HOLOCRON_URL ??= GATEWAY_ORIGIN` before the config; plugins `holocron()`, then `cloudflare({ viteEnvironment: { name: 'rsc', childEnvironments: ['ssr'] } })`, then `copyDocStatics()`: a build-only plugin that, after the client environment is written, copies exactly `genie/images`, `genie/videos`, `captures/genie`, `logo` and `favicon.png` into the client output directory with `fs.cpSync`, keeping their paths and skipping any path containing `_internal`; `server.fs.deny` adds `'**/_internal/**'`.
5. `wrangler.jsonc`: `name` `automagik-docs`, `main` `spiceflow/cloudflare-entrypoint`, `compatibility_date` `2026-04-14`, `compatibility_flags` `["nodejs_compat", "global_fetch_strictly_public"]`, `workers_dev: true`, `observability: { "enabled": true }`. No `routes`, no `vars`, no secrets.
6. `docs.json`, keeping every existing Mintlify field: a group `{ "group": "Unlisted", "hidden": true, "pages": ["genie/hacks", "genie/security/key-rotation"] }` in the Genie product; mikro product icon `brain`; `assistant`: `{ "enabled": true, "display": "sidebar", "suggestions": ["How do I install Genie?", "How do I send a message with Omni?", "What does mikro do?"] }`; `poweredBy`: `{ "name": "Holocron", "url": "https://holocron.so" }`; `redirects`: only `{ "source": "/", "destination": "/genie", "permanent": false }` (decision 12).
7. `scripts/verify-site.mjs`, Node 22 or later, no dependencies. Usage `node scripts/verify-site.mjs <base-url> [flags]` or `--serve` (starts `npx vite preview --port 4173 --strictPort`, waits for `/genie`, runs the checks, stops the server). It exits 1 and prints one line per failure. Checks:
   - every page in `docs.json` navigation, hidden ones included, answers 200 at its href; no redirect or old URL is checked (decision 12);
   - on every one of those pages, every root-relative URL in a `src`, `poster` or `srcset` attribute, and every root-relative `href` whose last segment has a file extension, answers 200 (`/genie/videos/*.mp4`, `/captures/genie/*.capture.txt`, `/genie/images/**`, `/logo/*`, `/favicon.png` among them);
   - `/genie/_internal/observability/detectors`, the same path with `.md` and with `.mdx`, and `/genie/images/_internal/`, answer 404;
   - `/docs.zip` (entries listed with `unzip -Z1`) holds one entry per navigation page and none under `_internal`; `/llms.txt` and `/llms-full.txt` contain no `_internal`;
   - in the HTML of `/genie`, `/omni`, `/rlmx`, the only URL whose host is `holocron.so` is the powered-by link.

**Interfaces:**
- Consumes: Group 1's icon names.
- Produces: `npm run build` writes `dist/` (the client output carries the five copied static roots); Worker `automagik-docs`; `GATEWAY_ORIGIN` in `vite.config.ts`; `node scripts/verify-site.mjs <base-url> | --serve` with exit 0 or 1, which `docs-holocron-chat` extends with `--chat-guard` and `--gateway-smoke` and `docs-holocron-cutover` with `--full`; the `docs.json` keys later wishes own: `colors`, `appearance`, `fonts`, `logo`, `favicon` (brand), the `navigation` paths of mikro (cutover, owner decision D, no redirects), `$schema` (cutover).

**Acceptance Criteria:**
- [ ] `npm ci && npm run build` exits 0 and reports 0 broken links, 0 invalid redirects, 0 broken assets, 0 unresolved icons, 0 MDX errors.
- [ ] Deleting one navigation page file makes `npm run build` fail (witnessed once, then restored), so strict validation is live.
- [ ] `dist/client/genie/videos`, `dist/client/captures/genie`, `dist/client/genie/images`, `dist/client/logo` and `dist/client/favicon.png` exist, and no path under `dist/` contains `_internal`.
- [ ] `npx wrangler deploy --dry-run --outdir .wrangler/dry-run` exits 0.
- [ ] `npm run verify` exits 0.
- [ ] Every dependency in `package.json` is pinned exactly.

**Validation:**
```bash
npm ci
npm run build
for p in genie/videos captures/genie genie/images logo favicon.png; do test -e "dist/client/$p" || { echo "missing dist/client/$p"; exit 1; }; done
test -z "$(find dist -path '*_internal*' -print -quit)"
npx wrangler deploy --dry-run --outdir .wrangler/dry-run
npm run verify
! git grep -n HOLOCRON_SKIP_BUILD_ERRORS -- ':!.genie/'
node -e 'const p=require("./package.json");const d={...p.dependencies,...p.devDependencies};const bad=Object.entries(d).filter(([,v])=>/^[\^~]/.test(v));if(bad.length){console.error(bad);process.exit(1)}'
```

**depends-on:** Group 1

---

### Group 3: Deploy pipeline with artifact previews

**Goal:** Every PR is built with strict validation in a job with no secrets, every same-repo PR gets a preview published from that build, and every push to `main` deploys Worker `automagik-docs` through a protected environment.

**Deliverables:**
1. Felipe preconditions, asked through the question harness before the first run, in this order:
   - Workers Paid, approved by Felipe on 2026-10-04 (decision 21): confirm it is active on "Felipehowit@gmail.com's Account" before the first deploy;
   - a Cloudflare API token on that account with Account: Workers Scripts: Edit and no zone scope, stored in bws;
   - a GitHub Environment `production` in `automagik-dev/docs` whose deployment branches are limited to `main`, holding secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`; the same two as repository secrets for the preview jobs;
   - confirmation in the Mintlify dashboard that its deployment still does not track `main` (decision 15).
2. `.github/workflows/site.yml`, triggered on `pull_request` (opened, synchronize, reopened, closed) and `push` to `main`; `permissions: contents: read` at the top; one concurrency group per ref; third-party actions pinned by commit SHA:
   - `build` (not on `closed`; references no secret): checkout, setup-node 24 with npm cache, `npm ci`, `npm run build`, `npm run verify`, then upload `dist/` and `.wrangler/deploy/config.json` (the deploy config the Cloudflare plugin writes) as artifact `site-dist` with `actions/upload-artifact` and `include-hidden-files: true`, because the artifact must keep `.wrangler/deploy/config.json` and `dist/client/.assetsignore`, which the action drops by default (without them wrangler fails with "Could not detect a directory containing static files");
   - `preview-publish` (needs `build`; `pull_request`, not `closed`, and `github.event.pull_request.head.repo.full_name == github.repository`; `pull-requests: write`): no checkout and no install; download `site-dist`; `npx --yes wrangler@4.147.0 preview --name pr-${{ github.event.number }} --json`; read the preview URL from the JSON; `curl -fsS` it on `/genie`; create or update one PR comment that holds the URL;
   - `deploy` (needs `build`; push to `main` only; `environment: production`): download `site-dist`, `npx --yes wrangler@4.147.0 deploy` from it, then check out `main` and run `node scripts/verify-site.mjs https://automagik-docs.<workers-subdomain>.workers.dev`;
   - `preview-cleanup` (PR `closed`, same repo; no checkout): `npx --yes wrangler@4.147.0 preview delete --name pr-${{ github.event.number }}`;
   - the only secrets referenced are `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`, passed as environment variables to the three wrangler jobs.
3. Read `npx --yes wrangler@4.147.0 preview --help` first; if the command or its `--json` output differs from Cloudflare's Previews docs, use the shape the CLI documents and record it in the PR body. There is no other preview mechanism (decision 17).

**Interfaces:**
- Consumes: `npm run build`, `npm run verify`, `scripts/verify-site.mjs <base-url>`, Worker `automagik-docs`.
- Produces: `.github/workflows/site.yml` with jobs `build`, `preview-publish`, `deploy`, `preview-cleanup` and artifact `site-dist`. `docs-holocron-brand` adds a UI-check step to `build`; `docs-holocron-chat` adds a separate `.github/workflows/chat.yml` and does not edit this file; `docs-holocron-cutover` points the deploy check at the live domain.

**Acceptance Criteria:**
- [ ] Workers Paid is active on the account and recorded in Review Results before the first deploy.
- [ ] The `build` job references no secret; only `preview-publish`, `deploy` and `preview-cleanup` do, and none of them runs `npm ci`, `npm install` or a PR script.
- [ ] On this wish's PR, `build` and `preview-publish` succeed and the PR carries one comment with `https://pr-<n>-automagik-docs.<workers-subdomain>.workers.dev`, which answers 200 on `/genie`, `/omni`, `/rlmx`.
- [ ] After Felipe merges to `main`, `deploy` runs in environment `production`, succeeds, and its verify step passes against the workers.dev URL.
- [ ] After that merge, `curl -sI https://docs.automagik.dev/genie` still shows Mintlify headers (`x-mintlify-client-version`).

**Validation:**
```bash
f=.github/workflows/site.yml
test "$(grep -oE 'secrets\.[A-Z_]+' "$f" | sort -u | tr '\n' ' ')" = "secrets.CLOUDFLARE_ACCOUNT_ID secrets.CLOUDFLARE_API_TOKEN "
grep -q 'github.event.pull_request.head.repo.full_name == github.repository' "$f"
grep -q 'environment: production' "$f"
grep -q 'wrangler@4.147.0 preview' "$f"
grep -q 'include-hidden-files: true' "$f"
! grep -n 'versions upload' "$f"
! grep -nE 'uses: [^@]+@v?[0-9]+(\.[0-9]+)*$' "$f"
! grep -n HOLOCRON_SKIP_BUILD_ERRORS "$f"
node -e 'const t=require("fs").readFileSync(".github/workflows/site.yml","utf8");const jobs=t.split(/\n  (?=[a-z-]+:\n)/);const b=jobs.find(j=>/^build:/.test(j));if(!b||/secrets\./.test(b)){console.error("build job holds a secret");process.exit(1)}for(const j of jobs.filter(j=>/secrets\./.test(j)))if(/npm (ci|install|run)/.test(j)){console.error("secret job runs npm");process.exit(1)}'
pr=$(gh pr view --json number -q .number) && gh pr checks "$pr"
url=$(gh pr view "$pr" --json comments -q '[.comments[].body | capture("(?<u>https://pr-[0-9]+-automagik-docs\\.[a-z0-9-]+\\.workers\\.dev)").u] | last')
for p in genie omni rlmx; do curl -fsS -o /dev/null "$url/$p" || exit 1; done
```

**depends-on:** Group 2

---

## QA Criteria

_What must be verified on dev after merge. The QA agent tests each criterion._

- [ ] Functional: the workers.dev site shows Genie, Omni and mikro in the product switcher, every sidebar link opens its page, its images, videos and capture transcripts load, and the two unlisted pages open only by URL.
- [ ] Integration: a push to `main` redeploys `automagik-docs` within one workflow run, and a new PR gets a working preview URL.
- [ ] Regression: docs.automagik.dev keeps serving the current Mintlify deployment until `docs-holocron-cutover`.

---

## Assumptions / Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Mintlify starts deploying `main` with holocron files before cutover | Low | Its deployment does not track `main` (decision 15); Felipe confirms before the first merge; Group 3 checks Mintlify headers after the merge. |
| No workers.dev subdomain on the account (0 Workers today), so a non-interactive deploy fails | Medium | Group 2 reads it first; Felipe registers one if missing. |
| `wrangler preview` (new in 4.135.0) or its `--json` output differs from the docs | Medium | Read `--help` at the pinned version and follow it; no fallback that would inherit Worker secrets. |
| The deploy config the Cloudflare plugin writes moves, so the artifact misses it | Medium | Group 3 reads where 4.147.0 and plugin 1.62.5 write it during the first run and fixes the artifact paths; `npx wrangler deploy --dry-run` in Group 2 shows the same config. |
| Old links to retired pages or `/rlmx` break after cutover | Low | Owner decisions B and D: a fresh start; the other products' docs are revamped later. `/x/index` forms keep working through holocron's built-in 308 (decision 12). |
| A new page references a static root outside the five copied ones | Medium | The verify script checks every referenced file on every page, so the build of that PR fails until the root is added. |
| A holocron upgrade changes routing or redirects | Medium | Exact pins and lockfile; upgrades are separate PRs gated by the verify script. |
| The dev server answers 500 on the first request after a restart | Low | Dev only; every validation uses `vite preview` or a deployed URL. |

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
.github/workflows/site.yml                       (create)
```
