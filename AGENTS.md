# wherefore: agent instructions

This repo uses a `wherefore/` directory: a plain-markdown record of technical
decisions (what was chosen, why, what was rejected) and open questions. Any agent
can read and maintain it by following the rules below. Do not invent a second
location; if `wherefore/` exists, use it.

## Directory layout

```
wherefore/
  topics.md         controlled tag vocabulary: Areas and Topics
  log/YYYY-MM-DD-short-slug.md    one decision per file
  questions/Q-NNN-short-slug.md   one question per file (ID prefix + scannable slug)
  plan/P-NNN-short-slug.md        forward-looking plan items, one per file
```

If `wherefore/` does not exist, create it plus `log/`, `questions/`, a starter
`topics.md`, and a `README.md` containing exactly:

```markdown
# wherefore

A decision log in plain markdown. Each file captures what was decided, why, and what was ruled out.

Maintained by the [wherefore](https://github.com/DustinVK/wherefore) skill.
```

## Reading (answering "why did we...", "what did we decide about...")

1. Read only the leading frontmatter block of every `log/*.md` file (it is short),
   and shortlist by area, topic, story, or title. Then open only the shortlisted
   files (1-5), not the whole log. The frontmatter also carries each entry's
   `status` and `superseded_by`, so filtering and chain-following need nothing else.
2. Treat status `active`, `current`, or absent as current. For a `superseded`
   entry, follow its `superseded_by` slug to the replacement (repeat until you
   reach an active entry). Exclude `obsolete` entries unless asked about history.
3. Answer from active entries, lead with the current decision, cite the source by
   date + title + filename. If nothing matches, say so plainly. Never fabricate.
4. After answering, read the `questions/Q-*.md` frontmatter and surface briefly any
   `open` questions whose areas overlap.

## Writing a decision (capture)

Distill the discussion to its useful residue; do not transcribe. Write
`wherefore/log/YYYY-MM-DD-short-slug.md` (slug: short, lowercase, hyphenated) with
this EXACT frontmatter and section structure:

```markdown
---
date: YYYY-MM-DD
title: "Short title, <= 8 words, always quoted"
areas: [tag]              # feature slices, from topics.md Areas, or []
topics: [tag, tag]        # cross-cutting concerns, from topics.md Topics
stories: [PROJ-1234]      # ticket IDs, or []
status: active            # active | superseded | obsolete
supersedes:               # slug this replaces, or blank
superseded_by:            # filled only when THIS entry is later superseded
superseded_date:          # YYYY-MM-DD, or blank
---

## Summary
2-4 sentences: what was discussed and the bottom line.

## Decisions / outcomes
- Concrete things agreed.

## Why
The rationale, constraints, tradeoffs. Highest-value section.

## Alternatives considered
- Option X, rejected because ... (omit only if none discussed)

## Open questions / follow-ups
- Anything unresolved, or "None".
```

Tag from `topics.md` only. Reuse existing tags; add a new one only when nothing
fits, and append it to the right section of `topics.md`. That is the whole write.

## Superseding a decision (never silently; confirm with the user first)

When a new decision replaces an old one, or the user asks to retire an entry:

1. New/replacement entry gets `supersedes: <old-slug>` in its frontmatter.
2. Old entry frontmatter: set `status: superseded`, `superseded_by: <new-slug>`,
   `superseded_date: YYYY-MM-DD`.
3. Add this as the first body line of the old entry (after the frontmatter, before
   `## Summary`):

   ```
   SUPERSEDED YYYY-MM-DD -> see <new-slug>. Kept for history, not current.
   ```

The frontmatter change is the whole update.

For an abandoned decision with no replacement: `status: obsolete`, a
`superseded_date`, and a banner `OBSOLETE YYYY-MM-DD. Kept for history, not current.`
(no `superseded_by`).

## Questions

When a decision leaves something unresolved, register it. Next Q-ID = (highest `id:`
across the existing `wherefore/questions/Q-*.md` files) + 1; IDs are sequential and
never reused. Create `wherefore/questions/Q-NNN-short-slug.md` (the `Q-NNN` prefix is
the zero-padded ID; the slug is a short, lowercase, hyphenated summary distilled from
the question, same style as a log slug). The `id:` frontmatter field remains the
authoritative ID; the filename slug is only for human scanning. Use this EXACT
frontmatter:

```markdown
---
id: Q-NNN
question: One-line question text
status: open
areas: [tag]
asked_date: YYYY-MM-DD
asked_slug: <slug of the entry that raised it>
resolution:
resolution_slug:
---
```

Creating the file is the whole registration.

To resolve: set the Q-file `status: resolved`, fill `resolution` (one sentence) and
`resolution_slug` (source slug, or blank if standalone). The frontmatter is the only
place the status lives.

## Plan items

Forward-looking work items live in `wherefore/plan/P-NNN-short-slug.md`, one per file, a
separate collection from decisions. A plan item is a committed intention; a decision is a
resolved ruling. Do not create plan items for work a decision merely implies unless a human
asks; commitments nobody chose are noise.

Next P-ID = (highest `id:` across `wherefore/plan/P-*.md`) + 1; IDs are sequential and never
reused, including numbers freed by dropped items. The `id:` field is authoritative; the
filename slug is only for human scanning. Use this frontmatter:

```markdown
---
id: P-NNN
title: Short human title
status: todo            # todo | doing | done | dropped
created: YYYY-MM-DD
updated:                # YYYY-MM-DD, set on ANY write: status change or body edit, including a checkbox toggle
area:                   # single area from topics.md, or omit
topics: []              # cross-cutting topics from topics.md, or omit
milestone:              # M1, defined in wherefore/ROADMAP.md, or omit
decision_ref:           # one or more YYYY-MM-DD decision slugs, comma-separated, no .md; or omit
question_ref:           # a single Q-NNN this item is blocked on, or omit
answers:                # a single Q-NNN this item is the work of answering (a spike), or omit
dropped_reason:         # short why, used when status: dropped
---
```

Body: break the work into `- [ ]` checkboxes concrete enough to check off; prose is valid too.

- Status flow is `todo -> doing -> done`; any move to `dropped` is abandonment and requires a
  `dropped_reason` or a `decision_ref`. Dropped items are kept, never deleted; the dropped item
  plus its reason IS the plan-change record.
- `blocked` is never written. It is derived: an item is blocked while it carries a
  `question_ref` to an open question. At most one blocking question per item.
- `answers` is a single `Q-NNN` a spike is the work of answering. It is the opposite of
  `question_ref` (blocked by) and does not make the item blocked. Never point `answers` and
  `question_ref` at the same `Q-NNN`.
- Plan status is a separate state machine from decision status. Never put
  `active`/`superseded`/`obsolete` on a plan item, or `todo`/`doing`/`done`/`dropped` on a
  decision. Retiring or replacing a decision is a supersession on the decision, not a plan edit.

## Linking

When a body (an entry, a question, or a plan item) refers to another wherefore item,
write a standard relative Markdown link to that item's file, never a bare slug and never
a `[[wikilink]]` (wikilinks render as literal text on GitHub and most editors). Start the
link text with the target's ID so the raw file stays greppable, then a short label:

```markdown
See [P-004: verified brokers](P-004-m9-populate-verified-brokers.md) for the broker work.
Blocked by [Q-007: token store](../questions/Q-007-token-store.md).
Supersedes [2026-07-03-plan-directory](../log/2026-07-03-plan-directory.md).
```

- The path is relative to the file you are writing: same directory is `NAME.md`; a sibling
  collection is `../log/NAME.md`, `../questions/NAME.md`, or `../plan/NAME.md`.
- Link text is the target ID (`P-NNN`, `Q-NNN`, or a `YYYY-MM-DD-slug`) then `: short label`.
- This is for body prose only. Frontmatter refs (`decision_ref`, `question_ref`,
  `supersedes`, `superseded_by`, `asked_slug`, `resolution_slug`) stay bare IDs/slugs.
- Standard Markdown links render as real links everywhere: GitHub, Obsidian, editors, and
  the dashboard. Obsidian users: turn off Files & Links -> "Use [[Wikilinks]]" so Obsidian
  writes this same portable format (it resolves Markdown links either way).

## Conventions

- All frontmatter keys use underscore style (superseded_by, superseded_date,
  asked_date). Do not use hyphenated keys.
- The dashboard derives a question's ID from its `id:` frontmatter field, not the
  filename. Keep `id:` accurate.
- Always report back what you wrote or changed (files touched, tags assigned, any
  supersession) so the human can correct it.
- No em dashes in entries.
