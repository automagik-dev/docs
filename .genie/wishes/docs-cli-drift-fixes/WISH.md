# WISH: docs-cli-drift-fixes — six small CLI-drift fixes across infrastructure, ls, setup

## Context

Six small drifts surfaced in the 2026-04-17 sweep. Individually each is one edit; bundling them into one PR keeps the reviewer context small. Triage synthesis: `/home/genie/workspace/genie-docs/reports/2026-04-17T18-45-sweep-synthesis.md`.

**Target repo:** automagik-dev/docs (this repo). Pages: `genie/cli/infrastructure.mdx`, wherever `genie ls` is documented, wherever `genie setup` is documented, wherever `genie answer` is documented.

## Execution groups

### Group 1 — `genie doctor --fix` flag

**File:** `genie/cli/infrastructure.mdx` — `## genie doctor` section.

**Deliverable:** Add `--fix` to the flags table with description from live help: "auto-fix: kill zombie postgres, clean shared memory, restart daemon" (paraphrase acceptable — keep it to one line).

**Source:** `state/cli-help/genie/doctor.txt` (re-capture with `PATH=/home/genie/.bun/bin:$PATH genie doctor --help` if stale).

### Group 2 — `genie serve` auto-starts omni bridge

**File:** `genie/cli/infrastructure.mdx` — `## genie serve` section.

**Deliverable:** Add a `<Note>` (or one line in the existing description) stating that `genie serve start` also starts the Omni↔Genie NATS bridge alongside `pgserve`, `tmux`, and `scheduler`. Verify in the services table of the same page that omni bridge is listed; add it if missing.

**Source:** commits `80010156` and `d2a28618` (2026-04-11) in `automagik-dev/genie`.

### Group 3 — `genie update --next` / `--stable` channel flags

**File:** `genie/cli/infrastructure.mdx` — `## genie update` section.

**Deliverable:** Add two rows to the flags table:

| `--next` | Switch to dev builds (npm `@next` dist-tag) |
| `--stable` | Switch to stable releases (npm `@latest` dist-tag) |

**Source:** `state/cli-help/genie/update.txt` (re-capture if stale).

### Group 4 — `genie ls --source <name>` filter flag

**File:** wherever `genie ls` is currently documented (grep the repo for `genie ls` headings).

**Deliverable:** Add `--source <name>` to the flags table: "Filter by executor metadata source (e.g., `omni`)".

**Source:** `state/cli-help/genie/ls.txt` line 7.

### Group 5 — `genie setup --shortcuts` label fix (keyboard vs terminal)

**File:** `genie/cli/infrastructure.mdx` or wherever `genie setup` flags are listed. Current text conflates two separate flags:

| Flag | Live CLI description | Current docs label |
|---|---|---|
| `--shortcuts` | "Only configure **keyboard** shortcuts" | "Only configure **terminal** shortcuts" ❌ |
| `--terminal` | "Only configure terminal defaults" | (may be missing — verify) |

**Deliverable:**
- Change `--shortcuts` description to "keyboard shortcuts" (match CLI exactly).
- Ensure `--terminal` is listed as a distinct flag with "terminal defaults" description.
- If the page description line says "terminal shortcuts" in a way that refers to `--shortcuts`, reword to "keyboard shortcuts" for consistency.

**Source:** `state/cli-help/genie/setup.txt` lines 7–9.

### Group 6 — `genie answer text:<value>` prefix protocol

**File:** wherever `genie answer` is documented (grep for `## .genie answer`).

**Deliverable:** Add a short subsection or `<Note>` explaining that the `<choice>` argument accepts a `text:` prefix for free-form answers, e.g., `genie answer my-agent text:"use option B with override"`. Without the prefix, `<choice>` is interpreted as a numeric/named selection.

**Source:** `state/cli-help/genie/answer.txt` (re-capture if stale) or `repos/genie/src/term-commands/approval.ts`.

## Constraints

- One PR bundles all six groups. Groups are independent; any order.
- Preserve existing table and frontmatter styles on each page.
- Do NOT expand scope — if you notice other drift on these pages, file a follow-up issue, don't inline-fix.
- No emojis, no promotional prose. Match the page voice.
- If a page truly doesn't document a command yet, and creating it is the cleanest home for a single flag, create the page and add it to `docs.json`. Otherwise add to the closest existing page.

## Success criteria

- Wished PR title: `docs(genie): fix CLI drift — doctor --fix, serve bridge, update channels, ls --source, setup --shortcuts label, answer text: prefix`.
- Branch: `docs/cli-drift-fixes-20260417`. Base: `main`.
- PR description enumerates all 6 closed gaps with source-file links.
- `mintlify broken-links` passes.
- If any new pages added, `docs.json` entry is included and reviewer confirms nav renders.

## Non-goals

- Not re-documenting commands that are already covered (check the "Verified as Covered" section of `reports/2026-04-17T00-00-gap-finder.md`).
- Not touching the nav ordering / wizard promotion / onboarding polish — that's PR-B/PR-C in Wave 2.
- Not running terminology sweeps — that's PR-E.
