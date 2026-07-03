---
date: 2026-06-25
title: "Standardize frontmatter keys to underscore style"
areas: [plugin, dashboard]
topics: [data-model]
stories: []
status: active
supersedes:
superseded_by:
superseded_date:
---

## Summary
Wherefore frontmatter had a split convention: log entries used hyphenated keys (`superseded-by`, `superseded-date`) while question files already used underscore (`asked_date`, `asked_slug`, `resolution_slug`). Worse, the dashboard schema (content.config.ts) declared underscore, so the supersession link was silently dropped on any superseded entry. We standardized to underscore everywhere and migrated the existing data.

## Decisions / outcomes
- All frontmatter keys use underscore style: `superseded_by`, `superseded_date`, `asked_date`, `asked_slug`, `resolution_slug`.
- Convention applies to data files, the Astro content schema (content.config.ts), the capture and supersede skills, and AGENTS.md.
- Existing data files were migrated (key names only, values unchanged) with a backup and file-count check to prevent loss.

## Why
The dashboard schema already used underscore, so the log files were already the odd one out, and the mismatch was actively causing supersession links to be silently dropped. Underscore is the safer YAML/templating choice: hyphenated keys are valid YAML but cannot be accessed as bare identifiers in most templating languages and trip some parsers. The migration was done while the data set is small and entirely team-owned; once other projects have wherefore directories full of entries, renaming a frontmatter key becomes a breaking migration requiring a tool.

## Alternatives considered
- Hyphenated keys everywhere: rejected because content.config.ts would have needed to change and hyphenated keys cause subtle failures in templating.
- Leave the mixed convention: rejected because the schema/data mismatch was the direct cause of the silent supersession-link bug.

## Open questions / follow-ups
- None.
