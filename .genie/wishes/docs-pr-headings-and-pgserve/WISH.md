# WISH: docs-pr-headings-and-pgserve — fix heading hierarchy + note pgserve 1.1.10

## Context

Three small drift fixes bundled into one low-risk PR:

1. `genie/cli/export-import.mdx` has 4 `# H1` headings — should have 1 (Mintlify expectation).
2. `genie/config/files.mdx` has 2 `# H1` headings — same fix.
3. `pgserve` was bumped 1.1.8 → 1.1.10 in genie PR #1245 (2026-04-20). Docs mention `pgserve` in 10 pages but never pin a version. Two pages are the right place to note the bump:
   - `genie/cli/database.mdx`
   - `genie/architecture/postgres.mdx`

**Target repo:** automagik-dev/docs (this repo). Touches 4 existing files.

**Source-of-truth files:**
- `/home/genie/workspace/repos/genie/CHANGELOG.md` — confirm pgserve bump entry
- `/home/genie/workspace/repos/genie/package.json` — confirm pgserve version pin

## Execution groups

### Group A — Demote secondary `#` headings in `cli/export-import.mdx`

**Deliverable:** keep the first `#` (the page title — though technically Mintlify uses frontmatter `title:` for that; if the existing first `#` is just decorative, demote ALL to `##` and rely on frontmatter for the page title). Audit current content, then:

- Convert H1 #2, #3, #4 to `##`.
- Cascade-demote any descendant headings if needed (`##` → `###`, etc.) ONLY if the original hierarchy was correct relative to the H1 (rarely the case).

**Acceptance:** `grep -c '^# ' export-import.mdx` returns 0 or 1 (depending on whether title is in frontmatter or body).

### Group B — Demote secondary `#` heading in `config/files.mdx`

**Deliverable:** same as Group A — convert the 2nd H1 to `##`.

**Acceptance:** `grep -c '^# ' files.mdx` returns 0 or 1.

### Group C — Note `pgserve >=1.1.10` in 2 pages

**Deliverable:** add a small `<Note>` component (or inline note) to `genie/cli/database.mdx` and `genie/architecture/postgres.mdx`:

> Genie requires pgserve >=1.1.10 (bumped 2026-04-20).

Pick the most natural placement (e.g., near "Prerequisites" or wherever pgserve is first introduced).

**Acceptance:** both pages have a version note; references to "pgserve" elsewhere on the page are consistent (don't pin one version in one paragraph and another in the next).

## Constraints

- 4 file edits, no new pages, no docs.json change.
- Cascade carefully — the heading demotion must not skip levels (e.g., if H1 → H3 existed, fixing H1 to H2 may now require H3 → H3 (no change)).
- Branch name: `docs/pr-headings-and-pgserve`.
- PR title: `docs(genie): fix heading hierarchy + note pgserve 1.1.10 minimum`.

## Out of scope

- Heading audits in other files (sweep showed only 2 files with multi-H1 issues).
- Other dependency-version notes (e.g., bun, node) — separate concern.
- pgserve mentions on other pages (8 of 10 pages don't need a version note; just the 2 most-relevant).
