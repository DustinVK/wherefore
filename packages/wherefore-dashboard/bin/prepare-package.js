import { cp, rm, mkdir, stat, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = resolve(__dirname, '..');
const REPO_ROOT = resolve(PKG_ROOT, '..', '..');

const SKILLS_SRC = resolve(REPO_ROOT, 'plugins', 'wherefore', 'skills');
const SNIPPET_SRC = resolve(REPO_ROOT, 'plugins', 'wherefore', 'CLAUDE.snippet.md');
const AGENTS_SRC = resolve(REPO_ROOT, 'AGENTS.md');
const SOURCES = [SKILLS_SRC, SNIPPET_SRC, AGENTS_SRC];

const destSkills = resolve(PKG_ROOT, 'skills');
const destTemplates = resolve(PKG_ROOT, 'templates');

// Newest mtime anywhere under a file or directory tree.
async function newestMtime(path) {
  const info = await stat(path);
  let newest = info.mtimeMs;
  if (info.isDirectory()) {
    for (const entry of await readdir(path, { withFileTypes: true })) {
      const m = await newestMtime(resolve(path, entry.name));
      if (m > newest) newest = m;
    }
  }
  return newest;
}

async function main() {
  const sourcesExist = SOURCES.every((p) => existsSync(p));
  const assetsPresent = existsSync(destSkills) && existsSync(destTemplates);

  // Outside the monorepo (e.g. an installed package), the sources are gone but the
  // assets were already shipped in the tarball, so there is nothing to regenerate.
  if (!sourcesExist) {
    if (assetsPresent) {
      console.log('Package assets already present; skipping generation.');
      return;
    }
    console.warn('Package assets missing and source files unavailable; cannot generate skills/templates.');
    return;
  }

  // Skip the rm+recopy when the generated assets are already newer than every
  // source, so dev/build/test do not rebuild the whole tree on every run. Any
  // error here (missing/racey files) falls through to a full, correct rebuild.
  if (assetsPresent) {
    try {
      const srcNewest = Math.max(...(await Promise.all(SOURCES.map(newestMtime))));
      const destNewest = Math.max(await newestMtime(destSkills), await newestMtime(destTemplates));
      if (destNewest >= srcNewest) {
        console.log('Package assets up to date; skipping regeneration.');
        return;
      }
    } catch {
      // fall through and rebuild
    }
  }

  console.log('Preparing package assets (copying skills and templates)...');

  // Clean old files
  await rm(destSkills, { recursive: true, force: true });
  await rm(destTemplates, { recursive: true, force: true });

  // Create directories
  await mkdir(destSkills, { recursive: true });
  await mkdir(destTemplates, { recursive: true });

  // Copy files
  await cp(SKILLS_SRC, destSkills, { recursive: true });
  await cp(SNIPPET_SRC, resolve(destTemplates, 'CLAUDE.snippet.md'));
  await cp(AGENTS_SRC, resolve(destTemplates, 'AGENTS.md'));

  console.log('Package assets prepared successfully.');
}

main().catch(err => {
  console.error('Failed to prepare package assets:', err);
  process.exit(1);
});
