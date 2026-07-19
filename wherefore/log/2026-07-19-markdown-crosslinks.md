---
date: 2026-07-19
title: "Standardize cross-links as relative Markdown links"
areas: [plugin, dashboard]
topics: [data-model, docs]
stories: []
status: active
supersedes:
superseded_by:
superseded_date:
---

## Summary
Standardized how wherefore items reference each other inside a body. Cross-references
now use a standard relative Markdown link to the target file, not a bare slug and not an
Obsidian `[[wikilink]]`. The skills write this format, the docs specify it, and the
dashboard rewrites the `.md` links to routes at build time.

## Decisions / outcomes
- Link to another item in body prose with a relative Markdown link to its file, ID first in the text: `[P-004: label](P-004-slug.md)` (same directory) or `[Q-007: label](../questions/Q-007-slug.md)` (sibling collection).
- Reject Obsidian `[[wikilinks]]`. They render as literal text on GitHub and most editors, which is the opposite of the portability goal.
- Keep frontmatter refs (`decision_ref`, `question_ref`, `supersedes`, `asked_slug`, `resolution_slug`) as bare IDs/slugs. The standard is for body prose only.
- The dashboard resolves these `.md` links to routes at build time: a rehype plugin for the pipeline pages and `renderInline` for log bodies, both keyed off one filename-to-route map.

## Why
Universal compatibility was the priority. A standard Markdown link renders as a real link
everywhere: GitHub, Obsidian, VS Code, and the dashboard. Wikilinks only resolve in the
Obsidian family, so they trade away the GitHub and generic-editor reading that wherefore
depends on. Frontmatter stays bare because it is parsed, never rendered, so linkifying it
only adds fragility. The dashboard rewrite closes the one gap: authored links point at the
source file, and the dashboard serves routes. Running a rehype plugin on this Astro version
meant adding the first-party `@astrojs/markdown-remark` processor.

## Alternatives considered
- Obsidian `[[wikilinks]]`, rejected. Most Obsidian-native, but the least portable: literal text on GitHub and outside the Obsidian ecosystem.
- Standardize the docs only and defer the dashboard, rejected. It would leave new `.md` links pointing at files that 404 inside the dashboard.

## Open questions / follow-ups
- Question deep-link anchors (`/questions#Q-NNN`) are deferred; a link to a question resolves to the `/questions` page for now.
- See also [2026-06-25-underscore-frontmatter-keys](2026-06-25-underscore-frontmatter-keys.md), the other repo-wide format standard.
