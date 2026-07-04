---
date: 2026-07-04
title: "Init installs agent skills by default"
areas: [repo-structure]
topics: [distribution, cross-tool]
stories: []
status: active
supersedes: 2026-07-03-wherefore-cli-and-multi-agent-skills
superseded_by:
superseded_date:
---

## Summary
`wherefore init` now installs agent SKILL.md skills by default, auto-detecting which
agent(s) a repo uses, instead of requiring an explicit `--skills` opt-in. `--no-skills`
opts out and `--agent <list>` overrides the target. Because nothing had shipped yet, the
`--skills` flag was removed outright rather than kept for compatibility. The package name,
lean dashboard launcher, and per-agent path mapping from the superseded entry are unchanged.

## Decisions / outcomes
- Skills install is ON by default. `init` resolves targets from `--agent`, defaulting to `auto`.
- `--no-skills` scaffolds the log plus the AGENTS.md / CLAUDE.md floor only, installing no skills.
- `--agent auto` (the default) detects agents from pre-existing markers (`.claude`, `CLAUDE.md`,
  `.codex`, `.cursor`, `.gemini`, `GEMINI.md`, `.github/copilot-instructions.md`, `.agents`);
  when none are found it falls back to the shared `.agents/skills` path so the flagless default
  always installs something usable rather than erroring.
- Auto-detection is snapshotted BEFORE init writes AGENTS.md / CLAUDE.md, so it never
  self-detects the `CLAUDE.md` init itself creates. Without this, `auto` matched the `CLAUDE.md`
  marker on every run and installed `.claude/skills` in every project.
- The `--skills` flag is removed entirely; no version has shipped, so there is no back-compat to
  keep. `--agent`, `--global`, `--force`, and the per-agent path mapping (claude -> `.claude/skills`,
  codex -> `.codex/skills`, copilot/cursor/gemini/antigravity -> `.agents/skills`) carry over
  unchanged from the superseded entry.
- Unchanged and still current: publish as the unscoped `wherefore` package; `npx wherefore
  dashboard` is a thin launcher for `@dustinvk/wherefore-dashboard`; AGENTS.md is written on every
  init as the universal cross-tool floor.

## Why
The opt-in default meant most users ran `wherefore init` and got no skills, burying the main
value behind a flag. Auto-detect makes the common case work with zero flags while `--no-skills`
keeps the escape hatch. Making `auto` the default forced fixing a latent ordering bug: detection
ran after init wrote CLAUDE.md, so the `CLAUDE.md` marker always matched and claude skills landed
everywhere; resolving targets against the pre-scaffold state fixes it. The shared `.agents/skills`
fallback keeps the flagless default useful in a fresh repo. Dropping `--skills` rather than
deprecating it is safe pre-ship and keeps the CLI surface minimal.

## Alternatives considered
- Keep skills opt-in via `--skills` (the superseded decision): rejected because the zero-flag
  default installed nothing, so the feature was undiscoverable.
- Keep `--skills` as a silent no-op for compatibility: unnecessary pre-ship; removing it keeps the
  surface smaller.
- Error when `auto` detects no markers: rejected as hostile for the default path; fall back to the
  shared `.agents/skills` instead.
- Detect agents after scaffolding (the old order): rejected because it self-detects init's own
  CLAUDE.md and installs claude unconditionally.

## Open questions / follow-ups
- Q-008 stays open: whether per-agent skills are worth shipping at all versus relying solely on the
  AGENTS.md floor. This decision doubles down on skills (now the default) but does not settle that
  strategic question. The skill-adaptation gaps noted in the superseded entry still stand:
  descriptions advertise `/wherefore:*` (only meaningful for the Claude Code plugin), capture writes
  a "Claude Code skill" attribution into consumer repos, topics.seed.md rides into the installed
  skill dir, and skills have no version independent of `wherefore`.
