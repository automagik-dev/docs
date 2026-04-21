# WISH: docs-pr-cli-commands-undocumented — document `blocked`/`failed`/`template`/`wipe` + spawn auto-resume

## Context

Audit revealed 4 real CLI commands and 2 docs from the upstream `automagik-dev/genie` repo that have zero coverage in `docs/genie/`:

| Command / topic | Source | Should land in |
|-----------------|--------|----------------|
| `genie blocked` | `cli-help/blocked.txt` | `genie/cli/dispatch.mdx` |
| `genie failed` | `cli-help/failed.txt` | `genie/cli/dispatch.mdx` |
| `genie template` | `cli-help/template.txt` (board template management) | `genie/cli/boards.mdx` |
| `genie wipe` (script) | new in PR #1240, repo file `scripts/genie-wipe` | `genie/cli/database.mdx` (Danger zone subsection) |
| Spawn auto-resume | `/home/genie/workspace/repos/genie/docs/SPAWN-AUTO-RESUME.md` | `genie/cli/spawn.mdx` |
| Spawn team-resolution | `/home/genie/workspace/repos/genie/docs/SPAWN-TEAM-RESOLUTION.md` | `genie/cli/spawn.mdx` |

**Target repo:** automagik-dev/docs (this repo). Touches 4 existing files; no new pages.

**Source-of-truth files:**
- `/home/genie/workspace/agents/genie-docs/state/cli-help/genie/blocked.txt`
- `/home/genie/workspace/agents/genie-docs/state/cli-help/genie/failed.txt`
- `/home/genie/workspace/agents/genie-docs/state/cli-help/genie/template.txt`
- `/home/genie/workspace/repos/genie/scripts/genie-wipe` (or wherever the script lives — confirm via `find /home/genie/workspace/repos/genie -name 'genie-wipe' -o -name 'wipe*'`)
- `/home/genie/workspace/repos/genie/docs/SPAWN-AUTO-RESUME.md`
- `/home/genie/workspace/repos/genie/docs/SPAWN-TEAM-RESOLUTION.md`

Re-capture if needed: `PATH=/home/genie/.bun/bin:$PATH genie <cmd> --help`.

## Execution groups

### Group A — Add `blocked` + `failed` to `cli/dispatch.mdx`

**Deliverable:** new sections in `genie/cli/dispatch.mdx`:

- `### genie blocked` — explain it closes the current turn with `outcome=blocked`. Show `--reason <message>` flag. Note: this is called from inside an agent session.
- `### genie failed` — same pattern, `outcome=failed`.

Both should be small (5-10 lines each) and include one example command.

**Acceptance:** both subcommands documented, flag tables match `--help` output.

### Group B — Add `genie template` to `cli/boards.mdx`

**Deliverable:** new `### Templates` section in `genie/cli/boards.mdx`. Document:

- `genie template` (the parent command — short blurb)
- Each subcommand listed in `cli-help/template/*.txt` (currently appears empty in capture; re-run `genie template --help` to enumerate)

If template has subcommands, list each with one line + flag table. If template is just a parent with no subcommands yet, note that and link to source.

**Acceptance:** boards.mdx has a Templates section; readers can find the command from the boards page.

### Group C — Add `genie wipe` script to `cli/database.mdx` (Danger zone)

**Deliverable:** new `## Danger zone` section at the bottom of `genie/cli/database.mdx`:

- `### genie wipe` (or whatever the script's invocation is — confirm via the script file)
- `<Warning>` call-out: this is destructive, requires confirmation.
- Show the exact command + what it deletes (PG data, on-disk state, etc.).
- Mention how to recover (re-run `genie serve start` to re-seed from disk).

**Source of truth:** the actual `genie-wipe` script in the upstream repo. Read it before writing the doc — do not invent flags.

**Acceptance:** Danger zone section present; `<Warning>` component used; command matches the script's actual usage.

### Group D — Add Auto-resume + Team resolution sections to `cli/spawn.mdx`

**Deliverable:** at the end of `genie/cli/spawn.mdx`, add two new `##` sections:

1. **`## Auto-resume`** — summarize `SPAWN-AUTO-RESUME.md` in 1-2 paragraphs. Cover: what triggers an auto-resume, how `--no-auto-resume` opts out, the `resumeAttempts` / `maxResumeAttempts` model. Use a `<Steps>` to walk through the resume lifecycle.

2. **`## Team resolution`** — summarize `SPAWN-TEAM-RESOLUTION.md`. Cover: how `--team` resolves to a team, why `--session` is rarely needed when `--team` is set, the `tmuxSessionName` lookup. Use a `<Note>` to flag the common footgun (`--session` overrides team's configured session).

Each section ≤ 30 lines. Cross-link to existing flag table.

**Acceptance:** both sections present; cite the source markdown files in `automagik-dev/genie/docs/`.

## Constraints

- 4 file edits, no new pages, no docs.json change.
- Preserve existing frontmatter and structure.
- Branch name: `docs/pr-cli-commands-undocumented`.
- PR title: `docs(genie/cli): document blocked/failed/template/wipe + spawn auto-resume`.

## Out of scope

- Documenting `genie pane-trap` (internal command, intentionally undocumented).
- Documenting the `genie dispatch` subcommand surface (existing dispatch.mdx covers the user-facing skill primitives; `genie dispatch` raw subcommands are dev-internal).
