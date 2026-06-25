---
date: 2026-06-24
title: Dashboard package at packages/wherefore-dashboard in the wherefore repo
areas: [repo-structure]
topics: [publishing, ci]
stories: []
status: active
supersedes: 2026-06-24-package-separate-repo
superseded_by:
superseded_date:
---

## Summary
Reversed the separate-repo call. The dashboard package lives inside the wherefore repo at
packages/wherefore-dashboard/, mirroring plugins/ with a packages/ kind-directory.

## Decisions / outcomes
- Package home: packages/wherefore-dashboard/, self-contained, published from the
  subdirectory (publishConfig.access public, repository.directory set, files
  whitelist ships source not a prebuilt dist).
- No root package.json and no npm workspaces yet; both wait for a second package.
- CI is path-filtered: validate-plugins.yml on plugins/**, a new dashboard.yml on
  packages/**.
- Example wherefore/ fixtures inside the package act as a contract drift tripwire.

## Why
The original split-repo reasoning did not survive the specifics. Only the dashboard
is semver-versioned, so there is no version skew to manage. More importantly, the
schema is still moving, and colocating producer (plugin) and consumer (dashboard)
lets a format change and its reader update land in one atomic commit. The marketplace
manifest enumerates plugins explicitly, so a packages/ sibling is invisible to it.

## Alternatives considered
- Separate repo (the prior decision). Rejected: splits a live data contract across
  two repos and forces coordinated two-repo PRs.
- Flat wherefore-dashboard/ at the repo root. Rejected: packages/ mirrors plugins/ and
  keeps the root clean.
- A root npm workspaces config now. Deferred: workspaces earn their keep at two or
  more packages; for one they just re-add a root package.json.

## Open questions / follow-ups
- Q-002: When a second package lands, switch to prefixed release tags and promote to
  npm workspaces?
- Q-003: Should the build-tool plan doc live inside the package as its design record?
- Q-004: Resolve the path-filter and required-check interaction before enabling
  branch protection.
