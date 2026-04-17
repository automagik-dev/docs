# Wish: Revamp Genie onboarding + restructure Skills Reference

| Field | Value |
|-------|-------|
| **Status** | DRAFT |
| **Slug** | `genie-docs-onboarding-revamp-20260417` |
| **Date** | 2026-04-17 |
| **Design** | _No brainstorm — direct wish_ |

## Summary

The 6-lens specialist sweep (conv-27f7f557) independently confirmed that the Genie onboarding funnel is rotten. `installation` comes after `quickstart` in the nav; the `wizard` is buried 6th in Skills Reference; `wizard.mdx` reads as agent-spec not user docs; five references to `/brainstorm` / `/wish` / `/review` / `/work` are backticked-but-not-hyperlinked; there's no path from the landing page to the skills reference. This wish rewrites the 5 onboarding pages, splits the flat 17-page Skills Reference into **Guided Workflow** (the canonical loop) + **Power Skills** (secondary), and authors two new connective-tissue pages (`onboarding.mdx`, `loop-overview.mdx`). Non-onboarding drift, gap, and consistency findings are explicitly OUT — they get their own wishes.

## Scope

### IN
- Rewrite `genie/index.mdx` — no prose wall, icon in frontmatter, linked card to skills.
- Rewrite `genie/features.mdx` — intro + card count fix ("8 capabilities" → generic or accurate).
- Rewrite `genie/installation.mdx` — `<Steps>`, `<Note>` platform callout, **add Homebrew path**, link to next pages (config/setup, cli/agents, quickstart).
- Rewrite `genie/quickstart.mdx` — minor: remove duplicate H1, move PostgreSQL footnote into a `<Note>`.
- Rewrite `genie/skills/wizard.mdx` — user-first voice, `<Steps>` for the 5 phases, hyperlink every skill reference, drop "delegate to /brainstorm with seed context" spec-doc language, add CardGroup footer.
- Author new `genie/onboarding.mdx` — the 15-minute guided walkthrough threading install → quickstart → wizard → first wish → first PR → first monitor.
- Author new `genie/skills/loop-overview.mdx` — one-page canonical **plan → review → work → ship → monitor** flow, the single index over the Guided Workflow group.
- Restructure `docs.json` Genie product nav:
  - Reorder Getting Started: `index → features → installation → quickstart → onboarding`.
  - Split flat **Skills Reference** into two groups: **Guided Workflow** (loop-overview, wizard, brainstorm, wish, review, work, fix, pm) and **Power Skills** (council, dream, refine, trace, report, docs, learn, brain, genie-hacks, genie).
- Mintlify `broken-links` → green before merge.

### OUT
- Freshness drift findings (9 `genie spawn` SDK flags, `genie reset`, `--source`, `text:` protocol, phantom `tui`/`omni`, `setup --shortcuts` wording). Tracked as a separate wish: `genie-docs-freshness-drift-20260417`.
- Gap findings (WISH.md drift detection page, `genie serve` omni bridge, `genie doctor --fix`, `genie update` channels). Tracked separately.
- Consistency findings (global `worker → agent` rename, `genie work` arg order fix, `boards.mdx` orphan rewire, sessions rename, cross-product terminology unification). Tracked separately.
- Anything in `khal-os/docs`.
- Anything in `omni/` or `rlmx/` subtrees (those products have their own onboarding audits pending).
- Source code changes in `automagik-dev/genie` itself — docs-only wish.
- Killing the wizard entirely — council of specialists did not support retirement. Keep it; rewrite it.

## Decisions

| Decision | Rationale |
|----------|-----------|
| Keep `wizard` as a skill page, rewrite it user-first | Specialists' 6-lens sweep flagged voice + hyperlinking — not the existence of the skill. The wizard's job (guided onboarding overlay that delegates to the loop skills) is still sensible; the doc just needs to stop leaking agent-delegation language into user copy. |
| Split Skills Reference into Guided Workflow + Power Skills | The flat 17-entry list buries the actual journey. Users need to see the plan→review→work→ship→monitor loop before they see `/refine` or `/learn`. |
| Promote `wizard` to #2 in Guided Workflow (after `loop-overview`) | It's the guided entry, not a random skill. Position reflects audience journey. |
| Add `loop-overview.mdx` as the first page in Guided Workflow | A one-page explanation of the loop — so users understand WHY the six pages exist before diving into each. Mirrors the `what-is-khal-os.mdx` pattern we shipped in khal-os/docs. |
| Add `onboarding.mdx` as the #5 Getting Started page | Threads the first 15 minutes end-to-end (install, smoke test, first wish, first PR, first `genie status`). Separate from `quickstart.mdx` which stays as the 60-second smoke test. |
| Put `installation` BEFORE `quickstart` in Getting Started | Nav-inspector finding — current order tells readers to run commands before installing. |
| Add Homebrew install path to `installation.mdx` | Gap-finder finding — macOS users currently hit a dead end. Brew tap for `automagik/tap` (or equivalent). |
| All skill references in `wizard.mdx` become hyperlinks | Link-tracer finding — 5 backticked mentions with no click-through. |
| Docs-only wish; no CLI source changes | Some findings (e.g., `genie tui` phantom) may require CLI work, but those belong in source-repo issues, not this wish. |

## Updated structure (ASCII)

```
BEFORE — current Genie product nav                 AFTER — revamped nav
═══════════════════════════════════════════       ═══════════════════════════════════════════
                                                    
Getting Started                                     Getting Started
├─ index                                            ├─ index              (hot home + icon + skills card)
├─ features                                         ├─ features           (sharpened; 8→12 card count fixed)
├─ quickstart          ◀── WRONG ORDER              ├─ installation       ◀── moved up + Homebrew + <Steps>
└─ installation                                     ├─ quickstart         (60-sec smoke test)
                                                    └─ onboarding         ⭐ NEW — 15-min walkthrough
                                                    
Core Concepts (unchanged)                           Core Concepts (unchanged)
└─ wishes, agents, teams, boards,                   └─ wishes, agents, teams, boards,
     projects, skills, byoa                              projects, skills, byoa
                                                    
Skills Reference (flat — 17 pages)                  The Genie Loop        ⭐ NEW GROUP
├─ brainstorm                                       ├─ loop-overview      ⭐ NEW — canonical flow
├─ wish                                             ├─ wizard             ◀── rewritten user-first,
├─ work                                             │                         promoted from #6 → #2
├─ review                                           ├─ brainstorm
├─ pm                                               ├─ wish
├─ wizard              ◀── BURIED 6th               ├─ review
├─ council                                          ├─ work
├─ trace                                            ├─ fix
├─ fix                                              └─ pm                 (copilot/autopilot/pair)
├─ report                                           
├─ refine                                           Power Skills          ⭐ NEW GROUP
├─ dream                                            ├─ council
├─ docs                                             ├─ dream
├─ genie                                            ├─ refine
├─ genie-hacks                                      ├─ trace
├─ brain                                            ├─ report
└─ learn                                            ├─ docs
                                                    ├─ learn
CLI Reference (17 pages, unchanged)                 ├─ brain
Configuration (unchanged)                           ├─ genie-hacks
Architecture (unchanged)                            └─ genie              (meta router)
Hacks & Tips                                        
Contributing                                        CLI Reference (unchanged)
                                                    Configuration (unchanged)
                                                    Architecture (unchanged)
                                                    Hacks & Tips
                                                    Contributing
```

**FDE journey — before vs. after:**

```
BEFORE                                              AFTER
════════════════════════════════                    ═════════════════════════════════════════════
                                                    
   index  ──▶  quickstart  ──▶  ???                   index ──▶ features ──▶ installation
                (run before                                                       │
                 installing?)                                                      ▼
                                                                              quickstart
   Wants to learn skills?                                                          │
     │                                                                              ▼
     ▼                                                                         onboarding ⭐
   Sidebar, scroll to Skills Reference,                                             │
   scan 17 entries, guess at ordering,                                              ▼
   click "wizard" (buried at #6),                                            ┌──────────────────┐
   read spec-doc voice,                                                      │  The Genie Loop  │
   can't click /brainstorm /wish /review /work                               │                  │
                                                                              │  loop-overview   │
                                                                              │  (one page, the  │
                                                                              │   whole story)   │
                                                                              │        │         │
                                                                              │        ▼         │
                                                                              │  wizard (tour)   │
                                                                              │        │         │
                                                                              │        ▼         │
                                                                              │  brainstorm ────▶ wish ────▶ review
                                                                              │                                 │
                                                                              │                                 ▼
                                                                              │              work ◀── fix  ◀── (FIX-FIRST)
                                                                              │               │
                                                                              │               ▼
                                                                              │              pm (monitor)
                                                                              └──────────────────┘
                                                    
                                                    Want more? ──▶ Power Skills (council, dream,
                                                                    refine, trace, report, docs,
                                                                    learn, brain, genie-hacks, genie)
```

## Success Criteria

- [ ] `docs.json` Genie product nav reflects the BEFORE→AFTER diagram above.
- [ ] `installation.mdx` is ordered before `quickstart.mdx` in Getting Started.
- [ ] `genie/skills/wizard.mdx` appears second in the new "The Genie Loop" group (after `loop-overview`).
- [ ] `genie/onboarding.mdx` exists and threads install → quickstart → wizard → first wish → first PR → `genie status`.
- [ ] `genie/skills/loop-overview.mdx` exists, one page, covers plan → review → work → ship → monitor with `<Steps>` + `<CardGroup>`.
- [ ] `wizard.mdx` has zero "delegate to X" language; every `/brainstorm`, `/wish`, `/review`, `/work`, `/fix`, `/pm` mention is a hyperlink.
- [ ] `installation.mdx` documents the Homebrew path alongside npm/bun/curl/source.
- [ ] `index.mdx` has an `icon` in frontmatter and at least one link to `skills/wizard` or `onboarding`.
- [ ] Every rewritten / new page uses `<Steps>`, `<CardGroup>`, `<Note>`, or `<Warning>` components — no wall-of-prose pages.
- [ ] Every rewritten / new page has a `## What's next` `<CardGroup>` at the bottom.
- [ ] `mintlify broken-links` returns `success no broken links found`.
- [ ] No non-onboarding content is modified — genie/cli/*, genie/concepts/*, genie/config/*, genie/architecture/*, genie/hacks.mdx, genie/contributing.mdx are byte-identical to `main`.
- [ ] `omni/` and `rlmx/` subtrees untouched.

## Execution Strategy

Wave 1 runs four content groups in parallel (each author writes its own page; no cross-file conflicts). Wave 2 wires the new nav. Wave 3 reviews + PRs.

### Wave 1 (parallel — 4 groups)

| Group | Agent | Description |
|-------|-------|-------------|
| 1 | engineer | Onboarding funnel rewrite: `index.mdx`, `features.mdx`, `installation.mdx` (+ Homebrew), `quickstart.mdx` |
| 2 | engineer | Wizard rewrite: `skills/wizard.mdx` — user-first voice, hyperlinks, `<Steps>`, CardGroup footer |
| 3 | engineer | New page: `onboarding.mdx` — 15-min threaded walkthrough |
| 4 | engineer | New page: `skills/loop-overview.mdx` — canonical plan→review→work→ship→monitor |

### Wave 2 (after Wave 1)

| Group | Agent | Description |
|-------|-------|-------------|
| 5 | engineer | `docs.json` restructure: reorder Getting Started, split Skills Reference → Guided Workflow + Power Skills, wire new pages |

### Wave 3 (after Wave 2)

| Group | Agent | Description |
|-------|-------|-------------|
| review | docs--reviewer + docs--visual-critic + docs--link-tracer | Verify: onboarding funnel flows, nav resolves, `mintlify broken-links` green, no out-of-scope files touched |
| PR | orchestrator | `docs(genie): revamp onboarding + restructure Skills Reference` targeting `main` |

## Execution Groups

### Group 1: Onboarding funnel rewrite

**Goal:** Rewrite the 4 existing Getting Started pages so a new user bounces off nothing.

**Deliverables:**
1. `genie/index.mdx` — frontmatter gets `icon`; the opening prose wall is broken up (first Mintlify component within first 10 lines); "What this gives you" bullet list (lines 45–51) becomes `<CardGroup cols={2}>`; a "Skills Reference" / "Onboarding walkthrough" card is added to the next-steps CardGroup.
2. `genie/features.mdx` — `"8 capabilities"` heading fixed (accurate count OR generic wording); 1-sentence intro becomes a short `<Note>` with the core value prop; the footer "Learn more" text becomes a styled `<Info>` callout or `<CardGroup>`. Frontmatter gets `icon`.
3. `genie/installation.mdx` — full rewrite. **Add Homebrew install as the first path** (`brew install automagik/tap/genie` — verify the actual tap name against the repo's release flow). Add a `<Note>` at top with supported platforms. Convert the "This will:" numbered list to `<Steps>`. Convert the "Post-Install Setup" bullet list to `<CardGroup cols={2}>`. Add a "Next steps" `<CardGroup>` with links to `config/setup`, `cli/agents`, `quickstart`, `onboarding`. Frontmatter gets `icon`.
4. `genie/quickstart.mdx` — minor cleanups only: remove the duplicate `# Quickstart` H1 under the frontmatter title; move the PostgreSQL detail in "What just happened?" into a `<Note>` or cut it; Step 4's bullet list becomes a nested `<CardGroup>` or `<AccordionGroup>`.

**Acceptance Criteria:**
- [ ] All 4 pages have `icon` in frontmatter.
- [ ] Each page uses at least three Mintlify components (`<Steps>`, `<CardGroup>`, `<Note>`, `<Warning>`, `<Info>`, `<AccordionGroup>`, `<Frame>`, `<CodeGroup>`).
- [ ] `installation.mdx` documents the Homebrew path.
- [ ] `quickstart.mdx` no longer has a duplicated `# Quickstart` H1.
- [ ] Every page ends with a `## What's next` `<CardGroup>`.

**Validation:**
```bash
cd /home/genie/workspace/repos/docs
for f in genie/index.mdx genie/features.mdx genie/installation.mdx genie/quickstart.mdx; do
  # frontmatter icon
  head -10 "$f" | grep -q '^icon:' || { echo "FAIL: no icon in $f"; exit 1; }
  # component variety (at least 3 distinct Mintlify tags)
  variety=$(grep -oE '<(Steps|CardGroup|Card|Note|Warning|Info|AccordionGroup|Accordion|Frame|CodeGroup|Tabs)' "$f" | sort -u | wc -l)
  [ "$variety" -ge 3 ] || { echo "FAIL: $f has only $variety distinct Mintlify components"; exit 1; }
  # "What's next" footer
  grep -q '^## What.s next' "$f" || { echo "FAIL: $f missing What's next"; exit 1; }
done
# Homebrew in installation
grep -qE 'brew (install|tap)' genie/installation.mdx || { echo "FAIL: no Homebrew path"; exit 1; }
# No duplicate H1 in quickstart
dup=$(awk 'NR>10 && /^# /' genie/quickstart.mdx | wc -l)
[ "$dup" -eq 0 ] || { echo "FAIL: duplicate H1 in quickstart.mdx"; exit 1; }
echo OK
```

**depends-on:** none

---

### Group 2: Wizard rewrite

**Goal:** Rewrite `genie/skills/wizard.mdx` so it reads as user onboarding, not agent-spec.

**Deliverables:**
1. Replace the 5 `### Phase N` headers with a single `<Steps>` block — each phase is a `<Step title="...">`. Each Step's prose is 2–4 sentences maximum, user-facing (not "delegate to X"; instead "the wizard now asks you to describe the idea" or "once you confirm, it calls `/brainstorm` — click through to see what that does").
2. Every reference to `/brainstorm`, `/wish`, `/review`, `/work`, `/fix`, `/pm` becomes a Markdown hyperlink (`[`/brainstorm`](/genie/skills/brainstorm)`). Not backticks alone.
3. "When to Use" bullet list becomes a `<Note>` or `<AccordionGroup>`.
4. Phase 5's code block wraps in a `<Frame>` for consistency with `quickstart.mdx`.
5. Voice pass: strip "Delegate to /brainstorm with seed context" and equivalent spec-doc instructions. Rewrite user-facing. The wizard is a guided tour; the doc describes what the user experiences, not what the agent does.
6. New `## What's next` `<CardGroup>` at the bottom linking to `/genie/skills/loop-overview`, `/genie/skills/brainstorm`, `/genie/skills/wish`.
7. Keep the existing `icon: wand-magic-sparkles` in frontmatter.

**Acceptance Criteria:**
- [ ] Zero occurrences of "delegate to" / "Delegate to" / "Delegates to" in the page.
- [ ] Every `/brainstorm`, `/wish`, `/review`, `/work`, `/fix`, `/pm` mention is a hyperlink (format: `[/name](/genie/skills/name)`).
- [ ] Phases are rendered with `<Steps>` (H3 phases removed).
- [ ] Page ends with `## What's next` `<CardGroup>`.
- [ ] No heading-hierarchy skips (H2 → H3 only; no H2 → H2 → H3 as the current page does).

**Validation:**
```bash
cd /home/genie/workspace/repos/docs/genie/skills
# No delegate language
! grep -iE 'delegate to' wizard.mdx || { echo FAIL spec-doc language; exit 1; }
# All skill mentions are hyperlinked (if /brainstorm appears, it must be in a link)
for s in brainstorm wish review work fix pm; do
  if grep -q "/${s}" wizard.mdx; then
    # count links vs bare mentions
    bare=$(grep -cE "[^[]\`?/${s}\`?" wizard.mdx || true)
    linked=$(grep -cE "\\[/${s}" wizard.mdx || true)
    [ "$linked" -gt 0 ] || { echo "FAIL: /${s} not hyperlinked in wizard.mdx"; exit 1; }
  fi
done
# Uses <Steps>
grep -q '<Steps>' wizard.mdx || { echo FAIL no Steps; exit 1; }
# What's next footer
grep -q '^## What.s next' wizard.mdx || { echo FAIL no What\'s next; exit 1; }
echo OK
```

**depends-on:** none

---

### Group 3: Onboarding walkthrough page (NEW)

**Goal:** Author `genie/onboarding.mdx` — the 15-minute threaded walkthrough.

**Deliverables:**
1. New file `genie/onboarding.mdx` with frontmatter: `title`, `description: "The first 15 minutes — install, smoke test, first wish, first PR, first monitor"`, `icon: "rocket"`.
2. Content structure (use `<Steps>` as the top-level scaffold):
   - Step 1 — "Install the CLI" (1 paragraph + link to `/genie/installation`).
   - Step 2 — "Smoke test it" (1 command from `/genie/quickstart` + expected output screenshot placeholder).
   - Step 3 — "Run the wizard" (link to `/genie/skills/wizard` + 2-sentence preview of what happens).
   - Step 4 — "Your first wish" (link to `/genie/skills/wish` + concrete example prompt).
   - Step 5 — "Review and ship" (link to `/genie/skills/review` + `/genie/skills/work`).
   - Step 6 — "Monitor what you shipped" (`genie status` + `genie events list --since 5m` + link to `/genie/skills/pm`).
3. Below the `<Steps>`: `<CardGroup>` with "Something broke" (→ `/genie/skills/fix`) and "Go deeper" (→ `/genie/skills/loop-overview`).
4. No new CLI commands invented — every command cited is present in `/home/genie/workspace/repos/genie/` or the CLI `--help` output at `/home/genie/workspace/genie-docs/state/cli-help/genie/`.

**Acceptance Criteria:**
- [ ] File exists at `genie/onboarding.mdx`.
- [ ] 6 `<Step>` entries.
- [ ] Links to: installation, quickstart, wizard, wish, review, work, fix, loop-overview, pm.
- [ ] Every command is verified against CLI `--help` (no fabricated flags).
- [ ] Ends with `## What's next` `<CardGroup>`.

**Validation:**
```bash
cd /home/genie/workspace/repos/docs/genie
test -f onboarding.mdx
steps=$(grep -c '<Step ' onboarding.mdx)
[ "$steps" -eq 6 ] || { echo "FAIL: expected 6 Steps, got $steps"; exit 1; }
for t in installation quickstart skills/wizard skills/wish skills/review skills/work skills/fix skills/loop-overview skills/pm; do
  grep -q "/genie/${t}" onboarding.mdx || { echo "FAIL: missing link to /genie/${t}"; exit 1; }
done
echo OK
```

**depends-on:** none

---

### Group 4: Loop overview page (NEW)

**Goal:** Author `genie/skills/loop-overview.mdx` — one page that tells the whole plan→review→work→ship→monitor story.

**Deliverables:**
1. New file `genie/skills/loop-overview.mdx` with frontmatter: `title: "The Genie Loop"`, `description: "Plan → Review → Work → Ship → Monitor — the canonical lifecycle"`, `icon: "arrows-rotate"`.
2. Content structure:
   - Opening `<Note>` with the one-sentence pitch: "Every genie job moves through five phases. You can jump in at any phase; the skills that implement each phase are listed below."
   - `<CardGroup cols={3}>` of the 5 phases (Plan, Review, Work, Ship, Monitor) where each card names the primary skill that drives that phase and links to it.
   - `<Steps>` walking through a typical one-shot lifecycle (clone idea → wish → review → work → ship → pm) with hyperlinks to each skill.
   - `## Entry points` table mapping user intent → phase → skill, e.g.:
     | I want to... | Start at... | Skill |
     |---|---|---|
     | Explore a fuzzy idea | Plan | [/brainstorm](/genie/skills/brainstorm) |
     | Formalize a plan | Plan | [/wish](/genie/skills/wish) |
     | Gate a plan / PR | Review | [/review](/genie/skills/review) |
     | Execute an approved wish | Work | [/work](/genie/skills/work) |
     | Close FIX-FIRST gaps | Work | [/fix](/genie/skills/fix) |
     | Orchestrate a backlog | all | [/pm](/genie/skills/pm) |
   - Closing `<CardGroup>` linking to `onboarding.mdx` (the walkthrough that uses this loop) and `concepts/wishes.mdx` (the primitive this loop operates on).

**Acceptance Criteria:**
- [ ] File exists at `genie/skills/loop-overview.mdx`.
- [ ] Uses `<Steps>`, `<CardGroup>`, `<Note>`.
- [ ] Links to all 6 Guided Workflow skills (wizard, brainstorm, wish, review, work, fix) plus `/pm`.
- [ ] Includes the "I want to..." intent-to-skill table.
- [ ] Ends with `## What's next` `<CardGroup>`.

**Validation:**
```bash
cd /home/genie/workspace/repos/docs/genie/skills
test -f loop-overview.mdx
grep -q '<Steps>' loop-overview.mdx
grep -q '<CardGroup' loop-overview.mdx
for t in wizard brainstorm wish review work fix pm; do
  grep -q "/genie/skills/${t}" loop-overview.mdx || { echo "FAIL: missing link to /genie/skills/${t}"; exit 1; }
done
echo OK
```

**depends-on:** none

---

### Group 5: Nav restructure

**Goal:** Wire `docs.json` to the new structure.

**Deliverables:**
1. Reorder the `Getting Started` group to: `index → features → installation → quickstart → onboarding`.
2. Replace the flat `Skills Reference` group with two new groups in the Genie product:
   - **`The Genie Loop`** (order: `loop-overview, wizard, brainstorm, wish, review, work, fix, pm`).
   - **`Power Skills`** (order: `council, dream, refine, trace, report, docs, learn, brain, genie-hacks, genie`).
3. No changes to any other product (Omni, Rlmx) or any other group (Core Concepts, CLI Reference, Configuration, Architecture, Hacks & Tips, Contributing).
4. No new external links or navbar changes.

**Acceptance Criteria:**
- [ ] `docs.json` parses as valid JSON.
- [ ] Getting Started pages list == `["genie/index","genie/features","genie/installation","genie/quickstart","genie/onboarding"]`.
- [ ] A group named "The Genie Loop" exists under the Genie product, with exactly 8 entries in the listed order.
- [ ] A group named "Power Skills" exists under the Genie product, with exactly 10 entries in the listed order.
- [ ] No `Skills Reference` group remains under the Genie product.
- [ ] Omni and Rlmx products' nav is byte-identical to `main`.

**Validation:**
```bash
cd /home/genie/workspace/repos/docs
python3 -c "
import json, sys
d = json.load(open('docs.json'))
genie = next(p for p in d['navigation']['products'] if p['product'] == 'Genie')
gs = next(g for g in genie['groups'] if g['group'] == 'Getting Started')
assert gs['pages'] == ['genie/index','genie/features','genie/installation','genie/quickstart','genie/onboarding'], f'Getting Started pages wrong: {gs[\"pages\"]}'
loop = next(g for g in genie['groups'] if g['group'] == 'The Genie Loop')
assert loop['pages'] == [
  'genie/skills/loop-overview','genie/skills/wizard','genie/skills/brainstorm',
  'genie/skills/wish','genie/skills/review','genie/skills/work',
  'genie/skills/fix','genie/skills/pm'
], f'Guided Workflow wrong: {loop[\"pages\"]}'
power = next(g for g in genie['groups'] if g['group'] == 'Power Skills')
assert len(power['pages']) == 10
assert not any(g['group'] == 'Skills Reference' for g in genie['groups']), 'Skills Reference still present'
print('nav OK')
"
# broken-links gate
npx --yes mintlify broken-links | tail -2
```

**depends-on:** Group 1, Group 2, Group 3, Group 4 (all files must exist before nav references them)

---

### Group 6 (review): Specialist gate

**Goal:** Before PR, dispatch 3 lens specialists to verify the revamp.

**Deliverables:**
1. `genie spawn docs--visual-critic` → verify each rewritten page hits at least 3 Mintlify component types, no prose walls, "What's next" footer present.
2. `genie spawn docs--link-tracer` → verify every `/brainstorm`, `/wish`, `/review`, `/work`, `/fix`, `/pm` mention across the new + rewritten files is a hyperlink.
3. `genie spawn docs--reviewer` → gate against this wish's Success Criteria.

**Acceptance Criteria:**
- [ ] Visual-critic returns no CRITICAL/HIGH findings on the 5 rewritten + 2 new pages.
- [ ] Link-tracer returns zero backticked-but-not-linked skill mentions.
- [ ] Reviewer returns SHIP.

**Validation:** specialist verdicts posted to team chat.

**depends-on:** Group 5

---

## QA Criteria

_What must be verified on `dev` after merge._

- [ ] Loading `genie/index` in the live Mintlify preview renders without prose walls.
- [ ] Sidebar shows Getting Started as `index → features → installation → quickstart → onboarding`, in that order.
- [ ] Sidebar shows "The Genie Loop" group (not "Skills Reference") with `loop-overview` first and `wizard` second.
- [ ] Sidebar shows "Power Skills" group with 10 entries.
- [ ] Clicking any skill reference inside `wizard.mdx` navigates to the target skill page (no dead backticks).
- [ ] `onboarding.mdx` renders the 6-step walkthrough and all links resolve.
- [ ] `loop-overview.mdx` renders the intent-to-skill table.
- [ ] `mintlify broken-links` still passes.
- [ ] A regression check: `/omni/*` and `/rlmx/*` sidebar entries unchanged.

---

## Assumptions / Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Homebrew tap for genie doesn't exist / isn't public yet. | Medium | Verify against `automagik-dev/genie` release workflow before authoring Step 3 of installation.mdx. If no tap, document "Homebrew coming soon" or skip + flag for a follow-up wish. |
| A specialist flags a rewritten page as "too thin" vs the current verbose version. | Low | Thin + clear beats thick + muddled. Reviewer gate is the tie-breaker. |
| Renaming groups in docs.json breaks external inbound links (e.g., someone links `/#skills-reference`). | Low | Mintlify anchors use page paths, not group names. Pages keep their slugs. No regression expected. |
| `loop-overview.mdx` vs `wizard.mdx` role overlap confuses users. | Medium | `loop-overview` is the map; `wizard` is the guided tour. Make that distinction explicit in both pages' opening `<Note>`. |
| `onboarding.mdx` vs `quickstart.mdx` role overlap. | Medium | `quickstart` = 60-second smoke test; `onboarding` = 15-minute walkthrough. Both pages open with a one-sentence audience disambiguator. |
| Wave 1 groups write conflicting or inconsistent cross-links because they run in parallel. | Medium | Group 5 (nav) runs strictly after Wave 1, and Group 6 (review) runs after Group 5 — link-tracer catches any inconsistency before PR. |

---

## Review Results

_Populated by `/review` after execution completes._

---

## Files to Create/Modify

```
MODIFY:
  genie/index.mdx                        (frontmatter icon + break prose wall + skills card)
  genie/features.mdx                     (intro Note + card-count fix + styled footer + icon)
  genie/installation.mdx                 (full rewrite: Steps + Note + Homebrew + CardGroup + icon)
  genie/quickstart.mdx                   (remove duplicate H1 + move PostgreSQL footnote to Note)
  genie/skills/wizard.mdx                (user-first voice + hyperlinks + Steps + CardGroup footer)
  docs.json                              (reorder Getting Started, split Skills Reference)

CREATE:
  genie/onboarding.mdx                   (15-minute walkthrough)
  genie/skills/loop-overview.mdx         (canonical plan→review→work→ship→monitor)

UNTOUCHED (hard boundary):
  genie/cli/**                           (drift findings go in a separate wish)
  genie/concepts/**
  genie/config/**
  genie/architecture/**
  genie/hacks.mdx
  genie/contributing.mdx
  omni/**
  rlmx/**
  snippets/**
```
