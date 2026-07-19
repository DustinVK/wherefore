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

Body: freeform. The `slate` skill breaks the work into `- [ ]` checkboxes by default
(steps concrete enough to check off); prose stays valid, and older items may be
prose-only. References to other items in the body use a relative Markdown link (see
Linking conventions below).

## Status vocabulary

`todo` -> `doing` -> `done` is the normal flow. Any transition to `dropped` is
abandonment. `dropped` is terminal but kept: a dropped item, with `updated` marking
when and `dropped_reason` or `decision_ref` marking why, IS the plan-change record.

`blocked` is derived, not a status. An item is blocked if it carries a `question_ref`
to an open question. It never lives in frontmatter. An item carrying `answers` (a spike
investigating a question) is not blocked; `answers` is the opposite relationship.

## Linking conventions

The frontmatter refs below stay bare IDs/slugs. In the BODY, link to another item with a
relative Markdown link, ID-first in the text: `[P-005: CI validator](P-005-ci-schema-validator.md)`
(same directory) or `[Q-007: token store](../questions/Q-007-token-store.md)` (sibling
collection). Never a bare slug or a `[[wikilink]]`: those render as literal text on GitHub
and most editors.

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

- The `slate` skill writes only `wherefore/plan/*`. Never `log/`, never `questions/`,
  never `ROADMAP.md`.
- Durable why belongs in the decision layer: when a plan item's rationale is really a
  decision, that is a `capture`; when a direction changes for a reason worth keeping,
  that is a `supersede` on the decision, and the plan item flips to `dropped` carrying
  `decision_ref` to it.
- `capture` never creates plan items and never writes plan status directly; it may hand
  off to the `slate` skill. The `slate` skill records that something changed; the decision
  layer owns the durable why.

Maintained by the [wherefore](https://github.com/DustinVK/wherefore) slate skill.
