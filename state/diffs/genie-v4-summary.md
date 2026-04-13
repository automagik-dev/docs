# Genie v4 Source Changes Since Docs Freeze

**Freeze point:** 2026-03-30 (docs commit `457f3925`)
**Current HEAD:** $(git rev-parse --short HEAD)
**Commits since:** 216 (126 files, 6823 insertions, 1289 deletions)
**Version range:** v4.260402.1 → v4.260402.18

## New Commands
| Command | Description |
|---------|-------------|
| `genie app` | Desktop app launcher (--backend-only, --tui, --dev) |
| `genie broadcast` | Team-wide PG-backed messaging |
| `genie chat` | Conversation management (list, read, send, thread) |
| `genie done` | Mark wish group as done |
| `genie reset` | Reset in-progress group to ready |
| `genie stop` | Stop agent, preserve session for resume |
| `genie read` | Read terminal output from agent pane |
| `genie shortcuts` | Manage tmux keyboard shortcuts (install, show, uninstall) |
| `genie brain` | Knowledge graph engine (enterprise) |
| `genie doctor` | Diagnostic checks (--fix auto-repairs) |

## New Spawn Flags
- `--role <role>` — Override role name for registration
- `--new-window` — Create new tmux window instead of splitting
- `--window <target>` — Tmux window to split into
- `--no-auto-resume` — Disable auto-resume on pane death

## New Export Subcommands
- `genie export agents|boards|comms|config|projects|schedules|tags|tasks|all`

## New Features
| Feature | Impact |
|---------|--------|
| Brain / Knowledge Graph | `genie brain` + `/brain` skill + pgvector + auto-brain hooks |
| TUI System Stats | System stats panel with systeminformation |
| TUI Context Menu | Per-node actions, pane rename, Start/Clone labels |
| PG LISTEN/NOTIFY | Instant message delivery replacing polling |
| Spawn Auto-Resume | Auto-resume Claude sessions on spawn |
| Serve/Daemon Unification | Single process ownership model |
| Agent Frontmatter Sync | Zod-validated frontmatter, metadata JSONB |
| Ctrl+T Parallel Workers | TUI shortcut for spawning parallel agents |
| OSC 52 Clipboard | Nested tmux clipboard passthrough |

## New Skills (undocumented)
- `/brain` — Knowledge graph with confidence scoring
- `/learn` — Behavioral correction + Claude native memory

## Architecture Changes
- Serve + daemon unified under single process ownership
- PG LISTEN/NOTIFY replaces polling for mailbox delivery
- Agent frontmatter with Zod validation + metadata JSONB column
- Auto-resume replaces fresh session creation on spawn
- Advisory locks for spawn guard (prevents duplicate spawns)
- Brain wiring with pgvector for vector similarity search

## Stability Fixes (v4 QA)
- Spawn watchdog + dynamic leader identity
- Blocking hook handlers deny on crash + slug validation
- Executor lifecycle + tmux race conditions
- Safe worktree removal + transactional cleanup
- Agent identity restoration on resume
- Session matching + selection stability
