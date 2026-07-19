---
date: 2026-07-19
title: "Flip roadmap M2 and M4 to done"
areas: [dashboard, plugin]
topics: [docs, publishing]
stories: []
status: active
supersedes:
superseded_by:
superseded_date:
---

## Summary
A drift review after the plan layer landed found the roadmap trailing reality. M2 (0.1.1
polish patch) and M4 (plan layer shipped) were still `active` though both had shipped, and
the slate rename had left stale "plan skill" references in `plan/README.md`. Reconciled all
three.

## Decisions / outcomes
- M2 flipped to `done`. `npm view @dustinvk/wherefore-dashboard` shows 0.1.0, 0.1.1, 0.1.2,
  and 0.2.0 published, so the 0.1.1 patch shipped. The blurry 16px favicon stays deferred as
  a carried note, not a milestone blocker.
- M4 flipped to `done`. The `P-NNN` collection, the `/wherefore:slate` verb, and the
  dashboard plan views all shipped (slate in plugin 0.2.0). Milestone grouping (P-011) is a
  deferred follow-on, not core delivery, so it does not hold the milestone open.
- `plan/README.md` now names the `slate` skill in all five spots. The rename decision moved
  the verb to `slate` but the collection's own README still said `plan` skill.

## Why
The roadmap is the source of truth for milestone status, so a milestone reading `active`
after it shipped is exactly the rot the dashboard is meant to surface. Verifying M2 against
npm rather than flipping it on assumption keeps the record honest. Treating a deferred
enhancement (favicon, P-011 grouping) as a carried note rather than a blocker matches how M1
already handles its follow-ups: a milestone is done when its core delivery ships, with
deferrals tracked as their own items.

## Alternatives considered
- Leave M4 `active` until milestone grouping (P-011) lands. Rejected: it gates the whole
  milestone on a deferred enhancement whose own trigger is "once items carry milestones,"
  which would keep M4 open indefinitely while its substance has shipped.

## Open questions / follow-ups
- None. P-011 tracks the remaining milestone-grouping work; Q-012 tracks the visual-system
  question, both independent of this reconciliation.
