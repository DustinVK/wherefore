---
date: 2026-07-03
title: "Lean wherefore CLI with opt-in agent skills"
areas: [repo-structure, dashboard]
topics: [distribution, cross-tool, publishing, naming]
stories: []
status: superseded
supersedes:
superseded_by: 2026-07-04-init-skills-on-by-default
superseded_date: 2026-07-04
---

SUPERSEDED 2026-07-04 -> see 2026-07-04-init-skills-on-by-default. Kept for history, not current.

## Summary
The init capability first landed inside the astro-based `@dustinvk/wherefore-dashboard`
package and installed skills into Antigravity by default. We split it into a new
dependency-light npm package named `wherefore` (`npx wherefore init`), made skill
install opt-in and multi-agent, and kept AGENTS.md as the always-on cross-tool floor.
Skills remain experimental pending Q-008.

## Decisions / outcomes
- Publish the CLI as the unscoped `wherefore` package: `npx wherefore init` scaffolds
  the log, and `npx wherefore dashboard` is a thin launcher that spawns
  `@dustinvk/wherefore-dashboard` on demand (overridable via `WHEREFORE_DASHBOARD_BIN`).
- Keep `wherefore` free of heavy dependencies (no astro) so init does not pull the
  dashboard build stack just to scaffold text files.
- Skills are opt-in via `--skills` / `--agent` / `--global`, never installed by default.
  AGENTS.md is written on every init as the universal floor.
- `--agent` accepts claude, codex, copilot, cursor, gemini, antigravity, plus `all` and
  `auto`. copilot/cursor/gemini/antigravity share the `.agents/skills` path; claude uses
  `.claude/skills`; codex uses `.codex/skills`. `--global` maps to the matching `~/` dirs.
- Replaced the stale `~/.gemini/antigravity-cli/skills` global path with `~/.agents/skills`
  and its per-agent siblings.

## Why
SKILL.md skills became a cross-tool standard across late 2025 and early 2026 (Claude Code,
Codex, Cursor, Copilot, Gemini, and Antigravity all auto-discover skill dirs), so per-agent
install is now feasible and worth exposing. Shipping init inside a package named "dashboard"
was undiscoverable and dragged astro into a text-scaffolding command; naming it `wherefore`
fixes discoverability and a lean package keeps `npx wherefore init` fast. Making skills
opt-in preserves the earlier decision (see 2026-06-25-agents-md-cross-tool) that AGENTS.md is
the plain-files floor: skills are an enhancement layered on top, not a replacement, so no
strategy was silently reversed.

## Alternatives considered
- Rename the dashboard package to `wherefore`: simplest, but `npx wherefore init` would
  download astro/esbuild/sharp just to scaffold files.
- Install skills by default (as first built): rejected because it imposes an unresolved
  cross-tool bet on every user and contradicts the AGENTS.md-floor decision.
- Auto-detect agents only, no explicit flag: rejected as too magical for a non-interactive
  CLI. `auto` is offered, but explicit `--agent` is the primary path.

## Open questions / follow-ups
- Q-008: whether to keep shipping per-agent skills at all, or rely solely on the AGENTS.md
  floor for cross-tool.
- Skill-adaptation gaps deferred until Q-008 resolves toward commit: descriptions advertise
  `/wherefore:*` (only meaningful for the Claude Code plugin); capture writes a "Claude Code
  skill" attribution into consumer repos; topics.seed.md rides into capture's installed skill
  dir; no Antigravity-specific global path; skills have no version independent of `wherefore`.
