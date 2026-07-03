---
date: 2026-06-25
title: "AGENTS.md as cross-tool wherefore spec"
areas: [plugin, repo-structure]
topics: [docs, skill-structure, cross-tool]
stories: []
status: active
supersedes:
superseded_by:
superseded_date:
---

## Summary
Wherefore's skills encode file conventions and workflows that aren't Claude-specific. We added AGENTS.md at the repo root to give any coding agent (Codex, Copilot, Cursor, Gemini) a readable spec for maintaining the log. The Claude skills remain the richer implementation; AGENTS.md is the lowest-common-denominator floor any model can follow.

## Decisions / outcomes
- AGENTS.md at the repo root contains the wherefore data format plus capture, supersede, and question workflows as an actionable spec.
- Claude Code imports it via @AGENTS.md in CLAUDE.md; Copilot gets a short .github/copilot-instructions.md pointing at it; Cursor and Codex read it natively.
- Tool-specific files are thin pointers, not copies. One source of truth prevents drift.
- AGENTS.md is kept lean (actionable spec, no rationale prose) because instruction-adherence drops as these files grow.
- Sophisticated skill behaviors (multi-thread splitting, auto-supersession detection, question-resolution matching) are deliberately omitted: weaker models won't execute them reliably.

## Why
AGENTS.md is the emerging cross-agent standard (Linux Foundation, 30-plus tools), making it the right lowest-common-denominator surface. Copy-pasting the same rules across CLAUDE.md, copilot-instructions.md, and AGENTS.md is the main anti-pattern that causes divergence over time. The design principle: the log degrades gracefully. Any model can produce valid records by following AGENTS.md; Claude does the smarter orchestration on top.

## Alternatives considered
- MCP server wrapping operations as callable tools: the most robust cross-tool path since MCP is universally supported, but adds infrastructure that cuts against the plain-files, no-dependency wedge. Deferred; see Q-006.

## Open questions / follow-ups
- Q-006: If real cross-tool usage shows weaker models mangling multi-file mutations (e.g. supersede), should we introduce an MCP server wrapper?
