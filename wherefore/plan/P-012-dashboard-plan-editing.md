---
id: P-012
title: Editable plan status and checkboxes in the dashboard (dev)
status: todo
created: 2026-07-19
area: dashboard
topics: [ui, build]
decision_ref: 2026-07-19-dashboard-plan-editing
---

Dev-only editing of plan items from the dashboard: flip status (todo, doing, done) and
toggle body checkboxes, writing straight to `wherefore/plan/*.md` while running
`wherefore-dashboard dev`. The hosted static build stays read-only. See
[2026-07-19-dashboard-plan-editing](../log/2026-07-19-dashboard-plan-editing.md) for the
rationale and rejected alternatives.

- [ ] `plan-edit.mjs` pure writer: `setStatus`/`setUpdated` (insert `updated:` after
  `created:`, else after `status:`, else throw) and `toggleTask` anchored by (line,
  expected text) with a `StaleAnchor` reject
- [ ] `plan-edit.test.mjs`: status change, updated insertion, fenced-code corruption case,
  stale-anchor reject, byte-identical output vs a real slate-produced file
- [ ] `dev-writer.mjs` Vite dev-server plugin: explicit POST and manual body read, an
  id-to-file resolver that 409s on a duplicate `id:`, atomic dot-prefixed temp write; wire
  into `astro.config.mjs` `vite.plugins`
- [ ] `rehype-md-links.mjs`: DEV-gated stamp of `data-wf-line` and `data-wf-src` (source
  line sliced from `file.value` by offset) onto each rendered task-list item
- [ ] `plan.ts` `taskProgress`: strip fenced code before counting, with a test
- [ ] `plan/[slug].astro`: DEV-gated status control and inline script (expected-text
  toggle, reload on 409)
- [ ] `render.test.mjs`: assert built output has no `__wherefore`, no `data-wf-*`, and all
  task-list checkboxes still disabled (the trust-model guardrail)
- [ ] verify end-to-end: dev toggle writes the file, fenced-code anti-corruption check,
  duplicate-id 409, build output unchanged
