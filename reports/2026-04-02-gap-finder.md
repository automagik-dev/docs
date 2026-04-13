# Documentation Gap Report — 2026-04-02

**Agent:** gap-finder
**Source version:** v4.260402.18 (216 commits since docs freeze 2026-03-30)
**CLI help files analyzed:** 197
**Docs pages analyzed:** 56 .mdx files
**Source skills analyzed:** 17 SKILL.md files

---

## Methodology

1. Compared all 197 CLI help files against docs pages
2. Compared all 17 source SKILL.md files against 15 skill docs pages
3. Scanned all .mdx files for stubs and thin content
4. Cross-referenced diff summary (genie-v4-summary.md) against docs coverage
5. Verified each known gap against actual source and docs

---

## Gaps

### Gap 1: [CRITICAL] `/brain` skill — no docs page

**What exists in source:** Full SKILL.md at `/home/genie/workspace/repos/genie/skills/brain/SKILL.md` (283 lines). Covers lifecycle commands (init, create, archive, migrate), ingest commands (update, process, watch, mount, unmount), query commands (search, get, analyze), knowledge commands (link, health, status), identity/RBAC commands (attach, detach, list), observability commands (traces, strategy, cache), search strategies (RAG/CAG), and confidence scoring.

**What docs have:** Nothing. No `/home/genie/workspace/repos/docs/genie/skills/brain.mdx` exists. Zero mentions of "brain" or "knowledge graph" in any docs page.

**Suggested docs scope:** New page at `skills/brain.mdx` covering: overview, prerequisites (`genie brain install`), lifecycle, ingest, query, knowledge, RBAC, observability, search strategies (RAG vs CAG), and confidence scoring table. This is a major enterprise feature.

---

### Gap 2: [CRITICAL] `genie brain` CLI command — no docs page

**What exists in source:** CLI help file at `state/cli-help/genie/brain.txt` confirms `genie brain` exists as a top-level command ("Knowledge graph engine (enterprise)"). The SKILL.md documents 30+ subcommands (brain init, brain create, brain search, brain update, brain process, brain watch, brain mount, brain unmount, brain get, brain analyze, brain link, brain health, brain status, brain attach, brain detach, brain list, brain traces, brain strategy, brain cache, brain archive, brain migrate, brain install).

**What docs have:** Nothing. Not documented in any CLI page. Not mentioned in the infrastructure or observability pages.

**Suggested docs scope:** New CLI reference page (either standalone `cli/brain.mdx` or section in existing page) covering all brain subcommands with examples.

---

### Gap 3: [CRITICAL] `/learn` skill — exists in source, docs claim it was removed

**What exists in source:** Full SKILL.md at `/home/genie/workspace/repos/genie/skills/learn/SKILL.md` (109 lines). Behavioral correction skill that diagnoses mistakes, determines root cause, proposes minimal fixes to behavioral surfaces (CLAUDE.md, AGENTS.md, SOUL.md, global rules, hooks, etc.), and saves learnings to Claude native memory.

**What docs have:** The concepts/skills.mdx page explicitly states: "The `/learn` skill was removed as a standalone skill -- behavioral corrections are now handled through Claude Code's native memory system." This is factually wrong -- the skill exists and is actively used.

**Suggested docs scope:** New page at `skills/learn.mdx` covering: when to use, writable surfaces table, never-touch surfaces, Claude native memory connection, flow, and examples. Also fix the incorrect removal note in `concepts/skills.mdx`.

---

### Gap 4: [HIGH] Spawn flags `--role`, `--new-window`, `--window` — undocumented

**What exists in source:** CLI help shows three new flags added in commit `badef105`:
- `--role <role>` — Override role name for registration (avoids duplicate guard)
- `--new-window` — Create a new tmux window instead of splitting
- `--window <target>` — Tmux window to split into (e.g., genie:3)

**What docs have:** Neither `/home/genie/workspace/repos/docs/genie/cli/agents.mdx` nor `/home/genie/workspace/repos/docs/genie/cli/spawn.mdx` list these flags. Both pages list other spawn flags but miss these three.

**Suggested docs scope:** Add three rows to the spawn options table in both `cli/agents.mdx` and `cli/spawn.mdx`.

---

### Gap 5: [HIGH] `genie work` auto-orchestration mode — undocumented

**What exists in source:** CLI help shows `genie work <ref> [agent]` — where agent is optional. When no agent is specified, `genie work <slug>` auto-orchestrates the entire wish (picks next ready group, spawns agents, manages waves). This is the primary usage mode.

**What docs have:** `cli/dispatch.mdx` documents only the manual mode: `genie work <agent> <slug>#<group>` — with agent as mandatory and group as required. The auto-orchestration form is not mentioned.

**Suggested docs scope:** Update dispatch.mdx to show both forms: auto-orchestration (`genie work <slug>`) and manual dispatch (`genie work <slug>#<group> <agent>`). Explain when each is used.

---

### Gap 6: [HIGH] Serve/daemon unification — undocumented

**What exists in source:** Commit `604b26f9` unified serve and daemon under single process ownership. The `genie serve start` command now supports `--headless` flag ("Run without TUI: services only — pgserve, scheduler, inbox-watcher"). `genie daemon` now redirects to `genie serve --headless`.

**What docs have:** `cli/infrastructure.mdx` documents `genie serve` without the `--headless` flag. `cli/scheduling.mdx` documents `genie daemon` without mentioning it's now a redirect to serve.

**Suggested docs scope:** Update `cli/infrastructure.mdx` to add `--headless` flag to serve start options. Update `cli/scheduling.mdx` to note daemon is now an alias for `genie serve --headless`.

---

### Gap 7: [HIGH] TUI system stats panel — undocumented

**What exists in source:** Commits `9caf4e42` and `8e7c4b8f` add a system stats panel to the TUI left menu bottom, using `systeminformation` for accurate hardware metrics.

**What docs have:** Nothing. The TUI section in `cli/infrastructure.mdx` is minimal (6 lines total) — just the command and `--dev` flag. No mention of panels, layout, or system stats.

**Suggested docs scope:** Expand TUI section in `cli/infrastructure.mdx` with description of panels, system stats, and how to interpret the display.

---

### Gap 8: [HIGH] TUI context menu — undocumented

**What exists in source:** Commits `9f7add83` and `389a9423` add context menu with per-node actions, pane rename support, and Start/Clone labels.

**What docs have:** Nothing. TUI documentation is minimal.

**Suggested docs scope:** Document TUI context menu actions, how to access them, and what operations they support (start, clone, rename).

---

### Gap 9: [HIGH] Auto-resume on spawn — undocumented as a feature

**What exists in source:** Commit `ed925681` — "auto-resume Claude session on genie spawn instead of creating new". This is a significant behavior change: spawn now resumes dead sessions instead of creating fresh ones. The `--no-auto-resume` flag exists to opt out.

**What docs have:** The `--no-auto-resume` flag is listed in spawn options, but there is no explanation of what auto-resume is, why it was added, or how it works. The concept is never explained.

**Suggested docs scope:** Add a paragraph in spawn section or concepts/agents.mdx explaining auto-resume behavior: when spawn detects a dead session for the same agent, it resumes instead of creating fresh. Mention the `--no-auto-resume` escape hatch.

---

### Gap 10: [HIGH] PG LISTEN/NOTIFY for mailbox — partially documented

**What exists in source:** Commit `44a153a3` — "wire PG LISTEN/NOTIFY for instant message delivery". This replaces polling for mailbox delivery.

**What docs have:** `architecture/postgres.mdx` documents LISTEN/NOTIFY channels including `genie_message`, but doesn't explain the migration from polling to instant delivery for the mailbox system. The messaging architecture page still describes the old file-based mailbox system.

**Suggested docs scope:** Update `architecture/messaging.mdx` to reflect PG-backed instant delivery. Note that LISTEN/NOTIFY replaced file polling for mailbox delivery.

---

### Gap 11: [MEDIUM] `genie init` workspace initialization — undocumented

**What exists in source:** CLI help shows `genie init` as "Initialize a genie workspace" with subcommand `agent <name>`.

**What docs have:** Only `genie init agent` is documented (in `cli/directory.mdx`). The parent `genie init` command for workspace initialization is not mentioned anywhere.

**Suggested docs scope:** Document `genie init` in installation or setup pages — what it creates, when to run it, and how it differs from `genie setup`.

---

### Gap 12: [MEDIUM] OSC 52 clipboard passthrough — undocumented

**What exists in source:** Commit `22aa5515` — "enable OSC 52 clipboard passthrough in nested tmux layers".

**What docs have:** Nothing. The tmux config page (`config/tmux.mdx`) does not mention clipboard, OSC 52, or nested passthrough.

**Suggested docs scope:** Add a section to `config/tmux.mdx` about clipboard behavior in nested tmux, how OSC 52 passthrough works, and any configuration needed.

---

### Gap 13: [MEDIUM] Agent frontmatter sync with Zod validation — undocumented

**What exists in source:** Diff summary mentions "Agent Frontmatter Sync — Zod-validated frontmatter, metadata JSONB" as a new feature.

**What docs have:** Brief mention of AGENTS.md frontmatter in `cli/registry.mdx` line 232, but no docs on Zod validation, what fields are validated, or the metadata JSONB column.

**Suggested docs scope:** Add section to `config/files.mdx` or `concepts/agents.mdx` about AGENTS.md frontmatter schema, Zod validation rules, and how metadata is stored in PG.

---

### Gap 14: [MEDIUM] `genie brain install` — undocumented

**What exists in source:** Multiple commits reference `genie brain install` (13a1bb3b, 85e1cade, dc5ff22f). It installs the brain package from a GitHub repo.

**What docs have:** SKILL.md mentions "Brain must be installed: `genie brain install`" but no docs page documents this command.

**Suggested docs scope:** Include in brain CLI documentation — prerequisites section showing `genie brain install` as a first step.

---

### Gap 15: [MEDIUM] Messaging architecture page describes stale file-based mailbox

**What exists in source:** Messaging has migrated to PG-backed conversations. `genie send`, `genie broadcast`, `genie chat` all use PostgreSQL.

**What docs have:** `architecture/messaging.mdx` still describes "Write to mailbox JSON (.genie/mailbox/<id>.json)" in the delivery flow diagram (line 82). The protocol router section mentions file-based delivery and native inbox file drops.

**Suggested docs scope:** Update `architecture/messaging.mdx` to reflect PG-backed messaging throughout. Replace file-based mailbox references with PG conversation/message table references.

---

### Gap 16: [MEDIUM] Skills concepts page lists 14 skills but source has 17

**What exists in source:** 17 SKILL.md files exist: brain, brainstorm, council, docs, dream, fix, genie, genie-hacks, learn, pm, refine, report, review, trace, wish, wizard, work.

**What docs have:** `concepts/skills.mdx` lists 14 skills. Missing: `/brain`, `/learn`, and `/genie-hacks` is not in the count (though it has its own docs page). The page says "Genie ships with 14 skills" but the actual count is 17.

**Suggested docs scope:** Update skill count and add `/brain` and `/learn` to the appropriate tables. Add `/genie-hacks` to a utility or community section.

---

### Gap 17: [LOW] Ctrl+T parallel worker spawning — undocumented

**What exists in source:** Diff summary mentions "Ctrl+T Parallel Workers — TUI shortcut for spawning parallel agents".

**What docs have:** `cli/infrastructure.mdx` mentions Ctrl+T as "new tab" in the shortcuts table, but does not describe the parallel worker spawning behavior.

**Suggested docs scope:** Note in TUI or shortcuts documentation that Ctrl+T spawns parallel workers in the TUI.

---

### Gap 18: [LOW] Spawn watchdog + dynamic leader identity — undocumented

**What exists in source:** Diff summary lists "Spawn watchdog + dynamic leader identity" as a stability fix.

**What docs have:** Nothing. No mention of spawn watchdog or how leader identity is dynamically resolved.

**Suggested docs scope:** Brief mention in architecture or team concepts about spawn watchdog behavior.

---

### Gap 19: [LOW] `concepts/skills.mdx` incorrectly claims `/learn` was removed

**What exists in source:** `/learn` SKILL.md exists and is functional at `/home/genie/workspace/repos/genie/skills/learn/SKILL.md`.

**What docs have:** Line 85 of `concepts/skills.mdx` states: "The `/learn` skill was removed as a standalone skill."

**Suggested docs scope:** Remove the incorrect note or replace with accurate description of `/learn`.

---

### Gap 20: [LOW] Thin TUI documentation

**What exists in source:** TUI has system stats panel, context menus, per-node actions, pane rename, sub-agent nesting, and env restore. Multiple commits add features.

**What docs have:** `cli/infrastructure.mdx` has 6 lines for TUI: the command, `--dev` flag, and two examples. No description of what the TUI looks like, its panels, or how to use it.

**Suggested docs scope:** Expand TUI section with screenshots or ASCII mockup, panel descriptions, keyboard shortcuts within TUI, and interaction model.

---

## Summary Matrix

| Severity | Count | Gaps |
|----------|-------|------|
| **CRITICAL** | 3 | `/brain` skill (#1), `genie brain` CLI (#2), `/learn` skill contradiction (#3) |
| **HIGH** | 7 | Spawn flags (#4), work auto-orchestrate (#5), serve/daemon unification (#6), TUI stats (#7), TUI context menu (#8), auto-resume (#9), PG LISTEN/NOTIFY mailbox (#10) |
| **MEDIUM** | 6 | `genie init` (#11), OSC 52 clipboard (#12), agent frontmatter sync (#13), brain install (#14), stale messaging arch (#15), skill count (#16) |
| **LOW** | 4 | Ctrl+T parallel workers (#17), spawn watchdog (#18), incorrect /learn removal note (#19), thin TUI docs (#20) |
| **Total** | **20** | |

## Priority Recommendations

1. **Immediate:** Create `skills/brain.mdx` and `skills/learn.mdx` (Gaps 1, 2, 3, 14) -- these are the largest documentation holes
2. **Immediate:** Fix the incorrect `/learn` removal claim in `concepts/skills.mdx` (Gap 19) -- this is actively misleading
3. **High priority:** Update `cli/agents.mdx` and `cli/spawn.mdx` with new spawn flags (Gap 4)
4. **High priority:** Update `cli/dispatch.mdx` with auto-orchestration mode for `genie work` (Gap 5)
5. **High priority:** Update `cli/infrastructure.mdx` with serve `--headless` flag and TUI content (Gaps 6, 7, 8, 20)
6. **Medium priority:** Update `architecture/messaging.mdx` to remove stale file-based references (Gaps 10, 15)
7. **Medium priority:** Update `concepts/skills.mdx` skill count and tables (Gap 16)

---

*Report generated by gap-finder agent on 2026-04-02*
