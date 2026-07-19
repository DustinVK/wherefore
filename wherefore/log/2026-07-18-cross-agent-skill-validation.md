---
date: 2026-07-18
title: "Per-agent skills verified in three agents"
areas: [plugin, repo-structure]
topics: [cross-tool, skill-structure]
stories: []
status: active
supersedes:
superseded_by:
superseded_date:
---

## Summary
Manual testing confirmed the four wherefore skills are discovered and usable in
three agents from their mapped directories, and that the AGENTS.md floor works on
its own with no skills installed. This removes the main open doubt behind Q-008:
non-Claude tools can both discover per-agent skills and fall back to the floor.

## Decisions / outcomes
- Verified skill discovery in all three agents from their mapped dirs. Antigravity read `.agents/skills`, Codex read `.codex/skills`, Claude Code read `.claude/skills`.
- Confirmed Codex discovers skills, not just AGENTS.md. It read the `ask` SKILL.md and invoked the skill by name, so the `codex -> .codex/skills` mapping is real, not aspirational.
- Confirmed the `ask` skill answers correctly cross-tool. In each agent it answered a sample "why did we..." from the log entry, cited the source file, and surfaced the overlapping open question.
- Confirmed the AGENTS.md floor stands alone. A Codex project run with `--no-skills` answered correctly from AGENTS.md alone.

## Why
The skills ship copied as-is with Claude-oriented triggers, so whether other agents
would discover and act on them was unproven. Two independent non-Claude tools
(Antigravity on Gemini, Codex on OpenAI) plus Claude Code now all deliver the same
cited answer, and the floor-only path produces the same result without any skills.
Both mechanisms work, which is the evidence Q-008 was waiting on.

## Open questions / follow-ups
- Q-008 stays open: ship per-agent skills, or rely solely on the AGENTS.md floor. This session is evidence that both work, not a decision on which to keep.
- See also: [2026-07-04-init-skills-on-by-default](2026-07-04-init-skills-on-by-default.md) and [2026-06-25-agents-md-cross-tool](2026-06-25-agents-md-cross-tool.md).
