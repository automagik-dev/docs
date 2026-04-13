# Consistency Checker Report — 2026-04-02

**Scope:** 56 `.mdx` files across `/home/genie/workspace/repos/docs/genie/`
**CLI help source:** `/home/genie/workspace/agents/docs/state/cli-help/genie/*.txt`

---

## Terminology Issues

### Finding 1: [MEDIUM] "worker" vs "agent" inconsistency

**Pages affected:** 16 files use "worker" (38 occurrences), 14 files use "workers" (25 occurrences)

**Inconsistency:** The user-facing term should be "agent" consistently, but many pages — especially architecture and internal-facing docs — use "worker" interchangeably. The term "worker registry" appears in 13 locations as a named concept, while the PostgreSQL table is called `agents` (migration 005). The heading in `concepts/agents.mdx` line 127 is "## Worker Registry", and `architecture/state.mdx` line 70 is "## Worker Registry", yet `cli/database.mdx` line 9 calls it "agent registry."

**Files with highest worker usage:**
- `/home/genie/workspace/repos/docs/genie/architecture/transcripts.mdx` (7 occurrences)
- `/home/genie/workspace/repos/docs/genie/architecture/messaging.mdx` (6 occurrences)
- `/home/genie/workspace/repos/docs/genie/architecture/state.mdx` (4 occurrences)
- `/home/genie/workspace/repos/docs/genie/concepts/byoa.mdx` (4 occurrences)

**Fix:** Standardize user-facing docs to "agent" throughout. The internal section name "Worker Registry" can remain as a named subsystem, but description text should say "agent registry" consistently. The concepts/agents.mdx and architecture/state.mdx headings should be changed to "Agent Registry" to match the PG table name (`agents`). The `config/files.mdx` legacy table still references `~/.genie/workers.json` which is fine as a historical reference, but narrative text should say "agent."

---

### Finding 2: [LOW] "worker registry" vs "agent registry" naming conflict

**Pages affected:**
- `cli/database.mdx` line 9: "agent registry"
- `concepts/agents.mdx` line 127: "Worker Registry" (heading)
- `architecture/state.mdx` line 70: "Worker Registry" (heading)
- `config/files.mdx` line 147: "Replaces `~/.genie/workers.json`"
- `concepts/skills.mdx` line 146: "Stateful (worker registry, mailbox)"

**Inconsistency:** The PostgreSQL table is `agents` (not `workers`). The JSON file it replaced was `workers.json`. The docs inconsistently call the same subsystem "worker registry" or "agent registry."

**Fix:** Standardize to "agent registry" everywhere in user-facing text. Keep "workers.json" only in the deprecated file reference.

---

### Finding 3: [LOW] "PG" abbreviation used inconsistently

**Pages affected:** 13 files use "PG" (23 occurrences), 20 files use "PostgreSQL" (64 occurrences), 10 files use "pgserve" (33 occurrences)

**Inconsistency:** The documentation mixes three terms for the database: "PG" (informal abbreviation), "PostgreSQL" (full name), and "pgserve" (the embedded binary). Most user-facing docs use "PostgreSQL" or "PG" without a clear pattern. Skills pages like `/fix`, `/trace`, `/review`, and `/work` use "PG task" as shorthand.

**Fix:** This is acceptable as-is since the three terms have distinct meanings (PG = general abbreviation, PostgreSQL = formal name, pgserve = the embedded instance). However, consider standardizing to "PostgreSQL" in concept/CLI pages and reserving "PG" for architecture/internal pages.

---

### Finding 4: [LOW] "Kanban" capitalization inconsistency

**Pages affected:**
- `concepts/boards.mdx` line 9: "Kanban-style" (capital K)
- `concepts/boards.mdx` line 4: "Kanban-style" (capital K)
- `cli/boards.mdx` line 4: "kanban-style" (lowercase)
- `cli/boards.mdx` line 9: "kanban-style" (lowercase)
- `architecture/state.mdx` line 51: "kanban pipelines" (lowercase)
- `cli/tasks.mdx` lines 58-59: "kanban view" (lowercase)
- `architecture/overview.mdx` line 59: "Kanban-style" (capital K)
- `features.mdx` line 25: "Kanban-style" (capital K)
- `index.mdx` line 85: "Kanban-style" (capital K)

**Inconsistency:** "Kanban" is a proper noun (Japanese origin) and should be capitalized consistently.

**Fix:** Standardize to "Kanban" (capitalized) everywhere. The lowercased instances in `cli/boards.mdx`, `architecture/state.mdx`, `cli/tasks.mdx`, `skills/pm.mdx`, and `quickstart.mdx` should be fixed.

---

### Finding 5: [MEDIUM] "tmux" capitalization inconsistency — "Tmux" in option descriptions

**Pages affected:**
- `cli/team.mdx` line 35: "Tmux session name"
- `cli/agents.mdx` line 108: "Tmux session name to spawn into"
- `cli/spawn.mdx` line 31: "Tmux session name to spawn into"

**Inconsistency:** tmux is always lowercase per its official documentation. Three CLI option description tables capitalize it as "Tmux."

**Fix:** Change "Tmux" to "tmux" in all three option table descriptions. The rest of the docs correctly use lowercase "tmux."

---

### Finding 6: [HIGH] "task group" used in /work description instead of "execution group"

**Pages affected:**
- `skills/work.mdx` line 5 (description): "orchestrate subagents per task group"

**Inconsistency:** The canonical term throughout the docs is "execution group" (12 occurrences across 8 files). The `/work` skill's own frontmatter description says "task group" instead. This is misleading because "task" and "execution group" are distinct concepts — a task is a PG entity, while an execution group is a section of a WISH.md.

**Fix:** Change the description in `skills/work.mdx` from "task group" to "execution group".

---

### Finding 7: [LOW] "When to use" vs "When to Use" capitalization

**Pages affected:**
- `skills/genie-hacks.mdx` line 12: "## When to use" (lowercase "use")
- All other 14 skill pages: "## When to Use" (capitalized)

**Inconsistency:** All skill pages use title case "When to Use" except `/genie-hacks`.

**Fix:** Change `skills/genie-hacks.mdx` line 12 from "## When to use" to "## When to Use".

---

## Structure Deviations

### Finding 8: [MEDIUM] CLI pages missing `icon` in frontmatter

**Pages affected:** All 16 CLI pages under `genie/cli/*.mdx`

**Expected:** Skill pages all have frontmatter with `title`, `description`, `sidebarTitle`, and `icon`.

**Actual:** No CLI page has an `icon` field in its frontmatter. All skill pages consistently include `icon`.

**Fix:** This may be intentional (CLI pages grouped under a nav section that provides its own icon). Verify with the Mintlify nav config. If icons are desired per-page, add them to all CLI pages consistently.

---

### Finding 9: [MEDIUM] Skill pages /genie, /wizard, /genie-hacks, and /pm missing "Flow" section

**Pages affected:**
- `skills/genie.mdx` — has "The Wish Lifecycle", "Decision Tree", "Lifecycle Details" instead of "Flow"
- `skills/wizard.mdx` — has "Phases" instead of "Flow"
- `skills/genie-hacks.mdx` — has "Commands" and "Examples" instead of "Flow"
- `skills/pm.mdx` — has "Three Modes", "Stage-to-Skill Mapping" instead of "Flow"
- `skills/council.mdx` — has "Modes", "Smart Routing" instead of "Flow"

**Expected:** The standard skill page template is: When to Use -> Flow -> [domain-specific sections] -> Rules.

**Actual:** 10 of 15 skill pages follow the When to Use -> Flow -> Rules pattern. Five skill pages substitute different section names. `/genie-hacks` also lacks a "Rules" section entirely.

**Fix:** This is partially acceptable since `/genie` (entry point), `/wizard` (onboarding), `/genie-hacks` (browsing), `/pm` (playbook), and `/council` (deliberation) have fundamentally different structures from pipeline skills. Consider adding a brief "## Flow" section as a summary even in these pages to maintain structural consistency, or document that these are intentionally different page types.

---

### Finding 10: [HIGH] `genie board create` flag inconsistency: `--from` (CLI) vs `--template` (concepts page)

**Pages affected:**
- `cli/boards.mdx` line 22: `--from <template>` — matches actual CLI help
- `concepts/boards.mdx` line 64: `genie board create "Sprint 12" --template software`
- `concepts/boards.mdx` line 85: `genie board create "Q2 Sprint" --template software --project myapp`

**CLI help source:** `board-create.txt` confirms the actual flag is `--from <template>`, NOT `--template`.

**Inconsistency:** The concepts/boards page uses a flag (`--template`) that does not exist. Users following the concepts page will get a CLI error.

**Fix:** Change both occurrences in `concepts/boards.mdx` from `--template` to `--from`:
- Line 64: `genie board create "Sprint 12" --from software`
- Line 85: `genie board create "Q2 Sprint" --from software --project myapp`

---

### Finding 11: [HIGH] `genie board import` flag inconsistency: `--json` (CLI page) vs `--file` (concepts page)

**Pages affected:**
- `cli/boards.mdx` line 109: `genie board import --json <file>` — matches actual CLI help
- `concepts/boards.mdx` line 97: `genie board import --file q2-sprint.json`

**CLI help source:** `board-import.txt` confirms the actual flag is `--json <file>`, NOT `--file`.

**Inconsistency:** The concepts/boards page uses a flag (`--file`) that does not exist. Users following the concepts page will get a CLI error.

**Fix:** Change `concepts/boards.mdx` line 97 from `genie board import --file q2-sprint.json` to `genie board import --json q2-sprint.json`.

---

### Finding 12: [MEDIUM] `genie db` commands documented in two places with different detail levels

**Pages affected:**
- `cli/database.mdx` — dedicated database CLI page with 6 commands (status, migrate, query, backup, restore, url)
- `cli/infrastructure.mdx` lines 202-260 — duplicates 3 of those commands (db status, db migrate, db query) with different example output

**Inconsistency:** `cli/infrastructure.mdx` includes a `## genie db` section that overlaps with the dedicated `cli/database.mdx` page. The `infrastructure.mdx` version of `genie db status` shows different output format than `database.mdx`. The infrastructure page is missing `backup`, `restore`, and `url` commands.

**Fix:** Remove the `## genie db` section from `cli/infrastructure.mdx` and replace with a cross-reference link: "See the [Database CLI reference](/genie/cli/database) for `genie db` commands." This eliminates divergent documentation.

---

### Finding 13: [MEDIUM] Concepts/agents.mdx references deprecated file-based messaging

**Pages affected:**
- `concepts/agents.mdx` lines 109-122: References `.genie/mailbox/<worker>.json` and `.genie/chat/<team>.jsonl`

**Inconsistency:** The messaging section in `concepts/agents.mdx` describes file-based mailbox and chat paths, but these were replaced by PostgreSQL tables in migration 005 (as documented in `config/files.mdx` and `architecture/state.mdx`). The `cli/messaging.mdx` page correctly describes PG-backed messaging.

**Fix:** Update `concepts/agents.mdx` Agent Communication section to reference PG-backed messaging. Remove the file path references (`.genie/mailbox/`, `.genie/chat/`) or mark them as deprecated legacy paths.

---

### Finding 14: [MEDIUM] Concepts/teams.mdx references deprecated file-based chat

**Pages affected:**
- `concepts/teams.mdx` line 149: "Team chat is stored in `.genie/chat/<team>.jsonl`"

**Inconsistency:** Same as Finding 13. Team chat is now stored in the PostgreSQL `team_chat` table. The same page correctly references PostgreSQL on line 185 in the "Team State" table.

**Fix:** Update line 149 to reference PG storage. The "Team State" table on line 185 already shows the correct location.

---

### Finding 15: [LOW] Architecture/overview.mdx shows outdated worker registry path

**Pages affected:**
- `architecture/overview.mdx` line 29: Shows `~/.genie/workers.json` in the ASCII diagram

**Inconsistency:** The workers.json file was replaced by the PostgreSQL `agents` table. The diagram still shows the legacy path.

**Fix:** Update the ASCII diagram to show `agents` table in PG instead of `~/.genie/workers.json`.

---

## Code Block Consistency

### Finding 16: [LOW] Mixed code block language tags in CLI pages

**Pages affected:** Multiple CLI pages

**Inconsistency:** Most CLI pages use `bash` for code blocks, but some examples use `bash Terminal` as the language tag for output examples (e.g., `cli/agents.mdx`, `cli/messaging.mdx`, `cli/team.mdx`). Others use just `bash` without the `Terminal` suffix. The `Terminal` suffix is a Mintlify CodeGroup label, not a language tag, but when used outside CodeGroups it appears inconsistently.

**Fix:** This is a style preference, not a bug. The `bash Terminal` pattern is used correctly inside `<CodeGroup>` blocks for tab labeling. Outside CodeGroups, plain `bash` is used. No change needed.

---

### Finding 17: [LOW] Concepts/boards.mdx export example uses shell redirect instead of `--output`

**Pages affected:**
- `concepts/boards.mdx` line 94: `genie board export "Q2 Sprint" > q2-sprint.json`

**Inconsistency:** The CLI reference in `cli/boards.mdx` and `cli/export-import.mdx` documents the `--output <file>` flag for exports. The concepts page uses shell redirect instead, which works but doesn't match the documented flag pattern.

**Fix:** Change to `genie board export "Q2 Sprint" --output q2-sprint.json` for consistency with the CLI reference.

---

## Summary

| Severity | Count | Category |
|----------|-------|----------|
| HIGH | 3 | Wrong CLI flags (2), wrong terminology in description (1) |
| MEDIUM | 6 | Inconsistent terms (2), duplicate docs (1), deprecated references (2), missing icons (1) |
| LOW | 8 | Capitalization (3), abbreviation style (1), structural variations (2), code style (2) |
| **Total** | **17** | |

### Priority Fixes (HIGH)

1. **Fix `--template` to `--from`** in `concepts/boards.mdx` (Finding 10)
2. **Fix `--file` to `--json`** in `concepts/boards.mdx` (Finding 11)
3. **Fix "task group" to "execution group"** in `skills/work.mdx` description (Finding 6)

### Recommended Fixes (MEDIUM)

4. Standardize "agent" over "worker" in user-facing text (Finding 1)
5. Fix "Tmux" to "tmux" in option tables (Finding 5)
6. Remove duplicate `genie db` section from `cli/infrastructure.mdx` (Finding 12)
7. Update deprecated file paths in `concepts/agents.mdx` and `concepts/teams.mdx` (Findings 13, 14)
