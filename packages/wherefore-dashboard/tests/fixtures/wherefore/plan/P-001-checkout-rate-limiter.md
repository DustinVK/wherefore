---
id: P-001
title: Wire up the checkout rate limiter
status: doing
created: 2026-01-02
updated: 2026-01-05
area: checkout
topics: [api-design]
milestone: M1
---

Rolling out the per-user limiter behind a flag.

- [x] add the token-bucket helper
- [x] gate it behind a flag
- [ ] backfill the config for staging
- [ ] flip it on in production
