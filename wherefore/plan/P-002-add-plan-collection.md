---
id: P-002
title: Add plan collection to the dashboard
status: done
created: 2026-07-03
updated: 2026-07-19
area: dashboard
topics: [astro, schema]
decision_ref: 2026-07-03-plan-directory, 2026-07-19-dashboard-plan-collection
---

Astro loader plus route for wherefore/plan/, mirroring the questions collection. Derive
IDs from the id field, not the filename. Test with --src pointing outside the package
(cross-directory false-pass risk). Preceded by stabilizing this frontmatter contract on
a few hand-written files.
