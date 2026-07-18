---
name: capture
description: >
  Capture a technical discussion or meeting summary into the team's wherefore log.
  Use whenever the user wants to log, record, save, or archive the outcome of a
  discussion, Slack huddle, design conversation, standup, or meeting, including when
  they paste a raw or AI-generated summary and say things like "log this", "add this
  to the discussion log", "record this discussion", "save this for later", or invoke
  "/wherefore:capture". Trigger even if the user only pastes a chunk of conversation
  and asks to capture the important parts; this skill distills it rather than storing
  it verbatim.
---

# Wherefore: capture

Turn a raw or AI-generated discussion into one compact, retrievable wherefore entry.
Preserve the useful residue (what was decided, why, and what was rejected), not a
transcript. Months later, someone asking "why did we build it this way?" should get
the answer in a few sentences.

## Writing style

The record must read well as a raw markdown file, not just in the dashboard. Editors
and the GitHub blob view are where most people read it.

- No em dashes anywhere. Use periods, commas, colons, semicolons, or parentheses. Firm project rule.
- Decisions are verdict-led. Open each bullet with the ruling as a short standalone clause; put elaboration after it or in Why. Someone reading only the first clause of every bullet should still get the full outcome.
- One decision per bullet. Split compound bullets.
- Do not use inline bold to fake structure. The lead clause carries the scan. Bold scattered mid-sentence is the main cause of wall-of-text records. Reserve emphasis for a rare load-bearing term.
- Keep sentences short and concrete.
- Why is the single home for rationale. State the outcome in Decisions, the reasoning in Why. Do not scatter reasoning across decision bullets.
- Unresolved threads are not decisions. They go to Open questions and become a numbered question (`Q-NNN` id, in a `Q-NNN-short-slug.md` file), never a Decisions bullet dressed as certainty.

Verdict-led, in practice:
- Weak: "There are two fulfillment paths, direct and via inventory, and after weighing platform fit we lean toward starting inventory-based and moving to direct later."
- Strong: "Start inventory-based, move to direct later. Two paths exist: direct (seller ships to buyer) and via inventory (trader stocks, then ships)."

## Storage layout

All entries live under a repo-relative `wherefore/` directory:

```
wherefore/
├── README.md          # what this directory is + link to the plugin
├── topics.md          # controlled tag vocabulary (areas + topics)
├── questions/
│   └── Q-NNN-short-slug.md   # one file per question (ID prefix + scannable slug)
└── log/
    └── YYYY-MM-DD-short-slug.md   # one file per discussion
```

There is no separate index file. The frontmatter in the entry and question
files is the single source of truth; readers derive what they need at read time.
Do not create, append to, or maintain any index file. A repo that still carries a
legacy index file from an older plugin version is no longer using it; leave it
untouched (or mention it can be deleted), never recreate it.

If `wherefore/` does not exist, create it plus `log/`, `questions/`, a starter
`topics.md`, and a `README.md` containing exactly:

```markdown
# wherefore

A decision log in plain markdown. Each file captures what was decided, why, and what was ruled out.

Maintained by the [wherefore](https://github.com/DustinVK/wherefore) Claude Code skill.
```

Never invent a second wherefore location. If the repo already has `wherefore/`, use it.

## Entry format

Write every entry with this exact structure:

```markdown
---
date: YYYY-MM-DD
title: "Short human-readable title, <= 8 words"   # always quoted
areas: [order-process]             # feature slices (WHAT), from topics.md
topics: [price-calculation, tax]   # cross-cutting concerns (HOW), from topics.md
stories: [PROJ-1234]               # related tickets/stories, or []
status: active                     # active | superseded | obsolete (absent or "current" = active)
supersedes:                        # slug this entry replaces, or blank
superseded_by:                     # slug of replacement, filled in when superseded
superseded_date:                   # YYYY-MM-DD, or blank
---

## Summary
2 to 4 sentences: what was discussed and the bottom line.

## Decisions / outcomes
- Verdict-led bullets. The concrete things the team agreed to do.

## Why
The rationale: constraints, tradeoffs, and reasoning that led here. Highest-value
section; people come back for the why, not the what.

## Alternatives considered
- Option X, rejected because ... (omit this section only if none were genuinely discussed)

## Open questions / follow-ups
- Anything unresolved, or "None".
```

Keep the body tight, under about 40 lines. If the source is long, compress harder; do
not transcribe.

## Frontmatter safety

Emit every free-text scalar as a double-quoted, single-line string: `title` on entries;
`question` and `resolution` on question files. Escape embedded `"` as `\"` and `\` as
`\\`. Quote unconditionally, never "only if it looks risky." An unquoted value with
`: ` (colon-space, e.g. `MDN: ...`) or a leading `-`, `#`, `[`, `{`, or `"` makes YAML
misparse and crashes the dashboard viewer. Controlled fields (`date`, `status`, slugs,
and the `areas`/`topics`/`stories` lists) need no quotes. If a value runs long, keep the
scalar to a one-line summary and move the detail into a body section.

## Workflow

1. Get the source. A summary, or raw pasted discussion. If raw, distill it: extract decisions and rationale, drop the chatter.

2. One entry or many? Split into one file per thread when threads are independently queryable: different areas, different stories, and reversible without affecting each other. Keep one file when causally linked (one decision led to or constrained another). When splitting, run each thread through the whole workflow and cross-link companions in each entry's Open questions section ("See also: 2026-06-24-foo"). Report how many files and why.

3. Date. Default to today. Use a stated date only if the user gives one ("yesterday's huddle").

4. Distill into the format, applying Writing style above. If a "decision" was actually unresolved, put it under Open questions, not Decisions. Do not manufacture certainty the discussion did not have.

5. Tag areas and topics from `wherefore/topics.md` (read it first).
    - Areas = feature slices, the WHAT (`order-process`, `price-calculator`). Primary retrieval key.
    - Topics = cross-cutting concerns, the HOW (`auth`, `postgres`, `security`).
      Usually one or two areas and one or more topics; a purely technical decision may have `areas: []`. Reuse existing tags. Keep areas coarse and stable (rounding inside the price calculator is `price-calculator`, not a new `price-rounding`). Add a new tag only when nothing fits; append it to the right section of `topics.md` and tell the user. Uncontrolled tags (`auth` vs `authentication` vs `login`) fragment search until it misses things that are right there.

6. Stories. Pull any ticket or story IDs. If none, `[]`.

7. Supersession check. Read only the frontmatter of existing entries in one cheap pass and scan for active entries (status active, current, or absent) sharing an area or topic:
   ```bash
   for f in wherefore/log/*.md; do
     awk -v F="$f" 'BEGIN{print "=== " F " ==="}
       /^---[[:space:]]*$/ { n++; if (n==2) exit; next }
       n==1 { print }' "$f"
   done
   ```
   Surface likely reversals as candidates and ask before acting; never supersede silently. Auto-detection misses reversals; the status field is the safety net. To mark an entry superseded without capturing a new discussion, use the `supersede` skill.
   On a confirmed replacement:
    - New entry frontmatter: `supersedes: <old-slug>`.
    - Old entry frontmatter: `status: superseded`, `superseded_by: <new-slug>`, `superseded_date: YYYY-MM-DD`.
    - Old entry first body line (after frontmatter, before `## Summary`): `SUPERSEDED YYYY-MM-DD -> see <new-slug>. Kept for history, not current.`

8. Write `wherefore/log/YYYY-MM-DD-short-slug.md`. Slug short, lowercase, hyphenated, recognizable (`oauth-token-refresh`, not `discussion-about-the-auth-stuff`). If the name exists, add a short suffix; never overwrite.

9. Register open questions. For each genuine unresolved item:
    - Next Q-ID = (highest `id:` across `wherefore/questions/Q-*.md`) + 1. Derive it from the files, e.g. `ls wherefore/questions/Q-*.md 2>/dev/null | sed -E 's|.*/Q-0*([0-9]+).*|\1|' | sort -n | tail -1`. If the directory is empty or absent, start at Q-001. IDs are sequential and never reused. (The regex tolerates both the legacy `Q-NNN.md` and the current `Q-NNN-slug.md` naming.)
    - Prefix the entry's item with the ID: `- Q-001: How should we ...`
    - Create `wherefore/questions/Q-NNN-short-slug.md`, leaving `resolution` and `resolution_slug` blank. Name it like a log entry: `Q-` + the zero-padded ID + a short, lowercase, hyphenated slug distilled from the question (`Q-001-eu-buyer-tax`, not `Q-001-question-about-tax-stuff`). The `Q-NNN` prefix keeps questions sorted and greppable by number; the slug is for human scanning; the authoritative ID is always the `id:` frontmatter field.
      ```
      ---
      id: Q-001
      question: "How should we handle tax for EU buyers?"
      status: open
      areas: [international-shipping, price-calculator]
      asked_date: YYYY-MM-DD
      asked_slug: 2026-06-23-rls-tenant-isolation
      resolution:
      resolution_slug:
      ---
      ```
      Report the assigned Q-IDs.

10. Resolve questions this discussion answers. If open Q files exist:
    - Shortlist by area/topic overlap, or where the source explicitly addresses the question.
    - Ask the user which are now resolved; do not auto-close.
    - For each confirmed: set the Q file `status: resolved`, fill `resolution` (one quoted sentence), set `resolution_slug` to the new slug. Report closures.
    - No match: skip silently.

11. Report back. Show the title, assigned areas and topics (flag any new tag), linked stories, any supersession applied, and any Q-IDs assigned or closed. This is the approval moment: you distilled and tagged on the user's behalf, so let them correct it before it ossifies. There is no index to update; `ask` derives everything from the frontmatter you just wrote.

## Examples

Reversal. Input: "We're dropping RLS and going schema-per-tenant after the perf testing." Before writing, dump entry frontmatter and scan for active entries sharing `multi-tenancy` or `postgres`, surface the RLS entry, and confirm the reversal. On confirmation, write the new entry with `supersedes: 2026-06-23-rls-tenant-isolation`, mutate the old entry's frontmatter (`status: superseded`, `superseded_by`, `superseded_date`) and add its banner line, and report every file touched.

No decision. Input: a long thread weighing GraphQL caching with no conclusion. The Decisions section reads "No decision, see Open questions"; the contenders go under Open questions, each becoming a `Q-NNN-short-slug.md` so a later discussion can close them out explicitly.

Two threads in one discussion. Input: a thread covering both an order PDF renderer swap and a separate cart price-suggestion feature, which share no causal link. Write two files (`2026-06-24-order-pdf-renderer.md`, `2026-06-24-buyer-price-suggestion.md`), each with its own tags. Report: "Split into 2 entries; the two decisions are unrelated and would be retrieved separately."