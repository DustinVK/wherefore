---
id: P-011
title: Group the Plan browse by milestone
status: todo
created: 2026-07-19
area: dashboard
topics: [ui]
decision_ref: 2026-07-19-dashboard-plan-collection
---

Milestone grouping was deferred when the Plan views shipped with status-section grouping,
because almost no live item carries a milestone yet. Pick this up once items do. The design
in `design_handoff_wherefore_dashboard/` specifies the target shape.

- [ ] load milestone IDs and titles from `wherefore/ROADMAP.md` at build time
- [ ] group the Plan browse by milestone, collecting un-milestoned items in a `backlog` group
- [ ] add a per-group header: milestone title, progress summary (n/m done, doing/blocked counts), collapse chevron
- [ ] order items within a group by status priority (doing, blocked, todo, done, dropped)
- [ ] decide how milestone grouping composes with the status sections (toggle between them, or status filter chips on top)
- [ ] extend fixtures and render tests to cover milestone grouping and the backlog group
