# WISH: docs-polish-sweep — terminology + sidebarTitles + code-block langs + Homebrew note + /pm cross-link

## Context

The 2026-04-17 sweep's consistency-checker and gap-finder surfaced a cross-cutting polish backlog. Each item is low-risk individually but they accumulate. Bundling into one PR keeps the noise-to-signal low. Triage synthesis: `/home/genie/workspace/genie-docs/reports/2026-04-17T18-45-sweep-synthesis.md`.

**Target repo:** automagik-dev/docs (this repo). Scope: cross-cutting.

**⚠️ Verification done up-front:**
- "64 deprecated worker occurrences" — actual is **18 occurrences across 6 files**. Use the actual number, not the inflated count.
- "boards.mdx orphaned" — **FALSE POSITIVE** in the consistency-checker report; both `genie/concepts/boards` and `genie/cli/boards` are in `docs.json` (lines 46 and 80). Do NOT re-add them.
- "RLMX 100% undocumented" — **FALSE POSITIVE**; PR #46 shipped rlmx docs. Skip.

## Execution groups

### Group 1 — `worker` → `agent` (18 real occurrences)

**Scope:** 6 files, 18 total occurrences. Run this first to see current state:

```bash
grep -rn "worker" /home/genie/workspace/repos/docs/genie --include="*.mdx"
```

Files known to have occurrences: `genie/architecture/state.mdx` (2), `genie/architecture/postgres.mdx` (1), `genie/architecture/scheduler.mdx` (3), `genie/architecture/transcripts.mdx` (6), `genie/architecture/overview.mdx` (1), `genie/config/files.mdx` (5).

**Rule:** Replace "worker" with "agent" ONLY when the referent is an agent process in the genie topology. If the context refers to OS/process-level workers (node.js worker threads, pg workers, etc.), keep the original term. Read the surrounding paragraph for each occurrence; don't run a blind replace_all.

**Acceptance:** every remaining "worker" occurrence has a reviewer-justifiable reason (OS-level, third-party, historical context).

### Group 2 — Add `sidebarTitle` to 55 files missing it

**Scope:** run `grep -L "sidebarTitle" genie/**/*.mdx` (after `shopt -s globstar`) to list files. Each `.mdx` file's frontmatter should include a `sidebarTitle` entry that matches the nav label in `docs.json` for that page (or a sensible short form if `docs.json` uses the default page slug).

**Rule:** `sidebarTitle` should be short (1–3 words, Title Case) and differ from `title` only when the full title is too long for the sidebar. If title is already short, you may set `sidebarTitle` to the same value.

**Acceptance:** every `.mdx` page referenced by `docs.json` has a `sidebarTitle` entry. Nav still renders identically (check by eye before/after).

### Group 3 — Tag 57 untagged code blocks with language hints

**Scope:** find untagged blocks with:

```bash
grep -rn '^```$' /home/genie/workspace/repos/docs/genie --include="*.mdx"
grep -rn '^```[ ]*$' /home/genie/workspace/repos/docs/genie --include="*.mdx"
```

**Rule:** add the obvious language (`bash`, `typescript`, `json`, `yaml`, `mdx`, `text`). If the block is shell terminal output, use `text` or `bash` with a `Terminal` label (matching existing style on `cli/dispatch.mdx`).

**Acceptance:** no untagged code fence remains in the `genie/` tree.

### Group 4 — Normalize placeholder style (~12 occurrences)

**Scope:** grep for placeholders that use camelCase or mixedCase inside angle brackets:

```bash
grep -rn '<[a-z][a-zA-Z]*[A-Z]' /home/genie/workspace/repos/docs/genie --include="*.mdx"
```

**Rule:** convert `<routeId>` → `<route-id>`, `<sessionName>` → `<session-name>`, etc. Kebab-case is canonical.

**Acceptance:** zero mixed-case placeholders remain.

### Group 5 — Homebrew-not-supported note

**File:** `genie/installation.mdx`.

**Deliverable:** add a short `<Note>` or `<Tip>` near the top of the install options section stating that Homebrew is not a supported install path — npm is canonical; `bun` and curl bootstrap are the alternatives. This prevents the macOS dead-end where users try `brew install genie` first.

**Rule:** keep to ~2 sentences. Don't apologize, don't promise a future tap.

### Group 6 — Cross-link onboarding → `/pm` playbook

**Files:** `genie/index.mdx` or `genie/features.mdx` (whichever has the most natural home for the link).

**Deliverable:** add one `<Card>` or a one-line mention linking to the `/pm` skill / playbook page (likely `/genie/skills/pm`). The onboarding path currently skips the plan+review loop; this card is the bridge.

**Rule:** do NOT duplicate the `/pm` content here. One card, one href. Cross-link only.

## Constraints

- One PR for all six groups. Groups are independent; complete in any order.
- Each group: one focused commit. Six commits on the branch is fine; do NOT squash prematurely.
- No new pages, no `docs.json` restructuring (that's Wave 2 PR-B).
- Do NOT fix consistency-checker's false-positive findings (boards.mdx, work arg order, RLMX, sessions ingest).
- `mintlify broken-links` must pass after all changes.
- Voice: no meta-commentary ("we're adding this because…"), just the artifacts.

## Success criteria

- Wished PR title: `docs(genie): polish sweep — terminology, sidebarTitles, code-block langs, Homebrew note, /pm cross-link`.
- Branch: `docs/polish-sweep-20260417`. Base: `main`.
- PR description enumerates all 6 groups with before/after counts (e.g., "worker occurrences: 18 → 0 after context-aware review; 3 retained as OS-level workers with reviewer justification").
- No nav or docs.json changes.

## Non-goals

- Not touching `spawn.mdx` (that's PR-A).
- Not touching CLI drift flags (that's PR-D).
- Not touching Wave 2 files (wizard.mdx, index.mdx prose wall, installation.mdx Next Steps CardGroup — those are PR-B/PR-C and coordinated after Wave 1 merges).
