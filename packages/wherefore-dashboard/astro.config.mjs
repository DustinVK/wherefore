import { defineConfig } from 'astro/config';
import { createRequire } from 'node:module';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildMdLinkMap } from './src/lib/md-links.mjs';
import rehypeMdLinks from './src/lib/rehype-md-links.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = __dirname;

// Astro may be hoisted above PACKAGE_ROOT when installed via npm/npx (flat
// node_modules layout). Resolve its actual location so Vite can serve its
// client runtime files (dev toolbar, HMR) regardless of install topology.
const _require = createRequire(import.meta.url);
const astroDir = dirname(_require.resolve('astro/package.json'));

const SRC = process.env.WHEREFORE_SRC;

// Filename -> route map for rewriting relative Markdown cross-links in bodies.
// Built once here (WHEREFORE_SRC is set by the CLI before build() runs); empty
// during type-gen when SRC is undefined, same guard the fs.allow list uses.
const mdLinkMap = buildMdLinkMap(SRC);

export default defineConfig({
  output: 'static',
  site: process.env.WHEREFORE_SITE,
  markdown: {
    rehypePlugins: [[rehypeMdLinks, { map: mdLinkMap }]],
  },
  vite: {
    server: {
      fs: {
        allow: [
          PACKAGE_ROOT,
          astroDir,
          ...(SRC ? [resolve(SRC)] : []),
        ],
      },
    },
  },
});
