# wherefore roadmap

High-level goals and milestones. Goals are the durable north stars. Milestones are
dated targets that group work. Individual plan items (`wherefore/plan/P-NNN-slug.md`)
reference a milestone via a `milestone: M1` frontmatter key.

This file is the source of truth for goal and milestone definitions and their status.
Git history is the record of how it changed. Do not hand-list plan items under a
milestone here; that list rots. The dashboard rolls items up from each item's
`milestone` field.

Milestone status vocabulary (its own small set, separate from plan-item and decision
states): `planned`, `active`, `done`, `held` (intentionally gated), `cut` (abandoned
but kept).

## Goals

**G1: The why, in plain markdown, in your repo.**
An open, inspectable, human-readable record of why the code is the way it is. No cloud,
no database, no lock-in.

**G2: Two honest halves, one data interface.**
A capture plugin and a static dashboard that both speak the same plain-markdown
`wherefore/` format, each useful without the other.

**G3: A focused, credible open-source launch.**
Ship narrow, stand alone, earn the Show HN on the strength of real dogfooding.

## Milestones

### M1: Dashboard MVP published
Status: done. Serves: G2.
0.1.0 published (MIT) and verified working from a clean external install.

### M2: 0.1.1 polish patch
Status: active. Serves: G2.
README rewrite, build-command preview-locally hint, Vite `server.fs.allow` fix for the
cross-directory dev errors, tsconfig plus @types/node (done). Deferred: blurry 16px
favicon. Confirm against `npm view` whether this has already shipped, and flip to done
if so.

### M3: Thin launcher published
Status: planned. Serves: G1.
Publish `wherefore` 1.0.1 forwarding argv to the scoped package bin, so the bare name
runs the real tool while `@dustinvk/wherefore-dashboard` stays the versioned source of
truth.

### M4: Plan layer shipped
Status: active. Serves: G2.
The `P-NNN` plan collection, the `/wherefore:plan` verb, dashboard rendering of plan
items, and this roadmap. Currently dogfooding the frontmatter contract by hand before
wiring the loader and the skill.

### M5: Live demo at wherefore.dev
Status: planned. Serves: G3.
Deploy the dashboard rendering wherefore's own decision log. A dogfooding asset, not a
marketing site.

### M6: Cross-agent skill publishing
Status: planned. Serves: G1.
Publish the skills across agent platforms (Copilot, Codex, Cursor, Gemini CLI) on the
SKILL.md standard. Scaffolding needed: `marketplace.json`, plugin manifests,
cross-tool skills layout.
