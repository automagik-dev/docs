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

Applies the launch-video design system to the holocron site: neon design B tokens, Geist and JetBrains Mono, the real logo with holocron's dark-mode invert cancelled, the lamp play (film scene 3) as the Genie introduction hero, and the sprite pet on every page, whose click opens the AI chat. Second of four sibling wishes (`docs-holocron`, this one, `docs-holocron-chat`, `docs-holocron-cutover`). The production pet uses holocron's documented custom-entry seam instead of the spike's dev-server HTML injection.

## Scope

### IN

- `style.css` at the repository root (holocron loads it automatically, `vite-plugin.ts:545`): tokens and component rules ported from the spike, each rule that targets holocron internals tagged and covered by a canary.
- Brand fields in `docs.json`: colors, strict dark appearance, fonts, logo, favicon, a static `og:image`.
- Brand, font, hero and pet assets copied byte for byte from the spike.
- A custom entry `src/server.tsx` that mounts holocron and one site-wide client component, `components/genie-pet.tsx`.
- `components/lamp-hero.tsx` at the top of `genie/index.mdx`.
- `scripts/ui-check.mjs` (Playwright): computed-style checks, CSS canaries, pet and hero behavior; run in CI.

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
| 4 | One logo image for light and dark, with the invert cancelled in CSS: `.slot-logo img` and `img[src$="/brand/genie-logo.png"]` get `filter: none`, `mix-blend-mode: normal`, `opacity: 1`. | With `light === dark` holocron's `<Logo>` takes its single-image branch and adds Tailwind's `dark:invert`, which turns cyan red and magenta green. The spike proved the cancel; the UI check asserts the computed `filter` is `none`. |
| 5 | Fonts are the video renderer's exact files, Latin subset only: `geist-latin.woff2` and `jetbrains-mono-latin.woff2`. | Same glyphs as the videos. The docs are English, and Latin-1 also covers Portuguese accents, so the two `latin-ext` files the spike carried are dropped. |
| 6 | The lamp hero (`lamp-hero.tsx`, the spike's canvas port of `render-src/film.html` scene 3, every frame a pure function of film time) replaces the video at the top of `genie/index.mdx`. It plays once, hands the Genie to the pet with a `genie:handoff` event, replays on click, and shows only the settled frame under reduced motion. | Owner decision 1; proven in the spike. |
| 7 | Eyes closed is guaranteed by provenance: only the approved render bundle's art is used (spritesheet cells, `face.png`, `lamp.png`, the logo crop), nothing is drawn or edited, and every asset is byte-identical to the spike's copy (hashes in Group 1 and Group 2). Felipe signs off screenshots in `docs-holocron-cutover`. | Eyes cannot be asserted by a script; byte identity plus a human look can. |
| 8 | Each CSS rule that targets holocron internals carries a `/* holocron-internal: <id> */` tag and a canary in `scripts/ui-check.mjs`: its selector must match at least one element on its fixture page. | About 10 rules hook inline-style attribute selectors, `.slot-*` classes, `figure[class~="group/code"]` and `.holocron-chat-drawer-*`. With `@holocron.so/vite` pinned at 0.36.0 they hold; on an upgrade a renamed hook fails CI instead of silently unstyling the site. |
| 9 | `components/pet/animation.json` is stored minified, equal after parsing to the spike's file. | It is 781 lines of data; minified it is one line (7,873 bytes) and keeps this wish within the insertion band. |
| 10 | The pet sets its spritesheet (1.8 MB) as a background only after the window `load` event. | It never competes with first paint; the browser caches it across pages. |

## Simplicity Case

- **Simplest complete design:** one stylesheet, one custom entry with one layout, one client component that renders nothing and mounts the spike's DOM pet, one canvas hero imported by one page.
- **Added machinery:** the custom entry (holocron has no other site-wide client hook; spike finding) and `scripts/ui-check.mjs` with Playwright (the CSS hooks are fragile across holocron versions, and pet behavior can only be proven in a browser).
- **Deferred until measured:** committed screenshot baselines with pixel diffs (screenshots are produced for Felipe's sign-off in the cutover wish instead), heroes for Omni and mikro, a smaller spritesheet.
- **Complexity removed:** the spike's dev-only HTML injection and its HMR wiring, the `latin-ext` font files, the separate `neutral.png` (the neutral pose is a spritesheet cell), the direct `chat-store` import.

## Dependencies

**depends-on:** docs-holocron
**blocks:** docs-holocron-chat, docs-holocron-cutover

Starts after `docs-holocron` merges to `main`; branch `wish/docs-holocron-brand` is cut from `origin/main`. Sources come from the spike at `/var/tmp/sofia-agents/claude-1001/-home-genie-workspace-repos-genie/065fdfff-9583-40b0-98b4-321e16c72e82/scratchpad/holo-spike/site/` (a session scratchpad: archive it before this wish starts). The original art is under the genie checkout's untracked `.orca/drops/launch/` and `.genie/brainstorms/genie-launch/`.

## Success Criteria

- [ ] Every public page renders on `#0B0B12` with `#E8E6F0` body text, `#FF3FF5` as primary, Geist for prose and JetBrains Mono for code.
- [ ] Header and footer show `genie-logo.png` with computed `filter: none`; no page shows the mascot face as a logo.
- [ ] `/genie` opens with the lamp hero, and the pet appears through the hand-off (or after the 6 s timeout); under reduced motion the hero shows its settled frame and the pet its neutral pose.
- [ ] Every public page of Genie, Omni and mikro shows exactly one pet, also after client-side navigation; clicking it, or pressing Enter on it, opens holocron's chat drawer, and doing it again closes the drawer.
- [ ] No console error or hydration warning on two pages per product; each page's HTML has exactly one `<html`.
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
- `HOLOCRON_SKIP_BUILD_ERRORS` is never set.
- No secret in git, CI logs, command lines or repository files.
- Outward or irreversible steps (pushes to `main`, DNS, secrets, production deploys) go to Felipe through the question harness first.
- New user-facing copy: no hashtags, no dash punctuation, no "not X, it's Y" construction.
- "Wishes in, PRs out" and "context framework" are never headings.

## Execution Groups

### Group 1: Theme, logo and fonts

**Goal:** Every page wears neon design B with Geist, JetBrains Mono and the real logo, and CI fails if a holocron upgrade breaks a CSS hook.

**Deliverables:**
1. `style.css`: the spike's `site/style.css` (342 lines) without the two `latin-ext` `@font-face` blocks. It keeps the tokens, headings, links, inline code, terminal code blocks, steps, callouts, frames, cards, tables, sidebar, header pill, skill-page slash, logo cancel, the `.genie-hero*` and `.genie-pet*` rules, and the chat drawer rules. Every holocron-internal selector carries `/* holocron-internal: <id> */`.
2. `docs.json`: `colors` primary, light and dark `#FF3FF5`; `appearance` `{ "default": "dark", "strict": true }`; `fonts` `{ "family": "Geist", "source": "/fonts/geist-latin.woff2", "format": "woff2" }`; `logo` `{ "light": "/brand/genie-logo.png", "dark": "/brand/genie-logo.png", "href": "/genie" }`; `favicon` `/brand/genie-favicon.png`; `seo.metatags["og:image"]` `/brand/genie-logo.png`.
3. Assets copied from the spike, verified by sha256 prefix: `public/brand/genie-logo.png` (`af3c8fffffa8ff6d`), `public/brand/genie-favicon.png` (`4f998b69b81f2f96`), `public/fonts/geist-latin.woff2` (`19f9c92546aa300c`), `public/fonts/jetbrains-mono-latin.woff2` (`83c005d49d8a6a50`).
4. `package.json` and `package-lock.json`: devDependency `playwright`, exact version.
5. `scripts/ui-check.mjs`: `node scripts/ui-check.mjs <base-url> | --serve [--pet]`, starting `vite preview` like the verify script. It launches Chromium at 1440x900 and checks on `/genie`, `/omni`, `/rlmx`: computed `background-color` of `body` is `rgb(11, 11, 18)`; body text `rgb(232, 230, 240)`; body `font-family` starts with `Geist`; `pre code` `font-family` starts with `"JetBrains Mono"`; `--primary` resolves to `#FF3FF5`; the logo image has computed `filter: none`; each tagged canary selector matches at least one element on its fixture page; no console error. It saves screenshots to `.ui-check/` (gitignored) and exits 1 with one line per failure.
6. `.github/workflows/site.yml`: in job `build`, after `npm run verify`, run `npx playwright install --with-deps chromium` and `node scripts/ui-check.mjs --serve`.
7. `.gitignore`: add `.ui-check/`.

**Interfaces:**
- Consumes: from `docs-holocron`, `npm run build`, `npm run verify`, `scripts/verify-site.mjs`, `.github/workflows/site.yml` job `build`, the `docs.json` brand keys.
- Produces: CSS classes Group 2 renders: `.genie-pet`, `.genie-pet.is-visible`, `.genie-pet__sprite`, `.genie-hero`, `.genie-hero__canvas`; custom properties `--gx-*`; `scripts/ui-check.mjs` with `--serve` and `<base-url>`, which Group 2 extends with `--pet`.

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
3. `components/genie-pet.tsx`: `'use client'`; `export function GeniePet(): null`, which builds a `ChatPort` from `useChatWidget()` with refs and calls `mountPet(port)` once per page lifetime (a module-level guard); `export function mountPet(chat: ChatPort): () => void` is the spike's `components/genie-pet.ts` `mount()` (sprite player with exact `durationMs`, 16 look directions, wave once per session, hero hand-off, run on navigation, docking beside the open drawer, reduced motion, role `button`, `aria-label` "Ask Genie", Enter and Space) with every `chatStore` use replaced by the port. The spritesheet background is set after window `load`.
4. `components/lamp-hero.tsx`: the spike's file; it imports only React.
5. `components/pet/animation.json`: minified, equal after parsing to the spike's (`sha256` of `JSON.stringify(JSON.parse(text))` starts `ea20b7c43cda5bfd`).
6. Assets copied from the spike, verified by sha256 prefix: `public/genie-hero/lamp.png` (`af66b73273569de5`), `public/genie-hero/face.png` (`89c995e76fc55f3e`), `public/genie-hero/face-points.json` (`30104120432dff19`), `public/pet/spritesheet.webp` (`431aa00ad989e502`).
7. `genie/index.mdx`: replace the `<video …/>` block with `import { LampHero } from '../components/lamp-hero'` and `<LampHero />`, as in the spike; nothing else on the page changes.
8. `scripts/ui-check.mjs --pet`, on two pages per product: exactly one `.genie-pet.is-visible` within 8 s; after clicking a sidebar link, still exactly one; a click sets `aria-expanded="true"` and shows `.holocron-chat-drawer-panel`, and a second click closes it; Enter on the focused pet toggles too; on `/genie`, `[data-genie-hero]` exists and the pet becomes visible; with `reducedMotion: 'reduce'` the pet's `data-clip` is `neutral`; the HTML holds exactly one `<html`; no console error and no hydration warning.

**Interfaces:**
- Consumes: Group 1's CSS classes and `scripts/ui-check.mjs`; `useChatWidget` from `@holocron.so/vite/src/chat/use-chat-widget.ts` returning `{ isOpen: boolean; isGenerating: boolean; messages: ChatMessage[]; open(): void; close(): void; toggle(): void }`; `app` from `@holocron.so/vite/app`; `Spiceflow` from `spiceflow`.
- Produces: `type ChatPort = { isOpen(): boolean; toggle(): void; onChange(listener: (s: { open: boolean; generating: boolean; failed: boolean }) => void): () => void }`; `export function mountPet(chat: ChatPort): () => void`; `export function GeniePet(): null`; `export const app` in `src/server.tsx`, to which `docs-holocron-chat` adds `.use(chatGuard)` before `.use(holocronApp)`; the window event `genie:handoff` with detail `{ x: number; y: number; size: number }` from `LampHero`.

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
| CSS hooks break on upgrade | Medium | Tagged rules with canaries in CI. |
| The spike scratchpad disappears before execution | Medium | Archive it first; hashes let a recovered copy be verified; the originals are in the genie checkout's `.orca/drops/launch/`. |
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
public/fonts/geist-latin.woff2           (create, binary)
public/fonts/jetbrains-mono-latin.woff2  (create, binary)
package.json                             (modify: playwright)
package-lock.json                        (modify, generated)
scripts/ui-check.mjs                     (create)
.github/workflows/site.yml               (modify: UI check step)
.gitignore                               (modify: .ui-check/)
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
