# Link Tracer Report — 2026-04-02

**Scope:** 55 genie `.mdx` files in `/home/genie/workspace/repos/docs/genie/`
**Internal links verified:** 65
**Broken links found:** 0
**Missing cross-references found:** 31
**Total orphan pages (no inbound + no outbound):** 11

---

## Broken Links

No broken internal links were found. All 65 internal links (markdown `[text](/path)` and JSX `href="/path"`) resolve to existing `.mdx` files. All anchor-only links within `hacks.mdx` also resolve correctly.

---

## Missing Cross-References

### Finding 1: [MEDIUM] spawn.mdx does not link to team.mdx or session.mdx
**Page A:** `genie/cli/spawn.mdx`
**Page B:** `genie/cli/team.mdx`, `genie/cli/session.mdx`
**Why they should link:** Spawn mentions "team" 3x and "session" 12x in its content but never links to the Team CLI or Session CLI pages. Teams use `spawn` internally, and sessions are created alongside spawned agents. Bidirectional: `team.mdx` and `session.mdx` also lack links back to `spawn.mdx`.

### Finding 2: [MEDIUM] tasks.mdx does not link to boards concept
**Page A:** `genie/cli/tasks.mdx`
**Page B:** `genie/concepts/boards.mdx`
**Why they should link:** Tasks mentions "board" 5x — tasks live on boards and move through board columns. Neither page links to the other. `boards.mdx` mentions "task" 14x but never links to the Tasks CLI.

### Finding 3: [MEDIUM] wishes.mdx does not link to /work, /brainstorm, or /wish skill pages
**Page A:** `genie/concepts/wishes.mdx`
**Page B:** `genie/skills/work.mdx`, `genie/skills/brainstorm.mdx`, `genie/skills/wish.mdx`
**Why they should link:** The wishes concept page describes the pipeline `brainstorm -> wish -> work -> review -> ship` and mentions `/work`, `/brainstorm`, and `/wish` by name, but none of these are hyperlinked to their skill reference pages. The skill pages also do not link back to the wishes concept.

### Finding 4: [MEDIUM] /work skill does not link to wishes concept or dispatch CLI
**Page A:** `genie/skills/work.mdx`
**Page B:** `genie/concepts/wishes.mdx`, `genie/cli/dispatch.mdx`
**Why they should link:** `/work` mentions "wish" 9x and "dispatch" multiple times. It orchestrates wish execution and uses dispatch commands, but links to neither. `dispatch.mdx` links to concepts/agents but not to the `/work` skill that drives it.

### Finding 5: [MEDIUM] /fix, /review, and /trace skills do not cross-link
**Page A:** `genie/skills/fix.mdx`
**Page B:** `genie/skills/review.mdx`, `genie/skills/trace.mdx`
**Why they should link:** These three skills form a tight loop: `/review` returns FIX-FIRST which triggers `/fix`; `/trace` investigates issues and hands off to `/fix`. Each page mentions the others by name (`/review` mentions `/fix` 3x, `/fix` mentions `/review` 3x, `/trace` mentions `/fix` 5x) but none are hyperlinked.

### Finding 6: [MEDIUM] /dream and /work skills do not cross-link
**Page A:** `genie/skills/dream.mdx`
**Page B:** `genie/skills/work.mdx`
**Why they should link:** `/dream` batch-executes wishes by spawning `/work` pipelines. Neither page mentions or links to the other despite the direct dependency.

### Finding 7: [MEDIUM] /pm skill does not link to boards concept
**Page A:** `genie/skills/pm.mdx`
**Page B:** `genie/concepts/boards.mdx`
**Why they should link:** The PM skill manages task flow across stages, which maps directly to the board column model. `pm.mdx` mentions "board" 2x without linking.

### Finding 8: [MEDIUM] /genie skill does not link to concepts/skills
**Page A:** `genie/skills/genie.mdx`
**Page B:** `genie/concepts/skills.mdx`
**Why they should link:** `/genie` is the router that dispatches to other skills. It should link to the skills overview page that catalogs all available skills. Currently mentions "skill" without linking.

### Finding 9: [MEDIUM] /wizard does not link to quickstart
**Page A:** `genie/skills/wizard.mdx`
**Page B:** `genie/quickstart.mdx`
**Why they should link:** The wizard is the onboarding skill, and the quickstart is the onboarding doc. The wizard mentions "setup" but never links to the quickstart (or vice versa).

### Finding 10: [MEDIUM] /docs skill and contributing page do not cross-link
**Page A:** `genie/skills/docs.mdx`
**Page B:** `genie/contributing.mdx`
**Why they should link:** The `/docs` skill generates and audits documentation. The contributing page covers how to contribute to the project including docs. Neither mentions or links to the other.

### Finding 11: [MEDIUM] infrastructure CLI and config/setup do not cross-link
**Page A:** `genie/cli/infrastructure.mdx`
**Page B:** `genie/config/setup.mdx`
**Why they should link:** The infrastructure page covers `genie setup`, `genie serve`, and diagnostics. The config/setup page covers `~/.genie/config.json` created by setup. `infrastructure.mdx` mentions "setup" 6x without linking to config/setup. Neither links to the other.

### Finding 12: [MEDIUM] cli/agents.mdx does not link to concepts/agents.mdx
**Page A:** `genie/cli/agents.mdx`
**Page B:** `genie/concepts/agents.mdx`
**Why they should link:** The CLI reference for agent commands should link to the concept page that explains what agents are. `concepts/agents.mdx` correctly links to both `cli/spawn` and `cli/agents`, but `cli/agents.mdx` has no return link.

### Finding 13: [LOW] cli/tasks.mdx does not link to concepts/wishes.mdx
**Page A:** `genie/cli/tasks.mdx`
**Page B:** `genie/concepts/wishes.mdx`
**Why they should link:** Wishes become tasks. The wishes concept page links to cli/tasks, but cli/tasks does not link back to explain where tasks originate from.

---

## Orphan Pages (No Inbound AND No Outbound Links)

These 11 pages are completely disconnected from the link graph — no other genie page links to them, and they link to no other genie page:

| Page | Category | Notes |
|------|----------|-------|
| `genie/cli/database.mdx` | CLI Reference | Covers `genie db` commands. Should link to `architecture/postgres.mdx`. |
| `genie/cli/directory.mdx` | CLI Reference | Covers `genie dir` commands. Should link to `concepts/agents.mdx`. |
| `genie/cli/export-import.mdx` | CLI Reference | Covers backup/restore. Could link to `architecture/postgres.mdx`. |
| `genie/cli/infrastructure.mdx` | CLI Reference | Covers `genie setup`, `genie serve`. Should link to `config/setup.mdx`. |
| `genie/cli/messaging.mdx` | CLI Reference | Covers `genie send`, `genie inbox`. Should link to `architecture/messaging.mdx`. |
| `genie/cli/registry.mdx` | CLI Reference | Covers `genie install`, `genie publish`. Could link to `concepts/skills.mdx`. |
| `genie/cli/releases-tags-types.mdx` | CLI Reference | Covers releases and tags. Could link to `cli/tasks.mdx`. |
| `genie/cli/scheduling.mdx` | CLI Reference | Covers `genie schedule`, `genie daemon`. Should link to `architecture/scheduler.mdx`. |
| `genie/config/tmux.mdx` | Configuration | Covers tmux transport layer. Should link to `cli/spawn.mdx`. |
| `genie/config/worktrees.mdx` | Configuration | Covers git worktree isolation. Should link to `cli/team.mdx`. |
| `genie/contributing.mdx` | Contributing | Development guide. Should link to `skills/docs.mdx` and `config/setup.mdx`. |

---

## Pages With No Inbound Links (But Have Outbound)

These 3 pages link out to other pages but no other page links to them:

| Page | Outbound Links | Notes |
|------|---------------|-------|
| `genie/architecture/scheduler.mdx` | 2 | Links to postgres and state, but nothing links to the scheduler page. `cli/scheduling.mdx` should. |
| `genie/cli/dispatch.mdx` | 1 | Links to concepts/agents, but no skill or concept page links here. `skills/work.mdx` should. |
| `genie/skills/genie-hacks.mdx` | 1 | Links to hacks page, but only reachable via nav. `hacks.mdx` could link back. |

---

## Summary Statistics

| Metric | Count |
|--------|-------|
| Total `.mdx` files scanned | 55 |
| Internal links verified | 65 |
| Broken links (CRITICAL) | **0** |
| Broken anchors (HIGH) | **0** |
| Missing cross-references (MEDIUM) | **26** (across 13 findings) |
| Missing cross-references (LOW) | **5** (across 1 finding + orphans) |
| Total orphan pages | **11** |
| Pages with no inbound links | **14** |
| Pages with no outbound links | **35** |

---

## Recommendations

1. **Highest impact:** Add "See also" links at the bottom of each skill page pointing to related skills and concept pages. This would resolve Findings 3-10 in one sweep.

2. **Second priority:** Add a "Related CLI commands" section to each concept page, and a "See the [X concept guide]" line at the top of each CLI page. This resolves Findings 1-2, 11-13.

3. **Third priority:** De-orphan the 11 disconnected CLI/config pages by adding at least one inbound and one outbound link each. The natural pairs are:
   - `cli/database` <-> `architecture/postgres`
   - `cli/directory` <-> `concepts/agents`
   - `cli/messaging` <-> `architecture/messaging`
   - `cli/scheduling` <-> `architecture/scheduler`
   - `config/tmux` <-> `cli/spawn`
   - `config/worktrees` <-> `cli/team`
   - `cli/infrastructure` <-> `config/setup`
   - `cli/registry` <-> `concepts/skills`
   - `cli/releases-tags-types` <-> `cli/tasks`
   - `cli/export-import` <-> `architecture/postgres`
   - `contributing` <-> `skills/docs` + `config/setup`
