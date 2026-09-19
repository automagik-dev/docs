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

### Rollback

**The default is to fix forward.** A bad `6.x` is superseded by the next `6.<date>.N`, which is one merged PR away
and takes the normal, fully-gated path. Reach for a rollback only when operators are actively installing something
broken and the next build is not minutes away.

The five-minute rollback is **a hand-authored PR to `main` that reverts `.well-known/latest.json` to the last good
`5.x`.** That file is the channel authority: `install.sh` reads the stable manifest from `main` through the
credential-free contents API (and the CDN copy, which lags it by roughly five minutes), so pointing it back at a `5.x`
release is what actually stops new installs — nothing else does. The already-published `6.x` assets stay exactly where
they are; a release is never unpublished or rewritten.

If the whole major turned out to be premature, **revert the promotion commit on `main`**. That restores the version
generator and the release guard together, in one commit — `scripts/version.ts` and `scripts/release-guard.sh` both
carry the major, and reverting only one of them leaves a tree that generates a tag its own guard rejects.

**Do not try to re-dispatch a `5.x` stable release.** Once the major has moved, `release-guard.sh` rejects a `5.x`
version by design — it validates the version against the major the tree declares. That refusal is the guard working,
not a bug to route around. The path back to `5.x` is the manifest revert above, or the promotion revert, never a
dispatch.

## The orphan alert

The alert workflow files one `release-incident` issue per orphaned tag and closes it again on its own once the Release
appears. Two behaviours matter when reading its output:

- **Promotion tags are exempt.** A promotion advances a monotonic manifest and its Release object lags the tag by
  design, so promotion tags never raise an alert during the publish lag.
- **A healed incident auto-closes** and is labelled `release-auto-resolved`. The label is written after the close, as a
  one-shot receipt, and is created lazily only when it does not already exist. An issue carrying that label was resolved
  by the pipeline itself — nobody needs to look at it.

If the orchestrator never fires at all, check that `version.yml` dispatched it.
