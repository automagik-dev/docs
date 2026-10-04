# Wish: docs.automagik.dev on holocron: product logos, logo link and share images

| Field | Value |
|-------|-------|
| **Status** | IN_PROGRESS |
| **Slug** | `docs-holocron-products` |
| **Date** | 2026-10-04 |
| **Author** | Felipe Rosa (plan drafted by Claude) |
| **Appetite** | small |
| **Branch** | `wish/docs-holocron-products` |
| **Repos touched** | `automagik-dev/docs` |
| **Design** | _No brainstorm — direct wish_ |

## Summary

Makes the header follow the active product: GENIE on Genie pages, OMNI on Omni, MIKRO on mikro, from first paint, with the logo link going to that product's landing page. The product switcher shows logos instead of names, AUTOMAGIK signs the footer, and every page gets working `og:image` and `twitter:image` tags. Third of five sibling wishes (`docs-holocron`, `docs-holocron-brand`, this one, `docs-holocron-chat`, `docs-holocron-cutover`), split out of the brand wish to keep both inside the insertion band.

## Scope

### IN

- A middleware in the custom entry (`src/server.tsx`) that, with Workers' `HTMLRewriter`, marks `<html data-product>`, adds the spike's small head script (logo-link routing) and rewrites both share-image tags.
- `components/product-brand.tsx`: the spike's client module that replaces holocron's product select with a logo menu and keeps the product, the header logo and the logo link in step after client navigation.
- The product block of the snapshot's `style.css`: logo swaps, AUTOMAGIK in the footer, invert cancel on every logo, switcher styles, three more canaries.
- The OMNI, MIKRO and AUTOMAGIK logo files from the frozen snapshot.
- `scripts/ui-check.mjs` groups `--meta` and `--products`, run in Chromium in CI and in Firefox and WebKit in this wish's validation.

### OUT

- The GENIE logo, theme, hero and pet (`docs-holocron-brand`).
- Moving mikro's pages from `/rlmx` to `/mikro` (owner decision D, 2026-10-04, `docs-holocron-cutover` Group 1, no redirects); this wish reads every path from `docs.json`, so it follows with no change.
- Per-page OG image rendering; every page shares its product's logo.
- Heroes for Omni or mikro.

## Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | The header logo follows the active product: GENIE on Genie pages, OMNI on Omni, MIKRO on mikro, and the logo link goes to that product's landing page. The product switcher shows each product's logo instead of its text name. The AUTOMAGIK logo has one site-level place, the footer. Every logo is white with a cyan and magenta offset for the dark background, and holocron's dark-mode invert is cancelled on all of them. | Owner requirements (Felipe, 2026-10-04). The logo link is one of them: he reported "when you click the logo it fallsback to genie". Source art: `genie-logo-light-png.png`, `omni-logo-light-png.png`, `mikro.png`, `automagik-logo-light-png.png` in the genie checkout's `.orca/drops/`, used as the spike's trimmed copies. |
| 2 | Mechanism is the spike's, from the frozen snapshot: `site/components/product-brand.ts` (sha256 prefix `9f720bda57765140`), lines 344 to 387 of `site/style.css` (`b4e829d3b742ad0d`), and `productScript` with its `products` derivation in `site/vite.config.ts` (`0df903c279bea79f`). In production the custom entry's middleware does what the spike's dev server did: for `text/html` responses, `HTMLRewriter` sets `data-product` on `<html>` and prepends the spike's head script to `<head>`. | holocron 0.36.0 has no per-product logo (`productSchema` takes a name, icon and href), and its switcher is a native `<select>` (`nav-select.tsx`), whose open list the OS draws and cannot show images. Marking `<html>` on the server shows the right logo on first paint; `<html>` carries `suppressHydrationWarning`, so the extra attribute does not trip hydration. The client module must run inside holocron's bundle to share `spiceflow/react`'s router, so it mounts from the same site-wide layout as the pet. |
| 3 | Products, slugs and landing pages come from `docs.json` the way the spike derives them: each product's first navigation page is its landing (`genie/index`, `omni/index`, `rlmx/index` today), its folder is its URL prefix, and its lowercased name is its slug (`genie`, `omni`, `mikro`). The logo link is routed to the landing before hydration by the head script's capture-phase click handler (through `window.__genieNavigate`, exposed by the client module, or a plain navigation before it loads) and after hydration by setting the link's `href` once React owns the node. | Owner requirement; the spike's fix, frozen. The landings answer holocron's built-in 308 to the folder URL, which this wish's logo-link check follows. Owner decision D (2026-10-04) moves mikro in `docs-holocron-cutover` Group 1; the landing then becomes `/mikro/index` with no code change. |
| 4 | Share images: the middleware rewrites the `content` of `meta[property="og:image"]` and `meta[name="twitter:image"]` to `<origin>/brand/<slug>-logo.png`, and removes duplicates so exactly one of each remains. | holocron builds both from `holocronUrl('/api/og…')`, which now points at the gateway origin and answers 404 (plan review probe, `page.html`). `seo.metatags` alone does not fix `twitter:image`. The product logo is a working image with no renderer. |
| 5 | Three more canaries, tagged like the brand wish's: `html[data-product="omni"] .slot-logo img`, `html[data-product="mikro"] .slot-logo img`, `div:has(> select[data-genie-logos])`, so the frozen `style.css` totals 27. | The plan review counted 27 hooks into holocron internals; these 3 live in the product block. |
| 6 | PR CI runs the new UI groups in Chromium through `--all`; this wish's validation also runs `--products` in Firefox and WebKit. | Only the logo swap (`content: url()` on an `<img>`) is engine-sensitive; checking it per engine once per change to it is enough. |
| 7 | Every ported or copied file is checked by sha256 prefix against the frozen snapshot `/home/genie/.genie/state-backups/holo-spike-2026-10-04-frozen/` in the group's validation. | The live spike kept changing during planning; the frozen snapshot is the source of truth. |
| 8 | **Owner decisions at plan approval (Felipe, 2026-10-04, final; recorded through the question harness).** Hosting: Cloudflare Workers Paid ("Cloudflare Workers Paid (Recomendado)"); Vercel was considered and dropped because holocron has no Vercel target. A. Visitor IP: no per-IP rate limit for now, deferred by owner; trigger to revisit: abuse or the spend cap being hit. The gateway token gate, the hard daily spend cap with its reservation ledger, the input bounds (64 KB, no `system` role), `maxOutputTokens`, the step limit, `redirect: 'manual'` and the canonical-path guard stay. B. Retired-URL redirects: none ("não quero fazer redirect, consider this a fresh start; we will revamp the other product docs later"); only `/` goes to the Genie landing, as site navigation; retired pages answer 404. C. PR previews: none ("Sem previews", 2026-10-04); PRs run only `build` and `verify` with no secrets, so the preview-chat question is moot. D. mikro URLs: `rlmx/` moves to `mikro/` with no redirects; `/rlmx/*` answers 404. | Recorded as given; all five wishes are APPROVED on these terms. None changes this wish's files. |

## Simplicity Case

- **Simplest complete design:** one middleware that edits three things in the streamed HTML (an attribute, one head script, two meta tags), one client module copied from the spike, one CSS block, three images.
- **Added machinery:** `HTMLRewriter` in the custom entry, the only way to mark `<html>` and fix head tags before first paint on Workers; it streams, so pages are not buffered.
- **Deferred until measured:** a per-page OG image renderer, Omni and mikro heroes, a logo-only header on mobile.
- **Complexity removed:** the spike's dev-server HTML injection and HMR block; any per-product configuration outside `docs.json`.

## Dependencies

**depends-on:** docs-holocron, docs-holocron-brand
**blocks:** docs-holocron-chat, docs-holocron-cutover

Starts after `docs-holocron-brand` merges, because it extends the `src/server.tsx`, `style.css` and `scripts/ui-check.mjs` that wish creates. Every source comes from the frozen snapshot `/home/genie/.genie/state-backups/holo-spike-2026-10-04-frozen/site/`; hashes recorded against it on 2026-10-04.

## Success Criteria

- [ ] The raw HTML of a Genie, an Omni and a mikro page carries `data-product` `genie`, `omni`, `mikro`, the head script, and exactly one `og:image` and one `twitter:image`, each answering 200 with an image.
- [ ] In Chromium, Firefox and WebKit, the header shows GENIE, OMNI or MIKRO from first paint and after client navigation, and the footer shows AUTOMAGIK; no logo is inverted.
- [ ] Clicking the header logo on a deep page of each product, before and after hydration, lands on that product's landing page.
- [ ] The product switcher shows the three logos, marks the active one, works with mouse and keyboard, and navigates without a full reload; holocron's text pill is hidden.
- [ ] All 27 canaries match; the strict build, `npm run verify` and `ui-check --all` pass; every ported file matches its snapshot hash.

## Execution Strategy

### Wave 1 (sequential)

| Group | Agent | Complexity | Model | Description |
|-------|-------|------------|-------|-------------|
| 1 | engineer | medium: streaming HTML rewrite in a Spiceflow middleware, pre-hydration script | inherit | Server-side product marking, logo-link script and share images |

### Wave 2 (sequential)

| Group | Agent | Complexity | Model | Description |
|-------|-------|------------|-------|-------------|
| 2 | engineer | medium: DOM replacement of a holocron control, cross-engine CSS, keyboard menu | inherit | Logo switcher, product logos and footer AUTOMAGIK |

**Global constraints:**
- npm with the committed `package-lock.json`; CI and every validation run `npm ci`.
- Exact pins, no `^` or `~`, as set by `docs-holocron` and `docs-holocron-brand`.
- Run wrangler as `npx wrangler`; it is not installed globally.
- Local commands work on Linux and macOS; Windows is not a target.
- Source of truth: `/home/genie/.genie/state-backups/holo-spike-2026-10-04-frozen/`, read-only; every ported file is hash-checked.
- The header logo and its link follow the active product (GENIE, OMNI, MIKRO); the product switcher shows logos instead of names; AUTOMAGIK signs the footer; no logo is ever inverted.
- Products, prefixes and landing pages are read from `docs.json`, never hard-coded.
- `HOLOCRON_SKIP_BUILD_ERRORS` is never set.
- No secret in git, CI logs, command lines or repository files.
- Outward or irreversible steps (pushes to `main`, DNS, secrets, production deploys) go to Felipe through the question harness first.
- New user-facing copy (`aria-label`s included): no hashtags, no dash punctuation, no "not X, it's Y" construction.
- A change that alters the generated deploy config (`wrangler.jsonc`, the Cloudflare Vite plugin, wrangler or the build entry) regenerates `scripts/expected-wrangler.json` with `node scripts/check-deploy-config.mjs . --write` in the same PR; the `build` job's drift check fails otherwise.
- "Wishes in, PRs out" and "context framework" are never headings.

## Execution Groups

### Group 1: Server-side product marking, logo-link script and share images

**Goal:** Every HTML response names its product on `<html>`, carries the logo-link script, and has one working `og:image` and one working `twitter:image`.

**Deliverables:**
1. `src/server.tsx`: `PRODUCTS`, derived at build from `import docs from '../docs.json'` exactly as the snapshot's `site/vite.config.ts` derives `products` (first navigation page as landing, its folder as prefix, lowercased name as slug); `productForPath(pathname)` with Genie as the default; a middleware registered before `.use(holocronApp)` that, when the response's `content-type` is `text/html`, returns `new HTMLRewriter()` with handlers that set `data-product` on `html`, prepend the snapshot's `productScript` (built from `PRODUCTS`) to `head`, set `content` on the first `meta[property="og:image"]` and `meta[name="twitter:image"]` to `<origin>/brand/<slug>-logo.png` and remove any further ones. Other responses pass through untouched.
2. `scripts/ui-check.mjs --meta` (also in `--all`): fetch the raw HTML of `/genie/quickstart`, `/omni/quickstart` and the first mikro page after its landing (from `docs.json`); assert `data-product` on `<html>`, one `window.__genieProductLandings` script, exactly one `og:image` and one `twitter:image` whose URLs answer 200 with `content-type: image/png`, and no meta URL on the gateway origin.

**Interfaces:**
- Consumes: `export const app` and the site-wide layout in `src/server.tsx` (`docs-holocron-brand`); `docs.json` `navigation.products`; `scripts/ui-check.mjs` groups and `--all`.
- Produces: `const PRODUCTS: ReadonlyArray<{ prefix: string; slug: string; landing: string }>`; `function productForPath(pathname: string): string`; the attribute contract `html[data-product]` with values from `PRODUCTS`; window globals `__genieProductLandings: Record<string, string>` (set by the head script) and `__genieNavigate(to: string): void` (set by Group 2); logo paths `/brand/<slug>-logo.png`.

**Acceptance Criteria:**
- [ ] `node scripts/ui-check.mjs --serve --meta` exits 0.
- [ ] RSC payloads and static files pass through byte-identical (no rewrite outside `text/html`).
- [ ] The strict build, `npm run verify` and `node scripts/ui-check.mjs --serve --all` still pass.

**Validation:**
```bash
export SNAP=/home/genie/.genie/state-backups/holo-spike-2026-10-04-frozen/site
node -e 'const c=require("crypto"),fs=require("fs"),S=process.env.SNAP;const h=b=>c.createHash("sha256").update(b).digest("hex").slice(0,16);if(h(fs.readFileSync(S+"/vite.config.ts"))!=="0df903c279bea79f"){console.error("snapshot vite.config.ts");process.exit(1)}'
npm ci
npm run build
npm run verify
npx playwright install chromium
node scripts/ui-check.mjs --serve --meta
node scripts/ui-check.mjs --serve --all
```

**depends-on:** none

---

### Group 2: Logo switcher, product logos and footer AUTOMAGIK

**Goal:** The header, switcher and footer show the right logos in every engine, and the logo link reaches each product's landing page.

**Deliverables:**
1. Assets copied from the snapshot's `site/public/brand/`, verified by sha256 prefix: `public/brand/omni-logo.png` (`b1c3d8c2872fe998`), `public/brand/mikro-logo.png` (`1bbcc571db9be606`), `public/brand/automagik-logo.png` (`56ea82b76b4be436`).
2. `style.css`: append lines 344 to 387 of the snapshot's `site/style.css`: the `html[data-product]` logo swaps, the footer AUTOMAGIK swap, the invert cancel on `.genie-switcher img`, the rule hiding the native pill once replaced, and the `.genie-switcher*` styles; tag the three holocron-internal selectors (decision 5).
3. `components/product-brand.tsx`: `'use client'`; `export function ProductBrand(): null`, which calls `mountProductBrand()` once per page lifetime (module-level guard) after window `load`; `export function mountProductBrand(): () => void`, the snapshot's `site/components/product-brand.ts` without its HMR block: the `MutationObserver` that enhances every `select[aria-label="Select section"]` (header and mobile menu) into a logo menu (button, listbox, Arrow keys, Enter, Space, Escape, outside click), keeps `html[data-product]`, the header logo's `alt` and the logo link's `href` in step with the URL once React has hydrated each node, and exposes `window.__genieNavigate` (spiceflow `router.push`).
4. `src/server.tsx`: the layout renders `<ProductBrand />` beside `<GeniePet />`.
5. `scripts/ui-check.mjs --products` (also in `--all`), runnable with `--engine chromium|firefox|webkit`: on `/genie/quickstart`, `/omni/quickstart` and a mikro page, element screenshots of `.slot-logo img` are pairwise different and the footer logo's differs from the Genie header's; computed `filter` is `none` on the header, footer and switcher logos; `select[aria-label="Select section"]` is hidden and `.genie-switcher` visible; the menu lists three options whose images have `alt` Genie, Omni and mikro, the active one with `aria-selected="true"`; choosing Omni from a Genie page by mouse, and mikro by keyboard (ArrowDown, Enter), changes the URL without a full reload and updates `data-product` and the header logo; one logo-link assertion per product: clicking the header logo on that product's deep page lands on its landing from `docs.json` (after the 308, the folder URL), once right after `domcontentloaded` and once after hydration; no console error or hydration warning.

**Interfaces:**
- Consumes: Group 1's `PRODUCTS`, `html[data-product]` and `__genieProductLandings`; `router` from `spiceflow/react`; the brand wish's canary format and `--engine` flag.
- Produces: `export function ProductBrand(): null`; `export function mountProductBrand(): () => void`; `window.__genieNavigate(to: string): void`; the `--products` group in `scripts/ui-check.mjs`.

**Acceptance Criteria:**
- [ ] `node scripts/ui-check.mjs --serve --products` exits 0 in Chromium, Firefox and WebKit; `--all` passes in Chromium with 27 canaries.
- [ ] The snapshot sources and the three copied logos match their hashes.
- [ ] If an engine does not apply `content: url()` to an `<img>` (the logo screenshots match), `mountProductBrand` also sets the header and footer logos' `src` after hydration and the check is rerun; this fallback is recorded in the PR body.

**Validation:**
```bash
export SNAP=/home/genie/.genie/state-backups/holo-spike-2026-10-04-frozen/site
node -e 'const c=require("crypto"),fs=require("fs"),S=process.env.SNAP;const h=b=>c.createHash("sha256").update(b).digest("hex").slice(0,16);const src={"components/product-brand.ts":"9f720bda57765140","style.css":"b4e829d3b742ad0d"};const cp={"public/brand/omni-logo.png":"b1c3d8c2872fe998","public/brand/mikro-logo.png":"1bbcc571db9be606","public/brand/automagik-logo.png":"56ea82b76b4be436"};let ok=true;for(const[f,w]of Object.entries({...src,...cp}))if(h(fs.readFileSync(S+"/"+f))!==w){console.error("snapshot",f);ok=false}for(const[f,w]of Object.entries(cp))if(h(fs.readFileSync(f))!==w){console.error("repo",f);ok=false}process.exit(ok?0:1)'
test "$(grep -c 'holocron-internal:' style.css)" -ge 27
npm ci
npm run build
npm run verify
npx playwright install chromium firefox webkit
node scripts/ui-check.mjs --serve --all
node scripts/ui-check.mjs --serve --products --engine firefox
node scripts/ui-check.mjs --serve --products --engine webkit
```

**depends-on:** Group 1

---

## QA Criteria

_What must be verified on dev after merge. The QA agent tests each criterion._

- [ ] Functional: on the workers.dev site, each product's pages show its logo, the switcher shows logos, the logo link goes to the product's landing, and the footer shows AUTOMAGIK.
- [ ] Integration: sharing a page link in a chat app that reads Open Graph shows the product's logo.
- [ ] Regression: the pet, hero, theme canaries and every public page still pass `ui-check --all` and `npm run verify`.

---

## Assumptions / Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Spiceflow middleware cannot return a transformed response | Medium | Group 1's first check reads raw HTML; fallback is the same `HTMLRewriter` call wrapping `app.handle` in `export default { fetch }`, which is plain Workers code. |
| An engine ignores `content: url()` on `<img>` | Medium | Firefox and WebKit run in Group 2's validation; fallback sets `src` after hydration. |
| A holocron upgrade changes the `Select section` select, the logo markup or the meta tags | Medium | Exact pin; canaries and the `--meta` and `--products` groups fail loudly. |
| The head script runs before `__genieNavigate` exists | Low | It falls back to a plain navigation, as in the spike; the pre-hydration click is one of the asserted cases. |
| A product is added to `docs.json` without a logo file | Low | `--meta` fails on the 404 image; adding the logo is part of adding a product. |

---

## Plan Deviations

_Recorded by the engineer on 2026-10-04; the coordinator ruled on item 3._

1. **Logo files moved into Group 1.** Group 1's validation runs `ui-check --meta`, which fetches `/brand/omni-logo.png` and `/brand/mikro-logo.png`, but Deliverable 1 of Group 2 copies them. Both files (hash-checked against the snapshot) land in Group 1's commit; `automagik-logo.png` stays in Group 2.
2. **The logo link routes to the folder URL after hydration (Decision 3).** `router.push('/omni/index')` goes through holocron's 308 as a client navigation and leaves `/omni?__rsc=` in the address bar. `window.__genieNavigate` strips a trailing `/index` before `router.push`; the landings, the head script and the link's `href` keep the `docs.json` form, and a full load still follows the 308. `--products` asserts a clean folder URL before and after hydration.
3. **WebKit console errors from upstream holocron.** `ui-check --products --engine webkit` failed on console errors that holocron 0.36.0's own markup raises in WebKit only, on every page and already in a brand-only run: `<svg width/height="var(--sidebar-icon-size)">` from the side nav, and `<link rel="preload" as="stylesheet">`. Every products assertion passed. **Ruling (coordinator, 2026-10-04):** a narrow allowlist. `UPSTREAM_CONSOLE_ERRORS` in `scripts/ui-check.mjs` names the three exact message texts and skips only those when console errors are counted; every other console error still fails, and every brand, canary, pet and products assertion runs in WebKit unchanged. On a copy with one unrelated `console.error` injected, the WebKit run still failed with 17 failures, every one of them that error.
4. **Cross-engine runs needed a container and two harness fixes.** `npx playwright install chromium firefox webkit` fails host validation on the Ubuntu 26.04 build host (WebKit's system libraries are missing), so Group 2's block runs verbatim in `mcr.microsoft.com/playwright:v1.63.0-noble`, with the host's `unzip` mounted for `npm run verify`. The brand group's checks also needed two fixes outside Chromium: `networkidle` never arrives in Firefox on a page with a `<video>` (Firefox holds the media request open), so `openPage` waits for load and then a 500 ms quiet window over every request except media; and WebKit serializes `font-family` names without quotes, so the code-font check accepts both forms, as the body-font check already did.

Also noted: Decision 5 expected 27 canaries in total; the brand branch shipped 28 tags, so the total is 31 and the `-ge 27` gate passes.

---

## Review Results

_The read-only reviewer returns evidence; the invoking orchestrator appends a timestamped block here after plan, execution, and PR reviews._

---

## Files to Create/Modify

```
src/server.tsx                       (modify: middleware, PRODUCTS, ProductBrand in layout)
scripts/ui-check.mjs                 (modify: --meta, --products)
components/product-brand.tsx         (create)
style.css                            (modify: product block)
public/brand/omni-logo.png           (create, binary)
public/brand/mikro-logo.png          (create, binary)
public/brand/automagik-logo.png      (create, binary)
```
