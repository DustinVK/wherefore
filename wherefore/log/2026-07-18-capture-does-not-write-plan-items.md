---
date: 2026-07-18
title: "Capture does not write plan items"
areas: [plugin]
topics: [skill-structure, data-model]
stories: []
status: active
supersedes:
superseded_by:
superseded_date:
---

## Summary
A new plan skill now owns wherefore/plan/. This settles what capture may and may not do to
that collection: capture never creates plan items, and never writes plan status directly.

## Decisions / outcomes
- Capture never creates plan items. It may surface work a decision implies and offer to hand off to plan open, but writes nothing to plan/ on silence or no.
- Plan owns plan/, capture owns log/, supersede owns decision status. One verb does not own two collections.
- Flipping an already committed item to done routes through plan advance, not a direct capture write.
- The capture to advance handoff is one-directional. When capture drives the flip, plan advance suppresses its own capture offer, so the path does not loop back to capture the decision that just triggered it. Plan advance offers a capture handoff only when a human drove the transition.
- blocked is never written. It is derived from an open question_ref on the item.

## Why
A decision is a resolved ruling; a plan item is a committed intention. If capture auto-emitted
plan items for the work a decision implies, plan/ fills with todo items nobody chose, and once
it holds twenty such items "up next" is noise and the dashboard stops being trusted. Rot
arrives as records nobody chose to make. Keeping one writer per collection mirrors supersede
being the single writer of decision status, and stops the auto and manual paths from drifting.
Flipping an existing item to done is safe because it resolves a commitment already made; it
does not invent one. Plan-item checkboxes decompose a plan already committed to; they are not
the standalone task-manager feature ruled out in 2026-06-25-todo-list-out-of-scope.

## Alternatives considered
- Capture auto-emits plan items for implied work. Rejected: commitments nobody made, sitting at todo forever.
- Capture writes plan status directly. Rejected: a second writer of plan/, the drift the one-verb-one-collection rule exists to prevent.

## Open questions / follow-ups
- Does the one-verb-one-collection boundary hold when the forthcoming brief skill arrives, given that brief reads all three collections (log/, questions/, plan/) by design? Register as a Q-NNN if it firms up.
- Does the answers frontmatter key earn its place, or is a body mention of the investigated question enough? It was added ahead of hand-writing a spike item against it, which inverts the usual do-not-build-tooling-before-feeling-the-pain rule; this open question is the hedge. Revisit after the first real investigation runs through it.
