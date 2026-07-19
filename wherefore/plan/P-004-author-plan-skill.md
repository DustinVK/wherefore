---
id: P-004
title: Author the slate skill
status: done
created: 2026-07-18
updated: 2026-07-18
area: plugin
topics: [skill-structure]
decision_ref: 2026-07-03-plan-directory, 2026-07-18-capture-does-not-write-plan-items
---

Build the wherefore slate skill: one verb, four intents detected from the request, not
subcommands. Mirror the sibling skills in structure and tone.

- [x] SKILL.md frontmatter (name plus folded description) and a 3 to 5 line mission, no allowed-tools, matching capture/ask/resolve/supersede.
- [x] open intent: allocate the next P-NNN by scanning plan/, write P-NNN-slug.md, break the work into concrete checkboxes, push for specifics, never bulk-generate from a vague prompt.
- [x] advance intent: transition todo to doing to done, check and uncheck body boxes, bump updated on any write including a checkbox toggle.
- [x] advance handoff: on a human-driven done, offer a capture handoff; suppress that offer when capture drove the transition; never write log/ directly.
- [x] advance blocking: attach a single question_ref (create the question via ask if it does not exist); never write a blocked status.
- [x] drop intent: set status dropped plus updated, require dropped_reason or decision_ref, refuse to drop without one, never delete the file.
- [x] read intent: report plan/ only, grouped by status, with no cross-collection reach.
- [x] round-trip: accept prose-only bodies and off-vocab area/topics; verify against P-001, P-002, P-003.
