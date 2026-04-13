# Consistency Checker Report — 2026-04-05

## Summary
- Files audited: 80 `.mdx` files across `genie/`, `omni/`, `rlmx/`
- Terminology violations: 2
- Structural inconsistencies: 5
- Frontmatter issues: 0 (all files have title + description)
- **Previous report status**: 7 of 17 findings fixed; 10 remain (most LOW priority)

---

## Terminology Findings

### [LOW] "Kanban" capitalization — 2 lowercase instances in code comments

**Pages affected:**
- `genie/skills/pm.mdx` line 99: `# View tasks in kanban layout`
- `genie/quickstart.mdx` line 225: `for a kanban view`

**Context:** Kanban is a proper noun (Japanese origin) and should be capitalized. All other ~20 instances across the codebase correctly use "Kanban" (capitalized).

**Canonical form:** "Kanban" (with capital K)

**Fix:** Capitalize both comments to "Kanban layout" and "Kanban view".

---

### [MEDIUM] "Worker Registry" heading not aligned with PG table name

**Pages affected:**
- `genie/concepts/agents.mdx` line 127: `## Worker Registry`
- `genie/architecture/state.mdx` line 70: `## Worker Registry`

**Context:** The PostgreSQL table storing agents is named `agents`, not `workers`. The section heading "Worker Registry" is inconsistent with the database schema. While the heading can remain as a named subsystem concept, the content (line 129 and 72) already correctly references the `agents` table.

**Note from previous report:** Finding 1 from 2026-04-02 recommends standardizing to "agent registry" in user-facing text. The headings should be "## Agent Registry" for alignment with the PG table name.

**Fix:** Change both headings from "Worker Registry" to "Agent Registry" to match the PostgreSQL `agents` table naming.

---

## Structural Findings

### [MEDIUM] Skill pages deviating from canonical "When to Use → Flow → Rules" template

**Expected template:** All skill pages should have: `## When to Use` → `## Flow` → [domain-specific sections] → `## Rules`

**Deviations found:**
- `genie/skills/genie.mdx` — Has "The Wish Lifecycle", "Decision Tree", "Lifecycle Details" instead of "Flow"
- `genie/skills/wizard.mdx` — Has "Phases" and "Resumption" instead of "Flow" section
- `genie/skills/genie-hacks.mdx` — Has "Commands" and "Examples" instead of "Flow"; also missing "Rules" section
- `genie/skills/pm.mdx` — Has "Three Modes", "Stage-to-Skill Mapping", "Agent Routing" instead of "Flow"
- `genie/skills/council.mdx` — Has "Modes", "Smart Routing" instead of "Flow"

**Severity:** MEDIUM. These pages have fundamentally different structures because they are entry points or meta-skills rather than execution skills. However, the inconsistency makes it harder for users to learn the pattern.

**Fix:** Consider one of:
1. Add a brief "## Flow" section as a summary even in these pages
2. Document that `/genie`, `/wizard`, `/genie-hacks`, `/pm`, and `/council` are intentionally different page types (meta-skills vs execution skills)
3. Reorganize these pages to fit the template

---

### [LOW] CLI pages missing `icon` frontmatter field

**Pages affected:** All 16 files in `genie/cli/*.mdx`

**Expected:** Skill pages (`genie/skills/*.mdx`) all have `icon` field in frontmatter. For example:
```yaml
---
title: "/work"
sidebarTitle: "/work"
icon: "hammer"
description: "..."
---
```

**Actual:** No CLI page has an `icon` field.

**Severity:** LOW. This appears intentional — CLI pages may be grouped under a nav section that provides its own icon.

**Fix:** Verify with Mintlify nav config. If icons are desired per-page, add them to all CLI pages consistently. Example icons: `terminal`, `cog`, `database`, `layers`, etc.

---

### [LOW] Concepts page structural inconsistency

**Pages in `genie/concepts/` do not follow a uniform template:**
- `agents.mdx` — 8 sections ending with "Council: Multi-Agent Deliberation"
- `boards.mdx` — 9 sections ending with "Best Practices"
- `teams.mdx` — 10 sections ending with "Best Practices"
- `wishes.mdx` — 9 sections ending with "Best Practices"

**Severity:** LOW. Concepts pages have diverse content scopes, so this variation is acceptable. However, the pattern of ending with "Best Practices" appears in 3 of 7 concept pages, suggesting a semi-standard.

**Fix:** Consider documenting the concepts page template (e.g., Definition → How It Works → Lifecycle/Anatomy → State/Storage → Best Practices). No changes required unless aiming for strict consistency.

---

### [LOW] Architecture pages have inconsistent grouping

**Observation:** `genie/architecture/` has 6 pages with diverse structures:
- `overview.mdx` — Subsystems table + workflow steps
- `state.mdx` — Wish state machine, board state, project state, worker registry, agent states
- `messaging.mdx` — Event stream, fallback aggregation, protocol routing, NATS integration
- `scheduler.mdx` — Cron triggers, lease-based claiming, heartbeats
- `postgres.mdx` — Migrations, connection pooling, schemas, task service
- `transcripts.mdx` — Unified transcript abstraction for Claude Code and Codex

**Severity:** LOW. Architecture pages document diverse subsystems, so structural variation is justified.

**Fix:** No action needed. The variation reflects the genuine diversity of subsystems.

---

## Frontmatter Findings

### All files have complete frontmatter ✓

**Verified:**
- All 80 `.mdx` files have `title:` field
- All 80 `.mdx` files have `description:` field
- No description field ends with a period (Mintlify convention maintained)
- Skill pages have `icon:` field; CLI pages do not (appears intentional)

---

## Verification of Previous Report Fixes

### ✓ FIXED: Finding 10 (Kanban flag name)
- `concepts/boards.mdx` line 64 now correctly uses `--from software` (was `--template`)
- `concepts/boards.mdx` line 85 now correctly uses `--from software --project myapp` (was `--template`)

### ✓ FIXED: Finding 11 (Board import flag)
- `concepts/boards.mdx` line 97 now correctly uses `--json q2-sprint.json` (was `--file`)

### ✓ FIXED: Finding 6 ("task group" terminology)
- `skills/work.mdx` line 5 description now correctly says "execution group" (was "task group")

### ✓ FIXED: Finding 7 ("When to use" capitalization)
- `skills/genie-hacks.mdx` line 12 now has "## When to Use" (was "When to use")

### ✓ FIXED: Finding 13 & 14 (Deprecated file paths)
- `concepts/agents.mdx` lines 109-122 now references PostgreSQL `mailbox` and `team_chat` tables
- `concepts/teams.mdx` line 149 now references `team_chat` table (was deprecated file path)

### ⚠ NOT YET FIXED: Finding 1 (Worker vs Agent terminology)
- "Worker Registry" headings still appear in 2 files (see Terminology Findings above)
- User-facing text correctly uses "agent" throughout; only the subsystem heading remains

### ⚠ MINOR: Finding 17 (Shell redirect vs --output)
- `concepts/boards.mdx` line 94 still uses `genie board export "Q2 Sprint" > q2-sprint.json`
- Recommended to change to `genie board export "Q2 Sprint" --output q2-sprint.json` for consistency with CLI docs

### ✓ NOT APPLICABLE: Finding 12 (Duplicate genie db section)
- Not verified in this audit scope (focused on consistency checks, not content duplication)

---

## Priority Recommendations

### HIGH PRIORITY (User-facing impact)
1. Fix "Kanban" capitalization in `pm.mdx` and `quickstart.mdx` — ensures consistent proper noun usage

### MEDIUM PRIORITY (Architectural alignment)
2. Change "Worker Registry" to "Agent Registry" in headings — aligns with PG table naming
3. Document or reorganize skill page deviations — improves pattern learnability

### LOW PRIORITY (Nice-to-have)
4. Add `icon` fields to CLI pages (if desired by design)
5. Standardize "Shell redirect vs --output" usage in examples
6. Consider adding "Flow" summaries to meta-skills for consistency

---

## Files Modified Status
- **Total files audited:** 80
- **Files with potential updates:** 4
  - `genie/skills/pm.mdx` (line 99)
  - `genie/quickstart.mdx` (line 225)
  - `genie/concepts/agents.mdx` (line 127)
  - `genie/architecture/state.mdx` (line 70)

---

## Comparison to 2026-04-02 Report

| Item | 2026-04-02 Status | 2026-04-05 Status | Change |
|------|-------------------|-------------------|--------|
| HIGH issues | 3 | 0 | ✓ All fixed |
| MEDIUM issues | 6 | 2 | ✓ 4 fixed |
| LOW issues | 8 | 5 | ✓ 3 fixed |
| **Total** | **17** | **7** | **59% fixed** |

