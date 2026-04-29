# Codex App-Server Research Spec

## Purpose

This document captures the research conclusions and implementation practices from the Codex app-server integration work. It is not a release checklist and does not claim the current branch is production ready. Use it as the operating spec for future Codex provider work, reviews, and follow-up fixes.

## Architecture Findings

- Genie needs two explicit Codex runtime surfaces:
  - `codex`: interactive TUI in tmux, backed by a Codex app-server sidecar and connected with `codex resume <thread> --remote <ws-url>`.
  - `codex-app-server`: headless process executor, backed by the same app-server control path but without a public pane.
- The standalone adapter boundary is the right abstraction. `CodexAppServerAdapter` owns JSON-RPC correlation, notification dispatch, request timeouts, malformed message failure, transport shutdown, and server-request surfacing.
- Executor state is the source of truth for runtime liveness. Worker rows are display/routing records and can lag or omit `current_executor_id`, especially when an executor is linked to a durable agent identity row.
- Codex thread identity must be persisted in provider-neutral executor metadata and mirrored into the legacy resume slot while the scheduler still reads `executors.claude_session_id`.
- Mailbox delivery for `codex-app-server` is pull-based by the host process. Protocol-router pane injection should skip this provider and let the host poll durable mailbox rows.
- Interactive Codex panes are a UI surface, not the control plane. The sidecar owns thread/turn control; the pane should exit when the host dies, and pane exit should stop the host.

## Best Practices We Used

- Prefer explicit providers over overloaded flags. Splitting `codex` and `codex-app-server` made transport, resume, TUI behavior, and templates auditable. Keep `--surface` only as a migration shim.
- Keep protocol code provider-neutral. The adapter exports Codex thread, turn, notification, request, and lifecycle concepts without depending on Genie provider classes.
- Persist runtime metadata early and patch it incrementally. Store `threadId`, `activeTurnId`, `listenUrl`, `hostPid`, `serverPid`, `logPath`, `surfaceKind`, `status`, and `lastError` under `metadata.codexAppServer`.
- Treat notification-derived state as authoritative for working/idle transitions. `turn/started` sets `activeTurnId`; `turn/completed` clears it and maps failed turns to executor error state.
- Add compatibility only at the boundary. Legacy `surface=headless` templates migrate to `provider=codex-app-server`, and Codex `threadId` is mirrored into `claude_session_id` only because existing resume code still expects that column.
- Use process evidence in reviews. A passing DB state is not enough for lifecycle features; verify `ps` output for `codex-host` and `codex app-server` after kill/stop paths.
- Make smoke tests exercise real operator commands. The useful sequence is spawn, inspect DB metadata, send/follow-up if applicable, stop/resume, kill, and process cleanup.
- Prefer one resolver for worker-to-executor lookup. Any command that starts from a worker row should resolve the active executor through `currentExecutorId`, tmux pane, and `metadata.workerId` / `metadata.agentName`.
- Keep PATH normalization close to runtime launch. Codex was installed globally outside the shell PATH in this environment, so launch code should include known user bin directories before falling back to `codex`.
- Preserve transcript/log recovery separately from runtime control. Rollout/log discovery should stay available even if app-server metadata is missing or stale.

## Review Heuristics

- If `genie resume <worker>` reports `no_session_id`, check whether `metadata.codexAppServer.threadId` exists and whether it was mirrored to `executors.claude_session_id`.
- If `genie ls` shows a synthetic-pane Codex worker as offline while `ps` shows a live host, suspect worker-row/executor-row mismatch.
- If `genie kill` marks the executor terminated but processes remain, the DB lifecycle and OS lifecycle are out of sync. The fix must target host/backend teardown, not only executor state.
- If protocol-router cannot find a live `codex-app-server` worker, inspect liveness helpers before changing mailbox delivery. The provider intentionally queues/polls instead of tmux-injecting.
- If a test asserts implementation text like `isPaneAlive(w.paneId)`, update it to assert the behavior or helper contract. String-literal tests become stale during liveness refactors.
- If a wish/design says websocket is out of scope but the implementation uses `--remote ws://`, update the spec before review. A stale wish makes acceptance criteria misleading.

## Validation Matrix

| Concern | Evidence to Collect |
| --- | --- |
| Adapter correctness | Unit tests for concurrent request correlation, notifications, server requests, malformed JSON, process exit, and timeout rejection. |
| Thread persistence | DB row has `metadata.codexAppServer.threadId` and `executors.claude_session_id` after `thread/start` or `thread/resume`. |
| Idle delivery | Mailbox or provider delivery produces one `turn/start` and sets executor/worker state to working. |
| Active steering | Delivery during active regular turn uses `turn/steer` with the current `activeTurnId`; mismatch falls back only after refreshing state. |
| Interrupt/kill | `turn/interrupt` is attempted, host/backend processes exit, executor ends in terminal state, and no orphan `codex-host` remains. |
| Interactive TUI | tmux pane runs `codex resume <thread> --remote <listenUrl>` and exits when the host PID disappears. |
| Headless executor | worker has synthetic pane `codex-app-server`, transport `inline`, provider `codex-app-server`, and liveness resolves through executor state. |
| Regression safety | Claude provider, native inbox delivery, transcript recovery, run spec validation, and event schemas still pass. |

## Current Known Gaps

- The worker row and durable identity row can disagree about `current_executor_id`. Future work should centralize worker-to-executor resolution and use it in liveness, resume, stop, send, duplicate detection, and kill.
- Host shutdown is still the risky path. A robust implementation should treat SIGTERM/SIGINT as cancellation, interrupt active turns with a bounded timeout, close the adapter, then terminate the backend process group.
- The wish/design text predates the `codex` versus `codex-app-server` split and should be refreshed before using it as a release gate.
- Full-suite validation must be green before merge; focused Codex tests are necessary but not sufficient.

## Recommended Commands

```bash
bun run typecheck
bun test src/lib/__tests__/codex-app-server-adapter.test.ts
bun test src/lib/__tests__/codex-app-server-manager.test.ts
bun test src/lib/providers/codex.test.ts
bun test src/lib/protocol-router.test.ts
bun test src/term-commands/__tests__/agents-resume.test.ts
bun test src/term-commands/agents.test.ts
bun test
bunx biome check src/genie.ts src/lib src/term-commands src/services src/tui
genie wish lint codex-app-server-integration
```

For smoke validation, use real CLI commands and inspect both DB and OS process state:

```bash
bun src/genie.ts spawn engineer --provider codex-app-server --team codex-smoke --prompt 'Smoke test: create a thread and wait.'
bun src/genie.ts ls --json
bun src/genie.ts resume <worker-id>
bun src/genie.ts stop <worker-id>
bun src/genie.ts kill <worker-id>
ps -eo pid,ppid,stat,cmd | rg 'codex-host|codex app-server|<executor-id>|<listen-url>'
```
