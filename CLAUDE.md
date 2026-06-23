# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

A Claude Code plugin marketplace. It hosts the `team-discussion-log` plugin, which ships two skills and a command for capturing technical decisions into a repo-committed log and querying them later. The marketplace itself has no build system, tests, or runtime — the only "code" is JSON manifests, Markdown skill/command definitions, and a GitHub Actions CI workflow.

## Validation

```bash
# Validate a single plugin
claude plugin validate ./plugins/team-discussion-log

# Validate the whole marketplace
claude plugin validate .

# Check JSON syntax (what CI does first)
python3 -m json.tool .claude-plugin/marketplace.json
python3 -m json.tool plugins/team-discussion-log/.claude-plugin/plugin.json
```

CI (`.github/workflows/validate-plugins.yml`) runs both JSON checks and `claude plugin validate` on every push and PR.

## Publishing / setup

Marketplace and plugin names must be **kebab-case** — the Claude.ai sync rejects anything else.

To test locally before pushing:
```bash
# From this repo's root
/plugin marketplace add ./
/plugin install team-discussion-log@dustinvk
```

## Repo structure and how pieces fit together

```
.claude-plugin/marketplace.json       # registry: lists plugins by name + source path
plugins/team-discussion-log/
  .claude-plugin/plugin.json          # plugin manifest (name, version, author, license)
  CLAUDE.snippet.md                   # pasted into a consuming project's CLAUDE.md to
                                      # make Claude offer to log decisions automatically
  commands/seed-topics.md             # /seed-topics: inspects a codebase and proposes
                                      # discussions/topics.md vocabulary (ask-before-write)
  skills/discussion-log/
    SKILL.md                          # captures a discussion into discussions/ as a
                                      # tagged Markdown entry + updates INDEX.md
    topics.seed.md                    # starter vocabulary copied on first use if no
                                      # topics.md exists yet
  skills/discussion-read/
    SKILL.md                          # answers "why did we build X?" by reading INDEX.md
                                      # first, then opening shortlisted entry files
```

The `discussions/` directory itself is **not** in this repo — it lives in each consuming project's repo, created by the skills on first use.

## Skill / command authoring conventions

- **SKILL.md** front matter: `name`, `description` (used for skill-trigger matching), and optionally `allowed-tools`.
- **Command `.md`** front matter: `description`, `argument-hint`, `allowed-tools`.
- Both skills use a two-facet tag system: **areas** (feature slices — WHAT) and **topics** (cross-cutting concerns — HOW), drawn from the consuming project's `discussions/topics.md`. Keep this separation consistent if extending the skills.
- `discussion-log` is write-heavy (creates/edits files); `discussion-read` is read-only. `seed-topics` is read-first, write-only-after-confirmation — preserve this ask-before-write pattern for any new commands.
- Entry filenames: `YYYY-MM-DD-short-slug.md`. INDEX.md format: `- YYYY-MM-DD | slug | title | areas: … | topics: … | stories: … | status`.
