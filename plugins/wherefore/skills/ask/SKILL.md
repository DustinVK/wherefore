---
name: ask
description: >
  Answer questions about past technical discussions, user stories, and why
  things were implemented a certain way by searching the team's wherefore log. Use this
  whenever the user asks why a feature was built the way it was, what was decided
  about a particular user story, topic, or component, or wants to recall an
  earlier conversation -- e.g. "why did we...", "what did we decide about...",
  "is there anything in the log about...", "how were we planning to implement...",
  or invoke "/wherefore:ask". Trigger even when the user doesn't name the wherefore
  explicitly but is clearly asking about a prior decision or its rationale. If
  nothing relevant is found, say so plainly rather than guessing.
---

# Wherefore -- Ask

Answer a question by finding the relevant past discussions and summarizing what
they actually say. The cardinal rule: **ground every answer in entries that
exist.** If the wherefore has nothing on the topic, say so -- a confident answer
assembled from nothing is worse than "I didn't find anything about that."

## Storage layout

The wherefore lives under a repo-relative `wherefore/` directory:

```
wherefore/
├── INDEX.md                      # one line per entry -- read this FIRST
├── QUESTIONS.md                  # one-line-per-question index
├── topics.md                     # controlled topic vocabulary
├── questions/
│   └── Q-NNN.md                  # one file per question
└── log/
    └── YYYY-MM-DD-short-slug.md  # one file per discussion
```

If `wherefore/` or `INDEX.md` does not exist, tell the user the wherefore is empty or
not set up yet -- do not fabricate an answer.

## Workflow

1. **Parse the question onto the right facet.** Decide whether it's about a
   feature slice (an **area** -- "the price calculator", "international shipping",
   "the order process") or a cross-cutting concern (a **topic** -- auth, postgres,
   performance), or both. Most "why did we build X this way" questions name a
   feature, so map those onto `areas` first. Also pull any ticket/story IDs and
   key nouns. Glance at `topics.md` -- which lists both Areas and Topics -- to map
   the user's wording onto the canonical tags: they may say "checkout" when the
   area is `order-process`, or "login" when the topic is `auth`.

2. **Shortlist from `wherefore/INDEX.md` first.** Read `wherefore/INDEX.md` and select
   entries whose areas, topics, stories, or titles plausibly match. This keeps
   retrieval cheap -- do not open every entry file. Open only the shortlisted
   ones (typically 1-5).
   - Prefer entries whose status column is `active`, `current`, or absent (all
     treated as active). Entries marked `superseded` carry a forward pointer
     (`superseded -> slug`) -- include those only when no active entry covers the
     topic, so you can follow the chain to the current answer. Exclude `obsolete`
     entries entirely unless the user explicitly asks about historical decisions.
   - If `INDEX.md` is missing, looks stale, or the shortlist comes up empty but
     you suspect coverage, fall back to grepping the frontmatter across
     `wherefore/log/*.md` (search `areas:`, `topics:`, `stories:`, and titles).
     The index is an optimization; the entry files are the source of truth.

3. **Read the shortlisted entries** and pull the parts that answer the question,
   especially the Summary, Why, and Decisions sections.

4. **Filter to active; follow chains.** Answer only from active entries by
   default. If the best INDEX match is `superseded`, read its `superseded ->
   <slug>` forward pointer and open that entry; if that entry is also superseded,
   follow again -- repeat until you reach an active entry (follow the full chain,
   not just one hop). Lead with the current decision, then add one line of
   history: "Earlier (YYYY-MM-DD) the team had decided X; that was superseded."
   Exclude `obsolete` entries entirely unless the user explicitly asks what the
   team used to do. If a chain ends in `obsolete` with no active replacement,
   respond: "The earlier decision on this topic was marked obsolete on
   YYYY-MM-DD and there is no current entry -- the wherefore has no current answer for
   this topic."

5. **Synthesize a focused answer.** Lead with the direct answer to what they
   asked, then the rationale. Cite each entry you drew from by date + title (and
   filename), so the user can open the source:
   > Per *RLS for tenant isolation* (2026-06-23, `wherefore/log/2026-06-23-rls-tenant-isolation.md`): ...
   When two entries touch the same area, reconcile them in chronological order
   rather than presenting them as separate disconnected facts.

6. **Be honest about gaps.** If you find nothing relevant, say so directly:
   "I didn't find anything in the wherefore about <topic>." When close-but-not-exact
   entries exist, offer them: "Nothing on X specifically, but there's a 2026-05
   discussion on the related Y -- want that?" Never pad a thin result with
   plausible-sounding detail the entries don't contain.

7. **Surface open questions.** After your answer, read `wherefore/QUESTIONS.md`
   (the one-line index) and filter for lines with `open` status whose `areas:`
   field overlaps with the areas of the entries you surfaced. If any match, append
   a brief section:
   ```
   ---
   **Still open in this area:** Q-001 (asked 2026-06-23, international-shipping):
   How should we handle tax for EU buyers?
   ```
   The index line has enough information (Q-ID, status, date, question text, areas)
   to populate this section without opening individual `wherefore/questions/Q-NNN.md`
   files. Open a Q-NNN.md only if the user asks for details about a specific
   question. Only show open questions; skip resolved ones unless the user
   explicitly asks (e.g. "what was Q-007?" or "show resolved questions too"). If
   no open questions match, omit the section entirely -- do not add noise.

## Answering style

- Match the depth of the question. "What did we decide about X?" wants the
  decision and one line of why. "Why did we implement X this way?" wants the
  rationale and the alternatives that were rejected.
- Distinguish a *decision* from an *open question*. If the only matching entry
  recorded an unresolved debate, say it was discussed but not settled, and
  summarize the contenders -- don't present a non-decision as a decision.
- Keep citations to source entries; the value is letting the user trace the
  answer back to the conversation it came from.

## Examples

**Example 1: rationale lookup (feature slice / area)**
Q: "Why does the price calculator round the way it does?"
Action: map to the `price-calculator` area, shortlist INDEX on that area, open the
matching entry, answer with the decision and the reasoning, cite by date and
filename. (A concern-axis question -- "why row-level security over separate
schemas?" -- works the same way but shortlists on the `postgres`/`security`
topics instead.)

**Example 2: story lookup**
Q: "What was the plan for PROJ-1240?"
Action: grep INDEX/frontmatter for `PROJ-1240`, summarize the matching entries in
date order, note any follow-ups still open.

**Example 3: a reversed decision**
Q: "How are we isolating tenants?"
Action: INDEX shows the RLS entry as `superseded -> 2026-07-01-schema-per-tenant`.
Open the replacement and lead with that answer. Then add one line of history:
"Earlier (2026-06-23) the team had chosen RLS; that was superseded after perf
testing showed cross-tenant query overhead." Do not lead with the superseded entry.

**Example 4: nothing found**
Q: "What did we decide about the mobile offline-sync strategy?"
Action: no matching entries. Respond: "I didn't find anything in the wherefore about
mobile offline sync." Optionally name the nearest topics that do exist.
