# WISH: docs-pr-mintlify-components — add Note/Warning/Tip to 9 CLI reference pages

## Context

Sweep found 20 of 60 `genie/**/*.mdx` files use zero Mintlify components. The 9 highest-value to fix are CLI reference pages (long, dense, currently lacking visual call-outs):

- `genie/cli/observability.mdx` (364 lines, 0 components)
- `genie/cli/team.mdx` (187 lines, 0 components)
- `genie/cli/boards.mdx` (196 lines, 0 components)
- `genie/cli/projects.mdx` (84 lines, 0 components)
- `genie/cli/registry.mdx` (234 lines, 0 components)
- `genie/cli/directory.mdx` (150 lines, 0 components)
- `genie/cli/session.mdx` (69 lines, 0 components)
- `genie/cli/dispatch.mdx` (145 lines, 0 components)
- `genie/cli/releases-tags-types.mdx` (162 lines, 0 components)

Sibling pages like `genie/onboarding.mdx`, `genie/quickstart.mdx`, and `genie/cli/spawn.mdx` use `<CardGroup>`, `<Note>`, `<Warning>`, `<Steps>`, `<Tip>` heavily. This PR brings the 9 reference pages up to that bar.

**Target repo:** automagik-dev/docs (this repo). Touches 9 existing files.

## Execution groups

### Group A — Add components to each of 9 pages

**For each page, follow this pattern (don't over-do it — quality over quantity):**

1. **At least one `<Warning>`** for any destructive operation or footgun (e.g., `genie team disband` deletes data; `genie release` is irreversible).
2. **At least one `<Note>`** for any non-obvious behavior (e.g., "`genie events list` shows recent events; use `--since 1h` to widen").
3. **One `<Tip>`** for power-user shortcuts (e.g., "Use `--json` to pipe output into `jq`").
4. **A `<CardGroup>` "See also" section** at the end with 2-4 cross-links to related pages.

**Page-specific guidance:**

- **observability.mdx**: Warning on `genie events admin` (incident-response); Tip on `--json | jq` pipelines; CardGroup links to detectors page (sibling PR), spawn, scheduler.
- **team.mdx**: Warning on `genie team disband`; Note on `--no-spawn` for testing; Tip on `--wish` auto-spawning a leader.
- **boards.mdx**: Note on board-task relationship; Tip on `genie task --json` for scripting.
- **projects.mdx**: Note on project vs team distinction; CardGroup links to boards, tasks, teams.
- **registry.mdx**: Warning on publish (irreversible); Note on `--dry-run`.
- **directory.mdx**: Note on `init` vs `register` (when each applies).
- **session.mdx**: Tip on tmux session naming conventions.
- **dispatch.mdx**: Note on the relationship between dispatch primitives and skills; CardGroup links to wish, work, review.
- **releases-tags-types.mdx**: Warning on tag/release destructive actions; Note on type vs role.

**Style:**
- Don't wrap everything — prose still does most of the work. Use components to highlight, not decorate.
- Match component placement of `genie/cli/spawn.mdx` (look at how it interleaves prose, code, and components).

**Acceptance:**
- Each of the 9 files has ≥ 3 Mintlify components (1 each of Warning/Note/Tip minimum).
- Each file has a "See also" `<CardGroup>` at the end.
- `mint dev` renders without component errors.
- `mint broken-links` passes.
- `git diff` shows additions only (no prose deletions unless the prose was redundant with the new component).

## Constraints

- 9 file edits, no new pages, no docs.json change.
- Don't introduce content that wasn't already implied by the existing prose. Components REFRAME existing info; they don't add new claims.
- Branch name: `docs/pr-mintlify-components`.
- PR title: `docs(genie/cli): add Note/Warning/Tip components to reference pages`.
- PR body lists the 9 files with a one-line summary of what was added to each.

## Out of scope

- Architecture pages (`architecture/*.mdx`) — separate concern, defer.
- Skill pages (`skills/*.mdx`) — covered or planned in sibling PRs.
- Concept page `concepts/agents.mdx` — defer to a content-rewrite wish.
- New pages (none).
