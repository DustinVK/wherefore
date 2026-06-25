#!/usr/bin/env node
import { build, dev } from 'astro';
import { cp, rm } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = resolve(__dirname, '..');

const USAGE = `wherefore-dashboard -- build or preview a static dashboard from a wherefore/ directory

Usage:
  wherefore-dashboard build [--src <path>] [--out <path>] [--title <string>]
  wherefore-dashboard dev   [--src <path>] [--title <string>]
  wherefore-dashboard init

Options:
  --src <path>     Path to the wherefore/ directory to render. Default: ./wherefore
  --out <path>     Output directory for the built site. Default: ./dist
  --title <string> Override the dashboard title.
  -h, --help       Show this help.`;

function checkSrc(src) {
  const logDir = resolve(src, 'log');
  let ok = false;
  try { ok = statSync(logDir).isDirectory(); } catch (_) {}
  if (!ok) {
    console.error(`Error: no wherefore found at ${src}`);
    console.error(`  Expected a wherefore directory containing a log/ subfolder.`);
    console.error(`  Pass --src pointing at your project's wherefore/ directory.`);
    process.exit(1);
  }
}

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

const rawArgs = process.argv.slice(2);
const wantsHelp = rawArgs.includes('--help') || rawArgs.includes('-h');

if (!command || command === 'help' || command === '--help' || command === '-h' || wantsHelp) {
  console.log(USAGE);
  process.exit(0);
}

if (command === 'build') {
  const src = resolve(flags.src ?? './wherefore');
  const out = resolve(flags.out ?? './dist');

  checkSrc(src);

  process.env.WHEREFORE_SRC = src;
  if (flags.title) process.env.WHEREFORE_TITLE = flags.title;

  const workDir = resolve(tmpdir(), `wherefore-dashboard-${Date.now()}`);

  process.chdir(PACKAGE_ROOT);

  try {
    await build({ root: PACKAGE_ROOT, outDir: workDir });
    if (existsSync(out)) await rm(out, { recursive: true });
    await cp(workDir, out, { recursive: true });
    console.log(`Built to ${out}`);
    console.log(`To preview locally:  npx serve ${out}`);
    console.log(`(Opening index.html directly will not load styles. For live preview, use the dev command.)`);
  } finally {
    if (existsSync(workDir)) await rm(workDir, { recursive: true }).catch(() => {});
  }

} else if (command === 'dev') {
  const src = resolve(flags.src ?? './wherefore');

  checkSrc(src);

  process.env.WHEREFORE_SRC = src;
  if (flags.title) process.env.WHEREFORE_TITLE = flags.title;

  const server = await dev({ root: PACKAGE_ROOT });
  process.on('SIGINT', async () => {
    await server.stop();
    process.exit(0);
  });

} else if (command === 'init') {
  console.log('init: not yet implemented.');
  console.log('Intended: scaffold package.json with @dustinvk/wherefore-dashboard as devDependency,');
  console.log('a .gitignore entry for dist/, and an optional wherefore-dashboard.config.json.');
  process.exit(1);

} else {
  console.error(`Unknown command: ${command ?? '(none)'}`);
  console.error('Usage: wherefore-dashboard <build|dev|init> [--src <path>] [--out <path>] [--title <string>]');
  process.exit(1);
}
