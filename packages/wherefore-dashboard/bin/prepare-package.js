import { cp, rm, mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = resolve(__dirname, '..');
const REPO_ROOT = resolve(PKG_ROOT, '..', '..');

async function main() {
  console.log('Preparing package assets (copying skills and templates)...');
  
  const destSkills = resolve(PKG_ROOT, 'skills');
  const destTemplates = resolve(PKG_ROOT, 'templates');

  // Clean old files
  await rm(destSkills, { recursive: true, force: true });
  await rm(destTemplates, { recursive: true, force: true });

  // Create directories
  await mkdir(destSkills, { recursive: true });
  await mkdir(destTemplates, { recursive: true });

  // Copy files
  await cp(resolve(REPO_ROOT, 'plugins', 'wherefore', 'skills'), destSkills, { recursive: true });
  await cp(resolve(REPO_ROOT, 'plugins', 'wherefore', 'CLAUDE.snippet.md'), resolve(destTemplates, 'CLAUDE.snippet.md'));
  await cp(resolve(REPO_ROOT, 'AGENTS.md'), resolve(destTemplates, 'AGENTS.md'));

  console.log('Package assets prepared successfully.');
}

main().catch(err => {
  console.error('Failed to prepare package assets:', err);
  process.exit(1);
});
