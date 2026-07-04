#!/usr/bin/env node
import { cp, rm, readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = resolve(__dirname, '..');

// The dashboard lives in its own (astro-heavy) package; `wherefore` stays lean and
// launches it on demand. WHEREFORE_DASHBOARD_BIN overrides the target for local dev/tests.
const DASHBOARD_PKG = '@dustinvk/wherefore-dashboard';

const USAGE = `wherefore -- capture and browse a repo-committed decision log

Usage:
  wherefore init      [--skills] [--agent <list>] [--global] [--force]
  wherefore dashboard [...args]      launch the dashboard (forwards to ${DASHBOARD_PKG})

Options:
  --skills          (experimental) also install the wherefore skills for your agent(s).
  --agent <list>    (experimental) comma-separated agents to install skills for:
                    claude, codex, copilot, cursor, gemini, antigravity, all, auto.
                    Default (with --skills, no --agent): the shared .agents/skills/ path.
  --global          install skills into your user-level dirs instead of the project.
  --force, -f       overwrite existing skills and configuration files.
  -h, --help        show this help.

init scaffolds a wherefore/ log, writes an AGENTS.md so any agent can read it, and
(opt-in) installs SKILL.md skills for the agents you name.`;

// Map an --agent name to the skills dir it auto-discovers (project-relative).
// copilot/cursor/gemini/antigravity all read the shared .agents/skills path.
const AGENT_DIRS = {
  claude: '.claude/skills',
  codex: '.codex/skills',
  copilot: '.agents/skills',
  cursor: '.agents/skills',
  gemini: '.agents/skills',
  antigravity: '.agents/skills',
};

// Best-effort markers used by --agent auto.
const AUTO_MARKERS = [
  { marker: '.claude', agent: 'claude' },
  { marker: 'CLAUDE.md', agent: 'claude' },
  { marker: '.codex', agent: 'codex' },
  { marker: '.cursor', agent: 'cursor' },
  { marker: '.gemini', agent: 'gemini' },
  { marker: 'GEMINI.md', agent: 'gemini' },
  { marker: '.github/copilot-instructions.md', agent: 'copilot' },
  { marker: '.agents', agent: 'copilot' },
];

function parseArgs(argv) {
  const args = argv.slice(2);
  const command = args[0];
  const flags = {};
  for (let i = 1; i < args.length; i++) {
    if (args[i] && args[i].startsWith('--') && args[i + 1] && !args[i + 1].startsWith('--')) {
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

// Resolve the requested agents to a deduped list of absolute skill dirs.
function resolveSkillDirs({ agentArg, isGlobal, targetRoot }) {
  let rel; // project-relative skill dirs
  if (!agentArg) {
    rel = ['.agents/skills']; // bare --skills -> the shared interop path
  } else if (agentArg === 'all') {
    rel = ['.claude/skills', '.codex/skills', '.agents/skills'];
  } else if (agentArg === 'auto') {
    const detected = new Set();
    for (const { marker, agent } of AUTO_MARKERS) {
      if (existsSync(resolve(targetRoot, marker))) detected.add(AGENT_DIRS[agent]);
    }
    if (detected.size === 0) return { dirs: [], error: 'no known agent markers found for --agent auto' };
    rel = [...detected];
  } else {
    const names = agentArg.split(',').map((s) => s.trim()).filter(Boolean);
    const unknown = names.filter((n) => !(n in AGENT_DIRS));
    if (unknown.length) {
      return {
        dirs: [],
        error: `unknown --agent value(s): ${unknown.join(', ')}. Valid: ${Object.keys(AGENT_DIRS).join(', ')}, all, auto`,
      };
    }
    rel = [...new Set(names.map((n) => AGENT_DIRS[n]))];
  }
  const dirs = [...new Set(rel.map((r) => (isGlobal ? resolve(homedir(), r) : resolve(targetRoot, r))))];
  return { dirs, error: null };
}

const { command, flags } = parseArgs(process.argv);
const rawArgs = process.argv.slice(2);
const wantsHelp = rawArgs.includes('--help') || rawArgs.includes('-h');

// Global help, but let `dashboard --help` fall through to the dashboard itself.
if (!command || command === 'help' || command === '--help' || command === '-h' || (wantsHelp && command !== 'dashboard')) {
  console.log(USAGE);
  process.exit(0);
}

if (command === 'dashboard') {
  // Thin launcher: keep `wherefore` dependency-light and spawn the dashboard on demand.
  const forwarded = rawArgs.slice(1);
  const overrideBin = process.env.WHEREFORE_DASHBOARD_BIN;
  const [cmd, baseArgs] = overrideBin
    ? [process.execPath, [overrideBin]]
    : ['npx', ['--yes', DASHBOARD_PKG]];
  const child = spawn(cmd, [...baseArgs, ...forwarded], { stdio: 'inherit' });
  child.on('error', (err) => {
    console.error(`Failed to launch dashboard: ${err.message}`);
    process.exit(1);
  });
  child.on('exit', (code) => process.exit(code ?? 0));

} else if (command === 'init') {
  const isGlobal = rawArgs.includes('--global');
  const isForce = rawArgs.includes('--force') || rawArgs.includes('-f');
  const targetRoot = process.cwd();
  // Track whether any step actually errored (not just "already exists / skipped")
  // so init can do as much setup as possible and still exit non-zero at the end.
  let hadError = false;

  // 1. Read this CLI's version to pin the consumer's devDependency.
  let cliVersion = 'latest';
  try {
    const pkgJson = JSON.parse(await readFile(resolve(PACKAGE_ROOT, 'package.json'), 'utf8'));
    cliVersion = `^${pkgJson.version}`;
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
      hadError = true;
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

      const hasDep = pkg.devDependencies['wherefore'] || pkg.dependencies['wherefore'];
      if (!hasDep) {
        pkg.devDependencies['wherefore'] = cliVersion;
        // Preserve the file's existing indentation and trailing newline so init
        // adds one line rather than reformatting the whole file into a noisy diff.
        const indentMatch = pkgContent.match(/\n([ \t]+)"/);
        const indent = indentMatch ? indentMatch[1] : 2;
        const trailingNewline = pkgContent.endsWith('\n') ? '\n' : '';
        await writeFile(targetPkgJsonPath, JSON.stringify(pkg, null, indent) + trailingNewline, 'utf8');
        console.log('  Added wherefore to devDependencies in package.json.');
      } else {
        console.log('  wherefore already in package.json.');
      }
    } catch (err) {
      console.warn(`  Warning: Could not update package.json: ${err.message}`);
      hadError = true;
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
  // `dist/` rule (the default dashboard build output the consumer produces).
  if (!existingIgnores.has('dist/')) linesToAppend.push('dist/');

  if (linesToAppend.length > 0) {
    const divider = gitignoreContent.length === 0 || gitignoreContent.endsWith('\n') ? '' : '\n';
    await writeFile(gitignorePath, gitignoreContent + divider + linesToAppend.join('\n') + '\n', 'utf8');
    console.log('  Updated .gitignore to ignore dashboard build output.');
  }

  // 5. Install AGENTS.md (the always-on cross-tool floor)
  const agentsPath = resolve(targetRoot, 'AGENTS.md');
  const templateAgentsPath = resolve(PACKAGE_ROOT, 'templates', 'AGENTS.md');
  const agentsExists = existsSync(agentsPath);
  if (!agentsExists || isForce) {
    try {
      await cp(templateAgentsPath, agentsPath);
      console.log(`  Created AGENTS.md in project root${isForce && agentsExists ? ' (overwritten)' : ''}.`);
    } catch (err) {
      console.warn(`  Warning: Could not create AGENTS.md: ${err.message}`);
      hadError = true;
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
    hadError = true;
  }

  // 7. Install agent skills (experimental, opt-in)
  const hasAgentArg = rawArgs.includes('--agent');
  const wantsSkills = rawArgs.includes('--skills') || isGlobal || hasAgentArg;
  if (wantsSkills) {
    const { dirs, error } = resolveSkillDirs({ agentArg: flags.agent, isGlobal, targetRoot });
    if (error) {
      console.error(`  Error: ${error}`);
      hadError = true;
    } else {
      for (const skillsDir of dirs) {
        console.log(`Installing skills into ${skillsDir}...`);
        try {
          await mkdir(skillsDir, { recursive: true });
          for (const skill of ['capture', 'ask', 'resolve', 'supersede']) {
            const dest = resolve(skillsDir, skill);
            const exists = existsSync(dest);
            if (!exists || isForce) {
              // Copy into a temp dir and swap in, so a failed copy never leaves the
              // skill deleted with no replacement.
              const tmpDest = `${dest}.tmp`;
              await rm(tmpDest, { recursive: true, force: true });
              await cp(resolve(PACKAGE_ROOT, 'skills', skill), tmpDest, { recursive: true });
              if (exists) await rm(dest, { recursive: true, force: true });
              await rename(tmpDest, dest);
              console.log(`  Installed skill '${skill}'${isForce && exists ? ' (overwritten)' : ''}.`);
            } else {
              console.log(`  Skipped skill '${skill}' (already exists). Pass --force to overwrite.`);
            }
          }
        } catch (err) {
          console.error(`  Error installing skills into ${skillsDir}: ${err.message}`);
          hadError = true;
        }
      }
    }
  } else {
    console.log('Skipping agent skill install (experimental; pass --skills or --agent <name> to enable).');
  }

  if (hadError) {
    console.error('\nInitialization completed with errors (see warnings above).');
    process.exit(1);
  }

  console.log('\nInitialization complete! All set up.');

} else {
  console.error(`Unknown command: ${command ?? '(none)'}`);
  console.error('Usage: wherefore <init|dashboard> [...]');
  process.exit(1);
}
