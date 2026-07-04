# Manual testing plan: `wherefore` CLI

`npm test` in this package already covers the mechanics: default-on skills via
auto-detect (including the `--no-skills` opt-out and the auto-doesn't-self-detect-CLAUDE.md
regression), the per-agent / `all` / `auto` / unknown / global / force paths, the dashboard
launcher (arg forwarding + exit code), and the CLAUDE.md / .gitignore / package.json regressions.

This document covers what those tests cannot: running the packaged artifact the way a
user would, and confirming that a real agent actually discovers the installed skills.
Work through it before publishing.

## Prerequisites

- Node >= 18.
- Pick how you'll run the CLI:
  - **Packaged (preferred, closest to real usage).** From this directory, `npm pack`.
    Its `prepack` script generates `skills/` and `templates/`, so the tarball is complete.
    Then `npm i -g ./wherefore-0.1.0.tgz` and invoke `wherefore ...`. Uninstall with
    `npm rm -g wherefore` when done.
  - **Direct (fastest for iterating).** Run `node bin/prepare-package.js` once so
    `skills/`/`templates/` exist, then `node bin/wherefore.js ...`. Skipping the prepare
    step makes skill/AGENTS.md/CLAUDE.md steps fail.
- Run every case in a throwaway project directory (`mkdir $(mktemp -d)` with a
  `package.json` inside). For `--global`, set `HOME=$(mktemp -d)` on the command so you
  never write to your real `~/.claude`, `~/.codex`, or `~/.agents`.

Below, `wherefore` means whichever invocation you chose.

## A. Help and dispatch

| Command | Expected |
| --- | --- |
| `wherefore` / `wherefore --help` | Prints usage, exit 0 |
| `wherefore bogus` | `Unknown command: bogus`, exit 1 |

## B. Default init installs skills (auto-detect)

Skills install is **on by default** and picks targets by auto-detecting the project's
agent markers. In an empty dir containing a minimal `package.json` (no agent markers), run
`wherefore init`. Expect exit 0. Verify:

- `wherefore/` has `log/`, `questions/`, `plan/`, and `topics.md`.
- `AGENTS.md` exists (the always-on cross-tool floor).
- `CLAUDE.md` contains `## Wherefore` and does **not** contain `paste from here` or
  `Paste the block below`.
- `package.json` gained a `wherefore` devDependency.
- `.gitignore` contains a bare `dist/` line.
- Auto found no markers, so it fell back to the shared path:
  `.agents/skills/{capture,ask,resolve,supersede}/SKILL.md` exist.
- **No** `.claude/skills` or `.codex/skills` (nothing detected them).

Then the detection cases (each in a fresh dir):

- `mkdir .claude && wherefore init` -> installs `.claude/skills` only; `.agents/skills` absent.
- `mkdir .codex && wherefore init` -> installs `.codex/skills` only. Critically, `.claude/skills`
  is **absent** even though `init` writes a `CLAUDE.md` along the way: auto detection is
  snapshotted before scaffolding, so it never self-detects init's own `CLAUDE.md`.

## C. Idempotency

Run `wherefore init` a second time in the same dir. Expect exit 0, "already exists"
messages for topics/AGENTS/CLAUDE, `Skipped skill '...' (already exists)` for each skill,
and that `CLAUDE.md` still has exactly one `## Wherefore` block (no duplicate append).
Confirm `package.json` was not rewritten (dependency not added twice, formatting unchanged).

## D. Targeting specific agents and opting out

Each in a fresh dir:

| Command | Expected |
| --- | --- |
| `wherefore init --no-skills` | floor scaffolded (wherefore/, AGENTS.md, CLAUDE.md); **no** `.agents`/`.claude`/`.codex` skills; console line `Skipping agent skill install (--no-skills).` |
| `wherefore init --agent claude` | `.claude/skills` only; no `.agents`/`.codex` |
| `wherefore init --agent claude,codex` | `.claude/skills` and `.codex/skills`; `.agents/skills` absent |
| `wherefore init --agent all` | all three roots written |
| `mkdir .codex && wherefore init --agent auto` | only `.codex/skills`; `.claude/skills` and `.cursor/skills` absent |
| `wherefore init --agent bogus` | exit 1, error lists valid agent names |
| re-run `--agent claude` then again with `--force` | first re-run skips existing skill; `--force` overwrites it |
| `HOME=$(mktemp -d) wherefore init --global --agent claude` | skill lands under that temp `HOME`'s `.claude/skills`, not the project |

## E. Robustness

- Put invalid JSON in `package.json`, then `wherefore init`. Expect a `Warning: Could not
  update package.json` line, the rest of the scaffold still created, and a non-zero exit
  with `Initialization completed with errors`.
- Confirm a genuinely healthy run exits 0 (already covered in B, note it here for contrast).

## F. Dashboard launcher

- Override path: `WHEREFORE_DASHBOARD_BIN=/path/to/stub.js wherefore dashboard build --src x`
  forwards `build --src x` to the stub and returns the stub's exit code. (This is what the
  automated test does; rerun it manually if you touched the launcher.)
- Real path: in a dir containing a `wherefore/`, run `wherefore dashboard dev`. It should
  `npx @dustinvk/wherefore-dashboard dev` on demand (first run downloads it), serve the
  dashboard, and stop cleanly on Ctrl-C. Try `wherefore dashboard --help` and confirm the
  dashboard's own help appears (the launcher forwards `--help` rather than showing the CLI's).

## G. Real cross-agent verification (the point of this doc)

For each agent you actually have installed, install its skills and confirm the agent
discovers them. This is the part unit tests can't reach.

- **Claude Code:** `wherefore init --agent claude`, then in Claude Code confirm the
  four skills are discovered from `.claude/skills/`. Known limitation to eyeball: their
  descriptions advertise `/wherefore:*` triggers, which only resolve for the marketplace
  plugin, not for filesystem-installed skills.
- **Codex CLI:** `--agent codex`, then run `codex` in that repo and confirm the skills load
  from `.codex/skills/`. Separately confirm Codex reads the `AGENTS.md` floor with no skills
  installed at all.
- **Copilot / Cursor / Gemini / Antigravity:** `--agent <that agent>` (all write
  `.agents/skills/`), open the tool, and confirm it discovers the skills there. For Cursor
  and Codex, also confirm plain `AGENTS.md` (default init, no skills) is picked up.
- Note any agent whose skill directory has moved since this was written; the paths in
  `bin/wherefore.js` (`AGENT_DIRS`) may need updating.

## H. Full end-to-end dry run

In a throwaway project: `wherefore init`, capture a decision through whichever agent you
set up (or hand-write a `wherefore/log/*.md`), then `wherefore dashboard build` and open the
generated `dist/` to confirm the entry and any questions render.

## Cleanup

Remove the throwaway directories and temp `HOME`s. If you installed the tarball,
`npm rm -g wherefore` and delete the `.tgz`.
