# WISH: docs-drift-omni — sync Omni docs to v2.260409.6

## Context

automagik-dev/omni shipped 14 days of development (v2.260326.1 → v2.260409.6). This wish closes Omni docs drift. Full audit: `/home/genie/workspace/genie-docs/reports/automagik-dev-drift-audit.md`.

**Target repo:** automagik-dev/docs. Pages under `omni/`.

## Execution groups

### Group A — Document `omni turns` admin family (CRITICAL)

**Deliverable:** Add a `turns` section to `omni/cli/system.mdx` (after the `journey` section) covering:

- `omni turns list [options]` — List turns with optional filters
- `omni turns get <id>` — Get a single turn by ID
- `omni turns close [options] <id>` — Admin force-close a turn
- `omni turns close-all [options]` — Bulk close all open turns (requires `--confirm`)
- `omni turns stats` — Show aggregate turn metrics

**Source of truth:** `PATH=/home/genie/.bun/bin:$PATH omni turns --help` plus each subcommand's `--help`. Also read `/home/genie/workspace/repos/omni/packages/cli/src/commands/turns/` for context.

**Acceptance:** Full turns section with flags, descriptions, one usage example per subcommand. `close-all` must clearly call out that `--confirm` is required.

### Group B — Update `film` docs with new flags

**Deliverable:** `omni/cli/messaging.mdx` (lines ~380–390, film examples) — add example usage of `--aspect-ratio 9:16` and `--no-audio`. Default is `16:9`; document both options.

**Source of truth:** `PATH=/home/genie/.bun/bin:$PATH omni film --help`.

**Acceptance:** At least one example in the film section uses `--aspect-ratio`, and `--no-audio` is documented in the options table.

### Group C — Add `omni imagine` dedicated subsection

**Deliverable:** `omni/cli/messaging.mdx` — add a dedicated `## omni imagine` subsection (currently only mentioned in passing). Cover: the command signature, typical prompt style, output path, any flags from `--help`.

**Source of truth:** `PATH=/home/genie/.bun/bin:$PATH omni imagine --help`.

**Acceptance:** `imagine` has the same level of detail as `film` in the messaging doc.

### Group D — Note `omni dead-letters` debug command

**Deliverable:** `omni/cli/debug.mdx` — add a short note documenting the `dead-letters` command (visible via `omni --all`, not in default help). Cover: when to use it, what it shows, that it is debug-only.

**Source of truth:** `/home/genie/workspace/repos/omni/packages/cli/src/commands/dead-letters.ts` and `PATH=/home/genie/.bun/bin:$PATH omni --all | grep -i dead`.

**Acceptance:** a user hitting a stuck message queue can find guidance in the debug doc.

## Constraints

- All fixes in one PR titled `docs(omni): sync to v2.260409.6 — turns, film flags, imagine, dead-letters`.
- Do NOT touch genie/ or rlmx/ pages.
- Mintlify components + consistent neighbor formatting.
- Every added flag or subcommand must be verified against live `--help` output before writing.

## PR target

Branch: `docs-drift-omni-20260417`. PR base: `main`.
