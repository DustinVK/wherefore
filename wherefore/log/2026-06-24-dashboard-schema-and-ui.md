---
date: 2026-06-24
title: Dashboard reads source files and renders all states
areas: [dashboard]
topics: [data-model, ui]
stories: []
status: active
supersedes:
superseded_by:
superseded_date:
---

## Summary
Settled how the dashboard parses wherefore frontmatter and how it renders each status,
correcting an earlier draft schema that predated supersession and would not build.

## Decisions / outcomes
- Schema matches what capture and supersede actually write: status enum
  active/superseded/obsolete (default active, normalize "current" to active),
  hyphenated superseded-by and superseded-date keys normalized in a transform,
  null-tolerant supersession and resolution fields.
- The dashboard reads the per-entry and per-question source files directly and
  ignores INDEX.md and QUESTIONS.md, so index drift cannot corrupt the view.
- Obsolete is handled on every surface: home, log list, detail banner, tag counts.
  One "Show retired" toggle covers superseded and obsolete.
- Questions render their full body in an expandable card.
- Tags show the full vocabulary with zero-count tags dimmed, counts active-only.
- Dangling pointers (placeholder superseded-by, blank resolution_slug) never produce
  broken links.

## Why
The earlier draft enum lacked active, was required, and read an underscore key the
skills do not write, so it failed the build on the first real wherefore data. Reading source
files over indexes is more robust. Showing the full vocabulary makes the tags page
reflect the controlled vocabulary, not just what happens to be used yet.

## Alternatives considered
- A separate /questions/[id] route. Rejected: an expandable card is lighter.
- Hide zero-count tags. Rejected: the vocabulary is the point of the page.

## Open questions / follow-ups
- None.
