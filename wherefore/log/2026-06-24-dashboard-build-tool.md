---
date: 2026-06-24
title: Ship the dashboard as a build tool, not a fork
areas: [dashboard]
topics: [distribution, build]
stories: []
status: active
supersedes:
superseded-by:
superseded-date:
---

## Summary
The wherefore dashboard ships as an npm build tool that reads a consuming repo's wherefore/
directory in place and emits a static site, rather than a repo people fork and feed.

## Decisions / outcomes
- Publish @dustinvk/wherefore-dashboard. It reads the project's real wherefore/ and builds a
  static site. No fork, no vendored source, no copied wherefore directory.
- Cloudflare Pages auto-builds on push, so logging a decision republishes the
  dashboard with no manual step.

## Why
The fork model is structurally stale: the real wherefore data lives in the project repo, the
fork renders a copy, and the two drift the moment anyone logs a decision. The manual
re-copy is exactly the chore the plugin exists to kill. A build tool reads the
canonical wherefore data in place, keeps the consuming repo footprint near zero, and makes
updates a pinned version bump instead of a fork sync.

## Alternatives considered
- Fork the dashboard repo and drop wherefore/ into it. Rejected: staleness is structural.
- Vendor the dashboard source into the project repo. Rejected: heavy footprint and
  it just relocates the update chore.

## Open questions / follow-ups
- Q-001: Will Astro build cleanly with content base and output dir both outside the
  Astro project root?
