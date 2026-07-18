---
name: ask
description: >
  Answer questions about past technical discussions, user stories, and why
  things were implemented a certain way by searching the team's wherefore log. Use this
  whenever the user asks why a feature was built the way it was, what was decided
  about a particular user story, topic, or component, or wants to recall an
  earlier conversation -- e.g. "why did we...", "what did we decide about...",
  "is there anything in the log about...", "how were we planning to implement...".
  Trigger even when the user doesn't name the wherefore
  explicitly but is clearly asking about a prior decision or its rationale. If
  nothing relevant is found, say so plainly rather than guessing.
---

# Wherefore: ask

Answer a question by finding the relevant past discussions and summarizing what
they actually say. The cardinal rule: **ground every answer in entries that
exist.** If the wherefore has nothing on the topic, say so: a confident answer
assembled from nothing is worse than "I didn't find anything about that."

No em dashes. Periods, commas, colons, semicolons, or parentheses instead. Firm project rule.

Never delete anything under a `wherefore/` data dir. Retire, do not delete.

## Storage layout

The wherefore lives under a repo-relative `wherefore/` directory:

```
wherefore/
├── topics.md                     # controlled topic vocabulary
├── questions/
│   └── Q-NNN-short-slug.md       # one file per question (ID prefix + scannable slug)
└── log/
    └── YYYY-MM-DD-short-slug.md  # one file per discussion
```

The frontmatter of the entry and question files
is the single source of truth; you derive what you need at read time. If
`wherefore/` or `wherefore/log/` does not exist, or `log/` holds no `*.md`
entries, tell the user the wherefore is empty or not set up yet; do not
fabricate an answer.

## Workflow

1. **Parse the question onto the right facet.** Decide whether it's about a
   feature slice (an **area**: "the price calculator", "international shipping",
   "the order process") or a cross-cutting concern (a **topic**: auth, postgres,
   performance), or both. Most "why did we build X this way" questions name a
   feature, so map those onto `areas` first. Also pull any ticket/story IDs and
   key nouns. Glance at `topics.md` (which lists both Areas and Topics) to map
   the user's wording onto the canonical tags: they may say "checkout" when the
   area is `order-process`, or "login" when the topic is `auth`.

2. **Shortlist from entry frontmatter.** Read only the leading frontmatter block
   of every log entry in one cheap pass, then pick the files worth opening. Do not
   open every entry file. One command that dumps just the frontmatter (each block
   is ~10 lines, far cheaper than the full bodies):
   ```bash
   for f in wherefore/log/*.md; do
     awk -v F="$f" 'BEGIN{print "=== " F " ==="}
       /^---[[:space:]]*$/ { n++; if (n==2) exit; next }
       n==1 { print }' "$f"
   done
   ```
   From that dump, select entries whose `areas`, `topics`, `stories`, or `title`
   plausibly match (typically 1-5). The dump also carries each entry's `status`
   and `superseded_by`, so you can filter and follow supersession chains without a
   second pass.
   - Prefer entries whose `status` is `active`, `current`, or absent (all treated
     as active). Include `superseded` entries only when no active entry covers the
     topic, so you can follow the chain to the current answer. Exclude `obsolete`
     entries entirely unless the user explicitly asks about historical decisions.
   - If the frontmatter fields look too sparse to shortlist on (older entries with
     thin tags), widen the same dump to grep the bodies for your key nouns.

3. **Read the shortlisted entries** and pull the parts that answer the question,
   especially the Summary, Why, and Decisions sections.

4. **Filter to active; follow chains.** Answer only from active entries by
   default. If the best match is `superseded`, follow its `superseded_by` slug to
   the replacement file (`wherefore/log/<slug>.md`); if that entry is also
   superseded, follow again; repeat until you reach an active entry (follow the
   full chain, not just one hop). The stage-two frontmatter dump already lists
   every entry's `superseded_by`, so the chain is resolvable without extra reads.
   Lead with the current decision, then add one line of history: "Earlier
   (YYYY-MM-DD) the team had decided X; that was superseded." Exclude `obsolete`
   entries entirely unless the user explicitly asks what the team used to do. If a
   chain ends in `obsolete` with no active replacement, respond: "The earlier
   decision on this topic was marked obsolete on YYYY-MM-DD and there is no current
   entry; the wherefore has no current answer for this topic."

5. **Synthesize a focused answer.** Lead with the direct answer to what they
   asked, then the rationale. Cite each entry you drew from by date + title (and
   filename), so the user can open the source:
   > Per *RLS for tenant isolation* (2026-06-23, `wherefore/log/2026-06-23-rls-tenant-isolation.md`): ...
   When two entries touch the same area, reconcile them in chronological order
   rather than presenting them as separate disconnected facts.

6. **Be honest about gaps.** If you find nothing relevant, say so directly:
   "I didn't find anything in the wherefore about <topic>." When close-but-not-exact
   entries exist, offer them: "Nothing on X specifically, but there's a 2026-05
   discussion on the related Y. Want that?" Never pad a thin result with
   plausible-sounding detail the entries don't contain.

7. **Surface open questions.** After your answer, read the frontmatter of the
   question files the same cheap way and filter for `status: open` whose `areas`
   overlap the areas of the entries you surfaced:
   ```bash
   for f in wherefore/questions/Q-*.md; do
     awk -v F="$f" 'BEGIN{print "=== " F " ==="}
       /^---[[:space:]]*$/ { n++; if (n==2) exit; next }
       n==1 { print }' "$f"
   done
   ```
   The frontmatter (`id`, `question`, `status`, `areas`, `asked_date`) has enough
   to populate this section without reading the bodies. If any match, append a
   brief section:
   ```
   ---
   **Still open in this area:** Q-001 (asked 2026-06-23, international-shipping):
   How should we handle tax for EU buyers?
   ```
   Only show open questions; skip resolved ones unless the user explicitly asks
   (e.g. "what was Q-007?" or "show resolved questions too"). If no open questions
   match, omit the section entirely; do not add noise.
   When you dump the question frontmatter, also dump `wherefore/plan/P-*.md` frontmatter
   and cross-check `answers`: if a plan item carries `answers: <this Q-NNN>`, the question
   is being actively investigated (a spike), not sitting untouched. Note it inline, e.g.
   "Q-007 (P-012 is investigating this, status doing)". That is exactly when the user needs
   to know work is already underway. Read-only; `ask` still writes nothing.

8. **Offer to link a blocking question to a plan item.** When a question surfaced
   above (or one the user just raised) blocks work in flight, offer to attach it as a
   `question_ref` on the relevant plan item. The link is one-way, from the plan item
   to the question. Making the attachment is a `plan` operation (its advance intent);
   `ask` only offers it and does not write `plan/` itself. Optionally, when the user
   is clearly asking about in-flight work, surface matching plan items alongside the
   open questions, still read-only, by dumping `wherefore/plan/P-*.md` frontmatter the
   same cheap way and filtering on `area` and status.

   Plan fields `ask` relies on: `status` (to tell in-flight from untouched), `question_ref`
   (blocked is derived from it and never stored), and `answers` (the opposite direction, a
   spike investigating the question). `ask` never writes plan files, so it needs none of the
   plan key order or quoting rules.

## Answering style

- Match the depth of the question. "What did we decide about X?" wants the
  decision and one line of why. "Why did we implement X this way?" wants the
  rationale and the alternatives that were rejected.
- Distinguish a *decision* from an *open question*. If the only matching entry
  recorded an unresolved debate, say it was discussed but not settled, and
  summarize the contenders; don't present a non-decision as a decision.
- Keep citations to source entries; the value is letting the user trace the
  answer back to the conversation it came from.

## Examples

**Example 1: rationale lookup (feature slice / area)**
Q: "Why does the price calculator round the way it does?"
Action: map to the `price-calculator` area, dump entry frontmatter, shortlist on
that area, open the matching entry, answer with the decision and the reasoning,
cite by date and filename. (A concern-axis question, "why row-level security
over separate schemas?", works the same way but shortlists on the
`postgres`/`security` topics instead.)

**Example 2: story lookup**
Q: "What was the plan for PROJ-1240?"
Action: grep the entry frontmatter for `PROJ-1240`, summarize the matching entries
in date order, note any follow-ups still open.

**Example 3: a reversed decision**
Q: "How are we isolating tenants?"
Action: the RLS entry's frontmatter shows `status: superseded`, `superseded_by:
2026-07-01-schema-per-tenant`. Open the replacement and lead with that answer.
Then add one line of history: "Earlier (2026-06-23) the team had chosen RLS; that
was superseded after perf testing showed cross-tenant query overhead." Do not lead
with the superseded entry.

**Example 4: nothing found**
Q: "What did we decide about the mobile offline-sync strategy?"
Action: no matching entries. Respond: "I didn't find anything in the wherefore about
mobile offline sync." Optionally name the nearest topics that do exist.
