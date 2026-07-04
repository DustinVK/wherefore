---
id: Q-002
question: "When a second package lands, switch to prefixed release tags and promote to npm workspaces?"
status: open
areas: [repo-structure]
asked_date: 2026-06-24
asked_slug: 2026-06-24-package-in-repo
resolution:
resolution_slug:
---

## Context
With one published package, plain vN.N.N tags are unambiguous and a root workspaces
config would just re-add a root package.json. Once a second publishable package
exists, prefixed tags (wherefore-dashboard@1.2.0) and real workspaces become worth it.
Deferred until that trigger.
