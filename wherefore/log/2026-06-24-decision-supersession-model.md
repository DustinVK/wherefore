---
date: 2026-06-24
title: "Decision supersession model and status states"
areas: [plugin]
topics: [supersession, data-model]
stories: []
status: active
supersedes:
superseded_by:
superseded_date:
---

## Summary
Added a lifecycle for decisions, not just questions. A reversed decision is marked
and points forward to its replacement, so the read skill never confidently cites a
dead decision.

## Decisions / outcomes
- Three status states: active (default, unmarked), superseded, obsolete.
- Bidirectional links: the new entry gets supersedes; the old entry gets status,
  superseded-by, superseded-date, plus a plain-text banner as its first body line.
- INDEX.md carries status inline, including the forward pointer, so the read skill
  can filter dead entries without opening files.
- Detection runs on capture: scan active entries sharing an area or topic tag, and
  ask the user before marking anything.
- The read skill answers from active entries, follows superseded-by chains to the
  current decision, and excludes obsolete unless asked.

## Why
A log that silently keeps reversed decisions becomes actively wrong, which is worse
than no log. ADRs solved this with a superseded-by status; copy it. Confirmation
beats silent supersession so a wrong detection cannot kill a live decision.
Detection is best-effort and will miss reversals; the status field is the safety
net, not the detection.

## Alternatives considered
- A parallel D-NNN counter to match Q-NNN. Rejected: adds a counter and a migration
  for no gain, since entries are already referenced by filename.
- Silent auto-supersession on capture. Rejected: a wrong call quietly kills a live
  decision, which is its own trust bug.

## Open questions / follow-ups
- None.
