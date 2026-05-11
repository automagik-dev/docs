---
title: latest.json Channel Pointer Schema
description: JSON Schema (draft 2020-12) for the .well-known/latest.json release-channel pointer file.
---

# `.well-known/latest.json` — Channel Pointer Schema

`.well-known/latest.json` is the published-by-genie file that `install.sh`,
`genie update`, and any third-party verifier reads to learn what version is
**current** for a given release channel. It is committed to `main` by the
`release-publish.yml` workflow on every stable, non-draft GitHub Release and
served via:

```
https://raw.githubusercontent.com/automagik-dev/genie/main/.well-known/latest.json
```

There is **no CDN, no signing key, no separate verification server**. The
file is a plain commit on `main`; integrity comes from the Git/GitHub trust
boundary (commit signing of the `release-bot` identity, branch protection,
and the supply-chain attestations on the artifacts it points to).

## Why `schema_version`

Operators install via `curl … | bash` and never see breaking changes —
because there will never be a breaking change. If we need a new field, we
add it as **optional**. If we need to break the contract, we ship a new
filename (`latest-v2.json`) and keep the old one alive for the deprecation
window. `schema_version: 1` is the explicit promise that any v1 reader can
read any v1 file forever.

## Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://raw.githubusercontent.com/automagik-dev/genie/main/.well-known/latest.json#/schema",
  "title": "Genie Channel Pointer",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "schema_version",
    "channel",
    "version",
    "released_at",
    "tarball_base",
    "platforms"
  ],
  "properties": {
    "schema_version": {
      "const": 1,
      "description": "Schema version. v1 readers may ignore unknown fields but MUST refuse files with a different schema_version."
    },
    "channel": {
      "type": "string",
      "enum": ["stable", "beta", "canary"],
      "description": "Release channel this pointer represents. The filename also encodes the channel for non-stable: latest.json (stable), latest-beta.json, latest-canary.json."
    },
    "version": {
      "type": "string",
      "pattern": "^[0-9]+\\.[0-9]+\\.[0-9]+(-[A-Za-z0-9.-]+)?$",
      "description": "The version string from package.json (e.g. \"4.260509.5\"). Matches the v<version> tag in the GitHub Release URL minus the leading 'v'."
    },
    "released_at": {
      "type": "string",
      "format": "date-time",
      "description": "ISO 8601 UTC timestamp of the release-publish workflow run. Format: YYYY-MM-DDTHH:MM:SSZ."
    },
    "tarball_base": {
      "type": "string",
      "format": "uri",
      "pattern": "^https://github\\.com/[^/]+/[^/]+/releases/download/v[^/]+$",
      "description": "Base URL where per-platform tarballs (and signing material) are hosted. Concrete asset URL: <tarball_base>/genie-<version>-<platform>.tar.gz"
    },
    "platforms": {
      "type": "array",
      "minItems": 1,
      "uniqueItems": true,
      "items": {
        "type": "string",
        "enum": [
          "linux-x64-glibc",
          "linux-x64-musl",
          "linux-arm64",
          "darwin-arm64"
        ]
      },
      "description": "Platforms shipped this release. install.sh and `genie update` use this list to select the matching tarball for the current host. darwin-x64 is intentionally absent (Intel Mac unsupported, see G1)."
    }
  }
}
```

## Canonical Example

```json
{
  "schema_version": 1,
  "channel": "stable",
  "version": "4.260509.5",
  "released_at": "2026-05-09T18:42:11Z",
  "tarball_base": "https://github.com/automagik-dev/genie/releases/download/v4.260509.5",
  "platforms": ["linux-x64-glibc", "linux-x64-musl", "linux-arm64", "darwin-arm64"]
}
```

## Asset URL Resolution

Given a host's `<platform>` (one of the four enum values), readers construct
the download URL as:

```
<tarball_base>/genie-<version>-<platform>.tar.gz
<tarball_base>/genie-<version>-<platform>.tar.gz.bundle        (cosign keyless bundle)
<tarball_base>/genie-<version>-<platform>.tar.gz.intoto.jsonl  (SLSA L3 DSSE envelope)
```

Every release attaches **12 assets** (4 platforms × 3 files). Readers MUST
download the bundle + intoto.jsonl alongside the tarball and verify both
before extracting. See `docs/security/key-rotation.mdx` for the cosign
identity pin and `SECURITY.md` for the full verification command.

## Reader Contract (install.sh + `genie update`)

A v1-conformant reader:

1. Fetches `latest.json` (or `latest-beta.json` / `latest-canary.json`) over
   HTTPS from `raw.githubusercontent.com/automagik-dev/genie/main/.well-known/`.
2. Refuses to parse files where `schema_version != 1`.
3. Refuses to parse files where `channel` does not match the channel the
   reader was invoked for.
4. Refuses to act on platforms not present in `platforms[]` (host platform
   was sunsetted — emit a clear error).
5. Computes asset URLs as described above and verifies cosign + SLSA on
   the downloaded artifact. Verification failure aborts the install.

There is no fallback to npm. There is no fallback to an unsigned tarball.
The whole point of the cutover is that operators install through pipes that
have already been independently verified.

## Validation

Manual:

```bash
curl -fsSL https://raw.githubusercontent.com/automagik-dev/genie/main/.well-known/latest.json \
  | jq -e '.schema_version == 1 and .channel == "stable" and (.version | type == "string") and (.platforms | length >= 4)'
```

CI: any future workflow that writes `latest.json` MUST validate against this
schema before committing. Today only `release-publish.yml` writes it, and
the file is generated from a templated heredoc — so the schema is enforced
at write-time by construction.
