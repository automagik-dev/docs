# WISH: docs-drift-genie — sync Genie docs to v4.260416.5

## Context

automagik-dev/genie shipped 17 days of development (v4.260330.1 → v4.260416.5) since these docs were last updated. This wish closes the documentation drift for the Genie CLI only. Full drift audit lives at `/home/genie/workspace/genie-docs/reports/automagik-dev-drift-audit.md`.

**Target repo:** automagik-dev/docs (this repo). Pages live under `genie/`.

## Execution groups

### Group A — Document the approval workflow (CRITICAL)

**Deliverable:** Add a new subsection to `genie/cli/agents.mdx` (or, if cleaner, a new page `genie/cli/approve.mdx` and wire it in `docs.json`) covering:

- `genie approve [options] <agent>` — "Approve an agent's output for merge"
- `genie answer <name> <choice>` — "Answer a question for an agent"

**Source of truth:** `/home/genie/workspace/repos/genie/src/term-commands/approval.ts` (the whole file — read it for flags, behavior, examples). Also capture `--help` live via `PATH=/home/genie/.bun/bin:$PATH genie approve --help` and `PATH=/home/genie/.bun/bin:$PATH genie answer --help`.

**Acceptance:** `approve` and `answer` both show up somewhere user-discoverable in the Genie CLI section with full flags, a one-paragraph use-case, and at least one code example.

### Group B — Fix `agent register` description

**Deliverable:** `genie/cli/agents.mdx` description currently says the page covers "spawn, kill, stop, resume, ls, history, read, answer" — it omits `register`. Update the description to either include `register` or add a cross-link to `genie/cli/directory.mdx` where `register` already lives.

**Source of truth:** `PATH=/home/genie/.bun/bin:$PATH genie agent register --help`.

**Acceptance:** description line is accurate; no broken cross-link introduced.

### Group C — Document `genie reset --yes/-y`

**Deliverable:** `genie/cli/dispatch.mdx` reset section (lines ~99–140) — add the `--yes, -y` flag to the options table with a one-line description ("skip interactive confirmation").

**Source of truth:** git commit `820f5490 fix(state): register --yes/-y option on reset command` (2026-04-16) and `PATH=/home/genie/.bun/bin:$PATH genie reset --help`.

**Acceptance:** `--yes, -y` documented in the options table of the reset section.

### Group D — Document wish-state drift detection

**Deliverable:** Add a subsection (or <Warning> callout) to `genie/concepts/wishes.mdx` covering the new drift-detection feature from commit `dcf23e60 feat(wish-state): detect WISH.md drift and fail loud on stale state` (2026-04-15). Explain: what triggers it, the exact error message users will see, recovery steps.

**Source of truth:** `/home/genie/workspace/repos/genie/src/term-commands/state.ts`.

**Acceptance:** a user encountering the drift error can find an explanation + recovery in the wishes doc.

## Constraints

- Edit existing .mdx files where possible; create new pages only if the reviewer finds a better home that doesn't exist yet.
- Every change must have evidence — cite source file:line or exact --help output in the PR description.
- Do NOT change the global `docs.json` beyond adding new pages you introduce.
- Use Mintlify components (`<Note>`, `<Warning>`, `<CodeGroup>`, `<ParamField>`) consistently with neighboring pages.
- Keep scope tight — this wish is only Genie. Do NOT touch omni/ or rlmx/ pages.

## Success criteria

- All 4 execution groups land in one PR titled `docs(genie): sync to v4.260416.5 — approve/answer, register, reset --yes, wish-state drift`.
- PR description enumerates the 4 closed gaps with evidence links.
- `mintlify dev` renders without errors.

## PR target

Branch: `docs-drift-genie-20260417`. PR base: `main`. One PR, all fixes bundled.
