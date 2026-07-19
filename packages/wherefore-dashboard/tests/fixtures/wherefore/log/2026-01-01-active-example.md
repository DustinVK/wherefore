---
date: 2026-01-01
title: Active example decision
areas: [checkout, catalog]
topics: [api-design]
stories: [PROJ-101]
status: active
supersedes:
superseded_by:
superseded_date:
---

## Summary

An example active entry. Nothing here was reversed.

## Decisions / outcomes

- Chose option A.

## Why

Option A was **simpler**: it needed only the `computeRate()` helper, kept latency < 50ms, and had
no known downsides at the time. See the [replacement](/log/2026-01-03-replacement-example) for
later context.

## Alternatives considered

- Option B, rejected for complexity.

## Open questions / follow-ups

- Q-001: Should we rate-limit per user or per IP?
- See also [2026-01-03-replacement-example: the replacement](2026-01-03-replacement-example.md)
