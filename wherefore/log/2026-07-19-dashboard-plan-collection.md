---
date: 2026-07-19
title: "Dashboard plan views on the shipped schema"
areas: [dashboard]
topics: [ui, data-model, visual-identity]
stories: []
status: active
supersedes:
superseded_by:
superseded_date:
---

## Summary
Built the dashboard's read-side views for the plan collection (P-002), driven by the
`design_handoff_wherefore_dashboard/` hifi design. The design was drawn against a generic,
idealized schema, so the work was as much reconciliation as rendering: map the design onto
the shipped `wherefore/plan/` contract, and keep the plan files the single source of truth.

## Decisions / outcomes
- Build against the shipped `wherefore/plan/` schema, not the handoff's idealized one. Map the design's `decision`, `blocks`, and `retired_by` to the real `decision_ref`, `question_ref`, and `dropped_reason` plus `decision_ref`; decision links point at existing `log/` entries, since there is no separate ADR collection.
- Derive `blocked` at build time by joining plan to questions. An item is blocked when its `question_ref` points at a still-open question; it is never stored.
- Group the Plan browse by status, not milestone. Sections run doing, blocked, todo, done, with dropped behind a toggle. Milestone grouping is deferred until items carry milestones.
- Extend the existing dashboard token system rather than adopt the handoff's palette and IBM Plex Mono. Add plan-status tokens (teal doing, warm blocked, muted todo/done/dropped) on top of the current brand tokens and fonts.
- Mirror the questions collection for the loader: glob `plan/P-*.md` so `README.md` is excluded, key identity off the `id:` frontmatter, and treat `area` as a single string.
- Rebuild the home page into a now view: in flight, blocked, up next, then open questions and recent decisions.

## Why
The plan collection is already dogfooded (P-001 through P-010) and specified in
`plan/README.md`, so its schema was fixed before this work. The handoff predates that
schema; shipping its literal fields would have forked a second, incompatible contract.
Deriving blocked keeps the plan files honest: it stays a view over `question_ref` plus the
referenced question's status, never a stored flag that drifts after a resolve, matching the
slate skill's read rule. Status grouping fits the current data, where almost no item sets a
milestone, so milestone sections would collapse to a single backlog group. Extending the
existing tokens keeps the four pages native to the shipped dashboard and avoids a site-wide
restyle; the handoff's full hifi system stays available if a later pass wants pixel fidelity.

## Alternatives considered
- Implement the handoff schema verbatim (a separate `decisions/` ADR collection, `blocks`/`retired_by`). Rejected: it forks the data contract from the shipped `wherefore/plan/` spec.
- Group the browse by milestone as the design shows. Rejected for now: real items rarely set a milestone, so it collapses to one backlog group.
- Adopt the handoff's ground/ink palette and IBM Plex Mono across the pages. Rejected for this pass: a full re-theme is out of scope. See Q-012.

## Open questions / follow-ups
- Q-012: Should the dashboard adopt the handoff's full visual system (dark-default palette plus IBM Plex Mono UI), or is extending the existing tokens the durable choice?
- Milestone grouping and a per-milestone roadmap view are deferred until plan items carry milestones.
- Implements P-002 and the dashboard side of 2026-07-03-plan-directory; extends 2026-06-24-dashboard-schema-and-ui.
