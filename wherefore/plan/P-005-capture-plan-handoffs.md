---
id: P-005
title: Wire capture's plan handoffs
status: done
created: 2026-07-18
updated: 2026-07-18
area: plugin
topics: [skill-structure]
decision_ref: 2026-07-18-capture-does-not-write-plan-items
---

After capture writes a decision, link it to plan/ without capture ever writing plan/ itself.

- [x] Resolved-item detection: when a decision plainly resolves an existing plan item, hand off to plan advance to set done and add decision_ref; the handoff marks capture as the driver so advance suppresses its return offer.
- [x] Implied-work surfacing: offer "this implies these pieces of work, want me to open plan items?"; on yes, hand off to plan open with decision_ref set on each new item.
- [x] On silence or no, write nothing to plan/.
- [x] Add a one-line note in capture that it never creates or directly mutates plan items.
