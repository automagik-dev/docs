# RLMX — Changes since docs freeze 2026-03-30

**Base tag:** v0.260330.12
**HEAD:** 5d41c1a (on dev; latest published v0.260331.5)
**Commits:** 46
**Files:** 40 changed (+4,018 / -579)

## Major new features

### 1. `.rlmx/` directory scaffolding (BREAKING layout change)
- `rlmx init` now creates `.rlmx/` directory with templates (was: flat files)
- `--template default|code` flag selects template
- Config loader rewritten to only use `.rlmx/` directory
- Templates include: `rlmx.yaml`, `SYSTEM.md`, `CRITERIA.md`, `TOOLS.md`
- Default and code-analysis templates shipped
- Stale `.rlmx/` and `node_modules` removed from tracking

### 2. `rlmx stats` — NEW command
- Query run history and cost breakdowns
- Wired into observability tables + `ObservabilityRecorder`
- pg_batteries Python functions + IPC handlers for storage queries

### 3. `rlmx benchmark` — NEW command
- Two modes: `cost` and `oolong`
- Fixed benchmark-data.json path for npm installations (#47)
- Uses uv for benchmark venv setup (#48)
- Correct Oolong Synth dataset field names (#49)

### 4. `pgserve` storage integration
- PgStorage class for pgserve lifecycle + context ingestion
- `StorageConfig` added to config schema
- pgserve dependency for large context handling
- Context validation gate with auto-fallback for large contexts
- pgserve auth credentials + tsvector size limit fix (#51)

### 5. Observability tables + recorder
- ObservabilityRecorder wired into main loop + batch engine
- Auto-save session artifacts to `~/.rlmx/sessions/`

### 6. Minor fixes
- Reset consecutive empty counter on thinking-only responses (#44)
- Respect `context.extensions` from `rlmx.yaml` (#28)

## Documentation impact

| Area | Action needed |
|------|--------------|
| `.rlmx/` config layout | Full rewrite of config docs — BREAKING change |
| `rlmx init` | Document `--template` flag + `.rlmx/` scaffold |
| `rlmx stats` | NEW command page |
| `rlmx benchmark` | NEW command page (cost + oolong modes) |
| `pgserve` storage | NEW architecture section |
| `StorageConfig` | Update config reference |
| `~/.rlmx/sessions/` | Document session auto-save |
| Context validation gate | Document auto-fallback behavior |
