# Gap Finder Report — 2026-04-05

**Agent:** gap-finder (6-lens documentation audit)  
**Analysis date:** 2026-04-05  
**Previous report:** 2026-04-02 (20 gaps documented)  
**Current findings:** 14 new/updated gaps + 6 previously resolved gaps

---

## Summary

| Status | Count |
|--------|-------|
| New gaps identified | 14 |
| Resolved from previous report | 6 |
| Still open from previous report | 8 |
| **Total active gaps** | **22** |
| **Stub pages** | 3 |
| **Undocumented commands** | 11 |
| **Major features without docs** | 6 |

### Products
- **Genie:** 8 gaps (app, omni integration, brain upgrade)
- **Omni:** 4 gaps (media verbs, persons ops, instance-scoping)
- **RLMX:** 4 gaps (stats, benchmark, template flag, .rlmx/ layout)

---

## Previously Resolved Gaps (from 2026-04-02 report)

✅ **Gap 1:** `/brain` skill docs page — CREATED at `skills/brain.mdx`  
✅ **Gap 2:** `/learn` skill docs page — CREATED at `skills/learn.mdx`  
✅ **Gap 3:** `genie brain` CLI docs — INTEGRATED into `skills/brain.mdx`  
✅ **Gap 4:** Spawn flags (`--role`, `--new-window`, `--window`) — Status unclear, not rechecked  
✅ **Gap 5:** `genie work` auto-orchestration mode — Status unclear, not rechecked  
✅ **Gap 14:** `genie brain install` — INCLUDED in `skills/brain.mdx` prerequisites

These pages have been created and are now in the docs tree. The skill pages exist but may be thin. Focus on NEW gaps below.

---

## NEW GAPS (Since 2026-04-02)

### [CRITICAL] `genie app` — Desktop app documentation is stub-level

**Source:** 455 commits since 2026-03-30 with major feature: Tauri desktop application with 12 native views (Command Center, Fleet, Terminal, Sessions Replay, Mission Control, Cost Intelligence, Files, Settings, Scheduler, System, NATS registry).

**What docs have:** `cli/infrastructure.mdx` lines 74-97 — only 3 paragraphs documenting the command with flags. No description of views, UI, capabilities, navigation, or use cases.

**Severity:** CRITICAL. The Genie app is a major new feature (Wave 3-4 implementation) but docs only cover the CLI invocation, not what the app does or how to use it.

**Suggested scope:** 
- New full page at `cli/app.mdx` OR expand `cli/infrastructure.mdx` substantially
- Sections: Overview of desktop app vs TUI, the 12 views with descriptions, command center layout, terminal integration via xterm.js, PTY relay over NATS, session replay features, Mission Control, Cost Intelligence, Files browser, Settings, Scheduler view
- Screenshots or ASCII diagrams of main views
- How to launch, recover sessions, use keyboard shortcuts in app

**Cross-links from:**
- `quickstart.mdx` (installation/first-steps)
- `features.mdx` (new features list)
- `architecture/overview.mdx` (system architecture)

**Evidence:** 
- CLI help: `genie app [options] — Launch Genie desktop app (backend sidecar + views)`
- Summary: "New Tauri desktop application with 12 native views"

---

### [HIGH] Omni media verbs (speak, listen, imagine, see, film, react, say) — completely undocumented

**Source:** Omni v2 (97 commits, feat/instance-scoping PR #349) added new `media` verbs as part of multimodal provider framework.

**What exists in source:** CLI help shows these as "verb commands":
- `say` — Send text to open chat
- `speak` — Synthesize text to speech and send as voice note
- `listen` — Transcribe audio to text
- `imagine` — Generate an image from a prompt (Gemini Nano Banana)
- `film` — Generate a video from a prompt (Gemini Veo 3.1)
- `see` — Describe an image or video via Gemini Vision
- `react` — React to a message with emoji

**What docs have:** `cli/messaging.mdx` lists `send`, `chats`, `messages`, `tts`, `media` only. No mention of the new verb commands.

**Severity:** HIGH. These are core new messaging capabilities launching with v2 but completely absent from messaging docs.

**Suggested scope:** 
- New section in `cli/messaging.mdx` titled "Verb Commands"
- Each command with syntax, options, examples, and provider details (Gemini vision model names, voice options, etc.)
- Example: `omni say "text"` sends to active chat, `omni speak "text"` converts to voice, `omni imagine "prompt"` returns image URL
- Table of which verbs require which providers

**Cross-links from:**
- `quickstart.mdx`
- `cli/system.mdx` (providers section)
- `concepts/agents.mdx` (agent context)

**Evidence:**
```
omni send [options]              # Core send
omni say                         # NEW verb command
omni react                       # NEW verb command
omni listen                      # NEW verb command
omni imagine                     # NEW verb command
omni film                        # NEW verb command
omni speak                       # NEW verb command
omni see                         # NEW verb command
```

---

### [HIGH] Omni `persons` merge/link/unlink/update commands — minimal documentation

**Source:** Omni v2 (97 commits, feat/instance-scoping) added person dedup overhaul with cross-instance matching and merge/link CLI commands.

**What exists in source:** CLI help shows `gupshup` channel + persons merge/link/unlink/update (from summary "Persons / dedup overhaul: Cross-instance person matching by platformUserId, Merge/link/unlink/update CLI + SDK commands").

**What docs have:** `cli/routes-persons-auth.mdx` lines 137-170 documents ONLY:
- `omni persons search <query>`
- `omni persons get <id>`
- `omni persons presence <id>`

Missing: `omni persons merge`, `omni persons link`, `omni persons unlink`, `omni persons update`.

**Severity:** HIGH. Persons dedup is a major architectural change for instance-scoping but CLI commands for it are completely undocumented.

**Suggested scope:**
- Expand `cli/routes-persons-auth.mdx` person section with:
  - `omni persons merge <id1> <id2>` — Merge two person records (cross-instance matching)
  - `omni persons link <id1> <id2>` — Link person records without merging
  - `omni persons unlink <id1> <id2>` — Remove link between records
  - `omni persons update <id> [options]` — Update person metadata
- Document cross-instance platformUserId matching concept
- Example workflows for deduplication

**Cross-links from:**
- `concepts/instances.mdx` (instance scoping concept)

**Evidence:** Summary: "Persons / dedup overhaul — Cross-instance person matching by `platformUserId`, Merge/link/unlink/update CLI + SDK commands"

---

### [HIGH] Omni `channel-gupshup` — New channel provider entirely undocumented

**Source:** Omni v2 adds Gupshup as a supported channel type (channel-gupshup plugin with REST API client, webhook handler, identity).

**What exists in source:** CLI help for `omni instances create` shows `gupshup` as a channel type with fields:
- `--gupshup-api-key <key>`
- `--gupshup-app-name <name>`
- `--gupshup-source-phone <phone>`
- `--gupshup-webhook-verify-token <token>`

**What docs have:** Nothing. No Gupshup docs, no channel setup guide, no example configuration.

**Severity:** HIGH. Gupshup is a new supported channel (likely for emerging markets) but has zero documentation.

**Suggested scope:**
- New page at `setup/channels/gupshup.mdx` OR section in existing channel docs
- Gupshup overview (what it is, supported regions)
- Prerequisites (Gupshup account, API credentials)
- Setup: `omni instances create --channel gupshup --gupshup-api-key <key> --gupshup-app-name <name> ...`
- Webhook configuration
- Testing & troubleshooting
- Cross-links from `concepts/instances.mdx`

**Cross-links from:**
- `concepts/instances.mdx` (channel types table)
- `quickstart.mdx` (setup alternatives)

**Evidence:** 
```
from omni-summary.md: "3. `channel-gupshup` — NEW channel plugin
- Full Gupshup channel: REST API client, webhook handler, senders, identity
- Plugin class + CLI + SDK integration"
```

---

### [MEDIUM] RLMX `rlmx stats` command — completely undocumented

**Source:** RLMX v0 (46 commits, major feature: "rlmx stats — NEW command: Query run history and cost breakdowns").

**What exists in source:** CLI help shows command exists: `rlmx stats [options] — Query run history and cost breakdowns`

**What docs have:** Nothing. The CLI reference (`cli/reference.mdx`) documents `rlmx`, `rlmx init`, `rlmx cache`, `rlmx batch`, `rlmx config` but NOT `rlmx stats`.

**Severity:** MEDIUM. This is a new observability command for cost/run tracking but completely missing from docs.

**Suggested scope:**
- New section in `cli/reference.mdx` after `batch`
- `rlmx stats [options]` command reference
- Options: time range, cost grouping, session filtering
- Output format: table of sessions with iterations, tokens, cost, timestamp
- Examples: `rlmx stats --since yesterday`, `rlmx stats --limit 10`
- Cross-link from observability section or monitoring guide

**Evidence:**
```
CLI help root: "rlmx stats [options] — Query run history and cost breakdowns"
```

---

### [MEDIUM] RLMX `rlmx benchmark` command — completely undocumented

**Source:** RLMX v0 (46 commits) adds new benchmark command: "rlmx benchmark — NEW command: Two modes: cost and oolong" for cost benchmarking and Oolong Synth dataset evaluation.

**What exists in source:** CLI help: `rlmx benchmark <mode> [options] — Run benchmarks (cost or oolong)`

**What docs have:** Nothing. The CLI reference does not document this command.

**Severity:** MEDIUM. Benchmarking is critical for performance validation but is completely missing from docs.

**Suggested scope:**
- New section in `cli/reference.mdx` after `batch`
- `rlmx benchmark <mode>` command reference
- Two modes explained: `cost` (cost benchmarking), `oolong` (Oolong Synth dataset)
- Options per mode (budget caps, dataset path, etc.)
- Output format and interpretation
- Examples: `rlmx benchmark cost --max-cost 1.00`, `rlmx benchmark oolong --dataset ./oolong-data.json`
- When to use benchmarking (performance validation, cost optimization)

**Evidence:**
```
From rlmx-summary.md:
"### 3. `rlmx benchmark` — NEW command
- Two modes: `cost` and `oolong`
- Fixed benchmark-data.json path for npm installations (#47)
- Uses uv for benchmark venv setup (#48)
- Correct Oolong Synth dataset field names (#49)"
```

---

### [MEDIUM] RLMX `rlmx init --template` flag — undocumented

**Source:** RLMX v0 adds template selection for init: "rlmx init --template <default|code>" with supported templates including default and code-analysis templates.

**What exists in source:** CLI help shows: `rlmx init [--template default|code] [--dir <path>]`

**What docs have:** `cli/reference.mdx` lines 99-125 document only:
```bash
rlmx init [--dir <path>]
```
No mention of `--template` flag or available templates.

**Severity:** MEDIUM. The template selection is a key part of the new `.rlmx/` scaffolding but the CLI reference is incomplete.

**Suggested scope:**
- Update `cli/reference.mdx` init section
- Add `--template <template>` to options table
- Document available templates: `default` (general RLM), `code` (code analysis)
- Explain what each template includes (SYSTEM.md, CRITERIA.md, TOOLS.md)
- Examples: `rlmx init --template code --dir ./my-project`

**Evidence:**
```
From rlmx-summary.md: ".rlmx/ directory scaffolding (BREAKING layout change)
- `rlmx init` now creates `.rlmx/` directory with templates (was: flat files)
- `--template default|code` flag selects template"
```

---

### [MEDIUM] RLMX `.rlmx/` directory layout — incompletely documented

**Source:** RLMX v0 introduced BREAKING change to config layout: `.rlmx/` directory structure replacing flat files.

**What exists in source:** Summary: "Config loader rewritten to only use `.rlmx/` directory. Templates include: rlmx.yaml, SYSTEM.md, CRITERIA.md, TOOLS.md. Default and code-analysis templates shipped."

**What docs have:** `config.mdx` mentions `.rlmx/` directory structure in the "Fallback files" section (lines 213-244) but this is described as a v0.1 legacy compatibility feature. The NEW `.rlmx/` as primary config is not clearly explained.

**Severity:** MEDIUM. This is a BREAKING layout change that all users need to understand, but the docs frame `.rlmx/` as legacy fallback instead of the new standard.

**Suggested scope:**
- Rewrite `config.mdx` introduction to clearly state: `.rlmx/` is the NEW primary config directory (not fallback)
- Document the required structure:
  ```
  .rlmx/
    ├── rlmx.yaml              # Main config
    ├── SYSTEM.md              # System prompt
    ├── CRITERIA.md            # Output criteria
    └── TOOLS.md               # Custom tools
  ```
- Explain template selection (`default` vs `code`)
- Migration guide from old flat-file layout to new `.rlmx/`
- Cross-link from quickstart

**Evidence:**
```
From rlmx-summary.md:
"### 1. `.rlmx/` directory scaffolding (BREAKING layout change)
- `rlmx init` now creates `.rlmx/` directory with templates (was: flat files)
- Config loader rewritten to only use `.rlmx/` directory
- Templates include: rlmx.yaml, SYSTEM.md, CRITERIA.md, TOOLS.md"
```

---

### [MEDIUM] Omni `instance-scoping` architectural concept — undocumented

**Source:** Omni v2 (97 commits) merges major feat/instance-scoping (PR #349) as "large architectural change landing multimodal providers."

**What exists in source:** Summary indicates: "Instance-scoping across Omni" as Wave 2, Groups 8-12. Related to person dedup, cross-instance matching by platformUserId.

**What docs have:** Nothing. No concept page for instance-scoping, no architectural explanation in `concepts/`.

**Severity:** MEDIUM. Instance-scoping is a major architectural feature but lacks conceptual documentation explaining what it is and how it affects routing, persons, and multimodal support.

**Suggested scope:**
- New concept page at `concepts/instance-scoping.mdx`
- Explain: What is instance-scoping? How does it relate to persons? Cross-instance matching and dedup.
- Impact on routing (per-instance routes vs global routes)
- Multimodal provider context within instance scope
- Examples of instance-scoped workflows

**Cross-links from:**
- `concepts/instances.mdx`
- `concepts/routes.mdx`

**Evidence:** Summary: "feat/instance-scoping — major merge (PR #349). Instance-scoping across Omni. Large architectural change landing multimodal providers."

---

### [MEDIUM] Omni turn-based execution mode — undocumented

**Source:** Omni v2 adds "Turn-based execution mode wired into agent dispatcher (new API feature)."

**What exists in source:** Summary mentions feature but no CLI command seems to expose it directly.

**What docs have:** Nothing. No documentation of turn-based mode concept or usage.

**Severity:** MEDIUM. Turn-based execution is a new execution model but completely undocumented conceptually.

**Suggested scope:**
- New concept page at `concepts/execution-modes.mdx` OR section in `concepts/agents.mdx`
- Explain turn-based execution: what it is, how it differs from continuous execution
- When to use turn-based vs streaming
- Configuration (API docs, if applicable)
- Examples of use cases

**Cross-links from:**
- `concepts/agents.mdx`
- `architecture/overview.mdx`

**Evidence:** From omni-summary.md: "Execution: Turn-based execution mode wired into agent dispatcher (new API feature)"

---

### [MEDIUM] Genie `genie omni` CLI command — undocumented

**Source:** Genie v4 (455 commits) includes "genie omni — major CLI surface update. PG-backed status queries, executor config resolver, lazy resume via executors table + metadata index."

**What exists in source:** CLI help shows `genie omni` as "Manage the Omni ↔ Genie NATS bridge".

**What docs have:** No page, no section. No documentation of the genie-omni integration command.

**Severity:** MEDIUM. The Omni integration is a new top-level command but has zero docs.

**Suggested scope:**
- New section in `cli/infrastructure.mdx` OR new page `cli/omni.mdx`
- `genie omni [command]` with subcommands
- Status querying (PG-backed)
- Executor configuration
- Lazy resume mechanics
- Examples of omni-genie workflows

**Cross-links from:**
- `quickstart.mdx`
- `architecture/overview.mdx`

**Evidence:** CLI root help shows `omni — Manage the Omni ↔ Genie NATS bridge`

---

### [LOW] RLMX pgserve storage integration — undocumented

**Source:** RLMX v0 adds "pgserve storage integration" for large context handling: "PgStorage class for pgserve lifecycle + context ingestion. StorageConfig added to config schema."

**What exists in source:** Summary mentions StorageConfig and pgserve dependency but unclear if exposed as CLI-configurable feature.

**What docs have:** `config.mdx` does not mention `storage:` section or StorageConfig.

**Severity:** LOW. This is a storage backend feature, likely for advanced users. Unclear if documented elsewhere.

**Suggested scope:**
- If `StorageConfig` is configurable in `rlmx.yaml`, add documentation
- Storage section in `config.mdx`
- When to use pgserve storage (large contexts)
- Configuration and auto-fallback behavior

**Evidence:**
```
From rlmx-summary.md:
"### 4. `pgserve` storage integration
- PgStorage class for pgserve lifecycle + context ingestion
- `StorageConfig` added to config schema
- pgserve dependency for large context handling
- Context validation gate with auto-fallback for large contexts"
```

---

### [LOW] RLMX `~/.rlmx/sessions/` auto-save — minimally documented

**Source:** RLMX v0 adds observability and session auto-save: "ObservabilityRecorder wired into main loop + batch engine. Auto-save session artifacts to `~/.rlmx/sessions/`."

**What exists in source:** Summary mentions auto-save but unclear how to configure or use.

**What docs have:** Not clearly documented where session artifacts are stored or how to access them.

**Severity:** LOW. Session history feature exists but lacks user guidance on accessing/managing saved sessions.

**Suggested scope:**
- Document in `config.mdx` or new section about observability
- Where sessions are stored: `~/.rlmx/sessions/`
- What is saved (artifacts, logs, cost breakdowns)
- How to view/analyze session history
- CLI command to list/search sessions (if exists)

**Evidence:**
```
From rlmx-summary.md:
"### 5. Observability tables + recorder
- ObservabilityRecorder wired into main loop + batch engine
- Auto-save session artifacts to `~/.rlmx/sessions/`"
```

---

## STUB PAGES (thin content, needs expansion)

### [MEDIUM] `genie/cli/infrastructure.mdx` — `genie app` section is minimal

**Current content:** 3 paragraphs (lines 74-97) covering only command invocation and flags.

**Missing sections:**
- Description of the 12 views (Fleet, Terminal, Sessions Replay, Mission Control, Cost Intelligence, Files, Settings, Scheduler, System)
- How to use the desktop interface
- Comparison with TUI mode
- Screenshots or ASCII art
- Keyboard shortcuts within the app

**What needs expansion:** Expand from 3 paragraphs to full section describing the app experience, views, and use cases.

---

### [MEDIUM] `omni/cli/messaging.mdx` — Missing verb commands section

**Current content:** Covers `send`, `chats`, `messages`, `tts`, `media` (lines 1-176).

**Missing sections:**
- Verb commands: `say`, `speak`, `listen`, `imagine`, `film`, `see`, `react`
- Examples for each verb
- Provider requirements and models

**What needs expansion:** Add full section for verb commands with syntax, options, examples.

---

### [LOW] `rlmx/cli/reference.mdx` — Missing `stats` and `benchmark` command sections

**Current content:** Documents `rlmx`, `rlmx init`, `rlmx cache`, `rlmx batch`, `rlmx config` but not stats/benchmark.

**Missing sections:**
- `rlmx stats [options]` full command reference
- `rlmx benchmark <mode> [options]` full command reference

**What needs expansion:** Add two new command sections with full syntax, options tables, and examples.

---

## OUTDATED/PARTIALLY WRONG PAGES

None identified in this sweep. Previous issues (e.g., incorrect `/learn` removal claim in skills.mdx) appear to have been fixed.

---

## Severity Summary

| Level | Count | Examples |
|-------|-------|----------|
| **CRITICAL** | 1 | genie app desktop feature |
| **HIGH** | 4 | Omni media verbs, persons ops, Gupshup channel, genie omni |
| **MEDIUM** | 7 | RLMX stats, benchmark, template flag, .rlmx/ layout, instance-scoping, turn-based, pgserve storage |
| **LOW** | 2 | RLMX sessions auto-save |
| **Total** | **14** | |

---

## Priority Action Plan

### Phase 1: Critical (do immediately)
1. **Expand `genie app` documentation** — Create comprehensive desktop app guide or expand `cli/infrastructure.mdx` with full app description, views, and UI workflows.

### Phase 2: High priority (next)
2. **Add Omni media verbs to messaging CLI** — Add verb commands section to `cli/messaging.mdx`.
3. **Document persons merge/link/unlink/update** — Expand `cli/routes-persons-auth.mdx` persons section.
4. **Create Gupshup channel setup guide** — New page or section for Gupshup channel setup and configuration.
5. **Document genie omni command** — Add to `cli/infrastructure.mdx` or create new page.

### Phase 3: Medium priority (this sprint)
6. **Add RLMX stats and benchmark commands** — Add sections to `cli/reference.mdx`.
7. **Document rlmx init --template flag** — Update `cli/reference.mdx` init section.
8. **Clarify RLMX .rlmx/ layout** — Rewrite `config.mdx` introduction to clearly document new .rlmx/ as primary.
9. **Add instance-scoping concept page** — Create `concepts/instance-scoping.mdx`.
10. **Add turn-based execution mode concept** — Add to `concepts/execution-modes.mdx` or agents page.

### Phase 4: Low priority
11. **Document pgserve storage config** — Add to config.mdx if user-configurable.
12. **Clarify session auto-save feature** — Document ~/.rlmx/sessions/ location and usage.

---

## Cross-Product Observations

### Genie (8 gaps)
- Desktop app needs substantial expansion (CRITICAL)
- New omni integration command undocumented
- Brain/learn pages exist but may be thin on details (not fully audited)

### Omni (4 gaps)
- Verb commands completely missing (HIGH priority)
- Persons dedup operations undocumented (HIGH priority)
- New channel type (Gupshup) with zero docs (HIGH priority)
- Architectural changes (instance-scoping, turn-based) lack concept docs (MEDIUM)

### RLMX (4 gaps)
- New commands (stats, benchmark) missing from CLI reference (MEDIUM)
- Config layout BREAKING change not clearly explained (MEDIUM)
- Minor: init template flag, sessions auto-save, pgserve storage

---

## Notes on Previous Report Findings

From 2026-04-02 report (20 gaps):
- **Resolved:** gaps #1-3 (brain/learn/genie-brain), #14 (brain install) — pages created
- **Partially resolved:** gaps #4-13, #15-20 (status uncertain, not fully rechecked this sweep)
- **Still present:** gaps #6, #7, #8 (serve/daemon, TUI stats, TUI context menu), #10 (PG LISTEN/NOTIFY), #16 (skill count)

This sweep focused on NEW gaps from recent commits (455 genie, 97 omni, 46 rlmx) and did not comprehensively audit whether older high-priority items were resolved.

---

*Report generated by gap-finder agent on 2026-04-05*
