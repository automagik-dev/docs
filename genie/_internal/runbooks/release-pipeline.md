# Release pipeline runbook

## Symptoms

A `v*` tag exists on origin but no Release object appears for that tag. Operators see a report, or the orphan alert
workflow files a `release-incident` issue.

## Diagnosis

Check the orchestrator run for the failed job. The orchestrator sequences build, sign-attest, and publish in one run.
Read the failed job logs.

```bash
TAG="v6.260919.1"
gh run list --workflow=release.yml --branch "$TAG"
RUN_ID=12345          # paste the failing run id from the list above
gh run view --log "$RUN_ID"
```

## Recovery

**Recovery cannot dispatch the per-file workflows.** `sign-attest.yml` and `release-publish.yml` are `workflow_call`-only
— they have no `workflow_dispatch` trigger, so there is no escape hatch that re-enters the pipeline halfway. Recovery is
always "produce a new build", never "resume this one".

### A dev orphan

A dev release that failed after its tag was pushed **cannot be re-run**. `version.yml` allocates a fresh build number on
every run and only calls `release.yml` after its own atomic push of the new `[auto-version]` child succeeds. Once dev's
tip already *is* that child, every re-run of the Version run rebuilds a sibling, detects the pinned next tag, and skips
the Release job. `release.yml`'s manual dispatch offers only `channel=stable`, and `release-guard.sh` rejects a human
dev dispatch.

So: **land any commit on dev through a normal pull request.** The next Version run ships the same tree under the next
build number. The orphan tag stays where it is — it is a record of an attempt, not a thing to clean up — and its
incident closes as superseded.

Re-running failed *jobs* inside one attempt is fine for a transient GitHub error. Re-running the whole workflow is not:
endorsements from different attempts make the security gate fail with `verified signer run disagreement`.

### A stable orphan

A stable release recovers through the stable re-dispatch, which `release.yml` does expose:

```bash
gh workflow run release.yml --field channel=stable
```

The tag stays, and the incident closes as superseded once the Release object appears.

## The orphan alert

The alert workflow files one `release-incident` issue per orphaned tag and closes it again on its own once the Release
appears. Two behaviours matter when reading its output:

- **Promotion tags are exempt.** A promotion advances a monotonic manifest and its Release object lags the tag by
  design, so promotion tags never raise an alert during the publish lag.
- **A healed incident auto-closes** and is labelled `release-auto-resolved`. The label is written after the close, as a
  one-shot receipt, and is created lazily only when it does not already exist. An issue carrying that label was resolved
  by the pipeline itself — nobody needs to look at it.

If the orchestrator never fires at all, check that `version.yml` dispatched it.
