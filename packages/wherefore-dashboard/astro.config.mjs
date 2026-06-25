import { defineConfig } from 'astro/config';
import { createRequire } from 'node:module';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = __dirname;

// Astro may be hoisted above PACKAGE_ROOT when installed via npm/npx (flat
// node_modules layout). Resolve its actual location so Vite can serve its
// client runtime files (dev toolbar, HMR) regardless of install topology.
const _require = createRequire(import.meta.url);
const astroDir = dirname(_require.resolve('astro/package.json'));

const SRC = process.env.WHEREFORE_SRC;

export default defineConfig({
  output: 'static',
  site: process.env.WHEREFORE_SITE,
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
