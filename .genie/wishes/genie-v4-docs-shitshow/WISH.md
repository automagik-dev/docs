# Wish: Genie v4 Documentation Shitshow — Full Docs vs Source Audit

| Field | Value |
|-------|-------|
| **Status** | DONE |
| **Slug** | `genie-v4-docs-shitshow` |
| **Date** | 2026-04-02 |
| **Design** | N/A — data-driven audit, no brainstorm needed |

## Summary

Genie v4 launched today. The docs site was last updated on **March 30, 2026** (`457f392`). Since then, **216 commits** landed in the genie repo — **126 files changed, 6,823 insertions, 1,289 deletions** across **19 version bumps** (v4.260402.1 → v4.260402.18). This wish orchestrates a 6-specialist sweep to find every documentation gap, stale reference, and missing page, then dispatches targeted PRs and issues.

## Evidence — The Delta

### Docs freeze point
- **Last genie docs commit**: `457f3925` — `2026-03-30 19:03:01 -0300`
- **Content**: "docs(all): add scheduler cross-ref and document hidden debug commands"
- **Docs repo branch**: `main` (commit `e110125..9ee1a3c`)

### Genie changes since freeze (216 commits)

#### New Features (not in docs)
| Feature | Commits | Impact |
|---------|---------|--------|
| **Brain / Knowledge Graph** | `212f1e4`, `45222d95`, `271ea531`, `85e1cade`, `3fd9bedf`, `13a1bb3b`, `02075666` | Entire new `genie brain` command + `/brain` skill + pgvector + auto-brain hooks |
| **TUI System Stats** | `9caf4e42`, `8e7c4b8f`, `2d6845e4` | New system stats panel, systeminformation rewrite |
| **TUI Context Menu** | `9f7add83`, `389a9423` | Per-node actions, pane rename, Start/Clone labels |
| **PG LISTEN/NOTIFY Mailbox** | `44a153a3` | Instant message delivery replacing polling |
| **Spawn Auto-Resume** | `ed925681`, `82915442`, `388e9ca8` | Auto-resume Claude sessions instead of creating new |
| **Serve/Daemon Unification** | `604b26f9` | Single process ownership model |
| **Spawn --role/--new-window/--window** | `badef105` | New spawn flags |
| **Agent Frontmatter Sync** | `1de13f2b`, `7fc1c4d3`, `029a1d1c` | Zod-validated frontmatter, metadata JSONB |
| **Desktop App** | `genie app` command | New `--backend-only`, `--tui`, `--dev` flags |
| **Ctrl+T Parallel Workers** | `36d5ed7a`, `addba87c` | TUI keyboard shortcut for spawning |
| **OSC 52 Clipboard** | `22aa5515` | Nested tmux clipboard passthrough |
| **Task JSON Truncation Fix** | `419e4b19` | `--project` with `--all`, 8KB limit fix |

#### Missing Skill Pages (in source, not in docs)
| Skill | Source File | Docs Page | Status |
|-------|------------|-----------|--------|
| `/brain` | `skills/brain/SKILL.md` | ❌ MISSING | Brand new — knowledge graph engine |
| `/learn` | `skills/learn/SKILL.md` | ❌ MISSING | Behavioral correction + Claude native memory |

#### Missing/Undocumented CLI Commands
| Command | In Source | In Docs | Notes |
|---------|----------|---------|-------|
| `genie app` | ✅ | ❌ | Desktop app launcher |
| `genie broadcast` | ✅ | ❌ | Team-wide PG-backed messaging |
| `genie chat` | ✅ | ❌ | Conversation management with threads |
| `genie done` | ✅ | ❌ | Mark wish groups done |
| `genie reset` | ✅ | ❌ | Reset groups to ready |
| `genie stop` | ✅ | ❌ | Stop agent (preserve session) |
| `genie read` | ✅ | ❌ | Read agent terminal output |
| `genie shortcuts` | ✅ | ❌ | Tmux keyboard shortcuts management |
| `genie doctor` | ✅ | ❌ maybe | Diagnostic with `--fix` flag |
| `genie brain` | ✅ | ❌ | Knowledge graph engine |

#### New Spawn Flags (undocumented)
- `--role <role>` — Override role name for registration
- `--new-window` — Create new tmux window instead of splitting
- `--window <target>` — Tmux window to split into
- `--no-auto-resume` — Disable auto-resume on pane death

#### New Export Subcommands (undocumented)
- `genie export agents` / `boards` / `comms` / `config` / `projects` / `schedules` / `tags` / `tasks` / `all`

#### Architecture Changes (docs likely stale)
- Serve/daemon unified under single process
- PG LISTEN/NOTIFY replaces polling for mailbox
- Agent frontmatter with Zod validation + metadata JSONB
- Auto-resume replaces fresh session creation on spawn
- Advisory locks for spawn guard
- Brain wiring with pgvector

## Scope

### IN
- All 57 genie `.mdx` pages in docs repo
- All CLI commands vs `--help` output verification
- All 17 skill SKILL.md files vs docs skill pages
- Navigation structure (`docs.json`) completeness
- Cross-references between genie pages
- Architecture docs accuracy (state, postgres, messaging, scheduler)
- Code examples and command snippets accuracy
- Getting started / quickstart / installation freshness

### OUT
- Omni docs (separate sweep)
- RLMX docs (separate sweep)
- Visual design / CSS / Mintlify theme changes
- Writing new conceptual content from scratch (only gaps and corrections)
- Rewriting the entire docs site

## Decisions

| Decision | Rationale |
|----------|-----------|
| Run all 6 specialists in parallel | Max speed, non-overlapping lenses |
| One PR per specialist per fix category | Easy to review, easy to revert |
| File GitHub issues for architecture gaps | Too complex for automated PRs |
| Use rlmx specialists with actual CLI --help piped as context | Ground truth, not hallucination |
| Verify every finding before PR | No fiction in documentation |

## Success Criteria

- [ ] Docs freeze date identified with exact commit hash ✅ (`457f3925`, 2026-03-30)
- [ ] Source diff computed: all genie changes since freeze ✅ (216 commits, 126 files)
- [ ] All 6 specialist reports generated in `reports/`
- [ ] Claude reviewer verifies every finding (zero unverified findings in PRs)
- [ ] Missing skill pages identified and PRs created (`/brain`, `/learn`)
- [ ] Missing CLI command docs identified and PRs created (10+ commands)
- [ ] Stale CLI flags/options corrected in existing pages
- [ ] Architecture docs updated or issues filed for major changes
- [ ] Cross-reference gaps fixed (new commands linking to new concepts)
- [ ] Final summary: X findings, Y PRs created, Z issues filed
- [ ] `state/last-sweep.json` updated with this sweep's timestamp

## Execution Strategy

### Wave 1 — Data Collection (parallel)
| Group | Agent | Description |
|-------|-------|-------------|
| 1 | engineer | Pre-generate all CLI --help output to `state/cli-help/genie/` |
| 2 | engineer | Generate source diff since docs freeze → `state/diffs/genie-v4.diff` |

### Wave 2 — Specialist Sweep (parallel, all 6 at once)
| Group | Agent | Description |
|-------|-------|-------------|
| 3 | freshness-auditor (rlmx) | CLI --help vs docs flags/options/defaults |
| 4 | nav-inspector (rlmx) | docs.json vs .mdx files, orphans, dead nav entries |
| 5 | gap-finder (rlmx) | Missing pages, stubs, undocumented commands |
| 6 | visual-critic (rlmx) | Mintlify components, text walls, heading hierarchy |
| 7 | link-tracer (rlmx) | Broken links, missing cross-references |
| 8 | consistency-checker (rlmx) | Terminology, code blocks, sibling formatting |

### Wave 3 — Verification Gate
| Group | Agent | Description |
|-------|-------|-------------|
| 9 | reviewer | Claude reviewer verifies every finding against source |

### Wave 4 — Dispatch (parallel)
| Group | Agent | Description |
|-------|-------|-------------|
| 10 | engineer | Create docs PRs for verified fixable findings |
| 11 | engineer | File GitHub issues for architecture/code-side gaps |
| 12 | engineer | Update state/last-sweep.json + generate final report |

## Execution Groups

### Group 1: Pre-generate CLI Help Output
**Goal:** Capture current `genie --help` and all subcommand help to files for specialist consumption.
**Deliverables:**
1. `state/cli-help/genie/` directory with one `.txt` file per command
2. Complete help output for all 40+ commands and subcommands

**Acceptance Criteria:**
- [ ] Every command listed in `genie --help` has a corresponding help file
- [ ] Subcommands (e.g., `genie task create --help`) are also captured

**Validation:**
```bash
ls state/cli-help/genie/ | wc -l  # Should be 40+
```

**depends-on:** none

---

### Group 2: Generate Source Diff
**Goal:** Compute structured diff of all genie changes since docs freeze (commit `457f3925` date: 2026-03-30).
**Deliverables:**
1. `state/diffs/genie-v4.diff` — full git diff stat
2. `state/diffs/genie-v4-summary.md` — human-readable change summary with categories

**Acceptance Criteria:**
- [ ] Diff covers commits from 2026-03-30 to HEAD
- [ ] Summary categorizes changes: new commands, changed flags, new features, removed features

**Validation:**
```bash
test -f state/diffs/genie-v4.diff && test -f state/diffs/genie-v4-summary.md
```

**depends-on:** none

---

### Group 3: Freshness Auditor Sweep
**Goal:** Compare every CLI flag, option, and default in docs against actual `--help` output.
**Deliverables:**
1. `reports/<timestamp>-freshness-auditor.md` — findings with severity

**Acceptance Criteria:**
- [ ] Every genie CLI page compared against actual --help
- [ ] Findings include: page path, line, what docs say, what source says

**Validation:**
```bash
test -f reports/*-freshness-auditor.md
```

**depends-on:** Group 1, Group 2

---

### Group 4: Nav Inspector Sweep
**Goal:** Verify `docs.json` navigation matches actual .mdx files. Find orphans and missing entries.
**Deliverables:**
1. `reports/<timestamp>-nav-inspector.md`

**Acceptance Criteria:**
- [ ] Every entry in docs.json verified to have a corresponding .mdx
- [ ] Every genie .mdx verified to appear in docs.json
- [ ] Orphan pages listed

**Validation:**
```bash
test -f reports/*-nav-inspector.md
```

**depends-on:** Group 1

---

### Group 5: Gap Finder Sweep
**Goal:** Identify missing pages, undocumented commands, stub pages with placeholder content.
**Deliverables:**
1. `reports/<timestamp>-gap-finder.md`

**Acceptance Criteria:**
- [ ] Every CLI command cross-checked against docs pages
- [ ] Every skill in source cross-checked against skill docs pages
- [ ] Missing pages listed with suggested content scope

**Validation:**
```bash
test -f reports/*-gap-finder.md
```

**depends-on:** Group 1, Group 2

---

### Group 6: Visual Critic Sweep
**Goal:** Check Mintlify component usage, heading hierarchy, text wall detection.
**Deliverables:**
1. `reports/<timestamp>-visual-critic.md`

**Acceptance Criteria:**
- [ ] Every genie .mdx scanned for formatting issues
- [ ] Text walls (>10 lines without breaks) flagged
- [ ] Heading hierarchy violations flagged

**Validation:**
```bash
test -f reports/*-visual-critic.md
```

**depends-on:** none

---

### Group 7: Link Tracer Sweep
**Goal:** Find broken internal links, missing cross-references between related pages.
**Deliverables:**
1. `reports/<timestamp>-link-tracer.md`

**Acceptance Criteria:**
- [ ] Every internal link in genie .mdx files verified
- [ ] Missing cross-references identified (e.g., spawn page should link to agent page)

**Validation:**
```bash
test -f reports/*-link-tracer.md
```

**depends-on:** none

---

### Group 8: Consistency Checker Sweep
**Goal:** Verify consistent terminology, code block formatting, sibling page structure.
**Deliverables:**
1. `reports/<timestamp>-consistency-checker.md`

**Acceptance Criteria:**
- [ ] Terminology consistent (worker vs agent, etc.)
- [ ] Code blocks have language tags
- [ ] Sibling pages follow same structure pattern

**Validation:**
```bash
test -f reports/*-consistency-checker.md
```

**depends-on:** none

---

### Group 9: Reviewer Verification Gate
**Goal:** Claude reviewer cross-checks every specialist finding against actual source code and CLI output.
**Deliverables:**
1. `reports/verified/<timestamp>-verified.json` — each finding marked verified/rejected with evidence

**Acceptance Criteria:**
- [ ] 100% of findings have verification status
- [ ] Rejected findings include reason
- [ ] Only verified findings proceed to dispatch

**Validation:**
```bash
test -f reports/verified/*-verified.json
```

**depends-on:** Groups 3-8

---

### Group 10: Dispatch Docs PRs
**Goal:** Create PRs on automagik-dev/docs for all verified fixable findings.
**Deliverables:**
1. One PR per specialist lens with fixes (up to 6 PRs)
2. PR for missing `/brain` skill page
3. PR for missing `/learn` skill page
4. PR for missing CLI command docs (app, broadcast, chat, done, reset, stop, read, shortcuts, brain)
5. PR for stale spawn flags documentation

**Acceptance Criteria:**
- [ ] Each PR has clear title and description
- [ ] Each PR targets `dev` branch
- [ ] Each PR contains only related fixes (no mixed concerns)

**Validation:**
```bash
gh pr list --repo automagik-dev/docs --author @me --state open | grep "v4"
```

**depends-on:** Group 9

---

### Group 11: File Source Issues
**Goal:** File GitHub issues on automagik-dev/genie for code-side documentation needs.
**Deliverables:**
1. Issues for architecture docs gaps (serve/daemon unification, LISTEN/NOTIFY, etc.)
2. Issues for missing --help descriptions or incomplete command help

**Acceptance Criteria:**
- [ ] Each issue has evidence (what docs say vs what code does)
- [ ] Each issue tagged with `docs` label

**Validation:**
```bash
gh issue list --repo automagik-dev/genie --label docs --state open
```

**depends-on:** Group 9

---

### Group 12: Final Report + State Update
**Goal:** Generate summary report and update sweep state.
**Deliverables:**
1. `reports/<timestamp>-final-summary.md` — stats, PR links, issue links
2. Updated `state/last-sweep.json`

**Acceptance Criteria:**
- [ ] Summary includes: total findings, verified count, PRs created, issues filed
- [ ] last-sweep.json updated with current timestamp and genie HEAD commit

**Validation:**
```bash
cat state/last-sweep.json | jq .genie.last_commit
```

**depends-on:** Groups 10, 11

---

## QA Criteria

- [ ] All specialist reports exist and contain structured findings
- [ ] No unverified findings made it into PRs
- [ ] All PRs target `dev` branch (not `main`)
- [ ] Missing skill pages (`/brain`, `/learn`) have corresponding PRs
- [ ] At least 10 undocumented CLI commands addressed
- [ ] `state/last-sweep.json` reflects current sweep

---

## Assumptions / Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| rlmx specialists may hallucinate findings | High | Claude reviewer gate (Group 9) verifies everything |
| Some docs pages may have been updated on unmerged branches | Medium | Check open PRs on docs repo before filing duplicates |
| genie source may have unreleased commands on dev only | Low | Only audit commands on main branch |
| Brain skill is brand new — may be unstable | Medium | Document current state, note "experimental" status |

---

## Review Results

### Plan Review — 2026-04-02

**Verdict: SHIP** ✅

| # | Severity | Finding |
|---|----------|---------|
| 1 | MEDIUM | PRs should branch from `dev` — add explicit checkout instructions |
| 2 | MEDIUM | Group numbering (3-8) vs PG task seq (#4-9) offset — add mapping note |
| 3 | LOW | Two success criteria pre-checked in DRAFT |
| 4 | LOW | `genie brain` CLI is thin — docs should focus on `/brain` skill interface |

All criteria passed. 0 CRITICAL/HIGH. Ready for `/work`.

---

## Files to Create/Modify

### Docs Repo (automagik-dev/docs)
```
genie/skills/brain.mdx          — NEW (missing skill page)
genie/skills/learn.mdx          — NEW (missing skill page)
genie/cli/session.mdx           — UPDATE (add app, stop, read, shortcuts)
genie/cli/messaging.mdx         — UPDATE (add broadcast, chat commands)
genie/cli/tasks.mdx             — UPDATE (add done, reset commands)
genie/cli/spawn.mdx             — UPDATE (new --role, --new-window, --window, --no-auto-resume flags)
genie/cli/infrastructure.mdx    — UPDATE (serve/daemon unification, doctor --fix)
genie/cli/database.mdx          — UPDATE (brain/pgvector)
genie/architecture/messaging.mdx — UPDATE (LISTEN/NOTIFY)
genie/architecture/state.mdx    — UPDATE (auto-resume, frontmatter sync)
docs.json                        — UPDATE (add brain, learn to nav)
```

### Docs-Maestro Workspace
```
state/cli-help/genie/*.txt       — CLI help captures
state/diffs/genie-v4.diff        — Source diff
state/diffs/genie-v4-summary.md  — Change summary
reports/*-<specialist>.md        — 6 specialist reports
reports/verified/*-verified.json — Verified findings
reports/*-final-summary.md       — Final summary
state/last-sweep.json            — Updated sweep state
```
