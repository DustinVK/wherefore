# CLAUDE.md

@AGENTS.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

A Claude Code plugin marketplace. It hosts the `wherefore` plugin, which ships five skills and a command for capturing technical decisions into a repo-committed wherefore log, querying them later, closing out open questions, retiring superseded or obsolete decisions, and tracking forward-looking plan items. The marketplace itself has no build system, tests, or runtime -- the only "code" is JSON manifests, Markdown skill/command definitions, and a GitHub Actions CI workflow.

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
  skills/slate/
    SKILL.md                          # manages wherefore/plan/ items (open, advance,
                                      # drop, read): one verb, four intents; never
                                      # writes log/ or questions/, hands off instead
```

The `wherefore/` directory itself is **not** in this repo -- it lives in each consuming project's repo, created by the skills on first use.

## Skill / command authoring conventions

- **SKILL.md** front matter: `name`, `description` (used for skill-trigger matching), and optionally `allowed-tools`.
- **Command `.md`** front matter: `description`, `argument-hint`, `allowed-tools`.
- All skills use a two-facet tag system: **areas** (feature slices: WHAT) and **topics** (cross-cutting concerns: HOW), drawn from the consuming project's `wherefore/topics.md`. Keep this separation consistent if extending the skills.
- Entry and question frontmatter is the single source of truth: `ask` derives its shortlist by reading only the leading frontmatter block of each file. Derive on read; do not add a generated index.
- `capture` is write-heavy (creates/edits files); a single discussion may produce multiple entry files when it covers independently-queryable threads. `ask` is read-only. `resolve` edits only the `questions/Q-NNN-short-slug.md` file (and optionally the source entry). `supersede` edits an existing entry file's frontmatter and adds a banner. `slate` is the only writer of `wherefore/plan/`: it opens, advances, drops, and reads plan items and never writes `log/` or `questions/` (it hands off to `capture` and `ask` instead). `capture` never creates plan items; when a decision resolves or implies work it hands off to `slate`. `seed` is read-first, write-only-after-confirmation -- preserve this ask-before-write pattern for any new commands.
- Entry filenames: `YYYY-MM-DD-short-slug.md`; the entry frontmatter (`date`, `title`, `areas`, `topics`, `stories`, `status`, `supersedes`, `superseded_by`, `superseded_date`) is what readers shortlist on.
- Question files: `questions/Q-NNN-short-slug.md` (the `Q-NNN` prefix is the zero-padded ID; the slug is a short, lowercase, hyphenated summary of the question, same style as a log slug and only for human scanning). One per question, with `id`, `question`, `status`, `areas`, `asked_date`, `asked_slug`, `resolution`, `resolution_slug` frontmatter. The `id:` field is the authoritative ID (the dashboard keys off it, not the filename). IDs are sequential and never reused; the next ID is (highest existing `id:`) + 1.
- Plan items: `plan/P-NNN-short-slug.md` (the `P-NNN` prefix is the zero-padded ID; the `id:` field is authoritative, and the loader globs `plan/P-*.md` so `plan/README.md` is never collected). Frontmatter: `id`, `title`, `status` (todo|doing|done|dropped), `created`, `updated` (bumped on any write, including a checkbox toggle), plus optional `area` (single, not the plural `areas` decisions use), `topics`, `milestone`, `decision_ref`, `question_ref`, `answers` (a single `Q-NNN` a spike is the work of answering, the opposite of `question_ref` and not a blocker), `dropped_reason`. Plan status is a separate state machine from decision status: `capture` never creates or mutates plan items, and plan transitions never touch a decision's status (that stays with `supersede`). `blocked` is derived from an open `question_ref` (at most one per item), never written. IDs are sequential and never reused; the next ID is (highest existing `id:`) + 1.
- Cross-links: body prose links another item with a relative Markdown link to its file (`[P-004: label](P-004-slug.md)`, `[Q-007: label](../questions/Q-007-slug.md)`), ID-first text, never a bare slug or a `[[wikilink]]`. Frontmatter refs stay bare IDs/slugs. See the AGENTS.md "Linking" section; the dashboard rewrites these `.md` links to routes at build time (`src/lib/md-links.mjs`).
