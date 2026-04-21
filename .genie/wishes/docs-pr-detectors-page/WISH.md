# WISH: docs-pr-detectors-page — add self-healing detectors to Genie docs

## Context

Genie dev shipped a full self-healing detectors feature (4 PRs: #1236 group 3c high-risk detectors, #1237 group 3a low-risk detectors, #1242 group 5 runbook seed, #1244 group 4 tail filter) between 2026-04-17 and 2026-04-20. The detectors runbook is authoritative at `/home/genie/workspace/repos/genie/docs/detectors/runbook.md` and `/home/genie/workspace/repos/genie/docs/detectors/schema-audit.md`. None of this has been surfaced in `automagik-dev/docs` — `grep -ri detector docs/genie/` returns only 1 incidental mention in `config/hooks.mdx`.

This PR creates the first user-facing docs page for detectors.

**Target repo:** automagik-dev/docs (this repo). Target file: new page.

**Source-of-truth files (read, then summarize — do NOT copy-paste the entire runbook):**
- `/home/genie/workspace/repos/genie/docs/detectors/runbook.md` — 8-pattern triage guide (authoritative)
- `/home/genie/workspace/repos/genie/docs/detectors/schema-audit.md` — schema drift detection
- `/home/genie/workspace/agents/genie-docs/state/cli-help/genie/events/stream-follow.txt` — `--kind <prefix>` glob example `detector.*`
- Existing page to cross-link from: `/home/genie/workspace/repos/docs/genie/cli/observability.mdx`
- docs.json: `/home/genie/workspace/repos/docs/docs.json` (add new page under an appropriate group)

## Execution groups

### Group A — Create `genie/observability/detectors.mdx`

**Deliverable:** new page `genie/observability/detectors.mdx` with these sections (each a short `##`):

1. **Overview** — one-paragraph elevator pitch: "Detectors emit `rot.*` and `detector.*` events when genie observes anomalies (state drift, schema drift, orphaned executors, etc.). You can stream them in real time to react to problems as they happen."
2. **Listing active detectors** — brief list of the 8 pattern families covered in the runbook (one line each). Point readers at `cli/observability.mdx` for the raw `genie events list --kind detector.*` command.
3. **Streaming in real time** — `<CodeGroup>` or fenced `bash` example showing `genie events stream-follow --kind 'detector.*'` with the `--severity` filter and `--since 5m` seed window.
4. **Triage procedure** — Mintlify `<Steps>` summarizing the runbook's triage flow at a high level (identify → classify → escalate → verify). Each step one sentence.
5. **Self-healing groups** — `<CardGroup>` with 4 cards: group 3a (low-risk), group 3c (high-risk), group 4 (tail filter), group 5 (runbook seed). Each card links to the runbook markdown upstream (use GitHub permalink to `automagik-dev/genie` blob).
6. **See also** — `<CardGroup>` linking to `genie/cli/observability.mdx`, `genie/architecture/state.mdx`.

**Source of truth:** runbook.md (summarize, don't paste). Keep page < 150 lines.

**Acceptance:**
- New file exists at `genie/observability/detectors.mdx`.
- Frontmatter has `title`, `description` (≤ 160 chars), and `icon` (match Mintlify conventions).
- Uses `<Steps>` and `<CardGroup>` components.
- At least one `<Note>` or `<Warning>` call-out (e.g., "Detectors surface anomalies, not errors — not all events require action").
- `mint broken-links` passes.

### Group B — Wire into `docs.json` navigation

**Deliverable:** add the new page to `docs.json` under `navigation.products[product=Genie]`. Introduce a new group "Observability" (between "Architecture" and "Hacks & Tips") OR add to an existing "Architecture" group — whichever reads better. Check sibling site structure for precedent.

**Source of truth:** `/home/genie/workspace/repos/docs/docs.json` — Genie product navigation.

**Acceptance:** `mint broken-links` + Mintlify dev server ingests `docs.json` without error. New page reachable from Genie tab.

### Group C — Cross-link from `cli/observability.mdx`

**Deliverable:** add a short `<Tip>` or `<Note>` near the `genie events list` section in `genie/cli/observability.mdx` pointing to the new detectors page: "For a walkthrough of rot/detector events and triage, see [Detectors](./observability/detectors.mdx)."

**Acceptance:** link renders, destination exists.

## Constraints

- Do NOT copy full text from runbook.md into the new page. Summarize.
- Use sentence case for headings. Active voice. Second person.
- Use `bash` language on shell blocks, not `shell` or bare ```.
- Branch name: `docs/pr-detectors-page`.
- PR title: `docs(genie): add self-healing detectors page`.
- PR body includes: rationale (4 upstream PRs, 0 existing coverage), link to this wish, link to runbook.md source file in genie repo.

## Out of scope

- Documenting every individual detector's schema (belongs in a future "detector reference" page).
- Modifying the runbook upstream in `automagik-dev/genie`.
- Other `genie events` subcommands (`stream-follow` is covered in sibling PR `docs-pr-events-subcommands`).
