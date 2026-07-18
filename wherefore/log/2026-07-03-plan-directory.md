---
date: 2026-07-03
title: "Keep wherefore/plan/ for forward-looking plans"
areas: [plugin, repo-structure]
topics: [data-model, docs]
stories: []
status: active
supersedes:
superseded_by:
superseded_date:
---

## Summary
init scaffolds a `wherefore/plan/` directory that nothing referenced: not AGENTS.md's
documented layout, not the dashboard, which renders only log/ and questions/. We kept it
and documented it as the home for forward-looking plans, the counterpart to log/ for past
decisions.

## Decisions / outcomes
- Keep `wherefore/plan/`. init continues to scaffold it in every project.
- Document it in AGENTS.md as "forward-looking plans and roadmaps, one per file."
- Scope it to plans not yet decided, distinct from log/ (decisions already made).

## Why
The directory was orphaned: created by init but missing from AGENTS.md's layout and
unrendered by the dashboard, so it read as an accident. Removing it was the clean default,
but it maps to a real gap. The log records decisions already made, and there was no home
for plans still forming. Keeping and documenting it reserves that space now instead of
reintroducing it later. Rendering plan/ in the dashboard is deferred until the format is
actually used.

## Alternatives considered
- Remove plan/ from init and its test. Rejected: it fills a real gap and would likely be
  re-added.
- Keep it undocumented. Rejected: an empty, unexplained directory reads as a mistake and
  invites deletion.

## Open questions / follow-ups
- None. Rendering plan/ in the dashboard is out of scope until entries exist.
- See also: 2026-07-03-wherefore-cli-and-multi-agent-skills.
