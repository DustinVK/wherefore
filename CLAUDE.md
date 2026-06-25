# CLAUDE.md

@AGENTS.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

A Claude Code plugin marketplace. It hosts the `wherefore` plugin, which ships four skills and a command for capturing technical decisions into a repo-committed wherefore log, querying them later, closing out open questions, and retiring superseded or obsolete decisions. The marketplace itself has no build system, tests, or runtime -- the only "code" is JSON manifests, Markdown skill/command definitions, and a GitHub Actions CI workflow.

## Validation

```bash
# Validate a single plugin
claude plugin validate ./plugins/wherefore

# Validate the whole marketplace
claude plugin validate .

# Check JSON syntax (what CI does first)
python3 -m json.tool .claude-plugin/marketplace.json
python3 -m json.tool plugins/wherefore/.claude-plugin/plugin.json
```

CI (`.github/workflows/validate-plugins.yml`) runs both JSON checks and `claude plugin validate` on every push and PR.

## Publishing / setup

Marketplace and plugin names must be **kebab-case** -- the Claude.ai sync rejects anything else.

To test locally before pushing:
```bash
# From this repo's root
/plugin marketplace add ./
/plugin install wherefore@dustinvk
```

## Repo structure and how pieces fit together

```
.claude-plugin/marketplace.json       # registry: lists plugins by name + source path
plugins/wherefore/
  .claude-plugin/plugin.json          # plugin manifest (name, version, author, license)
  CLAUDE.snippet.md                   # pasted into a consuming project's CLAUDE.md to
                                      # make Claude offer to capture decisions automatically
  commands/seed.md                    # /wherefore:seed: inspects a codebase and proposes
                                      # wherefore/topics.md vocabulary (ask-before-write)
  skills/capture/
    SKILL.md                          # captures a discussion into wherefore/ as one or
                                      # more tagged Markdown entries + updates INDEX.md
                                      # and QUESTIONS.md (open question registry)
    topics.seed.md                    # starter vocabulary copied on first use if no
                                      # topics.md exists yet
  skills/ask/
    SKILL.md                          # answers "why did we build X?" by reading INDEX.md
                                      # first, then opening shortlisted entry files;
                                      # also surfaces open questions in the same area
  skills/resolve/
    SKILL.md                          # closes an open question in QUESTIONS.md with an
                                      # answer, rationale, and optional entry back-link
  skills/supersede/
    SKILL.md                          # marks an entry superseded (with pointer to
                                      # replacement) or obsolete; updates INDEX.md
```

The `wherefore/` directory itself is **not** in this repo -- it lives in each consuming project's repo, created by the skills on first use.

## Skill / command authoring conventions

- **SKILL.md** front matter: `name`, `description` (used for skill-trigger matching), and optionally `allowed-tools`.
- **Command `.md`** front matter: `description`, `argument-hint`, `allowed-tools`.
- All skills use a two-facet tag system: **areas** (feature slices: WHAT) and **topics** (cross-cutting concerns: HOW), drawn from the consuming project's `wherefore/topics.md`. Keep this separation consistent if extending the skills.
- `capture` is write-heavy (creates/edits files); a single discussion may produce multiple entry files when it covers independently-queryable threads. `ask` is read-only. `resolve` edits only `QUESTIONS.md` (and optionally the source entry). `supersede` edits an existing entry file and its INDEX line. `seed` is read-first, write-only-after-confirmation -- preserve this ask-before-write pattern for any new commands.
- Entry filenames: `YYYY-MM-DD-short-slug.md`. INDEX.md format: `- YYYY-MM-DD | slug | title | areas: ... | topics: ... | stories: ... | status`.
- QUESTIONS.md format: one `## Q-NNN -- <text>` block per question, with `Status`, `Areas`, `Asked`, and `Resolution` fields. IDs are sequential and never reused.
