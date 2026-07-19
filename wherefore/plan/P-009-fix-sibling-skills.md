---
id: P-009
title: Fix up the sibling skills for the plan cross-links
status: done
created: 2026-07-18
updated: 2026-07-18
area: plugin
topics: [skill-structure]
decision_ref: 2026-07-03-plan-directory
---

Two passes over the sibling skills after plan landed: cross-skill review findings, then a
frontmatter-documentation consistency sweep. No settled ruling changes.

- [x] capture: confirm before closing a plan item (ask-first, matching the question standard); add the plan frontmatter dump plus area shortlist; fold plan links into the step 11 approval moment.
- [x] ask: when listing open questions, surface any plan item that answers one (spike underway), inline and read-only.
- [x] resolve: also report items whose answers matches the resolved id and offer to advance them via plan; skip dropped items; suppress the advance offer when plan drove the resolve.
- [x] supersede: report plan items whose decision_ref includes the retired slug; read-only, do not mutate, note it does not break the sole-writer boundary.
- [x] confirm name plus description frontmatter on all five skills (ask and supersede already have it).
- [x] reader/writer split: writers keep the full contract; ask, resolve, supersede get short "fields I rely on" notes only.
- [x] both project rules verbatim in all five: no em dashes, and never delete under a wherefore/ data dir.
