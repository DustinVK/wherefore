// Rewrites the relative Markdown cross-links that wherefore items use in their
// bodies (e.g. `[P-004: label](P-004-slug.md)`, `[..](../log/2026-..-slug.md)`)
// onto the dashboard's routes. Authored links point at the target FILE so they
// stay portable (GitHub, Obsidian, VS Code); the dashboard serves routes, so we
// map filename -> route at build time and swap the href.
//
// buildMdLinkMap() runs at config time (node:fs), rewriteMdHref() is pure so it
// is shared by the rehype plugin (render() pages) and renderInline (log page).

import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function readMdFiles(dir) {
  try {
    return readdirSync(dir).filter(f => f.endsWith('.md'));
  } catch {
    return [];
  }
}

function frontmatterId(dir, file) {
  try {
    const content = readFileSync(resolve(dir, file), 'utf-8');
    const fm = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!fm) return null;
    const m = fm[1].match(/^id:\s*(\S+)\s*$/m);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

/**
 * Build a `Map<filename, route>` for every linkable wherefore item under `src`.
 * Keyed by bare filename: the three collections use disjoint name shapes
 * (`P-*.md`, `Q-*.md`, `YYYY-MM-DD-*.md`), so a filename is globally unambiguous
 * and callers never have to resolve `../` paths.
 *   plan/P-*.md      -> /plan/<id>           (route keys off the id: frontmatter)
 *   questions/Q-*.md -> /questions           (single page; no per-question route)
 *   log/*.md         -> /log/<slug>          (slug = filename without .md)
 */
export function buildMdLinkMap(src) {
  const map = new Map();
  if (!src) return map;

  const planDir = resolve(src, 'plan');
  for (const file of readMdFiles(planDir)) {
    if (!file.startsWith('P-')) continue; // skip README.md and other non-items
    const id = frontmatterId(planDir, file);
    if (id) map.set(file, `/plan/${id}`);
  }

  for (const file of readMdFiles(resolve(src, 'questions'))) {
    if (!file.startsWith('Q-')) continue;
    map.set(file, '/questions');
  }

  for (const file of readMdFiles(resolve(src, 'log'))) {
    map.set(file, `/log/${file.replace(/\.md$/, '')}`);
  }

  return map;
}

/**
 * Rewrite one href. Relative `*.md` links whose filename is known become the
 * dashboard route (preserving any `#fragment`); everything else is untouched:
 * external URLs, anchors, absolute paths, and `.md` links to unknown targets
 * (which pass through rather than breaking).
 */
export function rewriteMdHref(href, map) {
  if (!href) return href;
  if (/^(https?:|mailto:|tel:|#|\/)/i.test(href)) return href;

  const hashAt = href.indexOf('#');
  const path = hashAt === -1 ? href : href.slice(0, hashAt);
  const frag = hashAt === -1 ? '' : href.slice(hashAt);
  if (!/\.md$/i.test(path)) return href;

  const filename = path.split('/').pop();
  const route = map && map.get(filename);
  return route ? route + frag : href;
}
