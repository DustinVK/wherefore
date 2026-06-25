---
name: resolve
description: >
  Mark an open question in the team's wherefore log as resolved. Use whenever the user
  wants to close out an open question -- e.g. "mark Q-042 resolved", "we figured
  out Q-007", "close Q-015", "we have an answer for Q-003", or invokes
  "/wherefore:resolve". Works both when resolution comes from a new wherefore entry and
  when it's a standalone answer with no new entry.
---

# Wherefore -- Resolve

Close out an open question by updating its individual file in
`wherefore/questions/` and its index line in `wherefore/QUESTIONS.md`, recording what was
decided, why, and which discussion (if any) contains the full context.

## Workflow

1. **Find the question.** Read `wherefore/QUESTIONS.md` (one-line-per-question index)
   and locate the entry by Q-ID. If the ID doesn't exist, say so clearly. Open
   `wherefore/questions/Q-NNN.md` to confirm its current `status`. If
   `status: resolved`, tell the user and show the existing resolution -- don't
   overwrite it.

2. **Get the resolution.** Ask the user (or extract from context if they already
   provided it):
   - **Answer:** what was decided -- one sentence.
   - **Why:** the rationale or constraint that drove it -- 1-2 sentences. This is
     the part that matters months later; don't skip it.
   - **Source discussion (optional):** a discussion slug if the answer came out of
     a logged discussion. The user can name it, or you can check whether they just
     ran the `capture` skill and a fresh entry exists. If no wherefore entry captures
     it, the resolution is standalone.

3. **Update `wherefore/questions/Q-NNN.md`.** Edit the frontmatter in place:
   - Set `status: resolved`
   - Fill in `resolution` with a one-sentence answer (and the why, if concise
     enough to fit; otherwise put it in a `## Resolution` body section below the
     frontmatter)
   - Set `resolution_slug` to the source discussion slug, or leave blank if
     standalone

4. **Update `wherefore/QUESTIONS.md`.** On the matching index line, change `open` to
   `resolved`. The line format is:
   ```
   - Q-001 | resolved | YYYY-MM-DD | asked_slug | question text | areas: area1, area2
   ```

5. **Update the source wherefore entry (if applicable).** If the resolution came from
   a specific wherefore entry, open `wherefore/log/<slug>.md` and add a note in its
   "Open questions / follow-ups" section next to the relevant item:
   `- Q-042: <question text> *(resolved -- see wherefore/questions/Q-042.md)*`

6. **Report back.** Show:
   - The question text and its ID
   - The answer recorded
   - Which files were touched
   - Whether any related questions in QUESTIONS.md share the same areas and are
     still open (a nudge -- don't resolve them automatically)

## Examples

**Example 1: resolution from a new discussion**
User: "Mark Q-001 resolved -- we decided to use zero-rated VAT for EU digital goods.
We discussed it in the entry we just logged, 2026-07-01-eu-vat-strategy."
Action: edit `wherefore/questions/Q-001.md` (status -> resolved, resolution filled,
resolution_slug set), update the Q-001 line in QUESTIONS.md to `resolved`, update
that wherefore entry to note the question is resolved. Report all files touched.

**Example 2: standalone resolution**
User: "Close Q-007 -- we're not doing offline sync this quarter, pushed to Q3."
Action: edit `wherefore/questions/Q-007.md` (status -> resolved, resolution filled,
resolution_slug left blank), update the Q-007 line in QUESTIONS.md to `resolved`.
No wherefore entry to update. Report both files touched.

**Example 3: question not found**
User: "Resolve Q-099"
Action: Q-099 doesn't appear in `wherefore/QUESTIONS.md`. Respond: "Q-099 wasn't
found in wherefore/QUESTIONS.md. Check the ID -- open questions are listed there."

**Example 4: already resolved**
User: "Mark Q-002 resolved"
Action: open `wherefore/questions/Q-002.md` -- status is already resolved. Respond:
"Q-002 is already resolved (2026-06-24): <existing answer>. No changes made."
