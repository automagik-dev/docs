# Wish: docs.automagik.dev on holocron: Automagik brand, lamp hero and pet

| Field | Value |
|-------|-------|
| **Status** | DRAFT |
| **Slug** | `docs-holocron-brand` |
| **Date** | 2026-10-04 |
| **Author** | Felipe Rosa (plan drafted by Claude) |
| **Appetite** | medium |
| **Branch** | `wish/docs-holocron-brand` |
| **Repos touched** | `automagik-dev/docs` |
| **Design** | _No brainstorm — direct wish_ |

## Summary

Applies the launch-video design system to the holocron site: neon design B tokens, Geist and JetBrains Mono, the real logo with holocron's dark-mode invert cancelled, the lamp play (film scene 3) as the Genie introduction hero, the sprite pet on every page, whose click opens the AI chat, and a header logo that follows the active product (GENIE, OMNI, MIKRO) with a logo product switcher and the AUTOMAGIK logo in the footer. Second of four sibling wishes (`docs-holocron`, this one, `docs-holocron-chat`, `docs-holocron-cutover`). The production pet and product logos use holocron's documented custom-entry seam instead of the spike's dev-server HTML injection.

## Scope

### IN

- `style.css` at the repository root (holocron loads it automatically, `vite-plugin.ts:545`): tokens and component rules ported from the spike, each rule that targets holocron internals tagged and covered by a canary.
- Brand fields in `docs.json`: colors, strict dark appearance, fonts, logo, favicon, a static `og:image`.
- Brand, font, hero and pet assets copied byte for byte from the spike archive `/home/genie/.genie/state-backups/holo-spike-2026-10-04/site/public/`; the three new product logos from the live spike (Group 3).
- A custom entry `src/server.tsx` that mounts holocron and one site-wide client component, `components/genie-pet.tsx`.
- `components/lamp-hero.tsx` at the top of `genie/index.mdx`.
- Product logos: the header logo follows the active product, the product switcher shows each product's logo instead of its name, and the AUTOMAGIK logo signs the footer, with holocron's dark-mode invert cancelled on every logo.
- `scripts/ui-check.mjs` (Playwright): computed-style checks, CSS canaries, pet, hero and product-logo behavior; run in CI.

### OUT

- Chat answers: the gateway, limits and spend cap (`docs-holocron-chat`). Here the pet only has to open and close holocron's chat drawer.
- Heroes for Omni or mikro; any new art; any edit to a sprite cell or the face.
- Light mode (the site is strict dark).
- A holocron upgrade.
- An OG image generator.

## Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | Design follows the Automagik design system as in the launch videos: neon design B `#0B0B12` / `#E8E6F0` / `#FF3FF5` / `#5EF2FF` / `#2A2438`; fonts Geist and JetBrains Mono; the real logo (triskele plus GENIE wordmark, never the mascot face) with the dark-mode invert cancelled; the lamp play (film scene 3) as the Genie introduction hero; the sprite pet as a site-wide companion; clicking the pet opens the AI chat; the mascot's eyes are always closed. | Owner decision (Felipe, 2026-10-03/04, final). |
| 2 | The production pet is mounted through holocron's custom entry: `holocron({ entry: './src/server.tsx' })`, where `src/server.tsx` mounts `holocronApp` and then registers `.layout('/*', …)` rendering one `'use client'` `<GeniePet />`. `GeniePet` renders `null` and, in an effect, mounts the spike's plain-DOM pet on `document.body` once per page lifetime. | The custom entry is holocron's documented extension point (`website/src/pages/docs/custom-entry.mdx`) and the one holocron's own Workers site uses. Because `GeniePet` renders nothing and attaches to `body`, its place in the layout tree does not matter, and a module-level guard keeps one pet even if the layout remounts. Rejected: rewriting HTML in middleware (a separately bundled script cannot share holocron's chat store), an import in every MDX page (41 edits, and every new page must remember it), a Vite transform of holocron's source (patches internals). |
| 3 | The pet reaches the chat through `useChatWidget()` (`isOpen`, `isGenerating`, `messages`, `open`, `close`, `toggle`), imported from `@holocron.so/vite/src/chat/use-chat-widget.ts`. | It is the hook holocron documents for controlling its chat. holocron's app is built from `src/` (`vite-plugin.ts:471` aliases `@holocron.so/vite/app` to source), so only a `src/` import shares the app's store; the `./chat` export resolves to `dist/` and would bind a second, unrelated store. `./src/*` is an exported subpath of the package. This replaces the spike's direct `chat-store.ts` import. |
| 4 | One logo image for light and dark, with the invert cancelled in CSS: `.slot-logo img`, `img[src$="/brand/genie-logo.png"]` and, from Group 3, `.genie-switcher img` get `filter: none`, `mix-blend-mode: normal`, `opacity: 1`. | With `light === dark` holocron's `<Logo>` takes its single-image branch and adds Tailwind's `dark:invert`, which turns cyan red and magenta green. The spike proved the cancel; the UI check asserts the computed `filter` is `none`. |
| 5 | Fonts are the video renderer's exact files, Latin subset only: `geist-latin.woff2` and `jetbrains-mono-latin.woff2`. | Same glyphs as the videos. The docs are English, and Latin-1 also covers Portuguese accents, so the two `latin-ext` files the spike carried are dropped. |
| 6 | The lamp hero (`lamp-hero.tsx`, the spike's canvas port of `render-src/film.html` scene 3, every frame a pure function of film time) replaces the video at the top of `genie/index.mdx`. It plays once, hands the Genie to the pet with a `genie:handoff` event, replays on click, and shows only the settled frame under reduced motion. | Owner decision 1; proven in the spike. |
| 7 | Eyes closed is guaranteed by provenance: only the approved render bundle's art is used (spritesheet cells, `face.png`, `lamp.png`, the logo crops), nothing is drawn or edited, and every asset is byte-identical to the spike's copy (hashes in Groups 1, 2 and 3). Felipe signs off screenshots in `docs-holocron-cutover`. | Eyes cannot be asserted by a script; byte identity plus a human look can. |
| 8 | Each CSS rule that targets holocron internals carries a `/* holocron-internal: <id> */` tag and a canary in `scripts/ui-check.mjs`: its selector must match at least one element on its fixture page. | About 10 rules hook inline-style attribute selectors, `.slot-*` classes, `figure[class~="group/code"]` and `.holocron-chat-drawer-*`. With `@holocron.so/vite` pinned at 0.36.0 they hold; on an upgrade a renamed hook fails CI instead of silently unstyling the site. |
| 9 | `components/pet/animation.json` is stored minified, equal after parsing to the spike's file. | It is 781 lines of data; minified it is one line (7,873 bytes) and keeps this wish within the insertion band. |
| 10 | The pet sets its spritesheet (1.8 MB) as a background only after the window `load` event. | It never competes with first paint; the browser caches it across pages. |
| 11 | The header logo follows the active product: GENIE on Genie pages, OMNI on Omni, MIKRO on mikro. The product switcher shows each product's logo instead of its text name. The AUTOMAGIK logo has one site-level place, the footer. Every logo is white with a cyan and magenta offset for the dark background, and holocron's dark-mode invert is cancelled on all of them. | Owner requirement (Felipe, 2026-10-04). Source art: `genie-logo-light-png.png`, `omni-logo-light-png.png`, `mikro.png`, `automagik-logo-light-png.png` in the genie checkout's `.orca/drops/`, used as the spike's trimmed copies. |
| 12 | Product logos use the spike's mechanism (`/var/tmp/sofia-agents/claude-1001/-home-genie-workspace-repos-genie/065fdfff-9583-40b0-98b4-321e16c72e82/scratchpad/holo-spike/site/components/product-brand.ts`, its `style.css` product block and the `productScript` in its `vite.config.ts`), delivered through the custom entry in production. `<html data-product>` is set from the URL prefix before first paint, and CSS swaps the logo from it: `html[data-product="omni"] .slot-logo img { content: url(/brand/omni-logo.png) }`, the same for mikro, Genie as the default. The footer logo is swapped to AUTOMAGIK the same way. A client module keeps `data-product` in step after client navigation and replaces holocron's `select[aria-label="Select section"]` with a logo menu that navigates with spiceflow's `router.push`, reading products, labels and hrefs from the native select's options. In production, the custom entry's middleware sets `data-product` on `<html>` with Workers' `HTMLRewriter` for `text/html` responses, from prefixes derived from `docs.json` (each product's first page folder: `/genie`, `/omni`, `/rlmx`); this replaces the spike's dev-server inline script. | holocron 0.36.0 has no per-product logo (`productSchema` takes a name, icon and href), and its switcher is a native `<select>` (`nav-select.tsx`), whose open list the OS draws and cannot show images. Setting the attribute on the server gives the right logo on first paint with no inline script; `<html>` carries `suppressHydrationWarning`, so the extra attribute does not trip hydration. The client module must run inside holocron's bundle to share `spiceflow/react`'s router, so it mounts from the same site-wide layout as the pet. |
| 13 | **Needs Felipe's approval at plan approval (one pass for all four wishes).** A. Visitor IP (`docs-holocron-chat` decision 5): rate-limited in the site Worker, never forwarded; the gateway accepts only the site's token. B. Retired-URL redirect targets (`docs-holocron` decision 12): `/genie/architecture/:page`, `/genie/concepts/:page`, `/genie/observability/:page`, `/genie/contributing`, `/genie/features`, `/genie/onboarding` to `/genie`; `/genie/cli/:page` to `/genie/cli-reference`; `/genie/config/:page` to `/genie/installation`; `/genie/security/distribution-sovereignty` and `/genie/security/verifying-installs` to `/genie/security`; 12 retired skill pages (`brain`, `docs`, `dream`, `genie`, `genie-hacks`, `learn`, `loop-overview`, `pm`, `refine`, `report`, `trace`, `wizard`) to `/genie/skills`. C. PR-preview chat (`docs-holocron` decision 17): previews carry no gateway token, so their chat shows an error. | Each changes user-visible behavior or the brief, so Felipe decides it at approval; until then they are proposals. None changes this wish's files. |

## Simplicity Case

- **Simplest complete design:** one stylesheet, one custom entry with one middleware and one layout, two client components that render nothing and mount the spike's DOM pet and product switcher, one canvas hero imported by one page.
- **Added machinery:** the custom entry (holocron has no other site-wide client hook; spike finding), an `HTMLRewriter` middleware (the only way to mark the product on `<html>` before first paint in production), and `scripts/ui-check.mjs` with Playwright (the CSS hooks are fragile across holocron versions, and pet and switcher behavior can only be proven in a browser).
- **Deferred until measured:** committed screenshot baselines with pixel diffs (screenshots are produced for Felipe's sign-off in the cutover wish instead), heroes for Omni and mikro, a smaller spritesheet, a header logo link that points at the active product's home (it keeps `logo.href` `/genie`).
- **Complexity removed:** the spike's dev-only HTML injection, its inline `data-product` script and its HMR wiring, the `latin-ext` font files, the separate `neutral.png` (the neutral pose is a spritesheet cell), the direct `chat-store` import.

## Dependencies

**depends-on:** docs-holocron
**blocks:** docs-holocron-chat, docs-holocron-cutover

Starts after `docs-holocron` merges to `main`; branch `wish/docs-holocron-brand` is cut from `origin/main`. Sources for Groups 1 and 2 come from the spike archive `/home/genie/.genie/state-backups/holo-spike-2026-10-04/site/` (no `node_modules`, no upstream clone); every hash below was verified against it on 2026-10-04. Group 3's sources (`components/product-brand.ts`, the product block of `style.css`, the `productScript` in `vite.config.ts`, `public/brand/{omni,mikro,automagik}-logo.png`) landed in the live spike `/var/tmp/sofia-agents/claude-1001/-home-genie-workspace-repos-genie/065fdfff-9583-40b0-98b4-321e16c72e82/scratchpad/holo-spike/site/` after the archive was taken; their hashes are recorded in Group 3, and the archive should be refreshed with them before execution. The original art is under the genie checkout's untracked `.orca/drops/` and `.genie/brainstorms/genie-launch/`.

## Success Criteria

- [ ] Every public page renders on `#0B0B12` with `#E8E6F0` body text, `#FF3FF5` as primary, Geist for prose and JetBrains Mono for code.
- [ ] Header and footer show `genie-logo.png` with computed `filter: none`; no page shows the mascot face as a logo.
- [ ] `/genie` opens with the lamp hero, and the pet appears through the hand-off (or after the 6 s timeout); under reduced motion the hero shows its settled frame and the pet its neutral pose.
- [ ] Every public page of Genie, Omni and mikro shows exactly one pet, also after client-side navigation; clicking it, or pressing Enter on it, opens holocron's chat drawer, and doing it again closes the drawer.
- [ ] No console error or hydration warning on two pages per product; each page's HTML has exactly one `<html`.
- [ ] Genie, Omni and mikro pages show the GENIE, OMNI and MIKRO header logo from first paint (server HTML carries `data-product`), also after client navigation, in Chromium, Firefox and WebKit; the footer shows AUTOMAGIK; no logo is inverted.
- [ ] The product switcher shows the three product logos, marks the active one, works with mouse and keyboard, and navigates without a full reload; holocron's text pill is hidden.
- [ ] Every CSS canary matches on holocron 0.36.0; the strict build and `npm run verify` still pass.

## Execution Strategy

### Wave 1 (sequential)

| Group | Agent | Complexity | Model | Description |
|-------|-------|------------|-------|-------------|
| 1 | engineer | medium: fragile CSS hooks, Playwright canary, binary assets | inherit | Theme, logo and fonts with a CSS canary in CI |

### Wave 2 (sequential)

| Group | Agent | Complexity | Model | Description |
|-------|-------|------------|-------|-------------|
| 2 | engineer | high: custom entry layout composition, client hydration, chat-store identity | inherit | Custom entry, lamp hero and site-wide pet with click-to-chat |

### Wave 3 (sequential)

| Group | Agent | Complexity | Model | Description |
|-------|-------|------------|-------|-------------|
| 3 | engineer | medium: HTMLRewriter middleware, DOM replacement of a holocron control, cross-engine CSS | inherit | Product logos in the header, switcher and footer |

**Global constraints:**
- npm with the committed `package-lock.json`; CI and every validation run `npm ci`.
- Exact pins, no `^` or `~`: `@holocron.so/vite` 0.36.0, `vite` 8.3.2, `@cloudflare/vite-plugin` 1.62.5, `wrangler` 4.147.0, `react` 19.3.0, `react-dom` 19.3.0; `playwright` pinned exactly when added.
- Run wrangler as `npx wrangler`; it is not installed globally.
- Local commands work on Linux and macOS; Windows is not a target.
- Brand tokens: `#0B0B12` surface, `#E8E6F0` text, `#FF3FF5` magenta, `#5EF2FF` cyan, `#2A2438` border.
- Fonts: Geist and JetBrains Mono.
- The logo is the triskele plus the GENIE wordmark, never the mascot face; the dark-mode invert is cancelled.
- The mascot's eyes are always closed; no sprite cell or face is drawn or edited.
- Clicking the pet opens the AI chat.
- The header logo follows the active product (GENIE, OMNI, MIKRO); the product switcher shows logos instead of names; AUTOMAGIK signs the footer; no logo is ever inverted.
- `HOLOCRON_SKIP_BUILD_ERRORS` is never set.
- No secret in git, CI logs, command lines or repository files.
- Outward or irreversible steps (pushes to `main`, DNS, secrets, production deploys) go to Felipe through the question harness first.
- New user-facing copy: no hashtags, no dash punctuation, no "not X, it's Y" construction.
- "Wishes in, PRs out" and "context framework" are never headings.

## Execution Groups

### Group 1: Theme, logo and fonts

**Goal:** Every page wears neon design B with Geist, JetBrains Mono and the real logo, and CI fails if a holocron upgrade breaks a CSS hook.

**Deliverables:**
1. `style.css`: the archived spike's `site/style.css` (342 lines, sha256 prefix `1514b3c349e67988`) without the two `latin-ext` `@font-face` blocks. It keeps the tokens, headings, links, inline code, terminal code blocks, steps, callouts, frames, cards, tables, sidebar, header pill, skill-page slash, logo cancel, the `.genie-hero*` and `.genie-pet*` rules, and the chat drawer rules. Every holocron-internal selector carries `/* holocron-internal: <id> */`.
2. `docs.json`: `colors` primary, light and dark `#FF3FF5`; `appearance` `{ "default": "dark", "strict": true }`; `fonts` `{ "family": "Geist", "source": "/fonts/geist-latin.woff2", "format": "woff2" }`; `logo` `{ "light": "/brand/genie-logo.png", "dark": "/brand/genie-logo.png", "href": "/genie" }`; `favicon` `/brand/genie-favicon.png`; `seo.metatags["og:image"]` `/brand/genie-logo.png`.
3. Assets copied from `/home/genie/.genie/state-backups/holo-spike-2026-10-04/site/public/`, verified by sha256 prefix: `public/brand/genie-logo.png` (`af3c8fffffa8ff6d`), `public/brand/genie-favicon.png` (`4f998b69b81f2f96`), `public/fonts/geist-latin.woff2` (`19f9c92546aa300c`), `public/fonts/jetbrains-mono-latin.woff2` (`83c005d49d8a6a50`).
4. `package.json` and `package-lock.json`: devDependency `playwright`, exact version, with Chromium, Firefox and WebKit used by the UI check.
5. `scripts/ui-check.mjs`: `node scripts/ui-check.mjs <base-url> | --serve [--pet]`, starting `vite preview` like the verify script. It launches Chromium at 1440x900 and checks on `/genie`, `/omni`, `/rlmx`: computed `background-color` of `body` is `rgb(11, 11, 18)`; body text `rgb(232, 230, 240)`; body `font-family` starts with `Geist`; `pre code` `font-family` starts with `"JetBrains Mono"`; `--primary` resolves to `#FF3FF5`; the logo image has computed `filter: none`; each tagged canary selector matches at least one element on its fixture page; no console error. It saves screenshots to `.ui-check/` (gitignored) and exits 1 with one line per failure.
6. `.github/workflows/site.yml`: in job `build`, after `npm run verify`, run `npx playwright install --with-deps chromium firefox webkit` and `node scripts/ui-check.mjs --serve --pet --products` (the flags Groups 2 and 3 add; until they land, `--serve` alone).

**Interfaces:**
- Consumes: from `docs-holocron`, `npm run build`, `npm run verify`, `scripts/verify-site.mjs`, `.github/workflows/site.yml` job `build`, the `docs.json` brand keys.
- Produces: CSS classes Group 2 renders: `.genie-pet`, `.genie-pet.is-visible`, `.genie-pet__sprite`, `.genie-hero`, `.genie-hero__canvas`; custom properties `--gx-*`; `scripts/ui-check.mjs` with `--serve` and `<base-url>`, which Group 2 extends with `--pet` and Group 3 with `--products`. `.ui-check/` is already gitignored by `docs-holocron`.

**Acceptance Criteria:**
- [ ] `node scripts/ui-check.mjs --serve` exits 0 on holocron 0.36.0.
- [ ] Renaming one canary selector in a scratch copy of `style.css` makes the UI check fail (witnessed once, then restored).
- [ ] The four assets match their hash prefixes.
- [ ] The CI `build` job runs the UI check and passes on this wish's PR.

**Validation:**
```bash
npm ci
npm run build
npm run verify
npx playwright install chromium
node scripts/ui-check.mjs --serve
node -e 'const c=require("crypto"),fs=require("fs");const want={"public/brand/genie-logo.png":"af3c8fffffa8ff6d","public/brand/genie-favicon.png":"4f998b69b81f2f96","public/fonts/geist-latin.woff2":"19f9c92546aa300c","public/fonts/jetbrains-mono-latin.woff2":"83c005d49d8a6a50"};let ok=true;for(const[f,h]of Object.entries(want)){const g=c.createHash("sha256").update(fs.readFileSync(f)).digest("hex").slice(0,16);if(g!==h){console.error(f,g);ok=false}}process.exit(ok?0:1)'
```

**depends-on:** none

---

### Group 2: Custom entry, lamp hero and site-wide pet

**Goal:** The production build shows the lamp hero on `/genie` and one pet on every page, and clicking the pet opens holocron's chat drawer.

**Deliverables:**
1. `vite.config.ts`: `holocron({ entry: './src/server.tsx' })`; nothing else changes.
2. `src/server.tsx`: `export const app = new Spiceflow().use(holocronApp).layout('/*', ({ children }) => <>{children}<GeniePet /></>)` and `export default { fetch: (request: Request) => app.handle(request) }`, matching holocron's own custom-entry fixture (`integration-tests/fixtures/custom-entry/server.tsx`). `wrangler.jsonc` keeps `main` `spiceflow/cloudflare-entrypoint`, as holocron's own site does with `entry`; confirm the entrypoint picks up the custom app in the built Worker.
3. `components/genie-pet.tsx`: `'use client'`; `export function GeniePet(): null`, which builds a `ChatPort` from `useChatWidget()` with refs and calls `mountPet(port)` once per page lifetime (a module-level guard); `export function mountPet(chat: ChatPort): () => void` is the archived spike's `site/components/genie-pet.ts` `mount()` (sha256 prefix `796564c3e03778b9`) (sprite player with exact `durationMs`, 16 look directions, wave once per session, hero hand-off, run on navigation, docking beside the open drawer, reduced motion, role `button`, `aria-label` "Ask Genie", Enter and Space) with every `chatStore` use replaced by the port. The spritesheet background is set after window `load`.
4. `components/lamp-hero.tsx`: the archived spike's `site/components/lamp-hero.tsx` (sha256 prefix `2b5053f79700582a`); it imports only React.
5. `components/pet/animation.json`: minified, equal after parsing to the archived spike's `site/components/pet/animation.json` (`sha256` of `JSON.stringify(JSON.parse(text))` starts `ea20b7c43cda5bfd`).
6. Assets copied from `/home/genie/.genie/state-backups/holo-spike-2026-10-04/site/public/`, verified by sha256 prefix: `public/genie-hero/lamp.png` (`af66b73273569de5`), `public/genie-hero/face.png` (`89c995e76fc55f3e`), `public/genie-hero/face-points.json` (`30104120432dff19`), `public/pet/spritesheet.webp` (`431aa00ad989e502`).
7. `genie/index.mdx`: replace the `<video …/>` block with `import { LampHero } from '../components/lamp-hero'` and `<LampHero />`, as in the spike; nothing else on the page changes.
8. `scripts/ui-check.mjs --pet`, on two pages per product: exactly one `.genie-pet.is-visible` within 8 s; after clicking a sidebar link, still exactly one; a click sets `aria-expanded="true"` and shows `.holocron-chat-drawer-panel`, and a second click closes it; Enter on the focused pet toggles too; on `/genie`, `[data-genie-hero]` exists and the pet becomes visible; with `reducedMotion: 'reduce'` the pet's `data-clip` is `neutral`; the HTML holds exactly one `<html`; no console error and no hydration warning.

**Interfaces:**
- Consumes: Group 1's CSS classes and `scripts/ui-check.mjs`; `useChatWidget` from `@holocron.so/vite/src/chat/use-chat-widget.ts` returning `{ isOpen: boolean; isGenerating: boolean; messages: ChatMessage[]; open(): void; close(): void; toggle(): void }`; `app` from `@holocron.so/vite/app`; `Spiceflow` from `spiceflow`.
- Produces: `type ChatPort = { isOpen(): boolean; toggle(): void; onChange(listener: (s: { open: boolean; generating: boolean; failed: boolean }) => void): () => void }`; `export function mountPet(chat: ChatPort): () => void`; `export function GeniePet(): null`; `export const app` in `src/server.tsx`, to which Group 3 adds a middleware and a second layout child, and `docs-holocron-chat` adds `.use(chatGuard)` before `.use(holocronApp)`; the window event `genie:handoff` with detail `{ x: number; y: number; size: number }` from `LampHero`.

**Acceptance Criteria:**
- [ ] `node scripts/ui-check.mjs --serve --pet` exits 0.
- [ ] Group 1's checks, the strict build and `npm run verify` still pass.
- [ ] The four assets and `animation.json` match their hashes.
- [ ] If the layout composition fails on 0.36.0 (two `<html>` elements, a hydration error, or a route without the pet), the executor stops and reports; the fallback, an import on every public page, is a separate wish.

**Validation:**
```bash
npm ci
npm run build
npm run verify
npx playwright install chromium
node scripts/ui-check.mjs --serve
node scripts/ui-check.mjs --serve --pet
node -e 'const c=require("crypto"),fs=require("fs");const h=(b)=>c.createHash("sha256").update(b).digest("hex").slice(0,16);const want={"public/genie-hero/lamp.png":"af66b73273569de5","public/genie-hero/face.png":"89c995e76fc55f3e","public/genie-hero/face-points.json":"30104120432dff19","public/pet/spritesheet.webp":"431aa00ad989e502"};let ok=true;for(const[f,w]of Object.entries(want)){if(h(fs.readFileSync(f))!==w){console.error(f);ok=false}}if(h(JSON.stringify(JSON.parse(fs.readFileSync("components/pet/animation.json","utf8"))))!=="ea20b7c43cda5bfd"){console.error("animation.json");ok=false}process.exit(ok?0:1)'
```

**depends-on:** Group 1

---

### Group 3: Product logos in the header, switcher and footer

**Goal:** Each product's pages carry that product's logo from first paint, the switcher shows logos, and AUTOMAGIK signs the footer, with no logo inverted.

**Deliverables:**
1. Assets, the spike's trimmed copies of the drops, verified by sha256 prefix: `public/brand/omni-logo.png` (`b1c3d8c2872fe998`), `public/brand/mikro-logo.png` (`1bbcc571db9be606`), `public/brand/automagik-logo.png` (`56ea82b76b4be436`). `genie-logo.png` stays as Group 1 placed it (`af3c8fffffa8ff6d`).
2. `style.css`: append the live spike's product block (spike `style.css` sha256 prefix `b4e829d3b742ad0d`, lines after the chat-drawer rules): the `html[data-product]` logo swaps, the footer AUTOMAGIK swap, the invert cancel on `.genie-switcher img`, the rule hiding the native pill once replaced, and the `.genie-switcher*` styles. Tag the two holocron-internal selectors (`.slot-logo img`, `div:has(> select[data-genie-logos])`) with canaries.
3. `components/product-brand.tsx`: `'use client'`; `export function ProductBrand(): null`, which calls `mountProductBrand()` once per page lifetime (module-level guard) after window `load`; `export function mountProductBrand(): () => void`, the live spike's `components/product-brand.ts` (sha256 prefix `893a4876454d5775`) without its HMR block: the `MutationObserver` that enhances every `select[aria-label="Select section"]` (header and mobile menu), keeps `html[data-product]` and the header logo's `alt` in step with the URL, and closes the menu on outside click.
4. `src/server.tsx`: a middleware before `.use(holocronApp)` that, for `text/html` responses, sets `data-product` on `<html>` with `new HTMLRewriter().on('html', …).transform(response)`; `productForPath(pathname)` derives the slug from `docs.json` the way the spike's `productScript` does (each product's first page folder, product name lowercased, Genie as the default); the layout renders `<ProductBrand />` beside `<GeniePet />`.
5. `scripts/ui-check.mjs --products`, in Chromium, Firefox and WebKit: the raw HTML of `/genie`, `/omni/quickstart`, `/rlmx/config` carries `data-product="genie"`, `"omni"`, `"mikro"`; element screenshots of `.slot-logo img` on those pages are pairwise different, and the footer logo's screenshot differs from the Genie header's; `select[aria-label="Select section"]` is hidden and `.genie-switcher` is visible; the menu lists three options whose images have `alt` Genie, Omni and mikro and whose active one has `aria-selected="true"`; choosing Omni from `/genie` by mouse, and mikro by keyboard (ArrowDown, Enter), changes the URL without a full reload and updates `data-product` and the header logo; computed `filter` is `none` on the header, footer and switcher logos; no console error or hydration warning.

**Interfaces:**
- Consumes: Group 1's `style.css` and the `--gx-*` tokens; Group 2's `src/server.tsx` and site-wide layout; `router` from `spiceflow/react`; `docs.json` `navigation.products`.
- Produces: `export function ProductBrand(): null`; `export function mountProductBrand(): () => void`; `function productForPath(pathname: string): 'genie' | 'omni' | 'mikro'` in `src/server.tsx`; the attribute contract `html[data-product="genie" | "omni" | "mikro"]`; logo paths `/brand/<slug>-logo.png`; the `scripts/ui-check.mjs --products` flag.

**Acceptance Criteria:**
- [ ] `node scripts/ui-check.mjs --serve --products` exits 0 in all three engines; Groups 1 and 2 checks, the strict build and `npm run verify` still pass.
- [ ] The three assets match their hash prefixes.
- [ ] If an engine does not apply `content: url()` to an `<img>` (the logo screenshots match), `mountProductBrand` also sets the header and footer logos' `src`, and the check is rerun; this fallback is recorded in the PR body.

**Validation:**
```bash
npm ci
npm run build
npm run verify
npx playwright install chromium firefox webkit
node scripts/ui-check.mjs --serve --pet
node scripts/ui-check.mjs --serve --products
node -e 'const c=require("crypto"),fs=require("fs");const want={"public/brand/omni-logo.png":"b1c3d8c2872fe998","public/brand/mikro-logo.png":"1bbcc571db9be606","public/brand/automagik-logo.png":"56ea82b76b4be436","public/brand/genie-logo.png":"af3c8fffffa8ff6d"};let ok=true;for(const[f,h]of Object.entries(want)){const g=c.createHash("sha256").update(fs.readFileSync(f)).digest("hex").slice(0,16);if(g!==h){console.error(f,g);ok=false}}process.exit(ok?0:1)'
```

**depends-on:** Group 2

---

## QA Criteria

_What must be verified on dev after merge. The QA agent tests each criterion._

- [ ] Functional: on the workers.dev site, the hero plays on `/genie`, the pet follows across Genie, Omni and mikro pages, clicking it opens the chat drawer, and the header and switcher show each product's logo.
- [ ] Integration: after `docs-holocron-chat` lands, clicking the pet and asking a question shows the pet's waiting, running and review poses.
- [ ] Regression: every public page still answers 200 and `npm run verify` passes against the workers.dev URL.

---

## Assumptions / Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| holocron 0.36.0 composes the user layout in an unexpected position | Medium | `GeniePet` renders `null` and mounts on `body`, so position does not matter; the UI check asserts one `<html>`, no hydration warning and one pet per page; stop and report on failure. |
| The `src/` import path or the hook changes in a holocron upgrade | Medium | Exact pin; the UI check's click test fails loudly on a second store. |
| CSS hooks break on upgrade | Medium | Tagged rules with canaries in CI. |
| The live spike keeps changing after this plan | Low | Groups 1 and 2 port from the archive `/home/genie/.genie/state-backups/holo-spike-2026-10-04/`; Group 3 ports the files whose hashes it records; refresh the archive with them before execution. |
| An engine ignores `content: url()` on `<img>` | Medium | Group 3 checks all three engines by screenshot; fallback sets `src` from `mountProductBrand`. |
| The custom entry cannot return a transformed response, or `HTMLRewriter` is missing in a local run | Medium | The cloudflare Vite plugin runs the Worker in workerd for `dev` and `preview`; the UI check reads raw HTML; fallback is the spike's inline head script added by the same `HTMLRewriter` call, or a client-only attribute with a first-paint flash, decided by Felipe. |
| A holocron upgrade changes the `Select section` select or the header markup | Medium | Exact pin; canaries on both selectors; the switcher check fails loudly. |
| The 1.8 MB spritesheet slows pages | Low | Loaded after `load` and cached; Lighthouse runs in `docs-holocron-cutover`. |
| The canvas hero costs CPU on weak devices | Low | It plays once and settles; reduced motion draws one frame. |

---

## Review Results

_The read-only reviewer returns evidence; the invoking orchestrator appends a timestamped block here after plan, execution, and PR reviews._

---

## Files to Create/Modify

```
style.css                                (create)
docs.json                                (modify: brand fields)
public/brand/genie-logo.png              (create, binary)
public/brand/genie-favicon.png           (create, binary)
public/brand/omni-logo.png               (create, binary)
public/brand/mikro-logo.png              (create, binary)
public/brand/automagik-logo.png          (create, binary)
public/fonts/geist-latin.woff2           (create, binary)
public/fonts/jetbrains-mono-latin.woff2  (create, binary)
package.json                             (modify: playwright)
package-lock.json                        (modify, generated)
scripts/ui-check.mjs                     (create)
.github/workflows/site.yml               (modify: UI check step)
vite.config.ts                           (modify: entry)
src/server.tsx                           (create; Group 3 adds the data-product middleware)
components/product-brand.tsx             (create)
components/genie-pet.tsx                 (create)
components/lamp-hero.tsx                 (create)
components/pet/animation.json            (create, minified)
public/genie-hero/lamp.png               (create, binary)
public/genie-hero/face.png               (create, binary)
public/genie-hero/face-points.json       (create)
public/pet/spritesheet.webp              (create, binary)
genie/index.mdx                          (modify: hero)
```
