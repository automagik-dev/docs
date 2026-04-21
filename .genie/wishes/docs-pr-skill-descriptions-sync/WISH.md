# WISH: docs-pr-skill-descriptions-sync — sync 12 skill page frontmatter to source SKILL.md

## Context

The `description:` field in `genie/skills/<name>.mdx` frontmatter has drifted from `skills/<name>/SKILL.md` in the upstream genie repo. Most are minor wording changes, but `genie/skills/genie.mdx` is materially wrong:
- **Doc says**: "Transform any Claude Code session into an Automagik Genie orchestrator — guide users through the wish lifecycle."
- **Source says**: "Single entry point for all genie operations — auto-routes natural language to the right skill, detects existing lifecycle state, and handles operational commands."

This PR aligns 12 skill descriptions to their authoritative `SKILL.md` source.

**Target repo:** automagik-dev/docs (this repo). Target files: 12 `.mdx` frontmatter edits.

## Skills to sync (with full source-of-truth)

For each skill below, the docs `description:` must match the exact `description:` line in the corresponding `/home/genie/workspace/repos/genie/skills/<name>/SKILL.md` frontmatter. Verify each by reading the source file.

| Skill | Doc file | Source file |
|-------|----------|-------------|
| genie | `genie/skills/genie.mdx` | `/home/genie/workspace/repos/genie/skills/genie/SKILL.md` |
| brainstorm | `genie/skills/brainstorm.mdx` | `.../skills/brainstorm/SKILL.md` |
| wish | `genie/skills/wish.mdx` | `.../skills/wish/SKILL.md` |
| review | `genie/skills/review.mdx` | `.../skills/review/SKILL.md` |
| work | `genie/skills/work.mdx` | `.../skills/work/SKILL.md` |
| fix | `genie/skills/fix.mdx` | `.../skills/fix/SKILL.md` |
| docs | `genie/skills/docs.mdx` | `.../skills/docs/SKILL.md` |
| dream | `genie/skills/dream.mdx` | `.../skills/dream/SKILL.md` |
| refine | `genie/skills/refine.mdx` | `.../skills/refine/SKILL.md` |
| trace | `genie/skills/trace.mdx` | `.../skills/trace/SKILL.md` |
| report | `genie/skills/report.mdx` | `.../skills/report/SKILL.md` |
| council | `genie/skills/council.mdx` | `.../skills/council/SKILL.md` |

## Execution groups

### Group A — Sync 12 frontmatter descriptions

**Deliverable:** for each of the 12 files, replace the `description:` line in the YAML frontmatter with the exact text from source `SKILL.md` frontmatter.

- Preserve quoting style (single vs double quotes — match what the existing file uses; if in doubt, use double).
- Preserve all other frontmatter fields (title, icon, etc.) untouched.
- Do NOT touch the body of the page in this PR (body sync is a separate concern).

**Acceptance:**
- All 12 files have `description:` matching their source.
- Frontmatter remains valid YAML (`mint dev` parses without error).
- `git diff` shows only `description:` changed in each file (one-line edits each).

## Constraints

- Strictly frontmatter only. No body edits.
- If source `description` is > 160 chars (Mintlify recommendation), shorten it cleanly while preserving the load-bearing words ("auto-routes", "single entry point", etc.). Do NOT silently change meaning.
- Branch name: `docs/pr-skill-descriptions-sync`.
- PR title: `docs(genie/skills): sync 12 skill descriptions to source SKILL.md`.
- PR body table summarizes before/after for the most-changed entries (esp. `genie` skill).

## Out of scope

- Body content drift in skill pages (filed separately if needed).
- New skill pages (none missing).
- Source-side changes (docs is the consumer; SKILL.md is authoritative).
