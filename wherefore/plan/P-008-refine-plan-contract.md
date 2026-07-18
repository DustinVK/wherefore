---
id: P-008
title: Refine the plan skill contract (spikes, reopening, read peek)
status: done
created: 2026-07-18
updated: 2026-07-18
area: plugin
topics: [skill-structure, data-model]
decision_ref: 2026-07-03-plan-directory
---

Contract refinements to the plan skill, on top of P-004 which authors it. Kept separate
because this is a contract change, not the initial authoring.

- [x] read intent: allow a narrow question-status peek to classify blocked; forbid question bodies and log/.
- [x] advance: document done -> doing reopening (bumps updated, unchecks nothing automatically; the user names which boxes reopen).
- [x] advance: allow advancing a blocked item to doing with a warning and a resolve-first prompt; never refuse.
- [x] drop example: use a fictional id, not a live record.
- [x] spikes: add a section; for a spike the checkboxes are the questions to answer; terminate via capture or ask.
- [x] new optional key answers: Q-NNN, adjacent to question_ref; blocked stays derived from question_ref only; never both at the same Q-NNN.
- [x] propagate the answers contract to plan/README.md, seed's embedded README, the AGENTS.md Plan items section, and CLAUDE.md.
- [x] decision record: add the open question on whether answers earns its place.
