---
description: Inspect the codebase and propose starter areas + topics for the wherefore log
argument-hint: [optional focus path]
allowed-tools: Read, Grep, Glob, Bash(ls:*), Bash(find:*), Bash(cat:*), Bash(git:*), Write
---

You are bootstrapping the controlled vocabulary for this project's wherefore log,
the two-facet `wherefore/topics.md` used by the `capture` and `ask` skills. Read
the codebase, propose a draft vocabulary, and, only after the user confirms,
write it.

Scope: if `$ARGUMENTS` names a path, focus your inspection there; otherwise inspect
the whole repo from its root.

## 1. Gather signals (read-only)

Infer the two facets from real structure, not guesses:

**Areas: feature slices / product domains (WHAT):**
- Top-level source layout and module/package names; feature folders and bounded
  contexts are the strongest signal. List the tree first (e.g. `find . -maxdepth 2
  -type d`, or `git ls-files | head -200` for tracked structure).
- Route / endpoint / controller / handler names, and the domain nouns in the
  README and any `docs/`.
- Group related code into coarse, stable buckets: one area per product capability
  (`checkout`, `billing`, `catalog`), NOT one per file or sub-feature.

**Topics: cross-cutting technical concerns (HOW):**
- Dependency manifests and lockfiles (`package.json`, `go.mod`, `requirements.txt`,
  `pom.xml`, `Gemfile`, `Cargo.toml`, ...), Dockerfiles, IaC, and any `migrations/`
  directory. These reveal the stack: the database, auth approach, queues, etc.
- Recurring engineering concerns visible in the tree (`auth`, `data-model`,
  `performance`, `security`, `api-design`, `infra`, `frontend`).

Keep each list to roughly 6-12 entries. Resist sprawl; coarse and reusable beats
exhaustive. Use lowercase, hyphenated tags.

## 2. Propose (do NOT write yet)

Present the proposal in the two-section format below, and for EACH tag add a short
(3-8 word) justification pointing at what in the codebase suggested it, so the user
can sanity-check:

```
## Areas: feature slices / product domains (WHAT)
- checkout            # src/checkout/, /api/checkout routes
- billing             # src/billing/, Stripe client

## Topics: cross-cutting technical concerns (HOW)
- postgres            # migrations/, pgx in go.mod
- auth                # internal/auth/, JWT middleware
```

Then STOP and ask the user to confirm, edit, or add/remove tags. Do not assume
approval; wait for their reply before writing anything.

## 3. Write (only after the user confirms)

- If `wherefore/topics.md` does NOT exist: create the `wherefore/` directory and
  write the confirmed vocabulary as `wherefore/topics.md` in the two-section format
  above. Do not create any index file; the `capture` skill scaffolds the rest of
  the directory on first use.
- If it DOES exist: treat the existing file as the source of truth and MERGE:
  append only the new, confirmed tags under the correct section, and never remove
  or rename anything already there. Report exactly which tags you added.

Finish with a one-line summary of what was written and where.
