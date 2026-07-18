---
date: 2026-07-03
title: "Entry view theming and stylesheet consolidation"
areas: [dashboard]
topics: [ui, visual-identity]
stories: []
status: active
supersedes:
superseded_by:
superseded_date:
---

## Summary
The 1A decision-entry view stayed dark when the app was toggled to light. Its `--wf-*`
color tokens were defined only on `:root` with dark values and three text colors were
hardcoded outside the token system, so the app theme never reached the card. We wired the
light palette to the app's `data-theme` signal, folded the standalone `wherefore-1A.css`
into `global.css`, and kept IBM Plex on the Google Fonts CDN rather than self-hosting.

## Decisions / outcomes
- Bind the entry-view light palette to `:root[data-theme="light"]`, the signal `Base.astro`'s toggle already sets. Mirror `global.css` exactly: the explicit selector plus a `prefers-color-scheme: light` fallback gated on `:root:not([data-theme="dark"])` for the no-JS path.
- Route every entry-view color through `--wf-*` tokens. The three hardcoded text colors became `--wf-text` and `--wf-strong`, so the card re-themes with no per-element overrides.
- Fold `wherefore-1A.css` into `global.css` and delete the standalone file. The import in `log/[slug].astro` is removed; the `.wf-*` rules and the IBM Plex `@import` now live in the single global sheet.
- Keep IBM Plex on the Google Fonts CDN; do not self-host.

## Why
Fixing the token wiring once is the right altitude: the card and all children already read
color only through `var(--wf-*)`, so binding those tokens to `data-theme` (and matching
`global.css`'s fallback) makes the entry flip in lockstep with the header and list, JS or
not. Consolidating removed a second stylesheet that only the detail page loaded; one sheet
is easier to reason about. The cost is that IBM Plex now loads on every page, but the
`.wf-*` rules only apply where the entry markup exists, so nothing else changes visually.
On fonts, self-hosting latin-only IBM Plex measured about 232 KB of binary woff2 (the single
largest thing in a roughly 427 KB repo) for no user benefit: browsers already fetch the same
files from Google, only the latin subset loads per page, and the CDN path matches how Space
Grotesk, Inter, and JetBrains Mono already load. Verified by build plus toggling a detail
page: dark (#12161c / #e6e9ee) and light (#ffffff / #2b3138, teal #0c8f80) both render.

## Alternatives considered
- Self-host the IBM Plex woff2 files, rejected because it adds 232 KB (latin) to 769 KB (all subsets) of binary blobs to git for no bandwidth win, since visitors download the same files either way and only the latin subset loads.
- Keep `wherefore-1A.css` as its own stylesheet, rejected in favor of a single global sheet to cut clutter.
- Hand-edit color values or add per-element light overrides, rejected in favor of fixing the token wiring once.

## Open questions / follow-ups
- Q-011: Should IBM Plex get preconnect hints and font-display tuning like the other three fonts, or is the extra `@import` latency acceptable?