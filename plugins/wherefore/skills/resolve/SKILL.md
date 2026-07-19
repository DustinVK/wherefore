---
name: resolve
description: >
   Mark an open question in the team's wherefore log as resolved. Use whenever the user
   wants to close out an open question, e.g. "mark Q-042 resolved", "we figured
   out Q-007", "close Q-015", "we have an answer for Q-003". Works both when
   resolution comes from a new wherefore entry and
   when it's a standalone answer with no new entry.
---

# Wherefore: resolve

Close out an open question by updating its individual file in
`wherefore/questions/`, recording what was decided, why, and which discussion (if
any) contains the full context. The file's frontmatter is the single source of
truth.

No em dashes. Periods, commas, colons, semicolons, or parentheses instead. Firm project rule.

Never delete anything under a `wherefore/` data dir. Retire, do not delete.

## Frontmatter safety

When you fill `resolution`, emit it as a double-quoted, single-line string, escaping
embedded `"` as `\"` and `\` as `\\`. An unquoted value containing `: ` (colon-space)
or a leading `-`, `#`, `[`, `{`, or `"` makes YAML misparse and crashes the dashboard
viewer. If the answer will not fit on one line, keep `resolution` to a one-line
summary and move detail into a `## Resolution` body section. `status` and
`resolution_slug` need no quotes.

## Workflow

1. **Find the question.** Files are named `Q-NNN-short-slug.md` (ID prefix plus a
   scannable slug), so glob by the ID rather than assuming the exact name:
   `ls wherefore/questions/Q-042-*.md wherefore/questions/Q-042.md 2>/dev/null`
   (the second path catches any legacy file still named `Q-NNN.md`). Expect exactly
   one match; open it. If nothing matches, say so clearly. To list what is open,
   dump the question frontmatter and filter `status: open`:
   ```bash
   for f in wherefore/questions/Q-*.md; do
     awk -v F="$f" 'BEGIN{print "=== " F " ==="}
       /^---[[:space:]]*$/ { n++; if (n==2) exit; next }
       n==1 { print }' "$f"
   done
   ```
   Confirm the target's current `status`. If `status: resolved`, tell the user and
   show the existing resolution; don't overwrite it.

2. **Get the resolution.** Ask the user (or extract from context if they already
   provided it):
   - **Answer:** what was decided, in one sentence.
   - **Why:** the rationale or constraint that drove it, in one or two sentences. This
     is the part that matters months later; don't skip it.
   - **Source discussion (optional):** a discussion slug if the answer came out of
     a logged discussion. The user can name it, or you can check whether they just
     ran the `capture` skill and a fresh entry exists. If no wherefore entry captures
     it, the resolution is standalone.

3. **Update the question file** (`wherefore/questions/Q-NNN-short-slug.md`). Edit the frontmatter in place:
   - Set `status: resolved`
   - Fill in `resolution` with a one-sentence answer (and the why, if concise
     enough to fit; otherwise put it in a `## Resolution` body section below the
     frontmatter). Quote it per Frontmatter safety.
   - Set `resolution_slug` to the source discussion slug, or leave blank if
     standalone

4. **Update the source wherefore entry (if applicable).** If the resolution came from
   a specific wherefore entry, open `wherefore/log/<slug>.md` and add a note in its
   "Open questions / follow-ups" section next to the relevant item:
   `- Q-042: <question text> (resolved, see wherefore/questions/Q-042-<slug>.md)`

5. **Report back.** Show:
   - The question text and its ID
   - The answer recorded
   - Which files were touched
   - Whether any related questions still `open` share the same areas (dump the
     question frontmatter to check), as a nudge; don't resolve them automatically
   - Plan items this resolution touches. Dump `wherefore/plan/P-*.md` frontmatter
     (`resolve` reads only `question_ref`, `answers`, and `status` and writes nothing to
     `plan/`). Skip any item whose `status` is `dropped`; a dropped item is not waiting on
     anything. Then:
     - Unblocked: items whose `question_ref` is the ID you just resolved just became
       unblocked. Tell the user; do not change their status. The item stays where it is
       until someone advances it through the `slate` skill.
     - Answered: items whose `answers` is that ID just accomplished their purpose (the
       spike that was investigating it). Report them and offer to advance them to `done`
       through the `slate` skill. Do not advance them silently, and do not advance them
       here yourself.
     - Break the loop: if the `slate` skill drove this resolve (its advance intent handed
       off here to close the question a finishing spike answered), suppress the offer to
       advance those items. `slate` is already advancing the item; offering to advance it
       back would loop. This mirrors how `slate` advance suppresses its capture offer when
       capture is the driver. Reading `plan/` here does not compromise `slate`'s sole
       ownership of it; nothing is written.

## Examples

**Example 1: resolution from a new discussion**
User: "Mark Q-001 resolved: we decided to use zero-rated VAT for EU digital goods.
We discussed it in the entry we just logged, 2026-07-01-eu-vat-strategy."
Action: find the file (`ls wherefore/questions/Q-001-*.md`) and edit it (status ->
resolved, resolution filled, resolution_slug set), update that wherefore entry to
note the question is resolved. Report both files touched.

**Example 2: standalone resolution**
User: "Close Q-007. We're not doing offline sync this quarter, pushed to Q3."
Action: edit the Q-007 file (`wherefore/questions/Q-007-*.md`) (status -> resolved,
resolution filled, resolution_slug left blank). No wherefore entry to update. Report
the file touched.

**Example 3: question not found**
User: "Resolve Q-099"
Action: no `wherefore/questions/Q-099-*.md` matches. Respond: "Q-099 wasn't found
in wherefore/questions/. Check the ID; I can list the open questions if that helps."

**Example 4: already resolved**
User: "Mark Q-002 resolved"
Action: open the Q-002 file (`wherefore/questions/Q-002-*.md`); status is already resolved. Show the
recorded resolution date and text and make no changes, e.g. "Q-002 was resolved on
2026-06-24: zero-rated VAT for EU digital goods. No changes made."