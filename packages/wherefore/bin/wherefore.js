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
  wherefore init      [--agent <list>] [--no-skills] [--global] [--force]
  wherefore dashboard [...args]      launch the dashboard (forwards to ${DASHBOARD_PKG})

Options:
  --agent <list>    comma-separated agents to install skills for:
                    claude, codex, copilot, cursor, gemini, antigravity, all, auto.
                    Default: auto -- detect agents from the project, falling back to
                    the shared .agents/skills/ path when none are detected.
  --no-skills       scaffold the log and AGENTS.md floor only; install no agent skills.
  --global          install skills into your user-level dirs instead of the project.
  --force, -f       overwrite existing skills and configuration files.
  -h, --help        show this help.

init scaffolds a wherefore/ log, writes an AGENTS.md so any agent can read it, and
installs the wherefore SKILL.md skills for your agent (auto-detected by default).
Pass --agent to target specific agents, or --no-skills to skip skill install.`;

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
    const arg = args[i];
    if (!arg || !arg.startsWith('--')) continue;
    // Accept both --flag=value and --flag value forms.
    const eq = arg.indexOf('=');
    if (eq !== -1) {
      flags[arg.slice(2, eq)] = arg.slice(eq + 1);
    } else if (args[i + 1] && !args[i + 1].startsWith('--')) {
      flags[arg.slice(2)] = args[i + 1];
      i++;
    }
  }
  return { command, flags };
}

// The CLAUDE.snippet.md template wraps the pasteable convention block in marker
// comments and precedes it with human-facing paste instructions. Install only the
// block between the markers so those instructions do not leak into CLAUDE.md.
function extractSnippetBlock(content) {
  // Match the full marker comments, not loose substrings: a stray "to here" inside
  // the block must not truncate extraction and leak the paste instructions.
  const START = '<!-- ===== paste from here ===== -->';
  const END = '<!-- ===== to here ===== -->';
  const start = content.indexOf(START);
  const end = content.indexOf(END, start + START.length);
  if (start === -1 || end === -1) return content.trim();
  return content.slice(start + START.length, end).trim();
}

// Resolve the requested agents to a deduped list of absolute skill dirs.
function resolveSkillDirs({ agentArg, isGlobal, targetRoot }) {
  let rel; // project-relative skill dirs
  if (agentArg === 'all') {
    rel = ['.claude/skills', '.codex/skills', '.agents/skills'];
  } else if (agentArg === 'auto') {
    const detected = new Set();
    for (const { marker, agent } of AUTO_MARKERS) {
      if (existsSync(resolve(targetRoot, marker))) detected.add(AGENT_DIRS[agent]);
    }
    // Nothing detected: fall back to the shared interop path so the default install
    // still lands something usable, rather than erroring on a fresh project.
    rel = detected.size ? [...detected] : ['.agents/skills'];
  } else {
    const names = agentArg.split(',').map((s) => s.trim()).filter(Boolean);
    if (names.length === 0) {
      return {
        dirs: [],
        error: `--agent needs at least one agent name. Valid: ${Object.keys(AGENT_DIRS).join(', ')}, all, auto`,
      };
    }
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
  // On Windows the launcher is npx.cmd; spawn cannot resolve/run a .cmd without a
  // shell, so it needs shell:true there. The override path is a real executable
  // (process.execPath), which must stay shell-free to avoid arg-quoting issues.
  const child = spawn(cmd, [...baseArgs, ...forwarded], {
    stdio: 'inherit',
    shell: !overrideBin && process.platform === 'win32',
  });
  child.on('error', (err) => {
    console.error(`Failed to launch dashboard: ${err.message}`);
    process.exit(1);
  });
  // A signal-terminated child reports code === null; treat that as failure (exit 1)
  // rather than coercing it to 0, so wrappers/CI see the crash.
  child.on('exit', (code, signal) => process.exit(signal ? 1 : (code ?? 0)));

} else if (command === 'init') {
  const isGlobal = rawArgs.includes('--global');
  const isForce = rawArgs.includes('--force') || rawArgs.includes('-f');
  const noSkills = rawArgs.includes('--no-skills');
  const targetRoot = process.cwd();
  // Track whether any step actually errored (not just "already exists / skipped")
  // so init can do as much setup as possible and still exit non-zero at the end.
  let hadError = false;

  // Skills install is ON by default; --no-skills opts out, --agent overrides the
  // target. Resolve the install targets NOW, before we scaffold, so `--agent auto`
  // (the default) detects the project's pre-existing agent markers -- not the
  // AGENTS.md / CLAUDE.md that init itself is about to write. Snapshotting here is
  // what keeps auto from always matching the CLAUDE.md marker init just created.
  const wantsSkills = !noSkills;
  let skillDirs = [];
  let skillError = null;
  if (wantsSkills) {
    ({ dirs: skillDirs, error: skillError } = resolveSkillDirs({
      agentArg: flags.agent ?? 'auto',
      isGlobal,
      targetRoot,
    }));
  }

  // A bad --agent value is a usage error: fail before touching the filesystem so a
  // typo (e.g. --agent claud) does not leave a half-initialized repo behind.
  if (skillError) {
    console.error(`Error: ${skillError}`);
    process.exit(1);
  }

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

  // git does not track empty directories; drop a .gitkeep in each so the scaffold
  // survives commit. Without this, log/ vanishes on a fresh clone and the dashboard
  // (which stats wherefore/log) refuses to launch even though init reported success.
  for (const dir of [logDir, questionsDir, planDir]) {
    const keep = resolve(dir, '.gitkeep');
    if (!existsSync(keep)) await writeFile(keep, '', 'utf8');
  }

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
  } else {
    // wherefore works in any repo (the log is just markdown); we don't fabricate a
    // package.json for non-Node projects, but say so rather than silently skipping.
    console.log('  No package.json found; skipped pinning the wherefore devDependency (run the dashboard via npx @dustinvk/wherefore-dashboard).');
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
  // Only overwrite an existing AGENTS.md under --force when it is our own managed
  // floor (it carries the template's marker heading). A hand-written AGENTS.md is
  // never clobbered: users run --force to refresh skills, and that must not silently
  // destroy custom agent guidance. (CLAUDE.md is handled idempotently below.)
  let agentsManaged = false;
  if (agentsExists) {
    try {
      agentsManaged = (await readFile(agentsPath, 'utf8')).includes('wherefore: agent instructions');
    } catch (_) {}
  }
  if (!agentsExists || (isForce && agentsManaged)) {
    try {
      await cp(templateAgentsPath, agentsPath);
      console.log(`  Created AGENTS.md in project root${isForce && agentsExists ? ' (overwritten)' : ''}.`);
    } catch (err) {
      console.warn(`  Warning: Could not create AGENTS.md: ${err.message}`);
      hadError = true;
    }
  } else if (isForce && !agentsManaged) {
    console.warn('  AGENTS.md exists with custom content; not overwriting even with --force. Merge the wherefore floor manually.');
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

  // 7. Install agent skills (on by default; --no-skills opts out). Targets were
  // resolved up front against the project's pre-scaffold state (see above), so
  // auto-detection is not fooled by the AGENTS.md / CLAUDE.md written in between.
  if (!wantsSkills) {
    console.log('Skipping agent skill install (--no-skills).');
  } else {
    for (const skillsDir of skillDirs) {
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
            // topics.seed.md is a seed init already used to write wherefore/topics.md;
            // it is not part of the runtime skill, so keep it out of the installed copy.
            await cp(resolve(PACKAGE_ROOT, 'skills', skill), tmpDest, {
              recursive: true,
              filter: (src) => !src.endsWith('topics.seed.md'),
            });
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
