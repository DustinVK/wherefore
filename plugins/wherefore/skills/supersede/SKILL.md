---
name: supersede
description: >
  Mark a past decision in the wherefore log as superseded or obsolete. Use whenever the
  user explicitly wants to retire an existing entry without capturing a new
  discussion -- e.g. "mark 2026-01-15-graphql-caching obsolete", "supersede the
  RLS entry with the schema-per-tenant one", "we dropped GraphQL, mark that
  decision dead". Does NOT capture a new discussion; that belongs to the
  capture skill.
---

# Wherefore: supersede

Retire an existing wherefore entry by marking it `superseded` (with a pointer to its
replacement) or `obsolete` (context gone, no replacement). Updates the entry
file and adds a visible banner, so neither the `ask` skill nor a human skimming
raw files is left guessing. The entry's frontmatter is the single source of
truth.

This skill is the only writer of decision status. Plan items have their own status
machine (`todo`/`doing`/`done`/`dropped`) that never touches a decision's status; if
work in the `slate` skill needs to retire or replace a decision, it routes here, not
through `slate`.

No em dashes. Periods, commas, colons, semicolons, or parentheses instead. Firm project rule.

Never delete anything under a `wherefore/` data dir. Retire, do not delete.

## Workflow

1. **Find the target entry.** Locate `wherefore/log/<slug>.md` directly. If you only
   have a date or partial name, dump the entry frontmatter to find the slug:
   ```bash
   for f in wherefore/log/*.md; do
     awk -v F="$f" 'BEGIN{print "=== " F " ==="}
       /^---[[:space:]]*$/ { n++; if (n==2) exit; next }
       n==1 { print }' "$f"
   done
   ```
   If not found, say so clearly. If already `superseded` or `obsolete`, show the
   current state and ask the user before overwriting; don't silently re-supersede.

2. **Determine the operation.**
   - *Superseded by*: the user names a replacement slug (an existing entry) or
     a replacement description (a discussion not yet logged). If the replacement
     isn't logged yet, note it and proceed; the link will be a placeholder.
   - *Obsolete*: no replacement. The decision was abandoned or its context no
     longer exists.

3. **Edit the target entry's frontmatter:**

   Superseded:
   ```yaml
   status: superseded
   superseded_by: <new-slug>
   superseded_date: YYYY-MM-DD
   ```

   Obsolete:
   ```yaml
   status: obsolete
   superseded_date: YYYY-MM-DD
   ```

4. **Add a one-line banner** as the first body line of the target entry, after
   the closing `---` of the frontmatter, before `## Summary`. No emoji.

   Superseded:
   ```
   SUPERSEDED YYYY-MM-DD -> see <new-slug>. Kept for history, not current.
   ```

   Obsolete:
   ```
   OBSOLETE YYYY-MM-DD. Kept for history, not current.
   ```

5. **Update the replacement entry (if applicable).** If a replacement entry
   exists and doesn't already have `supersedes: <old-slug>` in its frontmatter,
   add it. Skip this step if the replacement isn't logged yet.

6. **Report back.** List every file touched. If the replacement entry isn't
   logged yet, say so and suggest running the `capture` skill to log it.
   Then flag plan items pointing at the retired decision: dump `wherefore/plan/P-*.md`
   frontmatter and find any item whose `decision_ref` includes the slug you just
   superseded or marked obsolete, and tell the user which ones. Do not mutate them: the
   ref is still accurate history, and the chain is followable through `superseded_by`.
   This reads `decision_ref` only and writes nothing to `plan/`, so it does not compromise
   this skill's standing as the sole writer of decision status.

## Examples

**Example 1: supersede with a named replacement**
User: "Supersede the RLS tenant isolation entry. It was replaced by the
schema-per-tenant decision we logged last week."
Action: locate `wherefore/log/2026-06-23-rls-tenant-isolation.md`. Edit its
frontmatter (`status: superseded`, `superseded_by: 2026-07-01-schema-per-tenant`,
`superseded_date: 2026-07-01`), add the banner. Add `supersedes:
2026-06-23-rls-tenant-isolation` to the replacement entry's frontmatter if
missing. Report all files touched.

**Example 2: supersede where the replacement is not yet logged**
User: "Mark 2026-03-10-graphql-caching superseded. We decided on REST caching
headers but haven't logged that discussion yet."
Action: edit the entry as above but use a descriptive placeholder for
`superseded_by` (e.g. `rest-caching-headers-tbd`). Note in the report-back:
"The replacement discussion hasn't been logged yet; run the capture skill to
log it, then update the superseded_by field to the real slug."

**Example 3: mark obsolete**
User: "Mark 2026-01-15-graphql-caching obsolete. We dropped GraphQL entirely."
Action: edit the entry (`status: obsolete`, `superseded_date: YYYY-MM-DD`), add
the obsolete banner. No `superseded_by` field. Report what was changed.
