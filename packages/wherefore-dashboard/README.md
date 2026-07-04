<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/DustinVK/wherefore/main/.github/assets/lockup-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/DustinVK/wherefore/main/.github/assets/lockup-light.svg">
  <img alt="wherefore" src="https://raw.githubusercontent.com/DustinVK/wherefore/main/.github/assets/lockup-light.svg" width="280">
</picture>

# @dustinvk/wherefore-dashboard

The static dashboard for [wherefore](https://github.com/DustinVK/wherefore), the why behind your code.

Wherefore captures the reasoning behind your engineering decisions, what you chose, why, and what you ruled out, as plain markdown in your repo. This package reads that `wherefore/` directory and builds a browsable static site from it. No Astro source lives in your repo; no cloud, no lock-in.

[![npm](https://img.shields.io/npm/v/@dustinvk/wherefore-dashboard)](https://www.npmjs.com/package/@dustinvk/wherefore-dashboard)
[![license](https://img.shields.io/npm/l/@dustinvk/wherefore-dashboard)](https://github.com/DustinVK/wherefore/blob/main/LICENSE)

> This package only builds and serves the dashboard. To scaffold a `wherefore/` log or
> install skills for your agent, use the `wherefore` CLI: `npx wherefore init`. You can
> also launch this dashboard through it with `npx wherefore dashboard`.

## Quick start

From any directory that contains a `wherefore/` folder, no install and no flags:

```bash
# live dashboard with hot reload
npx @dustinvk/wherefore-dashboard dev

# build a static site to ./dist
npx @dustinvk/wherefore-dashboard build
```

`dev` and `build` default to `./wherefore` for the source and `./dist` for build output. Override either when your layout differs:

```bash
npx @dustinvk/wherefore-dashboard build \
  --src ./path/to/wherefore \
  --out ./site \
  --title "My Project Wherefore"
```

## Running from a local clone (without npx)

If you have this repo checked out, you can run the CLI directly with `node`, skipping `npx` entirely. Install dependencies once, then call the bin script:

```bash
cd packages/wherefore-dashboard
npm install

# live dashboard with hot reload
node bin/wherefore-dashboard.js dev --src /path/to/your/wherefore

# build a static site
node bin/wherefore-dashboard.js build --src /path/to/your/wherefore --out ./dist
```

The same `--src`, `--out`, and `--title` flags apply. `--src` defaults to `./wherefore` relative to your current directory, so point it at the project whose log you want to render. The `npm run dev` script in this package wraps the same command.

## Viewing a build locally

A built site uses absolute asset paths, so it must be served over HTTP. Opening `dist/index.html` directly in the browser (a `file://` URL) loads the page but not the styles. To preview a build, serve the folder:

```bash
npx serve ./dist
```

For routine local viewing, just use `dev`, it runs a live server with hot reload. The `build` output is meant to be deployed to a host (see below), where it serves correctly from the site root.

## Pinning for reproducible builds

For CI or team use, pin the version as a devDependency so everyone builds with the same dashboard:

```bash
npm install --save-dev @dustinvk/wherefore-dashboard
```

Bumping the dashboard later is a one-line change in your `package.json`.

## Running several projects at once

The dashboard caches per install, not per project. That has one consequence worth knowing:

- **Multiple `dev` servers at once is fine.** Browsing two or more projects side by side works --
  each `dev` server renders its own project. You may see harmless `Duplicate id "Q-..."` warnings
  in the logs; they do not affect what is served.
- **Avoid running multiple `build`s at once against the same `npx` install.** Parallel builds of
  different projects (e.g. a multi-repo CI job or script) share one on-disk cache and can
  cross-contaminate each other's output. Either serialize the builds, or install the dashboard as a
  per-project devDependency (see above) and build via an npm script so each project uses its own
  isolated copy.

## Deploy to Cloudflare Pages

- Build command: `npx @dustinvk/wherefore-dashboard build`
- Output directory: `dist`
- Root directory: the folder containing your `package.json`

See the [hosting guide](https://github.com/DustinVK/wherefore/blob/main/packages/wherefore-dashboard/docs/HOSTING.md) for private-dashboard options (Cloudflare Access, basic auth).

## How it works

The CLI reads your `wherefore/` directory in place and emits a static [Astro](https://astro.build) site. Your decision log stays as plain markdown in your repo; the dashboard is just a renderer you point at it.

The `wherefore/` directory is produced by the [wherefore plugin](https://github.com/DustinVK/wherefore) for Claude Code.

## License

MIT. Source at [github.com/DustinVK/wherefore](https://github.com/DustinVK/wherefore).