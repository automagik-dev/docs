# Genie v4 Documentation Shitshow — Final Summary

**Date:** 2026-04-02
**Wish:** `genie-v4-docs-shitshow`
**Duration:** ~25 minutes (Wave 1: 2min, Wave 2: 8min, Wave 3: 2min, Wave 4: 13min)

---

## The Delta

| Metric | Value |
|--------|-------|
| Docs freeze date | 2026-03-30 (commit `457f3925`) |
| Genie commits since freeze | 216 |
| Files changed in genie | 126 (6,823 insertions / 1,289 deletions) |
| Version bumps | 19 (v4.260402.1 → v4.260402.18) |

---

## Findings

| Specialist | Findings | CRITICAL | HIGH | MEDIUM | LOW |
|-----------|----------|----------|------|--------|-----|
| Freshness Auditor | 33 | 0 | 8 | 22 | 3 |
| Nav Inspector | 3 | 0 | 0 | 3 | 0 |
| Gap Finder | 20 | 3 | 7 | 6 | 4 |
| Visual Critic | 53 | 3 | 0 | 6 | 44 |
| Link Tracer | 44 | 0 | 0 | 31 | 13 |
| Consistency Checker | 17 | 0 | 3 | 6 | 8 |
| **TOTAL** | **170** | **6** | **18** | **74** | **72** |

### Top CRITICAL Findings
1. `/brain` skill — entire enterprise feature with zero documentation (283-line SKILL.md, 30+ subcommands)
2. `genie brain` CLI — not documented in any CLI page
3. `/learn` skill — docs falsely claim it was "removed" (line 85 of concepts/skills.mdx)

### Top HIGH Findings
1. `genie work` has wrong command signature in docs (agent/ref order swapped)
2. `--template` flag in concepts/boards.mdx doesn't exist (actual: `--from`)
3. `--file` flag in concepts/boards.mdx doesn't exist (actual: `--json`)
4. `genie task link --url` doesn't exist (replaced by `--gh`, `--external-id`, `--external-url`)
5. `genie sessions ingest` renamed to `sessions sync` — old command gone
6. `genie team create --session` deprecated, now `--tmux-session`
7. `genie spawn` missing 5 flags across docs pages
8. `genie agent register` has 7 flags, docs show zero

---

## Output

### PRs Created (automagik-dev/docs → dev)

| PR | Title | Files | Scope |
|----|-------|-------|-------|
| [#38](https://github.com/automagik-dev/docs/pull/38) | docs: fix critical CLI flag errors and stale references | 15 | Wrong flags, missing options, renamed commands, stale references |
| [#39](https://github.com/automagik-dev/docs/pull/39) | docs: add missing /brain, /learn skill pages | 3 | New brain.mdx, learn.mdx, docs.json nav update |
| [#40](https://github.com/automagik-dev/docs/pull/40) | docs: fix consistency, cross-references, and formatting | 15 | Heading hierarchy, code tags, terminology, deprecated paths |

**Total: 3 PRs, 33 files changed**

### Issues Filed (automagik-dev/genie)

| Issue | Title | Labels |
|-------|-------|--------|
| [#1002](https://github.com/automagik-dev/genie/issues/1002) | genie brain CLI needs comprehensive --help subcommands | type:docs, type:enhancement, area:cli |
| [#1003](https://github.com/automagik-dev/genie/issues/1003) | architecture docs need update for serve/daemon unification | type:docs, area:docs |
| [#1004](https://github.com/automagik-dev/genie/issues/1004) | PG LISTEN/NOTIFY migration should be documented in source | type:docs, area:messaging, area:storage |
| [#1005](https://github.com/automagik-dev/genie/issues/1005) | agent frontmatter Zod schema should be exported or documented | type:docs, type:enhancement, area:agents |
| [#1006](https://github.com/automagik-dev/genie/issues/1006) | spawn auto-resume behavior needs inline documentation | type:docs, area:agents |

**Total: 5 issues filed**

---

## Specialist Reports

| Report | Location |
|--------|----------|
| Freshness Auditor | `reports/2026-04-02-freshness-auditor.md` |
| Nav Inspector | `reports/2026-04-02-nav-inspector.md` |
| Gap Finder | `reports/2026-04-02-gap-finder.md` |
| Visual Critic | `reports/2026-04-02-visual-critic.md` |
| Link Tracer | `reports/2026-04-02-link-tracer.md` |
| Consistency Checker | `reports/2026-04-02-consistency-checker.md` |
| Verified Findings | `reports/verified/2026-04-02-verified.json` |

---

## Remaining Work (not addressed in PRs)

1. **11 orphan pages** with zero inbound/outbound links — need cross-references added
2. **31 missing cross-references** between related pages — link tracer identified natural pairs
3. **41 pages missing `icon` frontmatter** — batch fixable but low priority
4. **TUI documentation is thin** — needs screenshots/mockup and expanded content
5. **Architecture messaging page** still partially stale (PG sections exist but file-based flow diagram needs rework)

---

## Execution Stats

| Phase | Duration | Agents | Output |
|-------|----------|--------|--------|
| Wave 1: Data Collection | ~2 min | 1 (direct) | 197 help files, 3 diff files |
| Wave 2: Specialist Sweep | ~8 min | 6 parallel | 6 reports, 170 findings |
| Wave 3: Verification | ~2 min | 1 (direct) | verified.json, 0 rejections |
| Wave 4: Dispatch | ~13 min | 2 parallel | 3 PRs, 5 issues |
| **Total** | **~25 min** | **9 agents** | **170 findings → 3 PRs + 5 issues** |
