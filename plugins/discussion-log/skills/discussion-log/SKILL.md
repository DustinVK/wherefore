---
name: discussion-log
description: >
  Capture a technical discussion or meeting summary into the team's searchable
  discussion log. Use this whenever the user wants to log, record, save, or
  archive the outcome of a discussion, Slack huddle, design conversation, standup,
  or meeting — including when they paste a raw or AI-generated summary and say
  things like "log this", "add this to the discussion log", "record this
  discussion", "save this for later", or invoke "/discussion-log". Trigger even
  if the user only pastes a chunk of conversation and asks to capture the
  important parts; this skill distills it rather than storing it verbatim.
---

# Discussion Log — Capture

Turn a raw or AI-generated discussion summary into one compact, retrievable log
entry. The goal is to preserve the *useful residue* of a conversation — what was
decided, why, and what was rejected — not to archive a transcript. Months from
now, someone asking "why did we build it this way?" should get an answer from
this entry in a few sentences.

## Storage layout

All entries live under a repo-relative `discussions/` directory:

```
discussions/
├── INDEX.md                      # one line per entry; maintained by THIS skill
├── topics.md                     # controlled topic vocabulary (canonical tags)
├── QUESTIONS.md                  # open questions registry
└── log/
    └── YYYY-MM-DD-short-slug.md  # one file per discussion
```

If `discussions/` does not exist yet, create it along with `discussions/log/`,
an empty `INDEX.md`, an empty QUESTIONS.md, and a starter `topics.md`. Never invent a second log
location — if the user's repo already has `discussions/`, use it.

## Entry file format

ALWAYS write each entry with this exact structure:

```markdown
---
date: YYYY-MM-DD
title: Short human-readable title (≤ 8 words)
areas: [order-process]            # feature slices — WHAT part of the product (from topics.md)
topics: [price-calculation, tax]  # cross-cutting concerns — HOW (from topics.md)
stories: [PROJ-1234]              # related tickets / user stories, or []
status: current                   # current | superseded
supersedes:                       # slug of an entry this replaces, or blank
superseded_by:                    # filled in on the OLD entry when replaced
---

## Summary
2–4 sentences. What was discussed and the bottom line.

## Decisions / outcomes
- The concrete things the team agreed to do.

## Why
The rationale — the constraints, tradeoffs, and reasoning that led here. This is
the highest-value section; people come back for the "why", not the "what".

## Alternatives considered
- Option X — rejected because …
(Omit this section only if no alternatives were genuinely discussed.)

## Open questions / follow-ups
- Anything left unresolved, or "None".
```

Keep the whole body tight — aim for under ~40 lines. If the source material is
long, compress harder; do not transcribe.

## Workflow

1. **Get the source.** The user provides a summary (often AI-generated from a
   Slack huddle) or pastes raw discussion. If they paste raw conversation,
   distill it yourself — extract decisions and rationale, drop the chatter.

1b. **Decide: one entry or many?** Skim the source for distinct decision threads.
    Split into one file per thread when two or more threads are *independently
    queryable*: they have different areas, different stories, and outcomes that
    could be reversed without affecting each other. Stay in one file when the
    topics are causally linked — one decision constrained or led to another.
    When splitting: process each thread through the full workflow (steps 2–9)
    independently, and cross-link related entries by noting the companion slugs
    in each entry's Open questions / follow-ups section (e.g. "See also: 2026-06-24-foo").
    Report back how many files you created and why you split (or didn't).

2. **Determine the date.** Default to today. Use an explicit date only if the
   user states when the discussion happened (e.g. "from yesterday's huddle").

3. **Distill into the entry format above.** Be ruthless about the Summary and
   Why sections. If a "decision" is actually just a topic that was discussed
   without resolution, record it under Open questions, not Decisions — don't
   manufacture certainty the discussion didn't have.

4. **Tag on two facets — areas and topics — from the controlled vocabulary.**
   Read `discussions/topics.md` first; it has two sections:
   - **Areas** = feature slices / product domains: WHAT part of the product the
     discussion is about (`order-process`, `international-shipping`,
     `price-calculator`). Most "why did we build it this way" questions are
     anchored on a feature slice, so this is the primary retrieval key.
   - **Topics** = cross-cutting technical concerns: HOW (`auth`, `postgres`,
     `performance`, `security`).
   A single discussion usually has one or two areas and one or more topics — e.g.
   international shipping pricing might be `areas: [international-shipping,
   price-calculator]`, `topics: [tax, price-calculation]`. A purely technical
   decision (a database choice, say) may have no area at all — that's fine, leave
   `areas: []`.
   Reuse existing entries wherever they fit. Keep area names coarse and stable —
   align them to your epics or bounded contexts, not one-off feature names, so
   they don't proliferate (a discussion about rounding inside the price
   calculator is the `price-calculator` area, not a new `price-rounding` area).
   Only introduce a new area or topic when nothing existing covers it; when you
   do, append it to the right section of `topics.md` and tell the user.
   Uncontrolled tags silently fragment the log (`auth` vs `authentication` vs
   `login`) until search misses things that are right there.

5. **Extract related stories/tickets.** Pull any ticket IDs or user-story
   references mentioned. If none, use `[]`.

6. **Check for supersession.** Scan `INDEX.md` for prior entries on the same
   topics or stories. If this discussion *reverses or replaces* an earlier
   decision (not merely revisits the area), set `supersedes:` to the old slug,
   and edit the old entry's frontmatter: `status: superseded` and
   `superseded_by:` this new slug. When unsure whether it's a reversal or just a
   related follow-up, do NOT auto-supersede — flag it to the user and ask.

7. **Write the file** as `discussions/log/YYYY-MM-DD-short-slug.md`. Make the
   slug short, lowercase, hyphenated, and recognizable (`oauth-token-refresh`,
   not `discussion-about-the-auth-stuff`). If a file with that name exists,
   append a short disambiguating suffix rather than overwriting.

7b. **Register open questions.** For each item in the "Open questions / follow-ups"
    section that is a genuine unresolved question (not "None"):
    - Read `discussions/QUESTIONS.md` to find the highest existing Q-ID and
      increment it. If QUESTIONS.md doesn't exist, create it with a `# Questions`
      heading and start at Q-001.
    - Prefix the item in the discussion entry with its ID: `- Q-001: How should we…`
    - Append a new entry to QUESTIONS.md:
      ```
      ## Q-001 — <question text>
      - **Status:** open
      - **Areas:** [<same areas as this discussion>]
      - **Asked:** YYYY-MM-DD | [<slug>](log/<slug>.md)
      - **Resolution:** —
      ```
    Include the Q-IDs assigned in the report-back (step 9).

7c. **Resolve any open questions this discussion answers.** If QUESTIONS.md exists
    and has open entries:
    - Filter candidates by matching area/topic overlap with this discussion, or
      by recognizing question text that the source material explicitly addresses.
    - Present the shortlist to the user: "This discussion may answer these open
      questions — which (if any) are now resolved?" Do not auto-close without
      confirmation.
    - For each confirmed resolution:
      - In QUESTIONS.md, change `**Status:** open` → `**Status:** resolved` and
        fill in `**Resolution:** <one-sentence answer> | [<new-slug>](log/<new-slug>.md)`
      - Note the closure in the report-back (step 9): "Closed: Q-002, Q-005."
    - If no candidates match, skip this step silently.

8. **Update `INDEX.md`.** Append one line so the read skill can shortlist without
   opening files. Format:
   ```
   - YYYY-MM-DD | slug | title | areas: order-process | topics: tax, price-calculation | stories: PROJ-1234 | status
   ```

9. **Report back for a human sanity check.** Show the user: the title, the
   assigned topics (flagging any new tag you created), the linked stories, and
   any supersession you applied. This is the approval moment — you distilled and
   tagged on their behalf, so let them correct it before it ossifies.

## Examples

**Example 1 — straightforward capture**
Input: an AI summary of a huddle deciding to use Postgres row-level security for
tenant isolation instead of separate schemas.
Output: `discussions/log/2026-06-23-rls-tenant-isolation.md` with `areas: []`,
`topics: [multi-tenancy, postgres, security]`, a Summary, a Decision (use RLS), a
Why (operational simplicity, single migration path), and Alternatives
(schema-per-tenant — rejected for migration overhead). One line appended to INDEX.

**Example 2 — a reversal**
Input: "We changed our minds — we're dropping RLS and going schema-per-tenant
after the perf testing."
Action: write the new entry with `supersedes: 2026-06-23-rls-tenant-isolation`,
flip the old entry to `status: superseded` / `superseded_by:` the new slug, and
tell the user both files were touched.

**Example 3 — discussion without a decision**
Input: a long thread weighing GraphQL caching options with no conclusion.
Output: an entry whose Decisions section says "No decision — see Open questions",
with the contenders captured under Open questions / follow-ups so the next
discussion has the context.

**Example 4 — long meandering discussion, two independent threads**
Input: a 30-message thread that covers (a) switching the order PDF renderer and
(b) a separate decision to add buyer price-suggestion to the cart. These share no
causal link and would be searched independently.
Output: two files — `discussions/log/2026-06-24-order-pdf-renderer.md`
(areas: [order-process], topics: [pdf, rendering]) and
`discussions/log/2026-06-24-buyer-price-suggestion.md`
(areas: [cart, price-calculator], topics: [price-negotiation]). Each gets its own
INDEX.md line. Report back: "Split into 2 entries — the PDF renderer decision and
the cart price-suggestion decision are unrelated and would be retrieved separately."
