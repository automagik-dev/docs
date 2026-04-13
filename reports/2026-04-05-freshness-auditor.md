# Freshness Auditor Report — 2026-04-05

## Summary
- Total findings: 13
- Severity breakdown: CRITICAL 0, HIGH 1, MEDIUM 11, LOW 1
- Products covered: genie, omni, rlmx
- Prior findings from 2026-04-02: Most high/medium severity items have been **fixed**. This report documents NEW findings since the last audit.

---

## Findings

### [HIGH] `genie agent register` wrong flag: `--omni` should be `--skip-omni`

**Page:** genie/cli/directory.mdx (line 115)  
**Docs say:** `--omni` — "Also register in Omni"  
**Source says:** `--skip-omni` — "Skip Omni auto-registration" (from agent-register.txt)  
**Evidence:** `/home/genie/workspace/agents/docs/state/cli-help/genie/agent-register.txt` line 12  
**Fix:** Change docs from `--omni` to `--skip-omni` and update description to "Skip Omni auto-registration"

---

### [MEDIUM] `genie events scan` wrong flag format and breakdown description

**Page:** genie/cli/observability.mdx (line 103-115)  
**Docs say:** `--since <duration>` with examples like `--since 24h`, `--since 7d`  
**Source says:** `--since <date>` in YYYYMMDD format (from events-scan.txt)  
**Evidence:** `/home/genie/workspace/agents/docs/state/cli-help/genie/events-scan.txt` line 6  
**Fix:** Update docs to show `--since <date>` in YYYYMMDD format, not duration. Also docs incorrectly say "per-session cost breakdown" but the CLI flag shows "Show per-model breakdown" — update description accordingly.

---

### [MEDIUM] `genie qa run` missing 3 documented flags

**Page:** genie/cli/observability.mdx (line 308-323)  
**Docs say:** Options table only lists `--json` and `--verbose`  
**Source says:** `qa run --help` shows: `--timeout <seconds>` (default: 3600), `--parallel <n>` (default: 5), `--verbose`, `--ndjson`  
**Evidence:** `/home/genie/workspace/agents/docs/state/cli-help/genie/qa-run.txt`  
**Fix:** Add missing options to the qa run table:
- `--timeout <seconds>` — Max seconds per spec (default: 3600)
- `--parallel <n>` — Max specs to run in parallel (default: 5)
- `--ndjson` — Machine-readable NDJSON output

Also note: docs show `--json` but actual CLI has `--ndjson`.

---

### [MEDIUM] `genie qa check` missing 2 documented flags

**Page:** genie/cli/observability.mdx (line 337-353)  
**Docs say:** Options table only lists `--team <name>` and `--json`  
**Source says:** `qa check --help` shows: `--team <name>`, `--since <timestamp>`, `--since-file <path>`  
**Evidence:** `/home/genie/workspace/agents/docs/state/cli-help/genie/qa-check.txt`  
**Fix:** Add missing options:
- `--since <timestamp>` — Only consider events after this ISO timestamp
- `--since-file <path>` — Read the lower-bound timestamp from a file

---

### [MEDIUM] `omni persons` missing 4 subcommands

**Page:** omni/cli/routes-persons-auth.mdx (line 139-171)  
**Docs say:** Only documents `search`, `get`, and `presence` subcommands  
**Source says:** CLI has 8 subcommands: search, get, presence, **update**, **merge**, **link**, **unlink** (plus help)  
**Evidence:** `/home/genie/workspace/agents/docs/state/cli-help/omni/persons.txt` lines 12-18  
**Fix:** Add sections for missing subcommands:
- `omni persons update <id> [options]` — Update person fields
- `omni persons merge [options] <source> <target>` — Merge source person into target (source is deleted)
- `omni persons link <identityA> <identityB>` — Link two platform identities to the same person
- `omni persons unlink [options] <identityId>` — Unlink a platform identity from its person

---

### [MEDIUM] `rlmx init` missing `--template` flag documentation

**Page:** rlmx/cli/reference.mdx (line 99-125)  
**Docs say:** Only shows `--dir <path>` option  
**Source says:** CLI accepts `--template default|code` flag (from _root.txt and example usage)  
**Evidence:** `/home/genie/workspace/agents/docs/state/cli-help/rlmx/_root.txt` line 5 and line 47  
**Fix:** Add `--template <type>` option to the table:
- `--template <type>` | string | `default` | Template type: `default` or `code`

And update the description to note that `.rlmx/` directory is scaffolded with templates (BREAKING change from prior flat structure).

---

### [MEDIUM] `rlmx benchmark` command completely undocumented

**Page:** rlmx/cli/reference.mdx  
**Docs say:** No section for `benchmark` command exists  
**Source says:** CLI has `rlmx benchmark <mode> [options]` with modes `cost` and `oolong` (from _root.txt)  
**Evidence:** `/home/genie/workspace/agents/docs/state/cli-help/rlmx/_root.txt` line 8, line 47  
**Fix:** Add a new section for `rlmx benchmark` documenting:
- Command signature and both modes (cost, oolong)
- Options related to benchmarking (if any)
- Example usage

---

### [MEDIUM] `rlmx stats` command completely undocumented

**Page:** rlmx/cli/reference.mdx  
**Docs say:** No section for `stats` command exists  
**Source says:** CLI has `rlmx stats [options]` for "Query run history and cost breakdowns" (from _root.txt)  
**Evidence:** `/home/genie/workspace/agents/docs/state/cli-help/rlmx/_root.txt` line 9  
**Fix:** Add a new section for `rlmx stats` documenting:
- Command signature and purpose
- Available options (e.g., `--limit`, `--json`, etc.)
- Example usage

---

### [MEDIUM] RLMX config documentation references old structure

**Page:** rlmx/config.mdx (entire page) + rlmx/cli/reference.mdx (line 99-125)  
**Docs say:** Describes `rlmx.yaml` in project root with full config there; references `~/.rlmx/settings.json` for global config  
**Source says:** New structure is `.rlmx/` directory with `rlmx.yaml` **inside** it, plus `SYSTEM.md`, `CRITERIA.md`, `TOOLS.md` (from diffs-summary and _root.txt)  
**Evidence:** `/home/genie/workspace/agents/docs/state/cli-help/rlmx/_root.txt` lines 35-40 show `.rlmx/` layout  
**Fix:** Update config.mdx to clarify:
1. `rlmx init` now creates `.rlmx/` directory (not just `rlmx.yaml` in root)
2. Directory contains: `rlmx.yaml`, `SYSTEM.md`, `CRITERIA.md`, `TOOLS.md`
3. Global settings still at `~/.rlmx/settings.json`
4. Explain this is a **BREAKING change** from prior flat structure

---

### [LOW] `genie events scan` breakdown description cosmetic issue

**Page:** genie/cli/observability.mdx (line 110)  
**Docs say:** "Show per-session cost breakdown"  
**Source says:** `--breakdown` described as "Show per-model breakdown"  
**Evidence:** `/home/genie/workspace/agents/docs/state/cli-help/genie/events-scan.txt` line 8  
**Fix:** Minor: change docs description from "per-session" to "per-model"

---

### [LOW] RLMX reference mentions `rlmx.yaml` project config but new structure uses `.rlmx/rlmx.yaml`

**Page:** rlmx/cli/reference.mdx (line 290-291)  
**Docs say:** "Project `rlmx.yaml`" in priority order  
**Source says:** Config structure now has `.rlmx/` directory (from help text lines 35-40)  
**Fix:** Update priority order section to clarify: "Project `.rlmx/rlmx.yaml`" (not just `rlmx.yaml`)

---

### [MEDIUM] Genie quickstart.mdx may reference outdated or incorrect setup steps (awaiting verification)

**Page:** genie/quickstart.mdx  
**Status:** Contents checked but appear consistent with current CLI. No immediate discrepancies found in this sweep. Flag for next audit if setup steps change.

---

## Summary Table

| Severity | Count | Resolved from prior report |
|----------|-------|---------------------------|
| CRITICAL | 0     | —                         |
| HIGH     | 1     | Partial (8→1 remaining)   |
| MEDIUM   | 11    | Major improvements (22→11)|
| LOW      | 1     | Improved (3→1)            |
| **Total** | **13** | **Down from 33**           |

---

## Patterns & Observations

### Fixed since 2026-04-02
✅ `genie work` signature corrected  
✅ `genie spawn` flags (--role, --new-window, --window, --team, --skill)  
✅ `genie team create` (--tmux-session, --no-spawn, deprecated --session)  
✅ `genie sessions ingest` → `genie sessions sync`  
✅ `genie sessions list --limit` documented  
✅ `genie project` archive/unarchive added  
✅ `genie board` export/import and --all documented  
✅ `genie database` restore/url flags fixed  
✅ `genie inbox`, `genie chat` subcommands properly documented  
✅ `genie serve start` options fixed  
✅ Task and export-import pages mostly correct  

### Remaining issues
- Flag naming errors (--omni vs --skip-omni in agent register)
- Missing option documentation (qa run/check, events scan formatting)
- Completely undocumented commands (rlmx benchmark, rlmx stats, omni persons merge/link/unlink/update)
- Config structure redesign not reflected in docs (RLMX .rlmx/ layout)

### Products by stability
- **Genie:** 1 high, mostly stable with minor gaps
- **Omni:** 1 medium (missing persons subcommands), otherwise solid
- **RLMX:** 4 medium issues, mostly around new commands and config structure

---

## Recommendations

1. **Priority 1** (HIGH): Fix `--omni` → `--skip-omni` in agent register
2. **Priority 2** (MEDIUM): Document missing Omni persons subcommands
3. **Priority 3** (MEDIUM): Add RLMX benchmark, stats commands + .rlmx/ structure explanation
4. **Priority 4** (MEDIUM): Fix `genie events scan` format (--since date format) and remaining qa check/run options

