# WISH: docs-pr-events-subcommands — fill in missing `genie events` subcommands

## Context

`genie/cli/observability.mdx` documents 7 `genie events` subcommands: `costs`, `errors`, `list`, `scan`, `summary`, `timeline`, `tools`. The actual CLI has 13 — 7 are completely undocumented:

- **`stream-follow`** (NEW, PR #1244) — LISTEN/NOTIFY follow stream, supports `--kind` glob, `--severity`, `--since`, `--consumer-id`
- **`stream`** — base streaming command (no follow)
- **`subscribe`** — durable subscription registration
- **`admin`** — incident-response admin commands (sentinel)
- **`enriched`** — enriched event view (otel cols)
- **`timeline-v2`** — improved timeline (replaces `timeline` in some contexts)
- **`migrate`** — events migration helper

This PR adds documentation for all 7.

**Target repo:** automagik-dev/docs (this repo). Target file: `genie/cli/observability.mdx` (one file edit, no new pages).

**Source-of-truth files:**
- `/home/genie/workspace/agents/genie-docs/state/cli-help/genie/events/stream-follow.txt`
- `/home/genie/workspace/agents/genie-docs/state/cli-help/genie/events/stream.txt`
- `/home/genie/workspace/agents/genie-docs/state/cli-help/genie/events/subscribe.txt`
- `/home/genie/workspace/agents/genie-docs/state/cli-help/genie/events/admin.txt`
- `/home/genie/workspace/agents/genie-docs/state/cli-help/genie/events/enriched.txt`
- `/home/genie/workspace/agents/genie-docs/state/cli-help/genie/events/timeline-v2.txt`
- `/home/genie/workspace/agents/genie-docs/state/cli-help/genie/events/migrate.txt`

Authoritative re-capture if needed: `PATH=/home/genie/.bun/bin:$PATH genie events <subcmd> --help`.

## Execution groups

### Group A — Add the 7 missing subcommand sections to `observability.mdx`

**Deliverable:** for each missing subcommand, add a `### genie events <name>` subsection under the existing "## Events" area in `genie/cli/observability.mdx`. Each section:

- One-paragraph use-case: when would an operator reach for this?
- Flag table (Mintlify table or markdown table) listing every flag from the captured `--help`. Include defaults and descriptions verbatim from `--help`.
- One `bash` code example showing a realistic invocation.

**Special priority — `stream-follow`:**
- Highlight the glob-enabled `--kind` filter with example `--kind 'detector.*'`.
- Cross-link to the new Detectors page (`./observability/detectors.mdx`) — that page may land in a sibling PR; if it doesn't exist yet at write time, add the link anyway and note the sibling wish.

**Style:**
- Match the existing `genie events list` / `genie events scan` style in the same file (look at lines around the existing sections).
- Use `bash` for shell blocks. Use `<Note>` for caveats (e.g., "`subscribe` requires a running scheduler").

**Acceptance:**
- All 7 subcommands have `### genie events <name>` headings.
- Every `--help` flag is mentioned at least once.
- File still has correct frontmatter (don't accidentally drop it).
- `mint broken-links` passes.

### Group B — Update the page's intro paragraph + table of contents

**Deliverable:** the page's intro lists the documented subcommands. Update that list to include all 13. Re-order alphabetically OR keep existing curated order — whichever the existing prose flows better with.

**Acceptance:** intro matches the actual section count.

## Constraints

- Single file edit. Do NOT touch `docs.json` (no nav change needed).
- Branch name: `docs/pr-events-subcommands`.
- PR title: `docs(genie/observability): document missing events subcommands`.
- PR body lists the 7 added subcommands and links to this wish.

## Out of scope

- Detector page itself (covered in sibling PR `docs-pr-detectors-page`).
- Other `genie events` flags or environment variables not visible in `--help` output.
