---
date: 2026-06-24
title: Dashboard package in its own repo
areas: [repo-structure]
topics: [publishing]
stories: []
status: superseded
supersedes:
superseded_by: 2026-06-24-package-in-repo
superseded_date: 2026-06-24
---

SUPERSEDED 2026-06-24 -> see 2026-06-24-package-in-repo. Kept for history, not current.

## Summary
Initial call was to give the dashboard its own repo, DustinVK/wherefore-dashboard,
separate from the plugin marketplace repo.

## Decisions / outcomes
- Put the dashboard in a standalone repo to keep the plugin marketplace repo pure.

## Why
The wherefore repo is a plugin marketplace with its own validation CI and manifest shape;
the initial reasoning was that an Astro app and npm package would muddy that
identity, and that the two artifacts have different release cadences.

## Alternatives considered
- Colocate in the plugin repo. Initially rejected over version skew and contract
  drift concerns.

## Open questions / follow-ups
- None.
