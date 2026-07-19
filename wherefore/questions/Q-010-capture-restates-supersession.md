---
id: Q-010
question: "Does capture restating the supersession mutation steps violate the sole-writer rule, or is it fine?"
status: open
areas: [plugin]
asked_date: 2026-07-18
asked_slug: 2026-06-24-supersede-separate-skill
resolution:
resolution_slug:
---

## Context

capture step 7 restates the supersession mutation inline (sets `status: superseded`,
`superseded_by`, `superseded_date`, and writes the banner) when a captured discussion is a
confirmed reversal. supersede is meant to be the single writer of decision status
(2026-06-24-supersede-separate-skill). Two readings, which resolve differently:

- Duplication reading: the concern is two copies of the same instructions drifting apart.
  If so, this is the ships-to-other-repos problem again, and the duplication may be correct,
  since each skill must be self-contained. No change needed.
- Boundary reading: the concern is two skills both mutating decision status. If so, it is a
  real breach of the sole-writer rule, and capture should call supersede rather than restate
  the steps.

Current lean is the boundary reading. The same mutation living in two code paths is exactly
the failure the sole-writer rule exists to prevent, and capture already routes question
closure through resolve and plan closure through plan. Supersession is the one place capture
still does the work itself, which makes it the odd one out.

If this resolves toward "yes, tighten it," resolve closes this question and plan opens the
item to make capture delegate to supersede.
