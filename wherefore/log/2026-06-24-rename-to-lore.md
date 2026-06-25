---
date: 2026-06-24
title: Rebrand to lore with plain-verb skill names
areas: [branding]
topics: [naming]
stories: []
status: active
supersedes:
superseded-by:
superseded-date:
---

## Summary
Renamed the product from discussion-log to lore, with an evocative brand for the
product and plain functional verbs for the skills.

## Decisions / outcomes
- Product and plugin: lore. Skills: capture, ask, resolve, supersede, plus the seed
  command.
- The read skill is ask (chosen over recall).
- The per-project data directory is renamed discussions/ to lore/.
- Lowercase everywhere it is typed or resolved (repo, command namespace, directory).
  Title case only in prose.
- Trigger phrases inside skill descriptions stay as-is ("log this", "why did we"),
  since they track user intent, not the brand.

## Why
A brand wants personality; a skill name is a trigger, and a clever trigger is a worse
trigger. The lore namespace already carries the noun, so skills drop the old
discussion- prefix. Renamed now, while only the author uses it and a fresh repo is
being created, because renaming after installs breaks the install string.

## Alternatives considered
- Themed skill names like chronicle or lore-keep. Rejected: clever triggers route
  and read worse than plain verbs.
- ledger, provenance, or rationale as the brand. Considered: lore won on personality.
- ADR in the name. Rejected: see 2026-06-24-adr-positioning.

## Open questions / follow-ups
- See also: 2026-06-24-adr-positioning.
