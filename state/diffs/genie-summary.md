# Genie v4 — Changes since docs freeze 2026-03-30

**Base tag:** v4.260330.1
**HEAD:** 72fded8e (on feat/genie-app-v1; latest published v4.260405.5)
**Commits:** 455
**Files:** 410 changed (+50,886 / -9,171)

## Major new features

### 1. `genie app` — Desktop App v1 (HUGE)
New Tauri desktop application with 12 native views:
- Command Center + app shell with sidebar navigation
- Fleet screen (agents view rewrite with team grouping + detail panel)
- Terminal integration with xterm.js + NATS PTY relay
- Sessions Replay + Mission Control + Cost Intelligence (Wave 3)
- Files browser + Settings tabs + Scheduler + System views (Wave 4)
- NATS subject registry and backend service handlers
- Scaffolded khal-native app with defineManifest

### 2. `genie omni` — CLI surface rewrite
- PG-backed status queries replace runtime Map semantics
- Executor config resolver + `genie_executor` flip switch
- Lazy resume via `executors` table + metadata index
- Inline session content capture for SDK executor
- Document session Map semantics
- `safePgCall` helper + `pgAvailable` scaffolding

### 3. Brain refinements
- Rename `genie brain update` → `genie brain upgrade` (#1027)
- NOTIFY triggers removed from test schemas

### 4. Init / workspace fixes
- `genie init` respects CWD when scaffolding agents (#1023)
- `resolveAgentsDir` uses path-segment matching
- `isTempPath` uses canonicalized paths (symlink resolution)
- Dynamic config path in serve warning

### 5. PG / database changes
- `pgserve` timeout increased to 30s + `GENIE_PGSERVE_TIMEOUT` env override (#1043)
- Agent sync surfaces workspace resolution failures (no more tmp path poisoning)
- Directory `resolve()` and `ls()` prefer `dir:` rows over stale runtime rows

### 6. Testing / CI
- Cross-tag version collision detection in publish-next skip check
- `task-close-merged` command (new)
- Test pollution fixes in claude-sdk mocks

### 7. Refactor/demotion
- `services/executor.ts` demoted
- `World B elimination path` documented
- Unified executor layer merged (#1062)

## Documentation impact

| Area | Action needed |
|------|--------------|
| `genie app` command | NEW page needed — currently undocumented |
| `genie omni` command | Major update — new subcommands, PG backend |
| `genie brain upgrade` | Rename from `update` → verify docs |
| `genie task close-merged` | NEW subcommand |
| `genie init` | Verify `--dir` / CWD scaffolding behavior |
| `genie serve` | Verify warning messages + pgserve timeout env |
| Architecture/executor | Document `genie_executor` flip + lazy resume |
| Skills: `/brain`, `/learn` | Verify skill docs against source |
