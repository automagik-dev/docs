# CLI Docs Freshness Audit Report

**Date:** 2026-04-02
**Auditor:** freshness-auditor
**Scope:** 17 CLI docs pages vs 197 `--help` output files
**Freeze point:** 2026-03-30 (docs commit `457f3925`)
**CLI version:** v4.260402.18

---

## Findings

### Finding 1: [HIGH] `genie spawn` missing 3 new flags

**Page:** genie/cli/agents.mdx (line 98-109)
**Docs say:** Options table lists 10 flags (--model, --provider, --layout, --color, --plan-mode, --permission-mode, --extra-args, --cwd, --session, --no-auto-resume)
**Source says:** `spawn --help` lists 13 flags: the above 10 plus `--role <role>`, `--new-window`, and `--window <target>`
**Fix:** Add three rows to the options table:
- `--role <role>` — Override role name for registration (avoids duplicate guard)
- `--new-window` — Create a new tmux window instead of splitting
- `--window <target>` — Tmux window to split into (e.g., genie:3)

---

### Finding 2: [HIGH] `genie spawn` missing `--team` and `--skill` flags

**Page:** genie/cli/agents.mdx (line 98-109)
**Docs say:** Options table omits `--team` and `--skill`
**Source says:** `spawn --help` includes `--team <team>` (default: "genie") and `--skill <skill>` (Skill to load)
**Fix:** Add `--team <team>` and `--skill <skill>` to the agents.mdx spawn options table. (Note: spawn.mdx page has them, but agents.mdx duplicates the spawn section and is missing them.)

---

### Finding 3: [HIGH] `genie spawn` default team value undocumented

**Page:** genie/cli/spawn.mdx (line 20-32)
**Docs say:** `--team <team>` with description "Team name" (no default shown)
**Source says:** `--team <team>  Team name (default: "genie")`
**Fix:** Add `(default: "genie")` to the --team description in spawn.mdx.

---

### Finding 4: [HIGH] `genie work` wrong command signature

**Page:** genie/cli/dispatch.mdx (line 47-48)
**Docs say:** `genie work <agent> <slug>#<group>`
**Source says:** `Usage: genie work <ref> [agent]` — agent is optional and comes second, not first. The ref is the first positional arg.
**Fix:** Update syntax to `genie work <ref> [agent]` and update the description to match: "Auto-orchestrate a wish, or dispatch work on a specific group."

---

### Finding 5: [MEDIUM] `genie board list` missing `--all` flag

**Page:** genie/cli/boards.mdx (line 36-37)
**Docs say:** `genie board list [--project <project>] [--json]`
**Source says:** `board list --help` shows `--project`, `--all` (Include archived boards), and `--json`
**Fix:** Add `--all` flag: "Include archived boards."

---

### Finding 6: [MEDIUM] `genie board export` has undocumented `--json` flag

**Page:** genie/cli/boards.mdx (line 100-101)
**Docs say:** `genie board export <name> [--project <project>] [--output <file>]`
**Source says:** Also has `--json` flag: "Output as JSON (default, accepted for consistency)"
**Fix:** Add `--json` to the board export docs.

---

### Finding 7: [MEDIUM] `genie db restore` missing `-y, --yes` flag

**Page:** genie/cli/database.mdx (line 75-78)
**Docs say:** `genie db restore [file]` with no options listed
**Source says:** `db restore --help` shows `-y, --yes  Skip confirmation prompt`
**Fix:** Add `--yes / -y` flag to the db restore docs.

---

### Finding 8: [MEDIUM] `genie db url` missing `--quiet` flag

**Page:** genie/cli/database.mdx (line 97-98)
**Docs say:** `genie db url [options]` with no options listed
**Source says:** `db url --help` shows `--quiet  Print URL only, no trailing newline (for scripts)`
**Fix:** Add `--quiet` flag to the db url docs.

---

### Finding 9: [MEDIUM] `genie dir` missing `sync` subcommand

**Page:** genie/cli/directory.mdx (entire page)
**Docs say:** Documents `add`, `rm`, `ls`, `edit` subcommands for `genie dir`
**Source says:** `dir --help` also lists `sync  Sync agents from workspace agents/ directory`
**Fix:** Add a section for `genie dir sync`.

---

### Finding 10: [MEDIUM] `genie agent register` missing `--skip-omni` flag

**Page:** genie/cli/directory.mdx (line 91-105)
**Docs say:** Documents `genie agent register <name>` with no options listed
**Source says:** `agent register --help` shows options: `--dir`, `--repo`, `--prompt-mode`, `--model`, `--roles`, `--global`, `--skip-omni`
**Fix:** Add options table for `genie agent register` with all 7 flags. The docs page shows zero options, but the CLI has a full set identical to `genie dir add` plus `--skip-omni`.

---

### Finding 11: [HIGH] `genie agent register` duplicates `genie dir add` flags but docs don't show them

**Page:** genie/cli/directory.mdx (line 91-105)
**Docs say:** Only shows the command signature `genie agent register <name>` with no options
**Source says:** `agent register --help` shows: `--dir <path>`, `--repo <path>`, `--prompt-mode <mode>` (default: "append"), `--model <model>`, `--roles <roles...>`, `--global`, `--skip-omni`
**Fix:** Add the full options table to the `genie agent register` section. These are critical for users who use `agent register` directly.

---

### Finding 12: [MEDIUM] `genie inbox` is a subcommand group, not a simple command

**Page:** genie/cli/messaging.mdx (line 110-114)
**Docs say:** `genie inbox` as a standalone command
**Source says:** `inbox --help` shows it's a command group with subcommands: `list [options] [agent]` and `watch`
**Fix:** Document `genie inbox list` and `genie inbox watch` as subcommands. The `list` subcommand takes `[agent]` as optional arg.

---

### Finding 13: [MEDIUM] `genie chat` subcommand signatures differ from docs

**Page:** genie/cli/messaging.mdx (line 129-132)
**Docs say:** `genie chat <conversation_id> '<message>'` for sending
**Source says:** `chat --help` shows `send [options] <conversationId> <message>` — the subcommand is `send`, not implicit positional
**Fix:** Update to `genie chat send <conversationId> '<message>'`. Also add the `read` subcommand: `genie chat read [options] <conversationId>`.

---

### Finding 14: [HIGH] `genie team create` has new/renamed flags

**Page:** genie/cli/team.mdx (line 14-36)
**Docs say:** Options: `--repo`, `--branch` (default dev), `--wish`, `--session`
**Source says:** `team create --help` shows: `--repo`, `--branch` (default "dev"), `--wish`, `--tmux-session <name>` (new name), `--session <name>` (deprecated alias for --tmux-session), `--no-spawn`
**Fix:** Update:
1. Replace `--session` with `--tmux-session <name>` as the primary flag, note `--session` is deprecated
2. Add `--no-spawn` flag: "Create team and copy wish without spawning the leader (useful for testing)"
3. Update the wish description: "Wish slug -- auto-spawns a task leader with wish context" (says "task leader" not "team leader")

---

### Finding 15: [MEDIUM] `genie team cleanup` subcommand undocumented

**Page:** genie/cli/team.mdx (entire page)
**Docs say:** Documents 9 subcommands: create, hire, fire, ls, archive, unarchive, disband, done, blocked
**Source says:** `team --help` also lists `cleanup [options]  Kill tmux windows for done/archived teams` with a `--dry-run` flag
**Fix:** Add a section for `genie team cleanup [--dry-run]`.

---

### Finding 16: [HIGH] `genie sessions ingest` renamed to `genie sessions sync`

**Page:** genie/cli/observability.mdx (line 208-216)
**Docs say:** `genie sessions ingest [--backfill]` — "Manual batch import of JSONL session files"
**Source says:** `sessions --help` shows `sync  Check session backfill progress` — no `ingest` subcommand exists, and `sync` takes no `--backfill` flag
**Fix:** Replace `genie sessions ingest [--backfill]` with `genie sessions sync`. Update the description to "Check session backfill progress."

---

### Finding 17: [MEDIUM] `genie sessions list` missing `--limit` flag

**Page:** genie/cli/observability.mdx (line 185-191)
**Docs say:** Options: `--active`, `--orphaned`, `--agent`, `--json`
**Source says:** Also has `--limit <n>  Max number of sessions to return (default: 50)`
**Fix:** Add `--limit <n>` (default: 50) to the sessions list options table.

---

### Finding 18: [MEDIUM] `genie events scan` missing documented flags

**Page:** genie/cli/observability.mdx (line 99-108)
**Docs say:** Shows `genie events scan [options]` with no options documented
**Source says:** `events scan --help` shows: `--since <date>` (Start date in YYYYMMDD format), `--json`, `--breakdown` (Show per-model breakdown)
**Fix:** Add options table with `--since`, `--json`, and `--breakdown`.

---

### Finding 19: [MEDIUM] `genie task create` missing 3 new flags

**Page:** genie/cli/tasks.mdx (line 17-33)
**Docs say:** Options table lists 12 flags
**Source says:** `task create --help` shows 15 flags. Missing from docs: `--gh <owner/repo#N>` (Link to GitHub issue), `--external-id <id>`, `--external-url <url>`
**Fix:** Add three rows:
- `--gh <owner/repo#N>` — Link to GitHub issue (sets external_id + external_url)
- `--external-id <id>` — External tracker ID (e.g., JIRA-123)
- `--external-url <url>` — External tracker URL

---

### Finding 20: [MEDIUM] `genie task list` missing 4 flags

**Page:** genie/cli/tasks.mdx (line 43-63)
**Docs say:** Options table lists 12 flags
**Source says:** `task list --help` shows 16 flags. Missing: `--gh <owner/repo#N>` (Filter by GitHub issue link), `--limit <n>` (default: 100), `--offset <n>` (default: 0)
**Fix:** Add:
- `--gh <owner/repo#N>` — Filter by GitHub issue link
- `--limit <n>` — Max number of tasks to return (default: 100)
- `--offset <n>` — Skip first N tasks for pagination (default: 0)

---

### Finding 21: [HIGH] `genie task link --url` does not exist; flags completely wrong

**Page:** genie/cli/tasks.mdx (line 216-226)
**Docs say:** Shows `--url` flag in examples: `genie task link #42 --url https://github.com/org/repo/issues/123`
**Source says:** `task link --help` shows: `--gh <owner/repo#N>`, `--external-id <id>`, `--external-url <url>` — no `--url` flag exists at all
**Fix:** Replace the entire options section and examples with the actual flags:
```
genie task link #42 --gh org/repo#123
genie task link #42 --external-url https://linear.app/team/ENG-456
```

---

### Finding 22: [MEDIUM] `genie task close-merged` missing options

**Page:** genie/cli/tasks.mdx (line 230-234)
**Docs say:** `genie task close-merged [options]` with no options documented
**Source says:** `task close-merged --help` shows: `--since <duration>` (default "24h"), `--dry-run`, `--repo <owner/repo>`
**Fix:** Add options table with `--since`, `--dry-run`, `--repo`.

---

### Finding 23: [MEDIUM] `genie project list` missing `--all` flag

**Page:** genie/cli/projects.mdx (line 16-17)
**Docs say:** `genie project list [--json]`
**Source says:** `project list --help` also shows `--all  Include archived projects`
**Fix:** Add `--all` to the project list options.

---

### Finding 24: [MEDIUM] `genie project` missing `archive` and `unarchive` subcommands

**Page:** genie/cli/projects.mdx (entire page)
**Docs say:** Documents `list`, `create`, `show`, `set-default`
**Source says:** `project --help` also lists `archive <name>` and `unarchive <name>`
**Fix:** Add sections for:
- `genie project archive <name>` — Archive a project (cascades to boards and unfinished tasks)
- `genie project unarchive <name>` — Restore an archived project and its boards

---

### Finding 25: [MEDIUM] `genie serve start` has undocumented flags

**Page:** genie/cli/infrastructure.mdx (line 37-57)
**Docs say:** Lists `start`, `stop`, `status` subcommands with no options for start
**Source says:** `serve start --help` shows: `--daemon` (Run in background), `--foreground` (Run in foreground, default), `--headless` (Run without TUI)
**Fix:** Add options table for `genie serve start`:
- `--daemon` — Run in background
- `--foreground` — Run in foreground (default)
- `--headless` — Run without TUI (services only: pgserve, scheduler, inbox-watcher)

---

### Finding 26: [LOW] `genie daemon` description differs

**Page:** genie/cli/scheduling.mdx (line 110)
**Docs say:** "The scheduler daemon is the background process that polls for due triggers and executes them."
**Source says:** `daemon --help` describes it as "Manage scheduler daemon lifecycle (redirects to genie serve --headless)"
**Fix:** Add a note that `genie daemon` now redirects to `genie serve --headless`. The daemon is no longer a standalone process.

---

### Finding 27: [MEDIUM] `genie qa run` missing documented options

**Page:** genie/cli/observability.mdx (line 305-309)
**Docs say:** `genie qa run [target] [options]` with no options listed
**Source says:** `qa run --help` shows: `--timeout <seconds>` (default: 3600), `--parallel <n>` (default: 5), `--verbose`, `--ndjson`
**Fix:** Add options table for qa run with all 4 flags.

---

### Finding 28: [MEDIUM] `genie qa check` missing documented options

**Page:** genie/cli/observability.mdx (line 327-335)
**Docs say:** `genie qa check <specFile> [options]` with no options listed
**Source says:** `qa check --help` shows: `--team <name>`, `--since <timestamp>`, `--since-file <path>`
**Fix:** Add options table for qa check with all 3 flags.

---

### Finding 29: [MEDIUM] `genie export` missing `-o` alias documentation

**Page:** genie/cli/export-import.mdx (line 233-238)
**Docs say:** Shared export options: `--output <file>`, `--pretty`
**Source says:** Export also supports `-o <file>` as alias for `--output`
**Fix:** Add `-o` alias in the shared export options table.

---

### Finding 30: [MEDIUM] `genie export apps` subcommand does not exist

**Page:** genie/cli/export-import.mdx (line 208-211)
**Docs say:** `genie export apps [options]` — "Export the app store registry"
**Source says:** `export --help` does not list an `apps` subcommand. The available subcommands are: `agents`, `all`, `boards`, `comms`, `config`, `projects`, `schedules`, `tags`, `tasks`
**Fix:** Remove the `genie export apps` section from the docs. App data is included in the `agents` group or handled by `export all`.

---

### Finding 31: [LOW] `genie answer` docs differ from --help on argument naming

**Page:** genie/cli/agents.mdx (line 230-234)
**Docs say:** `genie answer <agent> '<response>'`
**Source says:** `Usage: genie answer <name> <choice>` — the second argument is called `choice`, not `response`. Also notes: `(use "text:..." for text input)`
**Fix:** Update to `genie answer <name> <choice>` and add note about `text:...` prefix.

---

### Finding 32: [MEDIUM] `genie daemon start --foreground` flag is for `serve start`, not just daemon

**Page:** genie/cli/scheduling.mdx (line 117-122)
**Docs say:** `genie daemon start [options]` with `--foreground` described as "Run in foreground (for systemd `ExecStart`)"
**Source says:** `daemon start --help` says "Start the scheduler daemon (alias for genie serve --headless)" with `--foreground` flag
**Fix:** The daemon start options should clarify these are passed through to `genie serve`. The --foreground description in docs says "for systemd ExecStart" but the help just says "Run in foreground (default)".

---

### Finding 33: [LOW] `genie daemon logs` description mismatch

**Page:** genie/cli/scheduling.mdx (line 154-159)
**Docs say:** "Tail structured JSON scheduler logs"
**Source says:** `daemon logs` description is "Tail structured JSON scheduler log" (singular "log")
**Fix:** Minor wording — change "logs" to "log" in description.

---

## Summary

| Severity | Count |
|----------|-------|
| CRITICAL | 0     |
| HIGH     | 8     |
| MEDIUM   | 22    |
| LOW      | 3     |
| **Total** | **33** |

### HIGH findings breakdown:
1. `genie spawn` missing `--role`, `--new-window`, `--window` flags (agents.mdx)
2. `genie spawn` missing `--team`, `--skill` in agents.mdx duplicate section
3. `genie spawn --team` default value "genie" not documented (spawn.mdx)
4. `genie work` wrong command signature (agent/ref order swapped)
5. `genie team create --session` deprecated, replaced by `--tmux-session`; missing `--no-spawn`
6. `genie sessions ingest` renamed to `genie sessions sync`
7. `genie task link --url` does not exist (replaced by `--gh`, `--external-id`, `--external-url`)
8. `genie agent register` has 7 flags but docs show zero

### Undocumented new commands (from diff summary, not in any docs page):
- `genie app` -- documented in infrastructure.mdx (OK)
- `genie broadcast` -- documented in messaging.mdx (OK)
- `genie chat` -- documented in messaging.mdx (OK)
- `genie done` -- documented in dispatch.mdx (OK)
- `genie reset` -- documented in dispatch.mdx (OK)
- `genie stop` -- documented in agents.mdx and spawn.mdx (OK)
- `genie read` -- documented in agents.mdx (OK)
- `genie shortcuts` -- documented in infrastructure.mdx (OK)
- `genie brain` -- NOT documented in any CLI page (new enterprise command)
- `genie doctor` -- documented in infrastructure.mdx (OK)

### Net new command missing from docs:
- `genie brain` (Knowledge graph engine, enterprise) has no CLI docs page
