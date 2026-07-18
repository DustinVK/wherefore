---
description: Inspect the codebase and propose starter areas + topics for the wherefore log
argument-hint: [optional focus path]
allowed-tools: Read, Grep, Glob, Bash(ls:*), Bash(find:*), Bash(cat:*), Bash(git:*), Write
---

You are bootstrapping the controlled vocabulary for this project's wherefore log,
the two-facet `wherefore/topics.md` used by the `capture` and `ask` skills. Read
the codebase, propose a draft vocabulary, and, only after the user confirms,
write it.

Scope: if `$ARGUMENTS` names a path, focus your inspection there; otherwise inspect
the whole repo from its root.

## 1. Gather signals (read-only)

Infer the two facets from real structure, not guesses:

**Areas: feature slices / product domains (WHAT):**
- Top-level source layout and module/package names; feature folders and bounded
  contexts are the strongest signal. List the tree first (e.g. `find . -maxdepth 2
  -type d`, or `git ls-files | head -200` for tracked structure).
- Route / endpoint / controller / handler names, and the domain nouns in the
  README and any `docs/`.
- Group related code into coarse, stable buckets: one area per product capability
  (`checkout`, `billing`, `catalog`), NOT one per file or sub-feature.

**Topics: cross-cutting technical concerns (HOW):**
- Dependency manifests and lockfiles (`package.json`, `go.mod`, `requirements.txt`,
  `pom.xml`, `Gemfile`, `Cargo.toml`, ...), Dockerfiles, IaC, and any `migrations/`
  directory. These reveal the stack: the database, auth approach, queues, etc.
- Recurring engineering concerns visible in the tree (`auth`, `data-model`,
  `performance`, `security`, `api-design`, `infra`, `frontend`).

Keep each list to roughly 6-12 entries. Resist sprawl; coarse and reusable beats
exhaustive. Use lowercase, hyphenated tags.

## 2. Propose (do NOT write yet)

Present the proposal in the two-section format below, and for EACH tag add a short
(3-8 word) justification pointing at what in the codebase suggested it, so the user
can sanity-check:

```
## Areas: feature slices / product domains (WHAT)
- checkout            # src/checkout/, /api/checkout routes
- billing             # src/billing/, Stripe client

## Topics: cross-cutting technical concerns (HOW)
- postgres            # migrations/, pgx in go.mod
- auth                # internal/auth/, JWT middleware
```

Then STOP and ask the user to confirm, edit, or add/remove tags. Do not assume
approval; wait for their reply before writing anything.

## 3. Write (only after the user confirms)

- If `wherefore/topics.md` does NOT exist: create the `wherefore/` directory and
  write the confirmed vocabulary as `wherefore/topics.md` in the two-section format
  above. The `capture` skill scaffolds `log/`, `questions/`, and the top-level
  `README.md` on first use.
- If it DOES exist: treat the existing file as the source of truth and MERGE:
  append only the new, confirmed tags under the correct section, and never remove
  or rename anything already there. Report exactly which tags you added.
- When creating `wherefore/` fresh (or when `wherefore/` exists but `wherefore/plan/`
  does not), scaffold the `plan/` collection: create `wherefore/plan/` and write
  `wherefore/plan/README.md` with exactly the content below. The loader globs
  `plan/P-*.md`, so this `README.md` is never collected as an item. Do NOT write any
  P-item; opening items is the `plan` skill's job.

  ````markdown
  # Plan collection (`wherefore/plan/`)

  Plan items are a first-class collection under `wherefore/`, parallel to `questions/`.
  They track forward-looking work and its state (todo / doing / done / dropped) and
  preserve plan-change history by keeping dropped items rather than deleting them. This
  collection is durable and retire-don't-delete, the same as the rest of `wherefore/`.

  Plan status is a separate state machine from decision status. Do not reuse active /
  superseded / obsolete here, and do not put todo / doing / done / dropped on decisions.

  ## Files

  - Path: `wherefore/plan/P-NNN-slug.md`. The slug is browsability sugar.
  - The `id` field in frontmatter is authoritative and drives the item's identity,
    exactly like `Q-NNN`. Filename casing cannot cause collisions.
  - The loader globs `plan/P-*.md`, so only plan-item files are collected. This
    `README.md` is ignored.
  - Next ID = (highest `id:` across the P-*.md files) + 1. IDs are sequential and never
    reused, including numbers freed by dropped items.

  ## Frontmatter

  | key             | req | type              | notes                                                       |
  |-----------------|-----|-------------------|-------------------------------------------------------------|
  | `id`            | yes | `P-NNN`           | authoritative, drives the item id                           |
  | `title`         | yes | string            | short human title                                           |
  | `status`        | yes | enum              | `todo` / `doing` / `done` / `dropped`                       |
  | `created`       | yes | `YYYY-MM-DD`      | creation date                                               |
  | `updated`       | no  | `YYYY-MM-DD`      | set on any write (status change or body edit, including a checkbox toggle); this IS the plan-change timestamp |
  | `area`          | no  | string            | single area, reuse existing area vocabulary                 |
  | `topics`        | no  | list              | reuse existing cross-cutting topics                         |
  | `milestone`     | no  | `M1`              | milestone this item serves, defined in `wherefore/ROADMAP.md`|
  | `decision_ref`  | no  | slug or slug list | originating or superseding decision(s), `supersedes` format |
  | `question_ref`  | no  | `Q-NNN`           | a single open question this item is blocked on              |
  | `answers`       | no  | `Q-NNN`           | a single question this item is the work of answering (spike)|
  | `dropped_reason`| no  | string            | lightweight why, used when `status: dropped`                |

  Body: freeform. The `plan` skill breaks the work into `- [ ]` checkboxes by default
  (steps concrete enough to check off); prose stays valid, and older items may be
  prose-only.

  ## Status vocabulary

  `todo` -> `doing` -> `done` is the normal flow. Any transition to `dropped` is
  abandonment. `dropped` is terminal but kept: a dropped item, with `updated` marking
  when and `dropped_reason` or `decision_ref` marking why, IS the plan-change record.

  `blocked` is derived, not a status. An item is blocked if it carries a `question_ref`
  to an open question. It never lives in frontmatter. An item carrying `answers` (a spike
  investigating a question) is not blocked; `answers` is the opposite relationship.

  ## Linking conventions

  - `milestone`: a single milestone ID (`M1`) defined in `wherefore/ROADMAP.md`. One-way:
    the item points up at the milestone.
  - `decision_ref`: one or more decision log slugs in `YYYY-MM-DD-slug` form (no `.md`),
    comma-separated for multiple, mirroring the `supersedes` convention.
  - `question_ref`: a single `Q-NNN` the item waits on. By deliberate choice an item is
    blocked by at most one question.
  - `answers`: a single `Q-NNN` this item investigates (a spike). The opposite of
    `question_ref`: an item that `answers` a question is not blocked by it. An item may
    carry both (rare but legal); never point them at the same `Q-NNN`.

  ## Key casing

  Single-word keys are bare (`id`, `title`, `status`, `created`, `updated`, `area`,
  `topics`, `milestone`, `answers`). Compound keys use underscore (`decision_ref`,
  `question_ref`, `dropped_reason`). A hyphen in a compound key parses silently and drops
  the link.

  ## Boundaries

  - The `plan` skill writes only `wherefore/plan/*`. Never `log/`, never `questions/`,
    never `ROADMAP.md`.
  - Durable why belongs in the decision layer: when a plan item's rationale is really a
    decision, that is a `capture`; when a direction changes for a reason worth keeping,
    that is a `supersede` on the decision, and the plan item flips to `dropped` carrying
    `decision_ref` to it.
  - `capture` never creates plan items and never writes plan status directly; it may hand
    off to the `plan` skill. The `plan` skill records that something changed; the decision
    layer owns the durable why.

  Maintained by the [wherefore](https://github.com/DustinVK/wherefore) plan skill.
  ````

Finish with a one-line summary of what was written and where.
