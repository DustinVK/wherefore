---
id: P-006
title: Wire ask and resolve plan links
status: done
created: 2026-07-18
updated: 2026-07-18
area: plugin
topics: [skill-structure]
decision_ref: 2026-07-18-capture-does-not-write-plan-items
---

Cross-link the read and resolve paths to plan items, one way only, and confirm supersede's
boundary.

- [x] ask: when a surfaced or newly asked question blocks work in flight, offer to attach it as a question_ref on the relevant plan item; the link is one-way, plan to question.
- [x] ask: optionally surface in-area plan items alongside open questions, read-only.
- [x] resolve: after resolving a question, report plan items carrying that question_ref as newly unblocked, without changing their status.
- [x] supersede: add one line affirming it stays the only writer of decision status.
