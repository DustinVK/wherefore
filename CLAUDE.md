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
                                      # more tagged Markdown entries; registers any open
                                      # questions as questions/Q-NNN-short-slug.md files
    topics.seed.md                    # starter vocabulary copied on first use if no
                                      # topics.md exists yet
  skills/ask/
    SKILL.md                          # answers "why did we build X?" by shortlisting from
                                      # entry frontmatter, then opening matching files;
                                      # also surfaces open questions in the same area
  skills/resolve/
    SKILL.md                          # closes an open question by editing its
                                      # questions/Q-NNN-short-slug.md file (answer, rationale, back-link)
  skills/supersede/
    SKILL.md                          # marks an entry superseded (with pointer to
                                      # replacement) or obsolete via its frontmatter
```

The `wherefore/` directory itself is **not** in this repo -- it lives in each consuming project's repo, created by the skills on first use.

## Skill / command authoring conventions

- **SKILL.md** front matter: `name`, `description` (used for skill-trigger matching), and optionally `allowed-tools`.
- **Command `.md`** front matter: `description`, `argument-hint`, `allowed-tools`.
- All skills use a two-facet tag system: **areas** (feature slices: WHAT) and **topics** (cross-cutting concerns: HOW), drawn from the consuming project's `wherefore/topics.md`. Keep this separation consistent if extending the skills.
- There is no hand-maintained index. INDEX.md and QUESTIONS.md are gone: entry and question frontmatter is the single source of truth, and `ask` derives its shortlist by reading only the leading frontmatter block of each file. Do not reintroduce a generated index in any skill or command; if extending the skills, derive on read instead.
- `capture` is write-heavy (creates/edits files); a single discussion may produce multiple entry files when it covers independently-queryable threads. `ask` is read-only. `resolve` edits only the `questions/Q-NNN-short-slug.md` file (and optionally the source entry). `supersede` edits an existing entry file's frontmatter and adds a banner. `seed` is read-first, write-only-after-confirmation -- preserve this ask-before-write pattern for any new commands.
- Entry filenames: `YYYY-MM-DD-short-slug.md`; the entry frontmatter (`date`, `title`, `areas`, `topics`, `stories`, `status`, `supersedes`, `superseded_by`, `superseded_date`) is what readers shortlist on.
- Question files: `questions/Q-NNN-short-slug.md` (the `Q-NNN` prefix is the zero-padded ID; the slug is a short, lowercase, hyphenated summary of the question, same style as a log slug and only for human scanning). One per question, with `id`, `question`, `status`, `areas`, `asked_date`, `asked_slug`, `resolution`, `resolution_slug` frontmatter. The `id:` field is the authoritative ID (the dashboard keys off it, not the filename). IDs are sequential and never reused; the next ID is (highest existing `id:`) + 1.
