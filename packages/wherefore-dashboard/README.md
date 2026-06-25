# @dustinvk/wherefore-dashboard

Build tool that reads a `wherefore/` directory (produced by the [wherefore plugin](../../plugins/wherefore/)) and emits a static dashboard. Deploy to Cloudflare Pages or serve locally.

## Install

```bash
npm install --save-dev @dustinvk/wherefore-dashboard
```

## Usage

```bash
# local preview
npx wherefore-dashboard dev

# build static site
npx wherefore-dashboard build

# options
npx wherefore-dashboard build --src ./wherefore --out ./dist --title "My Project Wherefore"
```

## Cloudflare Pages

- Build command: `npx wherefore-dashboard build`
- Output directory: `dist`
- Root directory: repo root (or the subfolder containing your package.json)

Commit a `package.json` with the tool pinned as a devDependency for reproducible builds.

## How it works

The CLI reads your `wherefore/` directory in place and builds a static Astro site. No Astro source lives in your repo. Bumping the dashboard version is a one-line change in your package.json.

Source: [github.com/DustinVK/wherefore](https://github.com/DustinVK/wherefore) -- `packages/wherefore-dashboard/`
