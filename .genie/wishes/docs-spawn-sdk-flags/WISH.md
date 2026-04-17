# WISH: docs-spawn-sdk-flags — document the SDK executor surface on genie spawn

## Context

`genie spawn` gained a full set of SDK-executor flags for the `claude-sdk` provider (streaming, session resume, reasoning effort, turn/budget caps, initial prompt). The `genie/cli/spawn.mdx` page documents 16 of the 24 live flags. The 8 SDK flags are completely absent.

This gap surfaced in the 2026-04-17 drift sweep from both the freshness-auditor and gap-finder lens specialists (signed by both). Triage synthesis: `/home/genie/workspace/genie-docs/reports/2026-04-17T18-45-sweep-synthesis.md`.

**Target repo:** automagik-dev/docs (this repo). Page: `genie/cli/spawn.mdx`.

## Execution groups

### Group 1 — Document the 8 missing SDK flags

**Deliverable:** Extend the `## genie spawn` flags table in `genie/cli/spawn.mdx` to include all 8 missing flags, in the order they appear in the live `--help` output.

| Flag | Description (verbatim from --help) |
|---|---|
| `--stream` | Stream SDK messages to stdout in real-time (claude-sdk provider) |
| `--stream-format <format>` | Streaming output format: `text`, `json`, `ndjson` (default: `text`) |
| `--sdk-max-turns <n>` | SDK: max conversation turns |
| `--sdk-max-budget <usd>` | SDK: max budget in USD |
| `--sdk-stream` | SDK: enable streaming output (shortcut for `--stream`) |
| `--sdk-effort <level>` | SDK: reasoning effort level (`low`, `medium`, `high`, `max`) |
| `--sdk-resume <session-id>` | SDK: resume a previous session by ID |
| `--prompt <text>` | Initial prompt to send as the first user message |

**Source of truth:** `/home/genie/workspace/genie-docs/state/cli-help/genie/spawn.txt` lines 23–34. If the captured file drifts from the live CLI, re-capture via `PATH=/home/genie/.bun/bin:$PATH genie spawn --help > /tmp/spawn-help.txt` and use the live output.

**Acceptance:**
- All 8 flags appear in the existing options table, preserving the current table style and column order.
- Flag names match the CLI exactly (including `--sdk-*` prefix and angle-bracket argument names).
- Descriptions are concise one-liners — match the phrasing style of the existing 16 flags.

### Group 2 — Add a short "SDK executor" section + one example

**Deliverable:** After the `### Examples` block (~line 60), add a `### SDK executor (claude-sdk provider)` subsection with:

1. A one-paragraph explanation: when you pass `--provider claude-sdk` (or set the default provider to `claude-sdk`), `genie spawn` drives the Anthropic SDK directly instead of launching Claude Code in tmux. The SDK flags control turn limits, budget, streaming, reasoning effort, and session resume.
2. Two code examples:
   ```bash
   # Stream SDK output in ndjson format with high reasoning effort
   genie spawn engineer --provider claude-sdk --sdk-stream --stream-format ndjson --sdk-effort high

   # Resume a previous SDK session
   genie spawn engineer --provider claude-sdk --sdk-resume <session-id> --prompt "Continue from where we left off"
   ```

Do NOT claim the SDK executor path is preferable, recommended, or a drop-in replacement — it's a separate mode, call it that neutrally.

**Acceptance:** a reader looking for `--sdk-effort` or `--sdk-resume` finds both the flag and an example of how they combine.

## Constraints

- Edit only `genie/cli/spawn.mdx`. Do NOT touch `docs.json`, other pages, or other repos.
- Preserve the existing frontmatter and page structure (H1 "Agent Lifecycle Commands", `## genie spawn` subsection style).
- Use the existing table markdown style (`|` pipes, not `<ParamField>`) to stay consistent with the 16 flags already documented.
- Bold code-style formatting for flag names (backticks) inside table cells exactly as existing rows do.
- No emojis. No "this is awesome" prose. Match the voice of the surrounding page.

## Success criteria

- Wished PR title: `docs(genie): document spawn SDK executor flags`.
- Branch: `docs/spawn-sdk-flags-20260417`. Base: `main`.
- PR description enumerates the 8 flags with a link to `state/cli-help/genie/spawn.txt` as source-of-truth.
- `mintlify broken-links` passes after the change (no new nav entries, should be trivially clean).
- Single commit, conventional commits format.

## Non-goals

- Not documenting the `claude-sdk` provider's broader architecture (session storage, token accounting internals — those are kernel-shaped concerns out of scope here).
- Not fixing "codex listed as a model" — this was a false-positive finding; `spawn.mdx` line 21 correctly lists codex as a provider.
- Not adding new pages to `docs.json`.
