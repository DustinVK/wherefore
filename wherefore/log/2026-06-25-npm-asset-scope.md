---
date: 2026-06-25
title: "npm tarball ships only site-referenced assets"
areas: [dashboard, repo-structure]
topics: [publishing, distribution]
stories: []
status: active
supersedes:
superseded-by:
superseded-date:
---

## Summary
The @dustinvk/wherefore-dashboard npm tarball ships only what the rendered site actually
references. Brand source files (icon-only SVGs, wordmark masters, social-card variants,
extra favicon sizes) are excluded. The "files" whitelist in package.json enforces the policy;
npm pack --dry-run is the verification ground truth.

## Decisions / outcomes
- public/ ships: favicon.svg, PNG favicons (16, 32, 180), both lockup SVGs (dark/light),
  og-card.png.
- Brand source files live in brand/ and .github/assets -- not shipped to npm.
- "files" whitelist: [bin, src, public, astro.config.mjs].
- Docs (HOSTING.md etc.) stay in the repo but out of the tarball. README ships; its
  images and links use absolute raw.githubusercontent URLs (npm does not resolve
  repo-relative paths).

## Why
A build tool's tarball should contain only what the tool needs to run. Brand source files
have no runtime role in the tool itself; including them would bloat every consuming
project's node_modules for no benefit. The files whitelist makes the scope explicit and
auditable. Docs are excluded for the same reason; the raw.githubusercontent URL constraint
applies to the README because npmjs.com serves it independently of the repo.

## Alternatives considered
- Ship everything in public/ including brand source files: rejected, unnecessary install weight.

## Open questions / follow-ups
- Q-005: Should the built site support file:// viewing via relative asset paths, or is
  "serve it, don't double-click it" the right stance? Leaning no -- it is an anti-pattern
  to support; the build hint message plus README note cover the real confusion. Revisit only
  if users keep hitting it.