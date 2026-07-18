---
date: 2026-07-18
title: "Keep per-agent skills, fix cross-tool gaps"
areas: [plugin, repo-structure]
topics: [cross-tool, skill-structure]
stories: []
status: active
supersedes:
superseded_by:
superseded_date:
---

## Summary
Resolves Q-008 in favor of keeping per-agent SKILL.md skills rather than dropping to
an AGENTS.md-only floor. Cross-agent testing showed the floor guarantees correctness
while skills add real discoverability (Codex surfaced and invoked the ask skill by
name). Keeping skills is conditioned on removing the Claude-specific text that
currently misleads non-Claude users.

## Decisions / outcomes
- Keep shipping per-agent skills; do not reduce to a floor-only product. AGENTS.md stays the universal floor and skills are the discoverability and depth layer above it.
- Skills must read as honestly cross-tool before they count as non-experimental: strip the Claude-plugin-specific wording that is wrong for Codex, Antigravity, and other agents.
- Q-008 is resolved by this entry. The answer is keep skills, conditioned on that cleanup.

## Why
The cross-agent test (2026-07-18-cross-agent-skill-validation) proved both paths work,
so the choice was value versus simplicity, not feasibility. Skills earn their place:
Codex read the ask SKILL.md and invoked it by name, a better experience than hoping an
agent reads prose, and skill discovery is becoming a cross-tool standard worth betting
on. The floor remains the guaranteed-correct fallback. The one real risk is that skills
currently ship Claude-plugin text (the `/wherefore:*` triggers, a "Claude Code skill"
attribution) into non-Claude repos, so fixing that is the price of keeping them.

## Alternatives considered
- Floor-only, drop skills: rejected. Gives up the by-name discoverability non-Claude tools used well, to buy a simplicity we do not need since the gaps are bounded.
- Keep skills as-is, marked experimental: rejected. Ships misleading Claude-specific text to non-Claude users, which is the fragile version of shipping.

## Open questions / follow-ups
- Follow-up work before skills are non-experimental: make skill `description` triggers agent-neutral (drop `/wherefore:*`); stop `capture` writing a "Claude Code skill" attribution into consumer repos; stop `topics.seed.md` leaking into the installed skill dir; decide how skills version independently of the `wherefore` CLI.
- Evidence: 2026-07-18-cross-agent-skill-validation. Prior context: 2026-07-04-init-skills-on-by-default, 2026-06-25-agents-md-cross-tool.
