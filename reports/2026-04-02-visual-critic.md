# Visual/Formatting Audit Report — Genie Docs

**Date:** 2026-04-02
**Scope:** 56 `.mdx` files under `genie/`
**Auditor:** visual-critic agent

---

## Heading Hierarchy Issues

### Issue 1: [HIGH] Skipped heading level (H1 -> H3)
**Page:** genie/cli/agents.mdx (line 11)
**Problem:** `### Agent Lifecycle at a Glance` follows `# Agent Commands` — jumps from H1 to H3, skipping H2.
**Fix:** Change to `## Agent Lifecycle at a Glance` or add an intermediate H2 section.

### Issue 2: [HIGH] Skipped heading level (H1 -> H3)
**Page:** genie/cli/export-import.mdx (line 11)
**Problem:** `### At a Glance` follows `# Export & Import` — jumps from H1 to H3, skipping H2.
**Fix:** Change to `## At a Glance`.

### Issue 3: [HIGH] Skipped heading level (H1 -> H3)
**Page:** genie/cli/messaging.mdx (line 11)
**Problem:** `### Messaging at a Glance` follows `# Messaging Commands` — jumps from H1 to H3, skipping H2.
**Fix:** Change to `## Messaging at a Glance`.

---

## Missing Code Block Language Tags

### Issue 4: [MEDIUM] Code block missing language tag
**Page:** genie/quickstart.mdx (line 30)
**Problem:** Output block for `genie doctor` opens as bare ` ``` ` with no language identifier.
**Fix:** Add ` ```text ` for plain-text output blocks.

### Issue 5: [MEDIUM] Code block missing language tag
**Page:** genie/quickstart.mdx (line 60)
**Problem:** Instruction text block (paste-into-agent content) opens as bare ` ``` `.
**Fix:** Add ` ```text `.

### Issue 6: [MEDIUM] Code block missing language tag
**Page:** genie/quickstart.mdx (line 98)
**Problem:** `/brainstorm` invocation example uses bare ` ``` `.
**Fix:** Add ` ```text `.

### Issue 7: [MEDIUM] Code block missing language tag
**Page:** genie/quickstart.mdx (line 112)
**Problem:** `/wish` invocation example uses bare ` ``` `.
**Fix:** Add ` ```text `.

### Issue 8: [MEDIUM] Code block missing language tag
**Page:** genie/quickstart.mdx (line 126)
**Problem:** `/work` invocation example uses bare ` ``` `.
**Fix:** Add ` ```text `.

### Issue 9: [MEDIUM] Code block missing language tag
**Page:** genie/quickstart.mdx (line 132)
**Problem:** `/review` invocation example uses bare ` ``` `.
**Fix:** Add ` ```text `.

---

## Missing Frontmatter Fields

### Issue 10: [LOW] Missing `icon` in frontmatter (41 files)
**Pages:** All files except the 15 skill pages (`genie/skills/*.mdx`) which have `icon` set.
**Problem:** 41 of 56 pages lack the `icon` frontmatter field. Mintlify uses `icon` for sidebar icons and navigation cards.
**Fix:** Add `icon` to each page's frontmatter. Suggested icons per section:

| Section | Suggested icon |
|---------|---------------|
| `architecture/*` | `sitemap`, `diagram-project`, `database`, `clock`, `file-lines`, `layer-group` |
| `cli/*` | `terminal` |
| `concepts/*` | `book` |
| `config/*` | `gear`, `puzzle-piece`, `code-branch` |
| `genie/index.mdx` | `house` |
| `genie/quickstart.mdx` | `rocket` |
| `genie/installation.mdx` | `download` |
| `genie/features.mdx` | `stars` |
| `genie/hacks.mdx` | `lightbulb` |
| `genie/contributing.mdx` | `code-pull-request` |

All frontmatter is complete for `title` and `description` across all 56 files -- no HIGH-severity frontmatter gaps.

---

## Component Usage Opportunities

### Issue 11: [LOW] Long pages without Mintlify components (32 files)
**Problem:** 32 of 56 pages use zero Mintlify components (`Note`, `Warning`, `Tip`, `Card`, `Steps`, etc.). While not every page needs components, several long pages would benefit from them.
**Fix:** Priority recommendations for component additions:

| Page | Lines | Recommendation |
|------|-------|----------------|
| `cli/observability.mdx` | 344 | Add `<Tabs>` to group the 7 command sections (Events, Log, Brief, Sessions, Metrics, Schedule, QA) |
| `cli/infrastructure.mdx` | 307 | Add `<Warning>` for destructive commands (`uninstall`), `<Note>` for db query |
| `cli/registry.mdx` | 234 | Add `<Steps>` for the install workflow, `<Accordion>` for manifest type-specific sections |
| `cli/scheduling.mdx` | 228 | Add `<Note>` for timezone handling, `<Warning>` for lease timeouts |
| `cli/boards.mdx` | 196 | Add `<Tip>` for template usage, `<Note>` for gate explanations |
| `architecture/postgres.mdx` | 218 | Add `<AccordionGroup>` for migration details (001-009) |
| `architecture/scheduler.mdx` | 195 | Add `<Warning>` for orphan reconciliation behavior |
| `architecture/transcripts.mdx` | 195 | Add `<Note>` for provider detection fallback |
| `architecture/messaging.mdx` | 181 | Add `<Tip>` about NATS being optional |
| `cli/team.mdx` | 173 | Add `<Warning>` for `disband` destructiveness |
| `concepts/agents.mdx` | 148 | Add `<AccordionGroup>` for the identity files section (SOUL/HEARTBEAT/AGENTS) |
| `skills/pm.mdx` | 140 | Add `<Tabs>` for the three mode descriptions (Copilot/Autopilot/Pair) |

### Issue 12: [LOW] Infrastructure page duplicates database commands
**Page:** genie/cli/infrastructure.mdx (lines 202-260)
**Problem:** The `genie db status`, `genie db migrate`, and `genie db query` commands are documented in both `cli/infrastructure.mdx` and `cli/database.mdx`. The infrastructure page has a less detailed version.
**Fix:** Remove the `## genie db` section from `infrastructure.mdx` and add a cross-reference link to `cli/database.mdx` instead.

---

## Text Wall Analysis

No text walls detected (>10 consecutive prose lines without breaks). The documentation consistently uses tables, code blocks, lists, and component breaks to maintain readability. This is a strength of the current docs.

---

## Aggregate Summary

| Severity | Count | Category |
|----------|-------|----------|
| **HIGH** | 3 | Skipped heading levels (H1->H3) |
| **MEDIUM** | 6 | Missing code block language tags |
| **LOW** | 44 | Missing frontmatter `icon` (41), component opportunities (2), duplicate content (1) |
| **Total** | 53 | |

### Severity Breakdown

| Category | HIGH | MEDIUM | LOW |
|----------|------|--------|-----|
| Heading hierarchy | 3 | 0 | 0 |
| Code block language tags | 0 | 6 | 0 |
| Frontmatter completeness | 0 | 0 | 41 |
| Component opportunities | 0 | 0 | 2 |
| Content duplication | 0 | 0 | 1 |

### Overall Assessment

The genie documentation is well-structured overall. Key strengths:
- All 56 pages have `title` and `description` frontmatter
- No text walls detected -- prose is consistently broken up with tables, code, and lists
- All code blocks outside `quickstart.mdx` have language tags
- 24 of 56 pages use Mintlify components effectively (Steps, CodeGroup, AccordionGroup, Card, Warning, Note, Tip, Info)

The 3 HIGH issues (heading jumps) and 6 MEDIUM issues (missing language tags) are all concentrated in just 4 files and are quick fixes. The LOW-severity `icon` frontmatter gap is systemic but cosmetic -- the skill pages show the desired pattern.

### Quick Fix Priority

1. **Fix 3 heading jumps** in `cli/agents.mdx`, `cli/export-import.mdx`, `cli/messaging.mdx` -- change `###` to `##` for the "At a Glance" sections.
2. **Add language tags** to 6 code blocks in `quickstart.mdx` -- use ` ```text ` for output blocks.
3. **Add `icon`** to the 41 pages missing it -- batch operation, 5 minutes.
4. **Add components** to the highest-traffic long pages (observability, infrastructure, registry) for better UX.
