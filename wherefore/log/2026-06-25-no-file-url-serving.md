---
date: 2026-06-25
title: "No file:// support; serve the build over HTTP"
areas: [dashboard]
topics: [distribution, build]
stories: []
status: active
supersedes:
superseded_by:
superseded_date:
---

## Summary
Astro emits absolute asset paths (`/_astro/...`), which resolve to the filesystem root under `file://` and break styles when a user double-clicks `dist/index.html`. We decided not to support file:// viewing -- the build output is HTTP-only. User confusion is addressed with documentation and a build-time hint rather than changing the asset path strategy.

## Decisions / outcomes
- Keep Astro's default absolute asset paths; do not switch to relative paths for file:// compatibility.
- README documents that the built site must be served (`npx serve ./dist`) and points routine local use at the dev command instead.
- Build command output will include a one-line hint directing users to serve rather than open the file.

## Why
Relative asset paths complicate sub-page routing and create their own class of bugs. The build output is always deployed over HTTP (Cloudflare Pages, etc.) where absolute paths are correct -- file:// is a local-preview edge case, not a deployment target. Documentation and a build hint fix the real problem (user confusion) at far lower cost than restructuring the asset strategy.

## Alternatives considered
- Relative asset paths everywhere: rejected because they complicate sub-page routing and the root cause is that the build was never meant to be double-clicked.

## Open questions / follow-ups
- None. Revisit only if users continue hitting this after the documentation and hint land.
