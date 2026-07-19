---
date: 2026-07-19
title: "Dashboard edits plan items in dev only"
areas: [dashboard]
topics: [ui, data-model, build]
stories: []
status: active
supersedes:
superseded_by:
superseded_date:
---

## Summary
The dashboard is a static, read-only Astro build. We decided to let a user flip a plan
item's status and toggle its body checkboxes, but only while running
`wherefore-dashboard dev` locally, writing straight to the source `wherefore/plan/*.md`.
The hosted static build stays read-only with no auth. Toggles anchor to a checkbox's exact
source line and text, never an ordinal index.

## Decisions / outcomes
- Editing is a dev-server-only capability: a Vite `configureServer` middleware plus
  controls gated on `import.meta.env.DEV`. The static build and its no-login, no-auth trust
  model are unchanged.
- A save writes the working-tree file only, no git commit. Scope is status
  (todo, doing, done) and checkbox toggles. Drop and full frontmatter or body editing stay
  with the slate skill.
- Checkbox toggles anchor by (body-relative source line, expected source-line text) and
  reject on mismatch with a 409. Ordinal "Nth checkbox" indexing is rejected.
- The write path resolves a P-NNN to a file by scanning the `id:` frontmatter and returns
  409 if two files share an id, rather than silently taking the first or last.
- The writer (`plan-edit.mjs`) reproduces slate's serialization rules in a second package.
  To stop the two writers from diverging, each rule cites its source line (AGENTS.md and
  slate SKILL.md) and a test fixture asserts byte-identical output against a real
  slate-produced file.
- `taskProgress` is made fence-aware (strip fenced code before counting), fixing a
  pre-existing over-count with the same root cause as the indexing bug.

## Why
- The product's value rests on being a simple, trustworthy static generator with no login,
  accounts, or auth code (docs/HOSTING.md). Keeping writes dev-only preserves that:
  nothing editable ships to the hosted build.
- Ordinal indexing is silently wrong. A `- [ ]` inside a fenced code block matches the
  counting regex but renders as code, not an input, so every checkbox after it writes to
  the wrong line with a clean diff. Verified against the real @astrojs/markdown-remark
  pipeline: a sample body rendered 3 real checkboxes while the regex counted 4, and a
  blockquoted `> - [ ]` drifts the other way. Plan items in this tool document markdown
  schemas, so fenced checkbox examples are close to guaranteed. Anchoring by source line
  plus expected text is immune, because only actually-rendered checkboxes carry an anchor.
- A second writer of slate's rules risks the silent-divergence class the underscore-key
  rule already guards against, so the citation and byte-identical fixture are part of the
  decision, not optional polish.

## Alternatives considered
- Ordinal or Nth-checkbox indexing. Rejected: silently corrupts on fenced or blockquoted
  checkboxes.
- Editing on the hosted deployment via a git-host write path (GitHub API commits) plus
  auth. Rejected for now: much larger and breaks the no-auth model.
- Auto-commit or auto-push on save. Rejected: write the working tree and let the user
  review the diff, as slate does.
- Parse and reserialize the frontmatter. Rejected: it would reflow lists, reorder keys, and
  re-quote titles. Surgical line edits only.

## Open questions / follow-ups
- One content-layer reload fires per checkbox tick. Observe how that feels before adding any
  debounce or HMR suppression.
- Whether to later give slate itself a deterministic checkbox counter. If so it inherits the
  same fenced-block exposure and the fix belongs in both places.
