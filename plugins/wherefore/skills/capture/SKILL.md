---
name: capture
description: >
  Capture a technical discussion or meeting summary into the team's wherefore log. Use
  this whenever the user wants to log, record, save, or archive the outcome of a
  discussion, Slack huddle, design conversation, standup, or meeting -- including
  when they paste a raw or AI-generated summary and say things like "log this",
  "add this to the discussion log", "record this discussion", "save this for
  later", or invoke "/wherefore:capture". Trigger even if the user only pastes a chunk
  of conversation and asks to capture the important parts; this skill distills it
  rather than storing it verbatim.
---

# Wherefore -- Capture

Turn a raw or AI-generated discussion summary into one compact, retrievable wherefore
entry. The goal is to preserve the *useful residue* of a conversation (what was
decided, why, and what was rejected), not to archive a transcript. Months from
now, someone asking "why did we build it this way?" should get an answer from
this entry in a few sentences.

## Storage layout

All entries live under a repo-relative `wherefore/` directory:

```
wherefore/
├── INDEX.md                      # one line per entry; maintained by THIS skill
├── QUESTIONS.md                  # one-line-per-question index
├── topics.md                     # controlled topic vocabulary (canonical tags)
├── questions/
│   └── Q-NNN.md                  # one file per question
└── log/
    └── YYYY-MM-DD-short-slug.md  # one file per discussion
```

If `wherefore/` does not exist yet, create it along with `wherefore/log/`,
`wherefore/questions/`, an empty `QUESTIONS.md`, a starter `topics.md`, and an
`INDEX.md`. Write this one-line header at the very top of the new `INDEX.md`:
```
# Wherefore: decision history for this repo
```
Never invent a second wherefore location -- if the user's repo already has `wherefore/`, use it.

## Entry file format

ALWAYS write each entry with this exact structure:

```markdown
---
date: YYYY-MM-DD
title: "Short human-readable title (<= 8 words)"  # ALWAYS quote titles
areas: [order-process]            # feature slices (WHAT part of the product; from topics.md)
topics: [price-calculation, tax]  # cross-cutting concerns (HOW; from topics.md)
stories: [PROJ-1234]              # related tickets / user stories, or []
status: active                    # active | superseded | obsolete  (absence or "current" = active)
supersedes:                       # slug of the entry this replaces, or blank
superseded_by:                    # slug of replacement; filled in when this is superseded
superseded_date:                  # date superseded (YYYY-MM-DD), or blank
---

## Summary
2-4 sentences. What was discussed and the bottom line.

## Decisions / outcomes
- The concrete things the team agreed to do.

## Why
The rationale -- the constraints, tradeoffs, and reasoning that led here. This is
the highest-value section; people come back for the "why", not the "what".

## Alternatives considered
- Option X, rejected because ...
(Omit this section only if no alternatives were genuinely discussed.)

## Open questions / follow-ups
- Anything left unresolved, or "None".
```

Keep the whole body tight. Aim for under ~40 lines. If the source material is
long, compress harder; do not transcribe.

## Workflow

1. **Get the source.** The user provides a summary (often AI-generated from a
   Slack huddle) or pastes raw discussion. If they paste raw conversation,
   distill it yourself -- extract decisions and rationale, drop the chatter.

1b. **Decide: one entry or many?** Skim the source for distinct decision threads.
    Split into one file per thread when two or more threads are *independently
    queryable*: they have different areas, different stories, and outcomes that
    could be reversed without affecting each other. Stay in one file when the
    topics are causally linked (one decision constrained or led to another).
    When splitting: process each thread through the full workflow (steps 2-9)
    independently, and cross-link related entries by noting the companion slugs
    in each entry's Open questions / follow-ups section (e.g. "See also: 2026-06-24-foo").
    Report back how many files you created and why you split (or didn't).

2. **Determine the date.** Default to today. Use an explicit date only if the
   user states when the discussion happened (e.g. "from yesterday's huddle").

3. **Distill into the entry format above.** Be ruthless about the Summary and
   Why sections. If a "decision" is actually just a topic that was discussed
   without resolution, record it under Open questions, not Decisions -- don't
   manufacture certainty the discussion didn't have.

4. **Tag on two facets -- areas and topics -- from the controlled vocabulary.**
   Read `wherefore/topics.md` first; it has two sections:
   - **Areas** = feature slices / product domains: WHAT part of the product the
     discussion is about (`order-process`, `international-shipping`,
     `price-calculator`). Most "why did we build it this way" questions are
     anchored on a feature slice, so this is the primary retrieval key.
   - **Topics** = cross-cutting technical concerns: HOW (`auth`, `postgres`,
     `performance`, `security`).
   A single discussion usually has one or two areas and one or more topics. For
   example, international shipping pricing might be `areas: [international-shipping,
   price-calculator]`, `topics: [tax, price-calculation]`. A purely technical
   decision (a database choice, say) may have no area at all -- that's fine, leave
   `areas: []`.
   Reuse existing entries wherever they fit. Keep area names coarse and stable --
   align them to your epics or bounded contexts, not one-off feature names, so
   they don't proliferate (a discussion about rounding inside the price calculator
   is the `price-calculator` area, not a new `price-rounding` area).
   Only introduce a new area or topic when nothing existing covers it; when you
   do, append it to the right section of `topics.md` and tell the user.
   Uncontrolled tags silently fragment the log (`auth` vs `authentication` vs
   `login`) until search misses things that are right there.

5. **Extract related stories/tickets.** Pull any ticket IDs or user-story
   references mentioned. If none, use `[]`.

6. **Check for supersession.** Before writing the new file, scan `wherefore/INDEX.md`
   for active entries (status `active`, `current`, or absent) that share an area
   or topic tag with this discussion. If any look like they could be reversed or
   replaced by the new decision, surface them as candidates and ask the user
   before doing anything. Never supersede silently. Auto-detection is
   best-effort and will miss reversals; the status field is the safety net, not
   the detection. For explicitly marking an existing entry superseded or obsolete
   without capturing a new discussion, use the `supersede` skill.

   **On confirmation that the new discussion replaces an old entry:**
   - Write the new entry with `supersedes: <old-slug>` in its frontmatter.
   - Edit the old entry's frontmatter: `status: superseded`,
     `superseded_by: <new-slug>`, `superseded_date: YYYY-MM-DD`.
   - Add a one-line banner as the first body line of the old entry (after the
     closing `---` of the frontmatter, before `## Summary`):
     ```
     SUPERSEDED YYYY-MM-DD -> see <new-slug>. Kept for history, not current.
     ```
   - Update the old entry's INDEX line: change its status column to
     `superseded -> <new-slug>`.
   - The new entry's INDEX line (written in step 8) uses `active` as its status.

7. **Write the file** as `wherefore/log/YYYY-MM-DD-short-slug.md`. Make the slug
   short, lowercase, hyphenated, and recognizable (`oauth-token-refresh`, not
   `discussion-about-the-auth-stuff`). If a file with that name exists, append
   a short disambiguating suffix rather than overwriting.

7b. **Register open questions.** For each genuine unresolved question in the
    "Open questions / follow-ups" section:
    - Determine the next Q-ID by reading `wherefore/QUESTIONS.md` (find the highest
      existing Q-NNN and increment). If `wherefore/QUESTIONS.md` doesn't exist yet,
      start at Q-001 and create the file with a `# Questions` heading.
    - Prefix the item in the wherefore entry with the ID: `- Q-001: How should we...`
    - Create `wherefore/questions/Q-NNN.md` with this exact frontmatter (leave
      `resolution` and `resolution_slug` blank):
      ```
      ---
      id: Q-001
      question: How should we handle tax for EU buyers?
      status: open
      areas: [international-shipping, price-calculator]
      asked_date: YYYY-MM-DD
      asked_slug: 2026-06-23-rls-tenant-isolation
      resolution:
      resolution_slug:
      ---
      ```
    - Append one line to `wherefore/QUESTIONS.md`:
      ```
      - Q-001 | open | YYYY-MM-DD | asked_slug | question text | areas: area1, area2
      ```
    Include the Q-IDs assigned in the report-back (step 9).

7c. **Resolve any open questions this discussion answers.** If
    `wherefore/questions/` exists and contains files with `status: open`:
    - Filter candidates whose areas overlap with the current discussion's
      areas/topics, or whose question text the source material explicitly addresses.
    - Present the shortlist to the user: "This discussion may answer these open
      questions -- which (if any) are now resolved?" Do not auto-close without
      confirmation.
    - For each confirmed resolution:
      - Edit the `Q-NNN.md` frontmatter: set `status: resolved`, fill in
        `resolution` (one-sentence answer), set `resolution_slug` to the new
        entry's slug.
      - Update the corresponding line in `wherefore/QUESTIONS.md`: change `open` to
        `resolved`.
      - Note the closure in the report-back (step 9): "Closed: Q-002, Q-005."
    - If no candidates match, skip silently.

8. **Update `wherefore/INDEX.md`.** Append one line so the `ask` skill can shortlist
   without opening files. The status column carries the entry's state (and for
   superseded entries, a forward pointer). Possible forms:
   ```
   - YYYY-MM-DD | slug | title | areas: order-process | topics: tax, price-calculation | stories: PROJ-1234 | active
   - YYYY-MM-DD | slug | title | areas: ...           | topics: ...                   | stories: ...        | superseded -> new-slug
   - YYYY-MM-DD | slug | title | areas: ...           | topics: ...                   | stories: ...        | obsolete
   ```
   Lines with no status column (entries written before this feature) are treated
   as active by the `ask` skill.

9. **Report back for a human sanity check.** Show the user: the title, the
   assigned topics (flagging any new tag you created), the linked stories, and
   any supersession you applied. This is the approval moment -- you distilled and
   tagged on their behalf, so let them correct it before it ossifies.

## Examples

**Example 1: straightforward capture**
Input: an AI summary of a huddle deciding to use Postgres row-level security for
tenant isolation instead of separate schemas.
Output: `wherefore/log/2026-06-23-rls-tenant-isolation.md` with `areas: []`,
`topics: [multi-tenancy, postgres, security]`, a Summary, a Decision (use RLS), a
Why (operational simplicity, single migration path), and Alternatives
(schema-per-tenant, rejected for migration overhead). One line appended to INDEX.

**Example 2: a reversal**
Input: "We changed our minds -- we're dropping RLS and going schema-per-tenant
after the perf testing."
Action: before writing, scan INDEX for active entries sharing the `multi-tenancy`
or `postgres` topics. Surface the RLS entry as a candidate and ask the user to
confirm the reversal. On confirmation: write the new entry with
`supersedes: 2026-06-23-rls-tenant-isolation`. Edit the old entry's frontmatter
(`status: superseded`, `superseded_by: <new-slug>`, `superseded_date: YYYY-MM-DD`)
and add the banner line at the top of its body. Update the old INDEX line to
`superseded -> <new-slug>`. Report all files touched.
To mark an existing entry superseded or obsolete without capturing a new
discussion, use the `supersede` skill.

**Example 3: discussion without a decision**
Input: a long thread weighing GraphQL caching options with no conclusion.
Output: an entry whose Decisions section says "No decision -- see Open questions",
with the contenders captured under Open questions / follow-ups. Each unresolved
question becomes an individual file in `wherefore/questions/` (e.g. `Q-001.md`) and a
one-line entry in `wherefore/QUESTIONS.md`, so the next discussion can close them out
explicitly.

**Example 4: long meandering discussion, two independent threads**
Input: a 30-message thread that covers (a) switching the order PDF renderer and
(b) a separate decision to add buyer price-suggestion to the cart. These share no
causal link and would be searched independently.
Output: two files -- `wherefore/log/2026-06-24-order-pdf-renderer.md`
(areas: [order-process], topics: [pdf, rendering]) and
`wherefore/log/2026-06-24-buyer-price-suggestion.md`
(areas: [cart, price-calculator], topics: [price-negotiation]). Each gets its own
INDEX.md line. Report back: "Split into 2 entries -- the PDF renderer decision and
the cart price-suggestion decision are unrelated and would be retrieved separately."
