---
date: 2026-07-18
title: "Rename the plan skill to slate"
areas: [plugin]
topics: [skill-structure]
stories: []
status: active
supersedes:
superseded_by:
superseded_date:
---

## Summary
The skill that operates `wherefore/plan/` is renamed from `plan` to `slate`. Only the
verb changes: the directory, the `P-NNN` scheme, the frontmatter contract, and every
settled ruling stay exactly as they were.

## Decisions / outcomes
- The skill verb is `slate`, invoked as `/wherefore:slate`.
- A skill verb and the collection it writes are allowed to diverge. `capture` writes
  `log/`, `resolve` writes `questions/`, and now `slate` writes `plan/`. The verb names
  the action, not the folder.
- The description leads with the collection (operating the items in `wherefore/plan/`),
  not with the activity of planning. Trigger phrases center on the artifacts ("open a
  plan item", "mark P-012 done", "what am I working on", "drop P-007").
- The collection keeps its name. `wherefore/plan/`, `plan/README.md`, the `P-NNN` ids,
  and the "Plan items" doc sections are unchanged.

## Why
`plan` as a verb collides with Claude Code's built-in plan mode. The namespaced command
`/wherefore:plan` resolves, but the skill description competed for triggering whenever
someone said something like "plan the auth migration," and that ambiguity is reason
enough to move. Leading the description with the collection rather than the activity is
what actually keeps the two apart: `slate` reads as operating existing items, not as a
request to plan work.

## Alternatives considered
- `track`, rejected for dragging in issue-tracker connotations the collection does not
  want.
- `commit`, rejected for colliding with git.

## Open questions / follow-ups
- None.
