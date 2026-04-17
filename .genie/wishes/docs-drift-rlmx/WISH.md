# WISH: docs-drift-rlmx — sync Rlmx docs to v0.260412.2

## Context

automagik-dev/rlmx shipped 13 days of development (v0.260330.12 → v0.260412.2). The `rlmx` binary is currently broken on this machine (dangling symlink — see memory `reference_rlmx_broken.md`), so source-read the CLI surface from `/home/genie/workspace/repos/rlmx/src/cli.ts`.

Full audit: `/home/genie/workspace/genie-docs/reports/automagik-dev-drift-audit.md`.

**Target repo:** automagik-dev/docs. Pages under `rlmx/`.

## Execution groups

### Group A — Complete the CLI reference for batch / cache / benchmark / stats (CRITICAL)

**Deliverable:** `rlmx/cli/reference.mdx` — add or expand `## rlmx batch`, `## rlmx cache`, `## rlmx benchmark`, `## rlmx stats` subsections.

For each command, document:
- Signature (from `src/cli.ts` lines 52–101)
- All flags with defaults
- One realistic usage example
- What it outputs

**Source of truth:**
- `/home/genie/workspace/repos/rlmx/src/cli.ts` (lines 52–101 define these commands)
- `/home/genie/workspace/repos/rlmx/README.md` for narrative context
- `/home/genie/workspace/repos/rlmx/src/commands/` for individual implementations if needed

**Acceptance:** Each of the four commands has a labeled subsection with signature, flags table, example, and an "Outputs" note. Users discovering these via `rlmx --help` (when the binary is fixed) will find complete docs.

### Group B — Expand batch / cache concept pages with examples

**Deliverable:** `rlmx/batch.mdx` and `rlmx/cache.mdx` (the concept pages, not CLI reference) — add at least one end-to-end example per page showing input → invocation → output.

**Acceptance:** Each concept page now includes a runnable example (even if the binary is currently broken on this workspace — the command invocation text itself is the doc).

## Constraints

- `rlmx` binary is broken here; DO NOT attempt to run it. Derive CLI surface from `src/cli.ts` directly.
- Mintlify components + consistent neighbor formatting.
- One PR titled `docs(rlmx): sync to v0.260412.2 — batch/cache/benchmark/stats reference`.
- Do NOT touch genie/ or omni/ pages.

## PR target

Branch: `docs-drift-rlmx-20260417`. PR base: `main`.
