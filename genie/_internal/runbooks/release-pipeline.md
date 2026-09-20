# Release pipeline runbook

## Symptoms

A `v*` tag exists on origin but no Release object appears for that tag. Operators see a report or the orphan alert workflow files an issue.

## Diagnosis

Check the orchestrator run for the failed job. The orchestrator sequences build, sign-attest, and publish in one run. Read the failed job logs.

```bash
TAG="v4.260510.6"
gh run list --workflow=release.yml --branch "$TAG"
RUN_ID=12345          # paste the failing run id from the list above
gh run view --log "$RUN_ID"
```

## Recovery

There is no per-file escape hatch. `sign-attest.yml` and `release-publish.yml` are `workflow_call`-only — they run as jobs inside one release attempt and cannot be dispatched with an external run id. As `release-publish.yml` puts it: "All artifacts are from one workflow run; there is no standalone dispatch or external run-id recovery path."

### Transient failure inside one release attempt

Re-run the failed jobs of that same run:

```bash
gh run rerun <run-id> --failed
```

Prefer re-running the whole run over a partial re-run. Every artifact's endorsement carries the signer run that produced it, and the stable security gate requires them all to agree; artifacts mixed across attempts fail the gate with `verified signer run disagreement`.

### A dev release whose tag is already pushed

It cannot be republished. `version.yml` derives a fresh build number from the existing `v5.<yymmdd>.*` tags, pushes the version commit and the new tag with one `git push --atomic`, and only calls `release.yml` after that push succeeds. A re-run re-derives against the tag that now exists, so the atomic push is rejected and the run stops at:

```
release-race.next-tag-pin-skipped.detected
```

The remedy is to land any commit on `dev` through a normal PR — the next green CI run allocates the next build number and publishes it. The orphan tag is already acknowledged by the Release Orphan Alert issue; do not try to re-dispatch that version.

### Stable

Stable is never auto-dispatched. After the promotion PR merges, `version.yml` pushes the fresh promotion tag and writes the `release.yml` inputs into the run summary (`version`, `channel: stable`, `source_sha`, `source_branch: main`, `source_ci_run_id`). A maintainer then opens **Actions → Release → Run workflow** on `main` and supplies them; manual dispatch offers `stable` as the only channel. A different maintainer must approve the protected `production` environment — the initiator cannot.

If the orchestrator never fires at all, check that `version.yml` reached its release job.
