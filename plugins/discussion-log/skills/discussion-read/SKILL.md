---
name: discussion-read
description: >
  Answer questions about past technical discussions, user stories, and why
  things were implemented a certain way by searching the team's discussion log.
  Use this whenever the user asks why a feature was built the way it was, what
  was decided about a particular user story, topic, or component, or wants to
  recall an earlier conversation — e.g. "why did we…", "what did we decide
  about…", "is there anything in the log about…", "how were we planning to
  implement…", or invoke "/discussion-read". Trigger even when the user doesn't
  name the log explicitly but is clearly asking about a prior decision or its
  rationale. If nothing relevant is found, say so plainly rather than guessing.
---

# Discussion Log — Read

Answer a question by finding the relevant past discussions and summarizing what
they actually say. The cardinal rule: **ground every answer in entries that
exist.** If the log has nothing on the topic, say so — a confident answer
assembled from nothing is worse than "I didn't find anything about that."

## Storage layout

The log lives in a repo-relative `discussions/` directory:

```
discussions/
├── INDEX.md                      # one line per entry — read this FIRST
├── topics.md                     # controlled topic vocabulary
└── YYYY-MM-DD-short-slug.md       # one file per discussion
```

If `discussions/` or `INDEX.md` does not exist, tell the user the log is empty or
not set up yet — do not fabricate an answer.

## Workflow

1. **Parse the question onto the right facet.** Decide whether it's about a
   feature slice (an **area** — "the price calculator", "international shipping",
   "the order process") or a cross-cutting concern (a **topic** — auth, postgres,
   performance), or both. Most "why did we build X this way" questions name a
   feature, so map those onto `areas` first. Also pull any ticket/story IDs and
   key nouns. Glance at `topics.md` — which lists both Areas and Topics — to map
   the user's wording onto the canonical tags: they may say "checkout" when the
   area is `order-process`, or "login" when the topic is `auth`.

2. **Shortlist from `INDEX.md` first.** Read `INDEX.md` and select entries whose
   areas, topics, stories, or titles plausibly match. This keeps retrieval cheap
   — do not open every entry file. Open only the shortlisted ones (typically
   1–5).
   - If `INDEX.md` is missing, looks stale, or the shortlist comes up empty but
     you suspect coverage, fall back to grepping the frontmatter across
     `discussions/*.md` (search `areas:`, `topics:`, `stories:`, and titles). The
     index is an optimization; the entry files are the source of truth.

3. **Read the shortlisted entries** and pull the parts that answer the question —
   especially the Summary, Why, and Decisions sections.

4. **Prefer current over superseded.** If a matching entry has
   `status: superseded`, follow its `superseded_by:` link and answer from the
   newer entry. Mention that the decision changed and when, so the user isn't
   acting on a reversed call.

5. **Synthesize a focused answer.** Lead with the direct answer to what they
   asked, then the rationale. Cite each entry you drew from by date + title (and
   filename), so the user can open the source:
   > Per *RLS for tenant isolation* (2026-06-23, `discussions/2026-06-23-rls-tenant-isolation.md`): …
   When two entries touch the same area, reconcile them in chronological order
   rather than presenting them as separate disconnected facts.

6. **Be honest about gaps.** If you find nothing relevant, say so directly:
   "I didn't find anything in the discussion log about <topic>." When close-but-
   not-exact entries exist, offer them: "Nothing on X specifically, but there's a
   2026-05 discussion on the related Y — want that?" Never pad a thin result with
   plausible-sounding detail the entries don't contain.

## Answering style

- Match the depth of the question. "What did we decide about X?" wants the
  decision and one line of why. "Why did we implement X this way?" wants the
  rationale and the alternatives that were rejected.
- Distinguish a *decision* from an *open question*. If the only matching entry
  recorded an unresolved debate, say it was discussed but not settled, and
  summarize the contenders — don't present a non-decision as a decision.
- Keep citations to source entries; the value is letting the user trace the
  answer back to the conversation it came from.

## Examples

**Example 1 — rationale lookup (feature slice / area)**
Q: "Why does the price calculator round the way it does?"
Action: map to the `price-calculator` area, shortlist INDEX on that area, open the
matching entry, answer with the decision and the reasoning, cite by date and
filename. (A concern-axis question — "why row-level security over separate
schemas?" — works the same way but shortlists on the `postgres`/`security`
topics instead.)

**Example 2 — story lookup**
Q: "What was the plan for PROJ-1240?"
Action: grep INDEX/frontmatter for `PROJ-1240`, summarize the matching entries in
date order, note any follow-ups still open.

**Example 3 — a reversed decision**
Q: "How are we isolating tenants?"
Action: the RLS entry is `superseded`; follow `superseded_by` to the schema-per-
tenant entry, answer with the current approach, and note the decision changed
after perf testing.

**Example 4 — nothing found**
Q: "What did we decide about the mobile offline-sync strategy?"
Action: no matching entries. Respond: "I didn't find anything in the discussion
log about mobile offline sync." Optionally name the nearest topics that do exist.
