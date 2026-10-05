# Wish: docs.automagik.dev on holocron: Automagik brand, lamp hero and pet

| Field | Value |
|-------|-------|
| **Status** | IN_PROGRESS |
| **Slug** | `docs-holocron-brand` |
| **Date** | 2026-10-04 |
| **Author** | Felipe Rosa (plan drafted by Claude) |
| **Appetite** | medium |
| **Branch** | `wish/docs-holocron-brand` |
| **Repos touched** | `automagik-dev/docs` |
| **Design** | _No brainstorm — direct wish_ |

## Summary

Applies the launch-video design system to the holocron site: neon design B tokens, Geist and JetBrains Mono, the real GENIE logo with holocron's dark-mode invert cancelled, the lamp play (film scene 3) as the Genie introduction hero, and the sprite pet on every page, whose click opens the AI chat. Second of five sibling wishes (`docs-holocron`, this one, `docs-holocron-products`, `docs-holocron-chat`, `docs-holocron-cutover`). Product logos, the per-product logo link and share images moved to `docs-holocron-products` to keep this wish inside the insertion band. The production pet uses holocron's documented custom-entry seam instead of the spike's dev-server HTML injection.

## Scope

### IN

- `style.css` at the repository root (holocron loads it automatically, `vite-plugin.ts:545`): tokens and component rules ported from the frozen spike snapshot, each rule that targets holocron markup tagged and covered by a canary with its own fixture action.
- Brand fields in `docs.json`: colors, strict dark appearance, fonts, the GENIE logo, favicon.
- Brand, font, hero and pet assets copied byte for byte from the frozen snapshot, checked by hash.
- A custom entry `src/server.tsx` that mounts holocron and one site-wide client component, `components/genie-pet.tsx`.
- `components/lamp-hero.tsx` at the top of `genie/index.mdx`.
- `scripts/ui-check.mjs` (Playwright, Chromium in CI): computed-style checks, CSS canaries, pet and hero behavior.

### OUT

- Product logos in the header, the logo product switcher, the AUTOMAGIK footer logo, the per-product logo link, share images (`docs-holocron-products`).
- Chat answers: the gateway, limits and spend cap (`docs-holocron-chat`). Here the pet only has to open and close holocron's chat drawer.
- Heroes for Omni or mikro; any new art; any edit to a sprite cell or the face.
- Light mode (the site is strict dark).
- A holocron upgrade.

## Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | Design follows the Automagik design system as in the launch videos: neon design B `#0B0B12` / `#E8E6F0` / `#FF3FF5` / `#5EF2FF` / `#2A2438`; fonts Geist and JetBrains Mono; the real logo (triskele plus GENIE wordmark, never the mascot face) with the dark-mode invert cancelled; the lamp play (film scene 3) as the Genie introduction hero; the sprite pet as a site-wide companion; clicking the pet opens the AI chat; the mascot's eyes are always closed. | Owner decision (Felipe, 2026-10-03/04, final). The 2026-10-04 product-logo requirement is delivered by `docs-holocron-products`. |
| 2 | The production pet is mounted through holocron's custom entry: `holocron({ entry: './src/server.tsx' })`, where `src/server.tsx` mounts `holocronApp` and then registers `.layout('/*', …)` rendering one `'use client'` `<GeniePet />`. `GeniePet` renders `null` and, in an effect, mounts the spike's plain-DOM pet on `document.body` once per page lifetime. | The custom entry is holocron's documented extension point (`website/src/pages/docs/custom-entry.mdx`) and the one holocron's own Workers site uses. Because `GeniePet` renders nothing and attaches to `body`, its place in the layout tree does not matter, and a module-level guard keeps one pet even if the layout remounts. Rejected: rewriting HTML in middleware (a separately bundled script cannot share holocron's chat store), an import in every MDX page (41 edits, and every new page must remember it), a Vite transform of holocron's source (patches internals). |
| 3 | The pet reaches the chat through `useChatWidget()` (`isOpen`, `isGenerating`, `messages`, `open`, `close`, `toggle`), imported from `@holocron.so/vite/src/chat/use-chat-widget.ts`. | It is the hook holocron documents for controlling its chat. holocron's app is built from `src/` (`vite-plugin.ts:471` aliases `@holocron.so/vite/app` to source), so only a `src/` import shares the app's store; the `./chat` export resolves to `dist/` and would bind a second, unrelated store. `./src/*` is an exported subpath of the package. This replaces the spike's direct `chat-store.ts` import. |
| 4 | One logo image for light and dark, with the invert cancelled in CSS: `.slot-logo img` and `img[src$="/brand/genie-logo.png"]` get `filter: none`, `mix-blend-mode: normal`, `opacity: 1`. | With `light === dark` holocron's `<Logo>` takes its single-image branch and adds Tailwind's `dark:invert`, which turns cyan red and magenta green. The spike proved the cancel; the UI check asserts the computed `filter` is `none`. |
| 5 | Fonts are the video renderer's exact files, Latin subset only: `geist-latin.woff2` and `jetbrains-mono-latin.woff2`. | Same glyphs as the videos. The docs are English, and Latin-1 also covers Portuguese accents, so the two `latin-ext` files the spike carried are dropped. |
| 6 | The lamp hero (`lamp-hero.tsx`, the spike's canvas port of `render-src/film.html` scene 3, every frame a pure function of film time) replaces the video at the top of `genie/index.mdx`. It plays once, hands the Genie to the pet with a `genie:handoff` event, replays on click, and shows only the settled frame under reduced motion. | Owner decision 1; proven in the spike. |
| 7 | Eyes closed is guaranteed by provenance: only the approved render bundle's art is used (spritesheet cells, `face.png`, `lamp.png`, the logo crop), nothing is drawn or edited, and every asset is byte-identical to the frozen snapshot's copy (hashes checked in each group's validation). Felipe signs off screenshots in `docs-holocron-cutover`. | Eyes cannot be asserted by a script; byte identity plus a human look can. |
| 8 | Canaries: every rule in `style.css` that targets holocron markup carries `/* holocron-internal: <id> */`, and `scripts/ui-check.mjs` holds one canary per id: `{ id, selector, page, action }`. The check strips pseudo-classes and pseudo-elements that a query cannot match (`:hover`, `:focus-visible`, `::before`, `::after`) and keeps structural ones (`:not()`, `:has()`, `:first-child`). `action` is `none` or `open-drawer` (click the pet, wait for `.holocron-chat-drawer-panel`). Selectors that only match after a chat answer (links or code inside messages) are checked through their structural container (`.holocron-chat-drawer-messages`, `.slot-aside`), since this wish has no gateway. Group 1 defines all 24 canaries and asserts the 21 with action `none`; the 3 drawer canaries (`.holocron-chat-drawer-panel`, `.holocron-chat-drawer-messages a[href]` and its `:hover`) are asserted in Group 2, where the pet that opens the drawer arrives. Opening the drawer in Group 1 through holocron's sidebar "Ask AI" box would mean submitting a question to a gateway that does not exist yet, so moving the 3 assertions is the cleaner choice. A check also fails when a tag has no canary or a canary has no tag. | The plan review counted 27 hooks into holocron internals in the frozen `style.css`: 24 in the part this wish ports, 3 in the product block `docs-holocron-products` ports. With `@holocron.so/vite` pinned at 0.36.0 they hold; on an upgrade a renamed hook fails CI instead of silently unstyling the site. |
| 9 | `components/pet/animation.json` is stored minified, equal after parsing to the snapshot's file. | It is 781 lines of data; minified it is one line (7,873 bytes) and keeps this wish within the insertion band. |
| 10 | The pet sets its spritesheet (1.8 MB) as a background only after the window `load` event. | It never competes with first paint; the browser caches it across pages. |
| 11 | PR CI runs the UI check in Chromium only. | Firefox and WebKit run in `docs-holocron-products`' own validation, where engine differences (`content: url()` on images) matter; keeping CI on one engine keeps PR runs short. |
| 12 | The frozen, read-only snapshot `/home/genie/.genie/state-backups/holo-spike-2026-10-04-frozen/` is the only source. Every file this wish ports or copies is checked by sha256 prefix, both in the snapshot and in the repository, in the group's validation. | The live spike and the mutable archive kept changing during planning; a frozen source makes the ports reviewable. |
| 13 | **Owner decisions at plan approval (Felipe, 2026-10-04, final; recorded through the question harness).** Hosting: Cloudflare Workers Paid ("Cloudflare Workers Paid (Recomendado)"); Vercel was considered and dropped because holocron has no Vercel target. A. Visitor IP: no per-IP rate limit for now, deferred by owner; trigger to revisit: abuse or the spend cap being hit. The gateway token gate, the hard daily spend cap with its reservation ledger, the input bounds (64 KB, no `system` role), `maxOutputTokens`, the step limit, `redirect: 'manual'` and the canonical-path guard stay. B. Retired-URL redirects: none ("não quero fazer redirect, consider this a fresh start; we will revamp the other product docs later"); only `/` goes to the Genie landing, as site navigation; retired pages answer 404. C. PR previews: none ("Sem previews", 2026-10-04); PRs run only `build` and `verify` with no secrets, so the preview-chat question is moot. D. mikro URLs: `rlmx/` moves to `mikro/` with no redirects; `/rlmx/*` answers 404. | Recorded as given; all five wishes are APPROVED on these terms. None changes this wish's files. |

## Simplicity Case

- **Simplest complete design:** one stylesheet, one custom entry with one layout, one client component that renders nothing and mounts the spike's DOM pet, one canvas hero imported by one page.
- **Added machinery:** the custom entry (holocron has no other site-wide client hook; spike finding) and `scripts/ui-check.mjs` with Playwright (the CSS hooks are fragile across holocron versions, and pet behavior can only be proven in a browser).
- **Deferred until measured:** committed screenshot baselines with pixel diffs (screenshots are produced for Felipe's sign-off in the cutover wish instead), heroes for Omni and mikro, a smaller spritesheet.
- **Complexity removed:** the spike's dev-only HTML injection and its HMR wiring, the `latin-ext` font files, the separate `neutral.png` (the neutral pose is a spritesheet cell), the direct `chat-store` import, a static `og:image` setting (`docs-holocron-products` rewrites both share-image tags, which `seo.metatags` alone does not fix).

## Dependencies

**depends-on:** docs-holocron
**blocks:** docs-holocron-products, docs-holocron-chat, docs-holocron-cutover

Starts after `docs-holocron` merges to `main`; branch `wish/docs-holocron-brand` is cut from `origin/main`. Every source comes from the frozen snapshot `/home/genie/.genie/state-backups/holo-spike-2026-10-04-frozen/site/`; the hashes below were recorded against it on 2026-10-04. The original art is under the genie checkout's untracked `.orca/drops/` and `.genie/brainstorms/genie-launch/`.

## Success Criteria

- [ ] Every public page renders on `#0B0B12` with `#E8E6F0` body text, `#FF3FF5` as primary, Geist for prose and JetBrains Mono for code.
- [ ] Header and footer show `genie-logo.png` with computed `filter: none`; no page shows the mascot face as a logo.
- [ ] `/genie` opens with the lamp hero, and the pet appears through the hand-off (or after the 6 s timeout); under reduced motion the hero shows its settled frame and the pet its neutral pose.
- [ ] Every public page of Genie, Omni and mikro shows exactly one pet, also after client-side navigation; clicking it, or pressing Enter on it, opens holocron's chat drawer, and doing it again closes the drawer.
- [ ] No console error or hydration warning on two pages per product; each page's HTML has exactly one `<html`.
- [ ] All 24 canaries match on holocron 0.36.0, every tag has a canary, and the strict build and `npm run verify` still pass.
- [ ] Every ported or copied file matches its recorded hash in the snapshot and in the repository.

## Execution Strategy

### Wave 1 (sequential)

| Group | Agent | Complexity | Model | Description |
|-------|-------|------------|-------|-------------|
| 1 | engineer | medium: 24 fragile CSS hooks with fixture actions, Playwright canary, binary assets | inherit | Theme, logo and fonts with a CSS canary in CI |

### Wave 2 (sequential)

| Group | Agent | Complexity | Model | Description |
|-------|-------|------------|-------|-------------|
| 2 | engineer | high: custom entry layout composition, client hydration, chat-store identity | inherit | Custom entry, lamp hero and site-wide pet with click-to-chat |

**Global constraints:**
- npm with the committed `package-lock.json`; CI and every validation run `npm ci`.
- Exact pins, no `^` or `~`: `@holocron.so/vite` 0.36.0, `vite` 8.3.2, `@cloudflare/vite-plugin` 1.62.5, `wrangler` 4.147.0, `react` 19.3.0, `react-dom` 19.3.0; `playwright` pinned exactly when added.
- Run wrangler as `npx wrangler`; it is not installed globally.
- Local commands work on Linux and macOS; Windows is not a target.
- Source of truth: `/home/genie/.genie/state-backups/holo-spike-2026-10-04-frozen/`, read-only; every ported file is hash-checked.
- Brand tokens: `#0B0B12` surface, `#E8E6F0` text, `#FF3FF5` magenta, `#5EF2FF` cyan, `#2A2438` border.
- Fonts: Geist and JetBrains Mono.
- The logo is the triskele plus the GENIE wordmark, never the mascot face; the dark-mode invert is cancelled.
- The mascot's eyes are always closed; no sprite cell or face is drawn or edited.
- Clicking the pet opens the AI chat.
- `HOLOCRON_SKIP_BUILD_ERRORS` is never set.
- No secret in git, CI logs, command lines or repository files.
- Outward or irreversible steps (pushes to `main`, DNS, secrets, production deploys) go to Felipe through the question harness first.
- New user-facing copy: no hashtags, no dash punctuation, no "not X, it's Y" construction.
- A change that alters the generated deploy config (`wrangler.jsonc`, the Cloudflare Vite plugin, wrangler or the build entry) regenerates `scripts/expected-wrangler.json` with `node scripts/check-deploy-config.mjs . --write` in the same PR; the `build` job's drift check fails otherwise.
- "Wishes in, PRs out" and "context framework" are never headings.

## Execution Groups

### Group 1: Theme, logo and fonts

**Goal:** Every page wears neon design B with Geist, JetBrains Mono and the real GENIE logo, and CI fails if a holocron upgrade breaks a CSS hook.

**Deliverables:**
1. `style.css`: lines 1 to 343 of the snapshot's `site/style.css` (sha256 prefix `b4e829d3b742ad0d`; the product block from line 344 belongs to `docs-holocron-products`), without the two `latin-ext` `@font-face` blocks. It keeps the tokens, headings, links, inline code, terminal code blocks, steps, callouts, frames, cards, tables, sidebar, header pill, skill-page slash, logo cancel, the `.genie-hero*` and `.genie-pet*` rules, and the chat drawer rules. Every rule that targets holocron markup carries `/* holocron-internal: <id> */`; at least these 24 (snapshot line, selector as written):
   ```
   149 .slot-main a[style*="var(--primary)"]            157 … :hover
   163 .slot-main code:not(pre code)                     169 .slot-main h1 code:not(pre code), .slot-main h2 code:not(pre code)
   172 figure[class~="group/code"]                       173 figure[class~="group/code"]::before
   185 figure[class~="group/code"] code                  189 figure[class~="group/code"] .token.method, … .token.builtin
   192 … .token.property, … .token.tag                   195 … .token.boolean, … .token.constant
   197 … .token.punctuation                              210 .slot-main div[style*="color-mix(in srgb, var(--background) 9"]
   217 … > :not(:first-child)                            229 [class~="group/card"]:has(a):hover
   235 .slot-main thead [data-slot="table-cell"]         243 .slot-main [data-slot="table-row"]
   248 .slot-sidebar-nav div[style*="text-transform: uppercase"]
   254 .slot-sidebar-nav a[aria-current="page"]          257 .slot-navbar-primary
   266 .slot-page:has(.slot-sidebar-nav a[aria-current="page"][href^="/genie/skills/"]) h1.editorial-h1 > span:first-child::before
   321 .holocron-chat-drawer-panel                       326 .slot-aside code:not(pre code)
   334 .holocron-chat-drawer-messages a[href]            342 … a[href]:hover
   ```
2. `docs.json`: `colors` primary, light and dark `#FF3FF5`; `appearance` `{ "default": "dark", "strict": true }`; `fonts` `{ "family": "Geist", "source": "/fonts/geist-latin.woff2", "format": "woff2" }`; `logo` `{ "light": "/brand/genie-logo.png", "dark": "/brand/genie-logo.png", "href": "/genie" }`; `favicon` `/brand/genie-favicon.png`.
3. Assets copied from the snapshot's `site/public/`, verified by sha256 prefix: `public/brand/genie-logo.png` (`af3c8fffffa8ff6d`), `public/brand/genie-favicon.png` (`4f998b69b81f2f96`), `public/fonts/geist-latin.woff2` (`19f9c92546aa300c`), `public/fonts/jetbrains-mono-latin.woff2` (`83c005d49d8a6a50`).
4. `package.json` and `package-lock.json`: devDependency `playwright`, exact version.
5. `scripts/ui-check.mjs`: `node scripts/ui-check.mjs <base-url> | --serve [--engine chromium|firefox|webkit] [--pet] [--all]`, starting `vite preview` like the verify script. In Chromium at 1440x900 it checks `/genie`, `/omni`, `/rlmx`: computed `background-color` of `body` is `rgb(11, 11, 18)`; body text `rgb(232, 230, 240)`; body `font-family` starts with `Geist`; `pre code` `font-family` starts with `"JetBrains Mono"`; `--primary` resolves to `#FF3FF5`; the header and footer logo images have computed `filter: none`; every canary whose action is available (decision 8: `none` here, `open-drawer` once `--pet` exists) runs its action on its page and its stripped selector matches at least one element; the set of tag ids in `style.css` equals the set of canary ids; no console error. `--all` runs every check group the script knows, so later wishes add groups without touching CI. It saves screenshots to `.ui-check/` and exits 1 with one line per failure.
6. `.github/workflows/site.yml`: in job `build`, after `npm run verify`, run `npx playwright install --with-deps chromium` and `node scripts/ui-check.mjs --serve --all`.

**Interfaces:**
- Consumes: from `docs-holocron`, `npm run build`, `npm run verify`, `scripts/verify-site.mjs`, `.github/workflows/site.yml` job `build`, the `docs.json` brand keys.
- Produces: CSS classes Group 2 renders: `.genie-pet`, `.genie-pet.is-visible`, `.genie-pet__sprite`, `.genie-hero`, `.genie-hero__canvas`; custom properties `--gx-*`; the canary format `{ id: string; selector: string; page: string; action: 'none' | 'open-drawer' }`; `scripts/ui-check.mjs` with `--serve`, `<base-url>`, `--engine` and `--all`, which Group 2 extends with `--pet` and `docs-holocron-products` with `--products` and `--meta` (each also joining `--all`).

**Acceptance Criteria:**
- [ ] `node scripts/ui-check.mjs --serve` exits 0 on holocron 0.36.0 with the 21 `none` canaries matched; the 3 `open-drawer` canaries are reported as deferred to `--pet`, never as passed.
- [ ] Renaming one canary selector in a scratch copy of `style.css`, or deleting one tag, makes the UI check fail (witnessed once, then restored).
- [ ] The snapshot source and the four copied assets match their hash prefixes.
- [ ] The CI `build` job runs the UI check and passes on this wish's PR.

**Validation:**
```bash
export SNAP=/home/genie/.genie/state-backups/holo-spike-2026-10-04-frozen/site
node -e 'const c=require("crypto"),fs=require("fs"),S=process.env.SNAP;const h=b=>c.createHash("sha256").update(b).digest("hex").slice(0,16);const src={"style.css":"b4e829d3b742ad0d"};const cp={"public/brand/genie-logo.png":"af3c8fffffa8ff6d","public/brand/genie-favicon.png":"4f998b69b81f2f96","public/fonts/geist-latin.woff2":"19f9c92546aa300c","public/fonts/jetbrains-mono-latin.woff2":"83c005d49d8a6a50"};let ok=true;for(const[f,w]of Object.entries({...src,...cp}))if(h(fs.readFileSync(S+"/"+f))!==w){console.error("snapshot",f);ok=false}for(const[f,w]of Object.entries(cp))if(h(fs.readFileSync(f))!==w){console.error("repo",f);ok=false}process.exit(ok?0:1)'
test "$(grep -c 'holocron-internal:' style.css)" -ge 24
npm ci
npm run build
npm run verify
npx playwright install chromium
node scripts/ui-check.mjs --serve
```

**depends-on:** none

---

### Group 2: Custom entry, lamp hero and site-wide pet

**Goal:** The production build shows the lamp hero on `/genie` and one pet on every page, and clicking the pet opens holocron's chat drawer.

**Deliverables:**
1. `vite.config.ts`: `holocron({ entry: './src/server.tsx' })`; nothing else changes.
2. `src/server.tsx`: `export const app = new Spiceflow().use(holocronApp).layout('/*', ({ children }) => <>{children}<GeniePet /></>)` and `export default { fetch: (request: Request) => app.handle(request) }`, matching holocron's own custom-entry fixture (`integration-tests/fixtures/custom-entry/server.tsx`). `wrangler.jsonc` keeps `main` `spiceflow/cloudflare-entrypoint`, as holocron's own site does with `entry`; confirm the entrypoint picks up the custom app in the built Worker.
3. `components/genie-pet.tsx`: `'use client'`; `export function GeniePet(): null`, which builds a `ChatPort` from `useChatWidget()` with refs and calls `mountPet(port)` once per page lifetime (a module-level guard); `export function mountPet(chat: ChatPort): () => void` is the snapshot's `site/components/genie-pet.ts` `mount()` (sha256 prefix `daf41943fbb81ec1`: sprite player with exact `durationMs`, 16 look directions, wave once per session, hero hand-off, run on navigation, docking beside the open drawer, reduced motion, role `button`, `aria-label` "Ask Genie", Enter and Space) with every `chatStore` use replaced by the port. The spritesheet background is set after window `load`.
4. `components/lamp-hero.tsx`: the snapshot's `site/components/lamp-hero.tsx` (sha256 prefix `2b5053f79700582a`); it imports only React.
5. `components/pet/animation.json`: minified, equal after parsing to the snapshot's `site/components/pet/animation.json` (sha256 of `JSON.stringify(JSON.parse(text))` starts `ea20b7c43cda5bfd`).
6. Assets copied from the snapshot's `site/public/`, verified by sha256 prefix: `public/genie-hero/lamp.png` (`af66b73273569de5`), `public/genie-hero/face.png` (`89c995e76fc55f3e`), `public/genie-hero/face-points.json` (`30104120432dff19`), `public/pet/spritesheet.webp` (`431aa00ad989e502`).
7. `genie/index.mdx`: replace the `<video …/>` block with `import { LampHero } from '../components/lamp-hero'` and `<LampHero />`, as in the spike; nothing else on the page changes.
8. `scripts/ui-check.mjs --pet` (also in `--all`), on two pages per product: exactly one `.genie-pet.is-visible` within 8 s; after clicking a sidebar link, still exactly one; a click sets `aria-expanded="true"` and shows `.holocron-chat-drawer-panel`, and a second click closes it; Enter on the focused pet toggles too; on `/genie`, `[data-genie-hero]` exists and the pet becomes visible; with `reducedMotion: 'reduce'` the pet's `data-clip` is `neutral`; the HTML holds exactly one `<html`; no console error and no hydration warning. The `open-drawer` canary action uses the same click, so `--pet` asserts the 3 drawer canaries.

**Interfaces:**
- Consumes: Group 1's CSS classes and `scripts/ui-check.mjs`; `useChatWidget` from `@holocron.so/vite/src/chat/use-chat-widget.ts` returning `{ isOpen: boolean; isGenerating: boolean; messages: ChatMessage[]; open(): void; close(): void; toggle(): void }`; `app` from `@holocron.so/vite/app`; `Spiceflow` from `spiceflow`.
- Produces: `type ChatPort = { isOpen(): boolean; toggle(): void; onChange(listener: (s: { open: boolean; generating: boolean; failed: boolean }) => void): () => void }`; `export function mountPet(chat: ChatPort): () => void`; `export function GeniePet(): null`; `export const app` in `src/server.tsx`, to which `docs-holocron-products` adds a middleware and a second layout child and `docs-holocron-chat` adds `.use(chatGuard)`, both before `.use(holocronApp)`; the window event `genie:handoff` with detail `{ x: number; y: number; size: number }` from `LampHero`.

**Acceptance Criteria:**
- [ ] `node scripts/ui-check.mjs --serve --all` exits 0 with all 24 canaries matched, the 3 drawer canaries included.
- [ ] Group 1's checks, the strict build and `npm run verify` still pass.
- [ ] The snapshot sources, the four assets and `animation.json` match their hashes.
- [ ] If the layout composition fails on 0.36.0 (two `<html>` elements, a hydration error, or a route without the pet), the executor stops and reports; the fallback, an import on every public page, is a separate wish.

**Validation:**
```bash
export SNAP=/home/genie/.genie/state-backups/holo-spike-2026-10-04-frozen/site
node -e 'const c=require("crypto"),fs=require("fs"),S=process.env.SNAP;const h=b=>c.createHash("sha256").update(b).digest("hex").slice(0,16);const src={"components/genie-pet.ts":"daf41943fbb81ec1","components/lamp-hero.tsx":"2b5053f79700582a"};const cp={"public/genie-hero/lamp.png":"af66b73273569de5","public/genie-hero/face.png":"89c995e76fc55f3e","public/genie-hero/face-points.json":"30104120432dff19","public/pet/spritesheet.webp":"431aa00ad989e502"};let ok=true;for(const[f,w]of Object.entries({...src,...cp}))if(h(fs.readFileSync(S+"/"+f))!==w){console.error("snapshot",f);ok=false}for(const[f,w]of Object.entries(cp))if(h(fs.readFileSync(f))!==w){console.error("repo",f);ok=false}for(const f of[S+"/components/pet/animation.json","components/pet/animation.json"])if(h(JSON.stringify(JSON.parse(fs.readFileSync(f,"utf8"))))!=="ea20b7c43cda5bfd"){console.error("animation",f);ok=false}process.exit(ok?0:1)'
npm ci
npm run build
npm run verify
npx playwright install chromium
node scripts/ui-check.mjs --serve --all
```

**depends-on:** Group 1

---

## QA Criteria

_What must be verified on dev after merge. The QA agent tests each criterion._

- [ ] Functional: on the workers.dev site, the hero plays on `/genie`, the pet follows across Genie, Omni and mikro pages, and clicking it opens the chat drawer.
- [ ] Integration: after `docs-holocron-chat` lands, clicking the pet and asking a question shows the pet's waiting, running and review poses.
- [ ] Regression: every public page still answers 200 and `npm run verify` passes against the workers.dev URL.

---

## Assumptions / Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| holocron 0.36.0 composes the user layout in an unexpected position | Medium | `GeniePet` renders `null` and mounts on `body`, so position does not matter; the UI check asserts one `<html>`, no hydration warning and one pet per page; stop and report on failure. |
| The `src/` import path or the hook changes in a holocron upgrade | Medium | Exact pin; the UI check's click test fails loudly on a second store. |
| CSS hooks break on upgrade | Medium | 24 tagged rules with canaries and fixture actions in CI; a tag without a canary fails too. |
| A canary needs a chat answer this wish cannot produce | Low | Such selectors are checked through their structural containers (decision 8); the cutover wish's chat run exercises the full selectors. |
| The 1.8 MB spritesheet slows pages | Low | Loaded after `load` and cached; Lighthouse runs in `docs-holocron-cutover`. |
| The canvas hero costs CPU on weak devices | Low | It plays once and settles; reduced motion draws one frame. |
| Share images stay broken until `docs-holocron-products` lands | Low | Nothing is public before cutover; the products wish rewrites both tags and checks them. |

---

## Review Results

_The read-only reviewer returns evidence; the invoking orchestrator appends a timestamped block here after plan, execution, and PR reviews._

### Execution review — 2026-10-04 (independent reviewer, read-only)

**Group 1 (558ac47): SHIP. Group 2 (dadd46e): SHIP.** 0 blocking findings.

- Validation, run in fresh worktrees after `npm ci`:
  - hash scripts exit 0;
  - 28 brand tags;
  - build, `npm run verify` and the deploy-config guard pass;
  - `ui-check` at Group 1: 25 matched and 3 deferred; `--pet` is refused with a usage error;
  - `ui-check --all` at Group 2: 28 canaries plus pet, reduced motion and the 404 shell.
  - `--all` also passes against `wrangler dev` (workerd).
- Sweep of all 41 navigation pages in workerd: each answers 200 with one `<html>`, one visible pet and no console or hydration error.
  - One pre-existing holocron warning: `<link rel=preload>` with `as="stylesheet"`.
- Visuals:
  - eyes are closed arcs everywhere;
  - the header and footer logos have no filter (sampled pixels show no inversion).
- Security:
  - the entry adds a layout and no routes;
  - `_internal`, `/src`, `/components`, `/style.css`, `/docs.json`, `/package.json`, `/.git/config`, `/.dev.vars`, `/@fs`, `/@id`, `/node_modules` and traversal all answer 404;
  - no `innerHTML` anywhere.
- Mutation checks: six mutations of the brand guard, each named with the right cause.

**Deviations from the plan, accepted by the reviewer:**
1. 28 brand tags, against the 24 the plan required.
2. `src/server.tsx` imports `style.css`. With `entry` set, `spiceflowPlugin({entry})` bypasses `virtual:holocron-app`, which is where holocron imports the CSS.
3. The layout is mounted on a child app (`src/server.tsx:16-23`). As the plan wrote it, the 404 rendered without an `<html>` shell, and `ui-check --pet` catches that regression.
4. The code-font check covers only `/genie` and `/omni`. `/rlmx` has no code block.
5. `--pet` is a Group 2 check. Group 1 builds its usage line from `GROUPS`.

**Non-blocking findings:**
- LOW: `components/genie-pet.tsx:380-387` reads `failed` from message notices only. A transport error sets `errorMessage` without a notice, so the pet plays `review` instead of `failed`.
  - Fix: subscribe to `errorMessage` from `src/chat/chat-store.ts`.
  - Owner: docs-holocron-chat.
- Note for docs-holocron-products: `<ProductBrand />` goes into `siteLayout`, not `app`.

Open: Group 1's "CI passes on the PR" criterion, pending the PR.

### 404 pet follow-up — 2026-10-05 (engineer, `feat/pet-on-404`)

**Owner ask (Felipe, 2026-10-05): "Quero o pet na 404".** Every 404 now shows the pet, and a click on it opens the chat. The product logo menu comes with the same change. Deviation 3 still holds: `siteLayout` stays innermost and out of the 404's rendered tree, and the server's 404 answer is unchanged (status 404, one `<html>`, holocron's chrome).

- **Mechanism.** `components/genie-pet.tsx` and `components/product-brand.tsx` start their pieces from module code once React has hydrated `<body>` (`components/hydration.ts`), not from an effect, since on a 404 no component of the site renders. The modules still load on a 404, by one of two paths:
  - under `vite dev`, spiceflow serializes `siteLayout` without rendering it, so the 404's payload names `GeniePet` and `ProductBrand`;
  - in a production build, both modules sit in the same client chunk as holocron's own client components (`worker-entry-*.js`), which the not-found page loads.
  - The reviewer removed the payload reference: production still showed the pet and the logo menu and ui-check passed; `vite dev` lost the pet. ui-check's 404 shell checks that the pet shows, not which path loaded it.
- **Deviation from Decision 3.** The pet reads holocron's chat store (`src/chat/chat-store.ts`) directly instead of `useChatWidget()`, because a hook needs a rendered component. Reviewer-confirmed safe:
  - one store instance, the same `src/` one the hook reads;
  - the same toggle, flipping `drawerState` as the hook's `toggle` does;
  - the store subscription is removed when the pet is disposed;
  - holocron sets `errorMessage` before `isGenerating` goes false, so the failed pose still plays.
- **React internals.** The hydration wait reads React's `__reactFiber$` key on `<body>`, as `product-brand.tsx` already did for its selects. If a React upgrade renames the key, neither piece starts, and CI's ui-check fails on the pet pages and the 404 shell.
- **Checks.** ui-check's 404 shell opens `/genie/no-such-page` and `/omni/no-such-page` and requires one visible pet that a click opens the drawer with and a second click closes, a refused question playing the failed pose with `/` as `currentSlug`, and the pet opening the drawer at 390x844. `--products` requires the logo menu on the Omni 404. On main's code these four checks fail and every other passes.
- **Review of e5799b2: SHIP**, one LOW: the comments credited the 404 to the payload path alone. The commit that adds this note rewords them to name both paths.

---

## Files to Create/Modify

```
style.css                                (create)
docs.json                                (modify: brand fields)
public/brand/genie-logo.png              (create, binary)
public/brand/genie-favicon.png           (create, binary)
public/fonts/geist-latin.woff2           (create, binary)
public/fonts/jetbrains-mono-latin.woff2  (create, binary)
package.json                             (modify: playwright)
package-lock.json                        (modify, generated)
scripts/ui-check.mjs                     (create)
.github/workflows/site.yml               (modify: UI check step)
vite.config.ts                           (modify: entry)
src/server.tsx                           (create)
components/genie-pet.tsx                 (create)
components/lamp-hero.tsx                 (create)
components/pet/animation.json            (create, minified)
public/genie-hero/lamp.png               (create, binary)
public/genie-hero/face.png               (create, binary)
public/genie-hero/face-points.json       (create)
public/pet/spritesheet.webp              (create, binary)
genie/index.mdx                          (modify: hero)
```
