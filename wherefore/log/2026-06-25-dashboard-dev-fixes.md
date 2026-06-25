---
date: 2026-06-25
title: "Fix tsconfig and Vite fs.allow in dev mode"
areas: [dashboard]
topics: [build]
stories: []
status: active
supersedes:
superseded_by:
superseded_date:
---

## Summary
Two dogfooding fixes to the dashboard build tool's dev experience. The package was missing a tsconfig.json, causing editors to fall back to legacy module resolution and report type errors in content.config.ts. Separately, Vite's server.fs.allow list was too narrow in dev mode because it anchors on the user's cwd while Astro's runtime files live in the package's install directory.

## Decisions / outcomes
- Add tsconfig.json extending astro/tsconfigs/base plus @types/node to resolve spurious `astro/loaders` and `process` type errors in editors.
- Add the package root and the resolved src dir to Vite's server.fs.allow list to clear cross-directory access errors in dev mode.

## Why
Both issues stem from the cross-directory model: Astro installs in one location but operates on content in the user's cwd. The tsconfig was absent because no TypeScript project file was needed at publish time, but its absence caused editors to pick legacy module resolution. The fs.allow list is correct for same-directory projects but under-inclusive when a build tool is invoked from outside its own directory.

## Alternatives considered
- Rely on ambient types without a tsconfig: rejected because editors report spurious errors that obscure real ones.

## Open questions / follow-ups
- Q-007: Are there other latent schema/writer mismatches beyond the underscore key fix? Worth a pass confirming the skills and the Astro content schema agree on every frontmatter key.
- The question of wrapping the supersede mutation as an MCP tool is already tracked as Q-006.
