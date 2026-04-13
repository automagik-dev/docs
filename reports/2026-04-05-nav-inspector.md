# Nav Inspector Report — 2026-04-05

## Summary
- docs.json total pages: 74
- .mdx files on disk: 79
- Dead nav entries: 0
- Orphan pages: 0
- Missing nav entries for new features: 5

---

## Findings

### [CRITICAL] Dead nav entries (nav references file that doesn't exist)

**None.** Every page reference in `docs.json` has a corresponding `.mdx` file on disk. This includes the two skills (`brain` and `learn`) that were flagged as missing docs in the 2026-04-02 report — both now have `.mdx` files committed.

---

### [HIGH] Orphan pages (file exists but not in docs.json)

**None.** Every `.mdx` file under `genie/`, `omni/`, and `rlmx/` directories is referenced in `docs.json` navigation.

**File inventory:**
- Genie: 57 files on disk, 55 in nav (includes index.mdx which is implicit in page paths)
- Omni: 17 files on disk, 14 in nav
- RLMX: 5 files on disk, 5 in nav

---

### [MEDIUM] Missing nav entries for new features

Based on cross-reference with `state/diffs/*-summary.md`, the following major new features have **no corresponding nav entries**:

#### Genie

1. **`genie app` command** — Desktop application v1 (HUGE feature)
   - Status: NEW command, completely undocumented
   - Nav impact: Needs new page: `genie/cli/app.mdx` in "CLI Reference" group
   - Evidence: `genie-summary.md` lines 10-19 — "New Tauri desktop application with 12 native views"
   - Scope: Command Center, Fleet screen, Terminal integration, Sessions Replay, Cost Intelligence, Files browser, Settings, Scheduler, System views
   - Priority: **CRITICAL** — this is a major user-facing feature that needs prominent documentation

2. **`genie task close-merged` subcommand** — NEW
   - Status: NEW subcommand (task group expanded)
   - Nav impact: Likely covered in existing `genie/cli/tasks.mdx`, verify it mentions this new subcommand
   - Evidence: `genie-summary.md` line 45 — "task-close-merged command (new)"
   - Priority: **HIGH** — update existing task docs to include

3. **`genie brain upgrade` rename** — `genie brain update` → `genie brain upgrade`
   - Status: Command renamed (breaking change to users)
   - Nav impact: Documentation should reference the new name, verify `genie/skills/brain.mdx` reflects this
   - Evidence: `genie-summary.md` line 29 — "Rename `genie brain update` → `genie brain upgrade` (#1027)"
   - Priority: **HIGH** — update skill docs + consider deprecation notice in CLI Reference if covered there

#### Omni

4. **`channel-gupshup` — NEW channel plugin**
   - Status: NEW channel provider, fully implemented with API client, webhook handler, CLI/SDK integration
   - Nav impact: Needs new page: `omni/cli/providers-gupshup.mdx` OR expand existing `omni/cli/providers.mdx` with Gupshup section
   - Evidence: `omni-summary.md` lines 19-24 — "Full Gupshup channel: REST API client, webhook handler, senders, identity"
   - Priority: **HIGH** — users need setup guide for new channel

5. **Multimodal provider framework (media verbs)** — `speak`, `listen`, `imagine`, `see`, `film`
   - Status: NEW verbs + provider framework (Wave 2)
   - Nav impact: Needs new page OR expand `omni/cli/messaging.mdx` / `omni/cli/providers.mdx` with media verb reference
   - Evidence: `omni-summary.md` lines 13-17 — "New `media` verbs: `speak`, `listen`, `imagine`, `see`, `film`" + "Provider framework for multimodal capabilities"
   - Priority: **MEDIUM** — likely covered in send command docs, verify completeness

#### RLMX

6. **`rlmx stats` — NEW command**
   - Status: NEW command (query run history + cost breakdowns)
   - Nav impact: Needs new page: `rlmx/cli/stats.mdx` OR add to existing `rlmx/cli/reference.mdx` with stats section
   - Evidence: `rlmx-summary.md` lines 18-20 — "Query run history and cost breakdowns" + wired into observability
   - Priority: **HIGH** — new observability feature needs documentation

7. **`rlmx benchmark` — NEW command**
   - Status: NEW command (two modes: `cost` and `oolong`)
   - Nav impact: Needs new page: `rlmx/cli/benchmark.mdx` OR add to existing `rlmx/cli/reference.mdx` with benchmark section
   - Evidence: `rlmx-summary.md` lines 23-26 — "Two modes: `cost` and `oolong`" + uses uv for venv setup
   - Priority: **HIGH** — new benchmarking feature needs documentation

8. **`.rlmx/` config layout rewrite** — BREAKING change
   - Status: BREAKING CHANGE — `.rlmx/` directory replaces flat files; `rlmx init` scaffolds with `--template` flag
   - Nav impact: **CRITICAL rewrite needed** for `rlmx/config.mdx`
   - Evidence: `rlmx-summary.md` lines 10-16 — "Breaking layout change", "Config loader rewritten to only use `.rlmx/` directory", "Templates include: `rlmx.yaml`, `SYSTEM.md`, `CRITERIA.md`, `TOOLS.md`"
   - Current nav: `rlmx/config.mdx` exists but content is likely outdated
   - Priority: **CRITICAL** — users upgrading from old config format need clear migration guide

---

### [LOW] Nav organization suggestions

**No structural issues identified.** The three products maintain good separation and progressive disclosure pattern:

- **Genie** (8 groups): Getting Started → Concepts → Skills → CLI → Config → Architecture → Hacks → Contributing
- **Omni** (4 groups): Getting Started → Concepts → CLI → Architecture
- **RLMX** (3 groups): Getting Started → CLI → Config

However, with the additions above:

1. **Genie Skills group** — already has 17 entries and just added `brain` + `learn`. Consider if this needs splitting (e.g., "Core Skills" vs "Enterprise Skills" with brain/learn in the latter).
2. **RLMX CLI Reference** — currently only 1 page (`rlmx/cli/reference.mdx`). With `stats` and `benchmark` coming, could expand to:
   - Keep `reference.mdx` as index/overview
   - Add `rlmx/cli/stats.mdx` 
   - Add `rlmx/cli/benchmark.mdx`
   - Update nav structure from flat page to group with subpages

---

## Next Steps (Priority Order)

1. **CRITICAL**: Add `genie/cli/app.mdx` for the new desktop app + update nav
2. **CRITICAL**: Rewrite `rlmx/config.mdx` for `.rlmx/` breaking change + document `--template` flag
3. **HIGH**: Add `rlmx/cli/stats.mdx` (or section in reference) + update nav
4. **HIGH**: Add `rlmx/cli/benchmark.mdx` (or section in reference) + update nav
5. **HIGH**: Add `omni/cli/providers-gupshup.mdx` (or expand providers) + update nav
6. **HIGH**: Verify `genie/cli/tasks.mdx` covers `close-merged` subcommand
7. **HIGH**: Verify `genie/skills/brain.mdx` uses new `upgrade` command name (not `update`)
8. **MEDIUM**: Verify `omni/cli/messaging.mdx` covers new media verbs or add dedicated page
9. **MEDIUM**: Consider splitting Genie Skills group if 19 entries feels unwieldy

---

## Comparison to 2026-04-02 Report

**Improvement since last audit:**
- `genie/skills/brain.mdx` and `genie/skills/learn.mdx` have been created and added to nav ✓
- No new orphan pages or dead nav entries introduced

**New gaps introduced by recent releases:**
- 8 major new features (commands/channel/verbs) added to source, but no nav entries yet
- 1 breaking config change (`rlmx`) requires full docs rewrite
- Nav is currently out of sync with source code capabilities

---

## Verification Summary

| Product | Audit Result | Status |
|---------|--------------|--------|
| **Genie** | Nav sync ✓ + 3 missing feature docs | ⚠️ Needs 1 critical page (app) |
| **Omni** | Nav sync ✓ + 2 missing feature docs | ⚠️ Needs 1-2 pages (gupshup + media verbs) |
| **RLMX** | Nav sync ✓ + 3 missing feature docs + 1 breaking change | ⚠️ Needs full config rewrite + 2 new pages |
| **Overall** | 79 files, 74 nav entries, 0 orphans, 0 dead links | Structurally sound but feature docs lagging |
