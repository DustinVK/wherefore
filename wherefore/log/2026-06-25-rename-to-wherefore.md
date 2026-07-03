---
date: 2026-06-25
title: "Rename from lore to wherefore"
areas: [branding]
topics: [naming, positioning]
stories: []
status: active
supersedes: 2026-06-24-rename-to-lore
superseded_by:
superseded_date:
---

## Summary
Renamed the project from lore to wherefore after discovering that uselore.io is a paid
closed-source AI knowledge-base product in the same Claude Code ecosystem. Trademark law
turns on likelihood of confusion, not price, so being free and open-source is no
protection. Wherefore, the archaic word for "why", fits the product concept precisely,
cleared npm and search, and provides a ready launch hook.

## Decisions / outcomes
- Product and plugin renamed: lore → wherefore.
- Per-project data directory renamed: lore/ → wherefore/.
- Plugin namespace and skill invocation prefix: wherefore.

## Why
Uselore.io is a direct competitor in the Claude Code ecosystem, making
likelihood-of-confusion a real risk. The rename is essentially free before the first npm
publish; waiting would break install strings and consumer configs. The lore/memory/myth
naming register is also overcrowded with competitors, so nothing was lost on
differentiation.

Wherefore is archaic English for "why": "wherefore art thou" means "why are you", not
"where are you". That maps precisely to the product's purpose: a human-readable record of
the *why* behind decisions, not an AI memory store. It cleared npm (404 page), returned
clean on broader search, and the etymology is a concrete, memorable launch hook.

Process lesson: always verify with `npm view <name>` or the npmjs page directly before
committing to a name. Web search misses npm collisions (it missed whence).

## Alternatives considered
- whence: archaic "why", briefly the favorite for its brevity; rejected because the npm
  name belongs to a prominent maintainer (Schlinkert), so the canonical package would
  never be ours.
- mneme (muse of memory): taken by Mneme HQ, whose product is nearly identical
  (version-controlled decision graphs, superseded decisions, no vector store, Claude Code
  integration), a head-on collision.
- iken (from "I ken" = "I know"): free on npm, arguably best meaning-for-length; rejected
  for ambiguous pronunciation and a crowded namespace (UK knowledge-management company
  since 1992, plus an AI dev-environment outfit).
- rell: short and free but meaningless; clashes with Chromia's Rell language.
- Earlier candidates (cairn, strata, throughline, vestige, mythos, saga, epos, quia,
  decisio, tome, crux): all taken, trademark-blocked, or sitting on a direct competitor.

## Open questions / follow-ups
- None.
