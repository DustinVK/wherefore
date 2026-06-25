---
date: 2026-06-24
title: Position against ADRs in one line, not a section
areas: [branding]
topics: [positioning, docs]
stories: []
status: active
supersedes:
superseded-by:
superseded-date:
---

## Summary
Decided how the README frames the product relative to Architecture Decision
Records. Lead with the agent-native pitch; acknowledge ADRs in a single sentence;
keep the ADR keyword for discoverability only.

## Decisions / outcomes
- Lead the README with the agent-native framing: the wherefore log lives in the repo where
  Claude already works, so decisions and open questions are pulled into context
  automatically instead of dying in a wiki.
- Acknowledge ADRs in one sentence, not a dedicated "Why not ADRs?" section.
- Put "adr" and "architecture-decision-records" in the GitHub topics for search
  traffic. Never put ADR in the product name.

## Why
A whole ADR section reads defensive and anchors the product to the exact thing it
wants to be measured against, not defined by. One sentence signals awareness and
moves on. The in-repo argument beats a wiki, but ADRs also live in-repo, so the
real edge over ADRs is that Claude does the capture, querying, question lifecycle,
and supersession bookkeeping, so the log actually gets maintained.

## Alternatives considered
- A dedicated "Why not ADRs?" section. Rejected: defensive, over-anchors to ADRs.
- ADR in the product name. Rejected: caps the concept at "an ADR tool".

## Open questions / follow-ups
- See also: 2026-06-24-rename-to-lore (the naming side of the same instinct).
