# wherefore: agent instructions

This repo uses a `wherefore/` directory: a plain-markdown record of technical
decisions (what was chosen, why, what was rejected) and open questions. Any agent
can read and maintain it by following the rules below. Do not invent a second
location; if `wherefore/` exists, use it.

## Directory layout

```
wherefore/
  INDEX.md          one line per decision entry (the retrieval index)
  QUESTIONS.md      one line per open/resolved question
  topics.md         controlled tag vocabulary: Areas and Topics
  log/YYYY-MM-DD-short-slug.md    one decision per file
  questions/Q-NNN.md              one question per file
```

## Reading (answering "why did we...", "what did we decide about...")

1. Read `INDEX.md` first and shortlist entries by area, topic, story, or title.
   Open only the shortlisted files (1-5), not the whole log.
2. Treat status `active`, `current`, or absent as current. For a `superseded`
   entry, follow its `superseded_by` slug to the replacement (repeat until you
   reach an active entry). Exclude `obsolete` entries unless asked about history.
3. Answer from active entries, lead with the current decision, cite the source by
   date + title + filename. If nothing matches, say so plainly. Never fabricate.
4. After answering, scan `QUESTIONS.md` for `open` questions whose areas overlap
   and surface them briefly.

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
fits, and append it to the right section of `topics.md`. Then append one line to
`INDEX.md`:

```
- YYYY-MM-DD | slug | title | areas: a1 | topics: t1, t2 | stories: PROJ-1 | active
```

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

4. Change the old entry's `INDEX.md` status column to `superseded -> <new-slug>`.

For an abandoned decision with no replacement: `status: obsolete`, a
`superseded_date`, a banner `OBSOLETE YYYY-MM-DD. Kept for history, not current.`,
and `obsolete` in the INDEX column (no `superseded_by`).

## Questions

When a decision leaves something unresolved, register it. Next Q-ID = highest in
`QUESTIONS.md` + 1. Create `wherefore/questions/Q-NNN.md` with this EXACT
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

Append one line to `QUESTIONS.md`:

```
- Q-NNN | open | YYYY-MM-DD | asked_slug | question text | areas: a1, a2
```

To resolve: set the Q-file `status: resolved`, fill `resolution` (one sentence)
and `resolution_slug` (source slug, or blank if standalone), and change `open` to
`resolved` on its `QUESTIONS.md` line.

## Conventions

- All frontmatter keys use underscore style (superseded_by, superseded_date,
  asked_date). Do not use hyphenated keys.
- The dashboard derives a question's ID from its `id:` frontmatter field, not the
  filename. Keep `id:` accurate.
- Always report back what you wrote or changed (files touched, tags assigned, any
  supersession) so the human can correct it.
- No em dashes in entries.
