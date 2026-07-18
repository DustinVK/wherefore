---
id: P-010
title: Allocate next ID from frontmatter, not filenames
status: done
created: 2026-07-18
updated: 2026-07-18
area: plugin
topics: [skill-structure, data-model]
---

Next-ID allocation read the filename via an ls | sed scan while identity reads the
authoritative id: field. The two sources agree until they do not, which is how two Q-008s
were allocated (fixed directly by renumbering the newer one to Q-011). Fix the cause in both
scanners so allocation and identity read the same source, the frontmatter dump every other
operation already uses.

- [x] capture step 9: replace the ls | sed next-Q-ID scan with a frontmatter id: dump that takes the max.
- [x] plan open intent: replace the ls | sed next-P-NNN scan with a frontmatter id: dump that takes the max (this bug was inherited before the collection had a single item).
- [x] confirm both read id: from the leading frontmatter block, matching the awk dump pattern the read paths use.
