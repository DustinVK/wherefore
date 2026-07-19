---
id: Q-001
question: "Will Astro build cleanly with content base and output dir both outside the Astro project root?"
status: resolved
areas: [dashboard]
asked_date: 2026-06-24
asked_slug: 2026-06-24-dashboard-build-tool
resolution: "Yes. The dashboard builds cleanly with the content base and output dir both outside the Astro root; reconfirmed by an out-of-repo build with external --src and --out."
resolution_slug: 2026-07-19-dashboard-plan-collection
---

## Context
The build tool injects the consuming repo's wherefore/ as an absolute content-collection
base and writes output to an external dir. The planned workaround is to build into a
working dir inside the package and copy dist/ out, but it is unproven. This is the
flagged integration risk and should be validated against fixtures before the rest of
the dashboard is built on top of it.
