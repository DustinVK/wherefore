---
name: slate
description: >
  Operate the wherefore plan collection: the forward-looking work items in
  wherefore/plan/. Use whenever the user wants to open a new plan item, move one
  along (todo to doing to done), drop one, or see what is in flight, e.g. "add a
  plan item for X", "open a plan item to migrate auth", "start on P-011", "mark
  P-012 done", "what am I working on", "what is on the plan", "drop P-007, we're not
  doing it", or invoke "/wherefore:slate". Detects the intent from the request rather
  than taking subcommands. Breaks work into concrete checkboxes on open; never
  bulk-generates items from a vague prompt.
---

# Wherefore: slate

Operate the wherefore plan collection: forward-looking work items, one file each,
tracking what is committed and how far along it is. A plan item is a commitment, not
a decision. Decisions (the why) live in `log/` and are owned by `capture`; open
questions live in `questions/`. This skill writes only `wherefore/plan/`, never
`log/` or `questions/`.

The skill is one verb with four intents, read from the request: open a new item,
advance one, drop one, or read what is in flight. The real work of open is
decomposition: break the item into checkboxes concrete enough to actually check off,
and push the user for specifics rather than writing vague steps. A plan item nobody
can act on is worse than none.

No em dashes. Periods, commas, colons, semicolons, or parentheses instead. Firm project rule.

Never delete anything under a `wherefore/` data dir. Retire, do not delete.

## Storage layout

Plan items live under a repo-relative `wherefore/` directory:

```
wherefore/
├── topics.md                 # controlled tag vocabulary (areas + topics)
└── plan/
    ├── README.md             # the item format (not an item; ignored by the loader)
    └── P-NNN-short-slug.md   # one file per plan item (ID prefix + scannable slug)
```

The loader globs `plan/P-*.md`, so only P-item files are collected; `README.md` and
any other doc in `plan/` is ignored. The `id` frontmatter field is authoritative and
drives the item's identity, exactly like `Q-NNN`; the filename slug is browsability
sugar and cannot cause a collision. If `wherefore/plan/` does not exist, create it
(the `seed` command scaffolds `plan/` and its `README.md` on a fresh repo); never
invent a second location.

## Frontmatter

Write every item with this frontmatter, in this key order (matching `plan/README.md`
so diffs stay clean). Omit optional keys that have no value rather than emitting them
blank.

```yaml
---
id: P-001                    # authoritative, P + zero-padded number
title: Ship the 0.1.1 patch  # short human title
status: todo                 # todo | doing | done | dropped
created: 2026-06-20          # YYYY-MM-DD, set once on open
updated: 2026-07-03          # YYYY-MM-DD, set on ANY write to the item (see below)
area: dashboard              # single area, reuse topics.md Areas; optional
topics: [release]            # inline flow list, reuse topics.md Topics; omit when empty
milestone: M1                # milestone this serves, defined in wherefore/ROADMAP.md; optional
decision_ref: 2026-07-03-companion-plan-collection   # originating/superseding decision(s); optional
question_ref: Q-007          # a single open question this item is blocked on; optional
answers: Q-009               # a single question this item is the work of answering (spike); optional
dropped_reason: >            # why, when status is dropped; optional
  Short reason kept for history.
---
```

- `status` is a separate state machine from decision status. Never put
  `active`/`superseded`/`obsolete` on a plan item, and never put
  `todo`/`doing`/`done`/`dropped` on a decision.
- `updated` is set to today on ANY write to the item: a status change OR a body edit,
  including checking or unchecking a single box. It is the plan-change timestamp and
  must not lie. A brand-new `todo` item that has never been touched again has no
  `updated` key.
- `blocked` is NOT a status. It is derived: an item is blocked when it carries a
  `question_ref` to an open question. Never write `blocked`.
- `question_ref` is a single `Q-NNN`. By deliberate choice an item is blocked by at
  most one question; this is a fixed constraint, not an unstated limit.
- `answers` is a single `Q-NNN` this item is the work of answering (a spike). It is the
  semantic opposite of `question_ref`: `question_ref` means blocked by that question,
  `answers` means investigating it, so an item carrying `answers` is NOT blocked. An item
  may carry both, answering one question while blocked on another: rare but legal. Never
  point `answers` and `question_ref` at the same `Q-NNN`; an item cannot be both blocked on
  a question and the work of answering it. If asked to, refuse and say why.
- `decision_ref` is one or more `YYYY-MM-DD` decision slugs, comma-separated, with no
  `.md` extension. This mirrors the `supersedes` convention, so there is one linking
  format across the repo.
- `area` is singular here (a plan item has one area), unlike the plural `areas` list
  on decisions. Reuse the vocabulary in `topics.md`; if an existing item uses a tag
  not in `topics.md`, keep it, do not rewrite it.

Compound keys use underscores (`decision_ref`, `question_ref`, `dropped_reason`). A
hyphen parses silently and drops the link.

## Frontmatter safety

Emit the free-text scalars `title` and `dropped_reason` safely. Quote `title` as a
double-quoted single-line string when it contains a `: ` (colon-space) or a leading
`-`, `#`, `[`, `{`, or `"`, escaping embedded `"` as `\"` and `\` as `\\`; a plain
title (`Ship the 0.1.1 patch`) needs no quotes, and existing unquoted titles must not
be rewritten. If `dropped_reason` runs long, a folded block scalar (`>`) over indented
lines is fine (P-003 uses one). Controlled fields (`id`, `status`, `created`,
`updated`, slugs, the `topics` list) never need quotes.

## Workflow

First, read the request and decide which intent it is: open (create a new item),
advance (move one along), drop (retire one), or read (report what is in flight). When
it is ambiguous, ask. Read `wherefore/topics.md` once if you will write `area`/`topics`.

To list or find items cheaply, dump only the leading frontmatter of each item:

```bash
for f in wherefore/plan/P-*.md; do
  awk -v F="$f" 'BEGIN{print "=== " F " ==="}
    /^---[[:space:]]*$/ { n++; if (n==2) exit; next }
    n==1 { print }' "$f"
done
```

### Intent: open (create a new item)

1. Allocate the next P-NNN: highest `id` across `plan/P-*.md` plus one. Read the
   authoritative `id:` from each file's frontmatter, not the filename (the filename slug is
   only browsability sugar, so allocating off filenames is how duplicate IDs get created):
   ```bash
   for f in wherefore/plan/P-*.md; do awk -F': *' '/^id:/{print $2; exit}' "$f"; done 2>/dev/null \
     | sed -E 's/P-0*([0-9]+)/\1/' | sort -n | tail -1
   ```
   Empty or absent dir starts at P-001. IDs are sequential and never reused, including
   numbers freed by dropped items.
2. Break the work into checkboxes. This is the point of the skill. Turn the plan into
   `- [ ]` steps concrete enough to check off. If the user's description is vague, push
   for specifics ("what are the actual steps?") rather than writing filler. Never
   bulk-generate items from a vague prompt: a plan item is a commitment, and
   manufacturing commitments in bulk is the failure this collection exists to avoid.
   When a checkbox or prose references another wherefore item, link it with a relative
   Markdown link, e.g. `- [ ] fold in [P-005: CI validator](P-005-ci-schema-validator.md)`
   or `[Q-007: token store](../questions/Q-007-token-store.md)`, never a bare slug or a
   `[[wikilink]]` (see AGENTS.md "Linking"). Frontmatter refs (`decision_ref`,
   `question_ref`, `milestone`, `answers`) stay bare, not links.
3. Set frontmatter: `id`, `title`, `status: todo`, `created` today. Add `area`/`topics`
   from `topics.md` if the item has them; add `milestone`, `question_ref`, or
   `decision_ref` if the user gives them. Do not set `updated` on a brand-new item.
4. Write `wherefore/plan/P-NNN-short-slug.md` (slug short, lowercase, hyphenated). If
   the name exists, add a suffix; never overwrite.
5. Report the id, title, tags, any refs, and the checkbox count.

### Intent: advance (move an item along)

1. Find the item (glob by id: `ls wherefore/plan/P-004-*.md`). Open it.
2. Move `status`. The normal flow is `todo -> doing -> done`. Reopening is allowed:
   `done -> doing` when work resumes. It bumps `updated` and unchecks nothing
   automatically; the user says which boxes reopen. Check or uncheck the body boxes to
   match progress.
3. Set `updated` to today. This applies to ANY write, including toggling a single
   checkbox, not only a status change.
4. Tolerate a prose-only body: an older or hand-written item may have no checkboxes.
   That is fine; just make the status change.
5. Advancing a blocked item: if the item carries a `question_ref` to a question still
   open, allow the move to `doing` but warn. Report that the item is still blocked on
   Q-NNN and ask whether that question should be resolved via `resolve` first. Do not
   refuse the transition.
6. On reaching `done`, decide the handoff by who drove the transition:
   - A human asked to mark it done: ask whether there is a decision worth capturing
     (the why behind finishing this way), and hand off to the `capture` skill if yes.
     Do not write `log/` yourself.
   - The `capture` skill drove this advance (it invoked advance to mark an item done
     and set `decision_ref` because a captured decision resolved the item): suppress
     the offer. The decision that would be captured is the one that just called in;
     offering to capture it would loop.
   - If the item carries `answers: Q-NNN` (a spike), the capture offer above still
     applies, and additionally offer to resolve that answered question via `resolve`. Do
     not resolve it silently; finishing the investigation is not the same as having an
     answer. This handoff marks `slate` as the driver, so `resolve` suppresses its return
     offer to advance this item, the same way capture-driven advance suppresses its capture
     offer.
7. To block an item, attach a `question_ref` to the open question it waits on. If that
   question does not exist yet, create it via the `ask` skill first, then set the ref.
   Never write a `blocked` status; blocked is derived from the ref.
8. Report the transition, the `updated` date, any boxes toggled, and any handoff.

### Intent: drop (retire an item)

1. Find and open the item.
2. Require a reason: either a `dropped_reason` (a short why) or a `decision_ref` to the
   decision that killed it. If the user gives neither, ask for the reason; refuse to
   drop without one.
3. Set `status: dropped`, set `updated` to today, and add `dropped_reason` and/or
   `decision_ref`. The dropped item plus its reason IS the plan-change record.
4. Never delete the file. Never delete anything under a `wherefore/` data dir. A
   dropped item is kept for history.
5. Report what was dropped and why.

### Intent: read (what am I working on)

1. Dump the item frontmatter (loop above) and report by status: `doing` first (in
   flight), then `todo`, then blocked (items carrying a `question_ref` to an open
   question), then recently `done`, then `dropped` if asked.
2. To classify blocked accurately, read MAY take one narrow cross-collection peek: the
   `status` of a referenced question, to tell whether an attached `question_ref` is still
   open. Read only that one frontmatter field. Reporting any `question_ref` as blocked
   without checking would show stale blocks after a `resolve`, the exact drift that makes a
   view untrustworthy.
3. That status peek is the only exception. Do not pull in question bodies, open questions
   at large, or anything from `log/`; a cross-collection status view is a separate concern,
   not this skill.
4. If `plan/` is empty or absent, say so plainly.

## Spikes

A spike is an open-ended research item: the unknown is what to do, so the steps are not
known up front. It is a plan item, not a new type, and needs no type field. Two rules:

- Body: the checkboxes are the questions to answer, not steps to take. Push for the
  specific unknowns ("does the vendor API support batching?", "what is the p99 under
  load?") rather than writing "research X" as a single box.
- Termination: a spike ends by producing a decision (hand off to `capture`) or new
  questions (hand off to `ask`). Finishing the investigation is not the same as having an
  answer.

If the spike is the work of answering a tracked question, set `answers: Q-NNN` on it, not
`question_ref` (which would render the spike as blocked in the read view). On advancing a
spike with `answers` to `done`, the capture-handoff offer applies and you additionally
offer to resolve that question via `resolve`.

## Examples

Open. User: "Add a plan item to migrate the auth flow to OAuth." Allocate the next
P-NNN, then push for the concrete steps ("which providers, what has to change?") and
write them as checkboxes. Report: "Opened P-101 (migrate-auth-to-oauth), status todo,
5 steps."

Advance, human-driven. User: "Mark P-101 done." Set `status: done`, set `updated` to
today, check the remaining boxes, then ask: "Anything decided here worth capturing as a
decision?" If yes, hand off to `capture`.

Advance, capture-driven. The `capture` skill logs a decision that resolves P-102 and
invokes advance to set it done with `decision_ref`. Advance sets `status: done`, adds
the `decision_ref`, bumps `updated`, and suppresses the capture offer, because capture
is the caller.

Reopen. User: "Actually P-101 is not done, the error states are missing." Set `status`
back to `doing`, bump `updated`, and uncheck only the boxes the user names; leave the
rest checked.

Block. User: "P-101 is stuck until we decide the token store." If no question tracks
that, create one via `ask` (Q-NNN), then set `question_ref: Q-NNN` on P-101. Report it
as blocked; do not write a `blocked` status.

Spike. User: "Open a spike on whether we can drop the Redis cache." Open it with the
unknowns as checkboxes (`- [ ] measure the cache hit rate`, `- [ ] test cold-start
latency without it`, `- [ ] list which endpoints depend on it`). If a question already
tracks this, set `answers: Q-018` (not `question_ref`, which would render it blocked).
When the spike is done, offer to capture the decision and to resolve Q-018.

Drop with a reason. User: "Drop P-103." Ask for the reason if none given. On "superseded
by the new pipeline, not worth finishing," set `status: dropped`, `updated` today,
`dropped_reason` to that. Never delete the file.

Read. User: "What am I working on?" Dump the item frontmatter and list `doing` first,
then `todo`, then blocked (checking each `question_ref`'s status to skip ones already
resolved), citing ids and titles. Do not reach into `log/` or `questions/` beyond that
one status check.
