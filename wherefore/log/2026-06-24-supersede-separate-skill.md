---
date: 2026-06-24
title: "Manual supersession lives in its own skill"
areas: [plugin]
topics: [supersession, skill-structure]
stories: []
status: active
supersedes:
superseded_by:
superseded_date:
---

## Summary
The manual "mark this superseded or obsolete" path became its own skill rather than
an extra intent folded into the capture skill.

## Decisions / outcomes
- Manual supersession is its own skill (supersede), mirroring resolve.
- That skill is the single source of truth for status mutation: editing the old
  entry, writing the banner, setting the forward pointer, updating INDEX.
- The capture skill keeps auto-detection on the way in, but on confirmation it
  performs the same procedure rather than restating the mutation steps.

## Why
Keeping the mutation logic in one place stops the auto path and the manual path from
drifting into two divergent copies. A separate skill is cleaner than a fourth intent
crammed into capture.

## Alternatives considered
- Fold the manual intent into capture. Rejected: two copies of the mutation logic
  that drift over time.
- Name it decision-retire. Considered: supersede chosen to mirror the verb pattern
  of resolve, even though it also handles the obsolete case.

## Open questions / follow-ups
- None.
