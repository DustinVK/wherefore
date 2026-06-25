#!/usr/bin/env node
import { build, dev } from 'astro';
import { cp, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = resolve(__dirname, '..');

function parseArgs(argv) {
  const args = argv.slice(2);
  const command = args[0];
  const flags = {};
  for (let i = 1; i < args.length; i++) {
    if (args[i] && args[i].startsWith('--') && args[i + 1]) {
      flags[args[i].slice(2)] = args[i + 1];
      i++;
    }
  }
  return { command, flags };
}

const { command, flags } = parseArgs(process.argv);

if (command === 'build') {
  const src = resolve(flags.src ?? './lore');
  const out = resolve(flags.out ?? './dist');

  process.env.LORE_SRC = src;
  if (flags.title) process.env.LORE_TITLE = flags.title;

  const workDir = resolve(tmpdir(), `lore-dashboard-${Date.now()}`);

  process.chdir(PACKAGE_ROOT);

  try {
    await build({ root: PACKAGE_ROOT, outDir: workDir });
    if (existsSync(out)) await rm(out, { recursive: true });
    await cp(workDir, out, { recursive: true });
    console.log(`Built to ${out}`);
  } finally {
    if (existsSync(workDir)) await rm(workDir, { recursive: true }).catch(() => {});
  }

} else if (command === 'dev') {
  const src = resolve(flags.src ?? './lore');

  process.env.LORE_SRC = src;
  if (flags.title) process.env.LORE_TITLE = flags.title;

  const server = await dev({ root: PACKAGE_ROOT });
  process.on('SIGINT', async () => {
    await server.stop();
    process.exit(0);
  });

} else if (command === 'init') {
  console.log('init: not yet implemented.');
  console.log('Intended: scaffold package.json with @dustinvk/lore-dashboard as devDependency,');
  console.log('a .gitignore entry for dist/, and an optional lore-dashboard.config.json.');
  process.exit(1);

} else {
  console.error(`Unknown command: ${command ?? '(none)'}`);
  console.error('Usage: lore-dashboard <build|dev|init> [--src <path>] [--out <path>] [--title <string>]');
  process.exit(1);
}
