<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/DustinVK/wherefore/main/.github/assets/lockup-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/DustinVK/wherefore/main/.github/assets/lockup-light.svg">
  <img alt="wherefore" src="https://raw.githubusercontent.com/DustinVK/wherefore/main/.github/assets/lockup-light.svg" width="280">
</picture>

# wherefore

Set up and drive a [wherefore](https://github.com/DustinVK/wherefore) decision log: the why behind your code, kept as plain markdown in your repo.

Wherefore records the reasoning behind engineering decisions, what you chose, why, and what you ruled out, so an agent or a teammate can answer "why did we build it this way?" straight from the repo. This CLI scaffolds that log, writes an `AGENTS.md` so any coding agent can read and maintain it, and installs the wherefore skills for the agent(s) you use.

[![npm](https://img.shields.io/npm/v/wherefore)](https://www.npmjs.com/package/wherefore)
[![license](https://img.shields.io/npm/l/wherefore)](https://github.com/DustinVK/wherefore/blob/main/LICENSE)

## Quick start

From your project root:

```bash
npx wherefore init
```

That scaffolds a `wherefore/` log, writes an `AGENTS.md` floor and a `CLAUDE.md` snippet, adds a `dist/` line to `.gitignore`, and installs the skills for whichever agent(s) it detects. Then browse the log as a static dashboard:

```bash
npx wherefore dashboard dev     # live, hot-reloading
npx wherefore dashboard build   # static site to ./dist
```

`dashboard` is a thin launcher for [`@dustinvk/wherefore-dashboard`](https://www.npmjs.com/package/@dustinvk/wherefore-dashboard). The `wherefore` CLI itself has no build dependencies, so `init` stays fast.

## What `init` sets up

Two layers, and either one stands on its own:

- **`AGENTS.md`, always written.** A plain-markdown spec that tells any agent how to read and write the log. This is the cross-tool floor: it works in any tool that reads `AGENTS.md`, no skills required.
- **Per-agent skills, on by default.** The `capture`, `ask`, `resolve`, and `supersede` skills, installed into the directory your agent discovers. Auto-detected by default; pass `--no-skills` to write just the floor.

## Options

```
wherefore init [--agent <list>] [--no-skills] [--global] [--force]
```

- `--agent <list>` comma-separated agents to install skills for: `claude`, `codex`, `copilot`, `cursor`, `gemini`, `antigravity`, plus `all` and `auto`. Default is `auto`, which detects the agents your repo already uses and falls back to the shared `.agents/skills/` path when it cannot tell.
- `--no-skills` scaffold the log and `AGENTS.md` floor only; install no skills.
- `--global` install skills into your user-level directories (`~/.claude/skills` and friends) instead of the project.
- `--force` overwrite existing skills and config files. A hand-written `AGENTS.md` is left alone; only a wherefore-managed one is refreshed.

Each agent maps to the directory it discovers: `claude` reads `.claude/skills`, `codex` reads `.codex/skills`, and `copilot`, `cursor`, `gemini`, and `antigravity` share `.agents/skills`.

## How the pieces fit

- **This CLI (`wherefore`)** scaffolds and drives the log from any project.
- **The [Claude Code plugin](https://github.com/DustinVK/wherefore)** ships the same skills for Claude Code users who install from the marketplace.
- **The [dashboard](https://www.npmjs.com/package/@dustinvk/wherefore-dashboard)** renders `wherefore/` as a browsable static site.

The log itself is plain markdown in your repo. No cloud, no lock-in.

## License

MIT. Source at [github.com/DustinVK/wherefore](https://github.com/DustinVK/wherefore).
