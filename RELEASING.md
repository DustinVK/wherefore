# Releasing

How to cut an npm release of the two published packages in this repo:

- **`wherefore`** -- `packages/wherefore/`, the CLI. Bundles the skills at pack time.
- **`@dustinvk/wherefore-dashboard`** -- `packages/wherefore-dashboard/`, the static dashboard.

They version and publish **independently**; only bump the one that changed. The CLI's
`wherefore dashboard` command launches the dashboard via `npx --yes @dustinvk/wherefore-dashboard`
(unpinned, always latest), so there is no lockstep bump and no publish ordering to worry about.

> The Claude Code **plugin / marketplace** (`plugins/wherefore/`, `.claude-plugin/`) is a
> separate distribution channel, not npm. Its version lives in
> `plugins/wherefore/.claude-plugin/plugin.json` and it is released by pushing to the
> marketplace, not with `npm publish`. This doc does not cover it.

## Where the skills come from (the non-obvious part)

The CLI does **not** keep its own copy of the skills. `packages/wherefore/skills/` and
`packages/wherefore/templates/` are gitignored and generated at pack time:
`prepack` / `prepublishOnly` run `bin/prepare-package.js`, which copies the canonical
`plugins/wherefore/skills/` (all five skills) plus the root `AGENTS.md` and
`plugins/wherefore/CLAUDE.snippet.md` into the tarball. So to ship a skill change, you just
edit it under `plugins/wherefore/skills/` and publish -- the copy is automatic.

The dashboard ships only what its `files` field lists (`bin`, `src`, `public`,
`astro.config.mjs`). Any stray `skills/` or `templates/` scratch dirs under
`packages/wherefore-dashboard/` are **not** published.

## Prerequisites

```bash
npm whoami          # must be `dustinvk` (owns `wherefore` and the `@dustinvk` scope)
npm login           # if the above 401s
```

The account has **2FA on**, so every `npm publish` needs a one-time password:
`npm publish --otp=<6-digit-code>`.

## Versioning

Follow semver against the currently published version (`npm view <pkg> version`):

- new skill or dashboard feature -> **minor**
- fix only -> **patch**

Bump without tagging (we tag from `main` after merge):

```bash
cd packages/wherefore            # or packages/wherefore-dashboard
npm version minor --no-git-tag-version
```

For the dashboard this also updates `package-lock.json`; commit it too.

## Steps

### 1. Bump

Run `npm version <level> --no-git-tag-version` in each package you are releasing (see above).

### 2. Verify before you publish (npm versions are immutable)

**CLI:**
```bash
cd packages/wherefore
npm test                 # prepare-package.js + tests/cli.test.js
npm pack --dry-run       # confirm skills/<changed>/SKILL.md and templates/ are present
```

**Dashboard:**
```bash
cd packages/wherefore-dashboard
npm ci
npm test
npm run build            # smoke-builds tests/fixtures/wherefore -> .test-dist
npm pack --dry-run       # confirm bin/, src/, public/, astro.config.mjs; no stray skills/
```

### 3. Release PR into main

```bash
git add packages/wherefore/package.json \
        packages/wherefore-dashboard/package.json \
        packages/wherefore-dashboard/package-lock.json
git commit -m "wherefore: release <what changed>"
git push -u origin <branch>
gh pr create --base main --title "Release: <versions>" --body "..."
```

Let CI go green (`validate-plugins.yml`, `dashboard.yml`), merge, then:

```bash
git checkout main && git pull
```

### 4. Publish from main

```bash
cd packages/wherefore
npm publish --otp=<code>              # publishConfig makes it public

cd packages/wherefore-dashboard
npm publish --otp=<code>              # scoped pkg; publishConfig.access=public, no flag needed
```

Confirm:

```bash
npm view wherefore version
npm view @dustinvk/wherefore-dashboard version
```

### 5. Tag from main

The old bare `vX.Y.Z` tags track the **plugin** version, so use package-scoped annotated
tags for npm releases:

```bash
git tag -a wherefore-v<X.Y.Z> -m "wherefore CLI <X.Y.Z>: <summary>"
git tag -a wherefore-dashboard-v<X.Y.Z> -m "wherefore-dashboard <X.Y.Z>: <summary>"
git push origin wherefore-v<X.Y.Z> wherefore-dashboard-v<X.Y.Z>
```

Tag only the packages you actually published.

### 6. Smoke-test the published artifacts

From a throwaway dir outside the repo:

```bash
cd "$(mktemp -d)"
npx -y wherefore@<X.Y.Z> --help
npx -y @dustinvk/wherefore-dashboard@<X.Y.Z> --help
# optional: confirm a changed skill actually shipped
npm pack wherefore@<X.Y.Z> && tar -tzf wherefore-<X.Y.Z>.tgz | grep skills/
```
