---
id: P-004
title: Ship the billing webhook retries
status: done
created: 2026-01-01
updated: 2026-01-04
area: billing
topics: [auth]
decision_ref: 2026-01-01-active-example
---

Exponential backoff on webhook delivery.

- [x] add the retry queue
- [x] cap attempts at 6
- [x] alert on the dead-letter queue
