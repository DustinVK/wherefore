#!/usr/bin/env node
import { build, dev } from 'astro';
import { cp, rm, readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir, homedir } from 'node:os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = resolve(__dirname, '..');

async function resetContentStore() {
  // Astro persists its content-layer data store under the package root, not under --src:
  //   dev   -> <root>/.astro/data-store.json
  //   build -> <root>/node_modules/.astro/data-store.json  (cacheDir default)
  // Question ids (Q-001, ...) are identical in every project, so a store left over from a
  // different --src collides and Astro logs "Duplicate id". Clear it so each run is scoped to
  // the current --src. The store is cheap to rebuild for a markdown viewer.
  await Promise.all([
    rm(resolve(PACKAGE_ROOT, '.astro', 'data-store.json'), { force: true }),
    rm(resolve(PACKAGE_ROOT, 'node_modules', '.astro', 'data-store.json'), { force: true }),
  ]);
}

const USAGE = `wherefore-dashboard -- build or preview a static dashboard from a wherefore/ directory

Usage:
  wherefore-dashboard build [--src <path>] [--out <path>] [--title <string>]
  wherefore-dashboard dev   [--src <path>] [--title <string>]
  wherefore-dashboard init  [--global] [--force]

Options:
  --src <path>     Path to the wherefore/ directory to render. Default: ./wherefore
  --out <path>     Output directory for the built site. Default: ./dist
  --title <string> Override the dashboard title.
  --global         Install Antigravity skills globally instead of in the project root.
  --force, -f      Overwrite existing skills and configuration files.
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

// The CLAUDE.snippet.md template wraps the pasteable convention block in marker
// comments and precedes it with human-facing paste instructions. Install only the
// block between the markers so those instructions do not leak into CLAUDE.md.
function extractSnippetBlock(content) {
  const start = content.indexOf('paste from here');
  const end = content.indexOf('to here', start + 1);
  if (start === -1 || end === -1) return content.trim();
  const afterStart = content.indexOf('-->', start);
  const beforeEnd = content.lastIndexOf('<!--', end);
  if (afterStart === -1 || beforeEnd === -1 || afterStart >= beforeEnd) return content.trim();
  return content.slice(afterStart + 3, beforeEnd).trim();
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

  await resetContentStore();

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

  await resetContentStore();

  const server = await dev({ root: PACKAGE_ROOT });
  process.on('SIGINT', async () => {
    await server.stop();
    process.exit(0);
  });

} else if (command === 'init') {
  const isGlobal = flags.global === 'true' || rawArgs.includes('--global');
  const isForce = flags.force === 'true' || rawArgs.includes('--force') || rawArgs.includes('-f');
  const targetRoot = process.cwd();
  
  // 1. Read dashboard version from package.json
  let dashboardVersion = 'latest';
  try {
    const pkgJson = JSON.parse(await readFile(resolve(PACKAGE_ROOT, 'package.json'), 'utf8'));
    dashboardVersion = `^${pkgJson.version}`;
  } catch (_) {}

  console.log('Initializing wherefore log structure...');

  // 2. Create wherefore/ directories and seed topics.md if not exists
  const whereforeDir = resolve(targetRoot, 'wherefore');
  const logDir = resolve(whereforeDir, 'log');
  const questionsDir = resolve(whereforeDir, 'questions');
  const planDir = resolve(whereforeDir, 'plan');

  await mkdir(logDir, { recursive: true });
  await mkdir(questionsDir, { recursive: true });
  await mkdir(planDir, { recursive: true });

  const topicsPath = resolve(whereforeDir, 'topics.md');
  if (!existsSync(topicsPath)) {
    const seedTopicsPath = resolve(PACKAGE_ROOT, 'skills', 'capture', 'topics.seed.md');
    try {
      await cp(seedTopicsPath, topicsPath);
      console.log('  Created wherefore/topics.md from seed template.');
    } catch (err) {
      console.warn(`  Warning: Could not seed topics.md: ${err.message}`);
    }
  } else {
    console.log('  wherefore/topics.md already exists, skipping seed.');
  }

  // 3. Scaffold package.json
  const targetPkgJsonPath = resolve(targetRoot, 'package.json');
  if (existsSync(targetPkgJsonPath)) {
    try {
      const pkgContent = await readFile(targetPkgJsonPath, 'utf8');
      const pkg = JSON.parse(pkgContent);
      if (!pkg.devDependencies) pkg.devDependencies = {};
      if (!pkg.dependencies) pkg.dependencies = {};
      
      const hasDep = pkg.devDependencies['@dustinvk/wherefore-dashboard'] || pkg.dependencies['@dustinvk/wherefore-dashboard'];
      if (!hasDep) {
        pkg.devDependencies['@dustinvk/wherefore-dashboard'] = dashboardVersion;
        // Preserve the file's existing indentation and trailing newline so init
        // adds one line rather than reformatting the whole file into a noisy diff.
        const indentMatch = pkgContent.match(/\n([ \t]+)"/);
        const indent = indentMatch ? indentMatch[1] : 2;
        const trailingNewline = pkgContent.endsWith('\n') ? '\n' : '';
        await writeFile(targetPkgJsonPath, JSON.stringify(pkg, null, indent) + trailingNewline, 'utf8');
        console.log('  Added @dustinvk/wherefore-dashboard to devDependencies in package.json.');
      } else {
        console.log('  @dustinvk/wherefore-dashboard already in package.json.');
      }
    } catch (err) {
      console.warn(`  Warning: Could not update package.json: ${err.message}`);
    }
  }

  // 4. Update .gitignore
  const gitignorePath = resolve(targetRoot, '.gitignore');
  let gitignoreContent = '';
  if (existsSync(gitignorePath)) {
    gitignoreContent = await readFile(gitignorePath, 'utf8');
  }
  const existingIgnores = new Set(gitignoreContent.split('\n').map((line) => line.trim()));
  const linesToAppend = [];
  // Match whole lines: a nested `frontend/dist/` must not mask a missing top-level
  // `dist/` rule (the default build output the consumer actually produces).
  if (!existingIgnores.has('dist/')) linesToAppend.push('dist/');

  if (linesToAppend.length > 0) {
    const divider = gitignoreContent.length === 0 || gitignoreContent.endsWith('\n') ? '' : '\n';
    await writeFile(gitignorePath, gitignoreContent + divider + linesToAppend.join('\n') + '\n', 'utf8');
    console.log('  Updated .gitignore to ignore dashboard build output.');
  }

  // 5. Install AGENTS.md
  const agentsPath = resolve(targetRoot, 'AGENTS.md');
  const templateAgentsPath = resolve(PACKAGE_ROOT, 'templates', 'AGENTS.md');
  const agentsExists = existsSync(agentsPath);
  if (!agentsExists || isForce) {
    try {
      await cp(templateAgentsPath, agentsPath);
      console.log(`  Created AGENTS.md in project root${isForce && agentsExists ? ' (overwritten)' : ''}.`);
    } catch (err) {
      console.warn(`  Warning: Could not create AGENTS.md: ${err.message}`);
    }
  } else {
    console.log('  AGENTS.md already exists, skipping. Pass --force to overwrite.');
  }

  // 6. Install CLAUDE.md setup snippet
  const claudePath = resolve(targetRoot, 'CLAUDE.md');
  const templateSnippetPath = resolve(PACKAGE_ROOT, 'templates', 'CLAUDE.snippet.md');
  try {
    const snippetContent = extractSnippetBlock(await readFile(templateSnippetPath, 'utf8'));
    let existingClaude = '';
    if (existsSync(claudePath)) {
      existingClaude = await readFile(claudePath, 'utf8');
    }

    if (!existingClaude.includes('## Wherefore')) {
      const divider = existingClaude.length === 0 || existingClaude.endsWith('\n') ? '' : '\n';
      await writeFile(claudePath, existingClaude + divider + snippetContent + '\n', 'utf8');
      console.log('  Appended wherefore snippet to CLAUDE.md.');
    } else {
      console.log('  CLAUDE.md already configured for wherefore plugin, skipping.');
    }
  } catch (err) {
    console.warn(`  Warning: Could not configure CLAUDE.md: ${err.message}`);
  }

  // 7. Install Antigravity Skills
  if (isGlobal) {
    const globalSkillsDir = resolve(homedir(), '.gemini', 'antigravity-cli', 'skills');
    console.log(`Installing skills globally for Antigravity in ${globalSkillsDir}...`);
    try {
      await mkdir(globalSkillsDir, { recursive: true });
      const skillsToInstall = ['capture', 'ask', 'resolve', 'supersede'];
      for (const skill of skillsToInstall) {
        const dest = resolve(globalSkillsDir, skill);
        const exists = existsSync(dest);
        if (!exists || isForce) {
          if (exists) await rm(dest, { recursive: true, force: true });
          await cp(resolve(PACKAGE_ROOT, 'skills', skill), dest, { recursive: true });
          console.log(`  Installed global skill '${skill}'${isForce && exists ? ' (overwritten)' : ''}.`);
        } else {
          console.log(`  Skipped global skill '${skill}' (already exists). Pass --force to overwrite.`);
        }
      }
    } catch (err) {
      console.error(`  Error installing global skills: ${err.message}`);
      process.exit(1);
    }
  } else {
    const localSkillsDir = resolve(targetRoot, '.agents', 'skills');
    console.log(`Installing skills locally for Antigravity in ${localSkillsDir}...`);
    try {
      await mkdir(localSkillsDir, { recursive: true });
      const skillsToInstall = ['capture', 'ask', 'resolve', 'supersede'];
      for (const skill of skillsToInstall) {
        const dest = resolve(localSkillsDir, skill);
        const exists = existsSync(dest);
        if (!exists || isForce) {
          if (exists) await rm(dest, { recursive: true, force: true });
          await cp(resolve(PACKAGE_ROOT, 'skills', skill), dest, { recursive: true });
          console.log(`  Installed local skill '${skill}'${isForce && exists ? ' (overwritten)' : ''}.`);
        } else {
          console.log(`  Skipped local skill '${skill}' (already exists). Pass --force to overwrite.`);
        }
      }
    } catch (err) {
      console.error(`  Error installing local skills: ${err.message}`);
      process.exit(1);
    }
  }

  console.log('\nInitialization complete! All set up.');

} else {
  console.error(`Unknown command: ${command ?? '(none)'}`);
  console.error('Usage: wherefore-dashboard <build|dev|init> [--src <path>] [--out <path>] [--title <string>]');
  process.exit(1);
}
