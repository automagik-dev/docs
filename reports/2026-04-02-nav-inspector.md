# Nav Inspector Report — 2026-04-02

**Scope:** Cross-check `docs.json` navigation config against actual `.mdx` files for all three products (Genie, Omni, RLMX).

**Data sources:**
- `docs.json`: `/home/genie/workspace/repos/docs/docs.json`
- Genie pages: `/home/genie/workspace/repos/docs/genie/**/*.mdx` (55 files)
- Omni pages: `/home/genie/workspace/repos/docs/omni/**/*.mdx` (17 files)
- RLMX pages: `/home/genie/workspace/repos/docs/rlmx/**/*.mdx` (5 files)
- CLI help captures: `/home/genie/workspace/agents/docs/state/cli-help/genie/*.txt`

---

## Orphan Pages (file exists, not in nav)

**None.** Every `.mdx` file under `genie/`, `omni/`, and `rlmx/` has a corresponding entry in `docs.json`.

---

## Dead Nav Entries (in nav, no file)

**None.** Every path listed in `docs.json` navigation has a corresponding `.mdx` file on disk.

---

## Missing Nav Entries (should be added)

- **`genie/skills/brain.mdx`** — The `/brain` skill exists in the skill system (`genie:brain`) and has a CLI help capture (`brain.txt`: "Knowledge graph engine (enterprise)"), but no docs page or nav entry exists. This is a new skill that needs documentation before being added to nav.
- **`genie/skills/learn.mdx`** — The `/learn` skill exists in the skill system (`genie:learn`: "Diagnose and fix agent behavioral surfaces when the user corrects a mistake"), but no docs page or nav entry exists. Needs documentation first.
- **`genie/skills/brain-init.mdx`** — The `/brain-init` skill exists in the skill system (`genie:brain-init`: "Initialize and personalize a knowledge brain"), but no docs page or nav entry exists. Needs documentation first.

All three are correctly absent from nav today (you cannot add a nav entry without a file). They should be created as `.mdx` files and then added to the "Skills Reference" group in `docs.json`.

---

## Nav Structure Issues

### Ordering: Good

All three products follow the correct pattern of progressive disclosure:

**Genie** (8 groups):
1. Getting Started — overview, features, quickstart, installation
2. Core Concepts — wishes, agents, teams, boards, projects, skills, byoa
3. Skills Reference — 15 skill pages
4. CLI Reference — 17 command group pages
5. Configuration — setup, files, worktrees, hooks, tmux
6. Architecture — overview, state, postgres, messaging, scheduler, transcripts
7. Hacks & Tips
8. Contributing

**Omni** (4 groups): Getting Started, Core Concepts, CLI Reference, Architecture

**RLMX** (3 groups): Getting Started, CLI Reference, Configuration

No ordering issues detected. Getting started content comes first, reference material later, supplementary content last.

### CLI Command Coverage: Good

All top-level CLI commands are documented in existing pages:
- `tui`, `app`, `shortcuts` -> `genie/cli/infrastructure.mdx`
- `brief` -> `genie/cli/observability.mdx`
- `init` -> `genie/cli/directory.mdx`
- `template` -> `genie/cli/boards.mdx` (as `genie board template`)
- `serve`, `daemon` -> `genie/cli/infrastructure.mdx`
- `qa`, `qa-report` -> `genie/cli/observability.mdx`

### Minor Observations

- The `genie/cli/spawn.mdx` page overlaps with `genie/cli/agents.mdx` (which also covers `spawn`). Both exist as separate nav entries. This is intentional — spawn has dedicated docs due to its complexity — but worth noting for maintenance.
- CLI help files `for.txt`, `last.txt`, `main.txt`, `ones.txt` appear to be capture artifacts (they all show the root help output), not real commands. These can be ignored.

---

## Summary

| Check | Result |
|-------|--------|
| Orphan pages | 0 |
| Dead nav entries | 0 |
| Missing skill docs | 3 (`brain`, `learn`, `brain-init`) |
| Nav ordering | Correct |
| CLI coverage | Complete for all existing commands |
| Overall health | **Good** — nav is fully synced with files |
