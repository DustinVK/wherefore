import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BIN = resolve(__dirname, '..', 'bin', 'wherefore.js');

const SKILLS = ['capture', 'ask', 'resolve', 'supersede'];

function spawn(args, opts = {}) {
  return spawnSync(process.execPath, [BIN, ...args], {
    encoding: 'utf-8',
    timeout: opts.timeout ?? 10000,
    cwd: opts.cwd,
    env: { ...process.env, ...(opts.env ?? {}) },
  });
}

function uniqueTemp(label) {
  return resolve(tmpdir(), `wherefore-test-${label}-${Date.now()}`);
}

function withProject(label, fn) {
  const cwd = uniqueTemp(label);
  mkdirSync(cwd, { recursive: true });
  writeFileSync(resolve(cwd, 'package.json'), JSON.stringify({ name: 'test-project', version: '1.0.0' }, null, 2), 'utf8');
  try {
    fn(cwd);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
}

// True iff every skill installed under `<cwd>/<root>/skills`.
function hasSkills(cwd, root) {
  return SKILLS.every((s) => existsSync(resolve(cwd, root, 'skills', s, 'SKILL.md')));
}

test('--help exits 0 and does not scaffold', () => {
  const cwd = uniqueTemp('help');
  mkdirSync(cwd, { recursive: true });
  try {
    const result = spawn(['--help'], { cwd });
    assert.equal(result.status, 0);
    assert.ok(!existsSync(resolve(cwd, 'wherefore')), 'help must not scaffold');
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test('default init scaffolds the log + AGENTS.md floor AND installs skills (auto)', () => {
  withProject('default', (cwd) => {
    const result = spawn(['init'], { cwd });
    assert.equal(result.status, 0);

    assert.ok(existsSync(resolve(cwd, 'wherefore', 'log')), 'missing wherefore/log');
    assert.ok(existsSync(resolve(cwd, 'wherefore', 'questions')), 'missing wherefore/questions');
    assert.ok(existsSync(resolve(cwd, 'wherefore', 'plan')), 'missing wherefore/plan');
    assert.ok(existsSync(resolve(cwd, 'wherefore', 'topics.md')), 'missing topics.md');
    assert.ok(existsSync(resolve(cwd, 'AGENTS.md')), 'missing AGENTS.md');
    assert.ok(existsSync(resolve(cwd, 'CLAUDE.md')), 'missing CLAUDE.md');

    const pkg = JSON.parse(readFileSync(resolve(cwd, 'package.json'), 'utf8'));
    assert.ok(pkg.devDependencies['wherefore'], 'missing wherefore devDependency');

    // No agent markers present, so auto falls back to the shared .agents/skills path.
    assert.ok(hasSkills(cwd, '.agents'), 'default should install the shared .agents/skills');
    assert.ok(!existsSync(resolve(cwd, '.claude', 'skills')), 'no .claude marker => no .claude/skills');
    assert.ok(!existsSync(resolve(cwd, '.codex', 'skills')), 'no .codex marker => no .codex/skills');
  });
});

test('default init auto-detects a pre-existing agent marker (.claude)', () => {
  withProject('auto-detect', (cwd) => {
    mkdirSync(resolve(cwd, '.claude'), { recursive: true });
    const result = spawn(['init'], { cwd });
    assert.equal(result.status, 0);
    assert.ok(hasSkills(cwd, '.claude'), 'auto should install for the detected .claude marker');
    assert.ok(!existsSync(resolve(cwd, '.agents', 'skills')), 'detected a marker => no shared fallback');
    assert.ok(!existsSync(resolve(cwd, '.codex', 'skills')), 'should not install undetected codex');
  });
});

// Regression: init writes CLAUDE.md as part of scaffolding. Auto-detection must run
// against the PRE-scaffold state, so a codex-only project must NOT also get claude
// skills just because init created a CLAUDE.md along the way.
test('default init auto does not self-detect the CLAUDE.md it writes', () => {
  withProject('auto-regression', (cwd) => {
    mkdirSync(resolve(cwd, '.codex'), { recursive: true });
    const result = spawn(['init'], { cwd });
    assert.equal(result.status, 0);
    assert.ok(existsSync(resolve(cwd, 'CLAUDE.md')), 'init should still write CLAUDE.md');
    assert.ok(hasSkills(cwd, '.codex'), 'auto should install for the detected .codex marker');
    assert.ok(!existsSync(resolve(cwd, '.claude', 'skills')), 'must NOT install claude from its own CLAUDE.md');
    assert.ok(!existsSync(resolve(cwd, '.agents', 'skills')), 'detected codex => no shared fallback');
  });
});

test('init --no-skills scaffolds the floor but installs no skills anywhere', () => {
  withProject('no-skills', (cwd) => {
    const result = spawn(['init', '--no-skills'], { cwd });
    assert.equal(result.status, 0);

    // Floor is still scaffolded.
    assert.ok(existsSync(resolve(cwd, 'wherefore', 'topics.md')), 'missing topics.md');
    assert.ok(existsSync(resolve(cwd, 'AGENTS.md')), 'missing AGENTS.md');
    assert.ok(existsSync(resolve(cwd, 'CLAUDE.md')), 'missing CLAUDE.md');

    // But no skills, in any root.
    for (const root of ['.agents', '.claude', '.codex']) {
      assert.ok(!existsSync(resolve(cwd, root, 'skills')), `--no-skills must not install ${root}/skills`);
    }
  });
});

test('init --no-skills wins even if a marker is present', () => {
  withProject('no-skills-marker', (cwd) => {
    mkdirSync(resolve(cwd, '.claude'), { recursive: true });
    const result = spawn(['init', '--no-skills'], { cwd });
    assert.equal(result.status, 0);
    assert.ok(!existsSync(resolve(cwd, '.claude', 'skills')), '--no-skills must override auto-detection');
  });
});

test('init --agent claude overrides auto and installs only claude', () => {
  withProject('agent-one', (cwd) => {
    const result = spawn(['init', '--agent', 'claude'], { cwd });
    assert.equal(result.status, 0);
    assert.ok(hasSkills(cwd, '.claude'), 'missing claude skills');
    assert.ok(!existsSync(resolve(cwd, '.agents', 'skills')), 'named agent => no shared fallback');
    assert.ok(!existsSync(resolve(cwd, '.codex', 'skills')), 'should not install unrequested codex');
  });
});

test('init does not leak topics.seed.md into installed skill dirs', () => {
  withProject('seed-leak', (cwd) => {
    const result = spawn(['init', '--agent', 'claude'], { cwd });
    assert.equal(result.status, 0);
    assert.ok(existsSync(resolve(cwd, '.claude', 'skills', 'capture', 'SKILL.md')), 'capture SKILL.md should install');
    assert.ok(!existsSync(resolve(cwd, '.claude', 'skills', 'capture', 'topics.seed.md')), 'topics.seed.md must not ride into the installed skill');
    // The seed is still consumed: init writes wherefore/topics.md from it.
    assert.ok(existsSync(resolve(cwd, 'wherefore', 'topics.md')), 'topics.md should still be seeded');
  });
});

test('init --agent claude,codex writes only those targets', () => {
  withProject('named', (cwd) => {
    const result = spawn(['init', '--agent', 'claude,codex'], { cwd });
    assert.equal(result.status, 0);
    assert.ok(hasSkills(cwd, '.claude'), 'missing claude skills');
    assert.ok(hasSkills(cwd, '.codex'), 'missing codex skills');
    assert.ok(!existsSync(resolve(cwd, '.agents', 'skills')), 'should not write .agents/skills for named agents');
  });
});

test('init --agent all writes all three roots', () => {
  withProject('all', (cwd) => {
    const result = spawn(['init', '--agent', 'all'], { cwd });
    assert.equal(result.status, 0);
    assert.ok(hasSkills(cwd, '.claude'), 'missing claude');
    assert.ok(hasSkills(cwd, '.codex'), 'missing codex');
    assert.ok(hasSkills(cwd, '.agents'), 'missing agents');
  });
});

test('init --agent auto installs for detected markers only', () => {
  withProject('auto-explicit', (cwd) => {
    mkdirSync(resolve(cwd, '.codex'), { recursive: true });
    const result = spawn(['init', '--agent', 'auto'], { cwd });
    assert.equal(result.status, 0);
    assert.ok(hasSkills(cwd, '.codex'), 'auto should install codex');
    assert.ok(!existsSync(resolve(cwd, '.claude', 'skills')), 'auto should not install undetected claude');
    assert.ok(!existsSync(resolve(cwd, '.cursor', 'skills')), 'auto should not install undetected cursor');
  });
});

test('init --agent bogus exits non-zero', () => {
  withProject('bogus', (cwd) => {
    const result = spawn(['init', '--agent', 'bogus'], { cwd });
    assert.notEqual(result.status, 0);
  });
});

test('init --agent=claude (equals form) installs claude, not the auto fallback', () => {
  withProject('agent-eq', (cwd) => {
    const result = spawn(['init', '--agent=claude'], { cwd });
    assert.equal(result.status, 0);
    assert.ok(hasSkills(cwd, '.claude'), 'equals form should install claude');
    assert.ok(!existsSync(resolve(cwd, '.agents', 'skills')), 'must not fall back to auto/.agents');
  });
});

test('init --agent=bogus (equals form) is validated too', () => {
  withProject('agent-eq-bogus', (cwd) => {
    const result = spawn(['init', '--agent=bogus'], { cwd });
    assert.notEqual(result.status, 0);
  });
});

test('init --agent , (empty list) exits non-zero', () => {
  withProject('agent-empty', (cwd) => {
    const result = spawn(['init', '--agent', ','], { cwd });
    assert.notEqual(result.status, 0);
  });
});

test('a bad --agent value fails before scaffolding anything', () => {
  withProject('agent-failfast', (cwd) => {
    const result = spawn(['init', '--agent', 'claud'], { cwd });
    assert.notEqual(result.status, 0);
    assert.ok(!existsSync(resolve(cwd, 'wherefore')), 'must not scaffold wherefore/ on a usage error');
    assert.ok(!existsSync(resolve(cwd, 'AGENTS.md')), 'must not write AGENTS.md on a usage error');
  });
});

test('init without a package.json notes the skipped devDependency and still succeeds', () => {
  const cwd = uniqueTemp('no-pkg');
  mkdirSync(cwd, { recursive: true });
  try {
    const result = spawn(['init', '--no-skills'], { cwd });
    assert.equal(result.status, 0);
    assert.ok(!existsSync(resolve(cwd, 'package.json')), 'must not fabricate a package.json');
    assert.ok(/No package\.json found/.test(result.stdout), 'should note the skipped devDependency');
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test('init --agent claude skips existing skill, --force overwrites', () => {
  withProject('force', (cwd) => {
    mkdirSync(resolve(cwd, '.claude', 'skills', 'capture'), { recursive: true });
    writeFileSync(resolve(cwd, '.claude', 'skills', 'capture', 'SKILL.md'), 'custom-capture', 'utf8');

    const r1 = spawn(['init', '--agent', 'claude'], { cwd });
    assert.equal(r1.status, 0);
    assert.equal(readFileSync(resolve(cwd, '.claude', 'skills', 'capture', 'SKILL.md'), 'utf8'), 'custom-capture');

    const r2 = spawn(['init', '--agent', 'claude', '--force'], { cwd });
    assert.equal(r2.status, 0);
    assert.notEqual(readFileSync(resolve(cwd, '.claude', 'skills', 'capture', 'SKILL.md'), 'utf8'), 'custom-capture');
  });
});

test('init preserves a custom AGENTS.md; --force refreshes only a managed one', () => {
  withProject('agents-md', (cwd) => {
    const agentsPath = resolve(cwd, 'AGENTS.md');
    const custom = 'CUSTOM TEAM GUIDANCE\n';
    writeFileSync(agentsPath, custom, 'utf8');

    // Plain init must not touch an existing AGENTS.md.
    const r1 = spawn(['init', '--no-skills'], { cwd });
    assert.equal(r1.status, 0);
    assert.equal(readFileSync(agentsPath, 'utf8'), custom, 'plain init must preserve AGENTS.md');

    // --force must NOT clobber a foreign AGENTS.md: refreshing skills can't destroy custom content.
    const r2 = spawn(['init', '--no-skills', '--force'], { cwd });
    assert.equal(r2.status, 0);
    assert.equal(readFileSync(agentsPath, 'utf8'), custom, '--force must not overwrite a custom AGENTS.md');

    // Once it is our managed floor, --force refreshes it (drops a local edit).
    rmSync(agentsPath);
    assert.equal(spawn(['init', '--no-skills'], { cwd }).status, 0);
    assert.ok(readFileSync(agentsPath, 'utf8').includes('wherefore: agent instructions'), 'managed floor written');
    writeFileSync(agentsPath, readFileSync(agentsPath, 'utf8') + '\nLOCAL EDIT\n', 'utf8');
    assert.equal(spawn(['init', '--no-skills', '--force'], { cwd }).status, 0);
    assert.ok(!readFileSync(agentsPath, 'utf8').includes('LOCAL EDIT'), '--force should refresh a managed AGENTS.md');
  });
});

test('init --global --agent claude installs into ~/.claude/skills (temp HOME)', () => {
  const home = uniqueTemp('home');
  mkdirSync(home, { recursive: true });
  try {
    withProject('global', (cwd) => {
      const result = spawn(['init', '--global', '--agent', 'claude'], { cwd, env: { HOME: home } });
      assert.equal(result.status, 0);
      assert.ok(existsSync(resolve(home, '.claude', 'skills', 'capture', 'SKILL.md')), 'missing global claude skill');
      assert.ok(!existsSync(resolve(cwd, '.claude', 'skills')), 'global install must not write into the project');
    });
  } finally {
    rmSync(home, { recursive: true, force: true });
  }
});

test('CLAUDE.md gets only the marked block, not the paste instructions', () => {
  withProject('claude-md', (cwd) => {
    const result = spawn(['init'], { cwd });
    assert.equal(result.status, 0);
    const claude = readFileSync(resolve(cwd, 'CLAUDE.md'), 'utf8');
    assert.ok(claude.includes('## Wherefore'), 'missing snippet');
    assert.ok(!claude.includes('paste from here'), 'leaked paste-marker comments');
    assert.ok(!claude.includes('Paste the block below'), 'leaked paste instructions');
  });
});

test('init adds a top-level dist/ rule even when a nested dist/ is already ignored', () => {
  withProject('gitignore', (cwd) => {
    writeFileSync(resolve(cwd, '.gitignore'), 'node_modules/\nfrontend/dist/\n', 'utf8');
    const result = spawn(['init'], { cwd });
    assert.equal(result.status, 0);
    const lines = readFileSync(resolve(cwd, '.gitignore'), 'utf8').split('\n').map((l) => l.trim());
    assert.ok(lines.includes('dist/'), 'should add a bare dist/ rule');
  });
});

test('init preserves existing package.json indentation and trailing newline', () => {
  const cwd = uniqueTemp('pkgfmt');
  mkdirSync(cwd, { recursive: true });
  writeFileSync(resolve(cwd, 'package.json'), JSON.stringify({ name: 'p', version: '1.0.0' }, null, 4) + '\n', 'utf8');
  try {
    const result = spawn(['init'], { cwd });
    assert.equal(result.status, 0);
    const updated = readFileSync(resolve(cwd, 'package.json'), 'utf8');
    assert.ok(updated.includes('\n    "'), 'should keep 4-space indentation');
    assert.ok(updated.endsWith('\n'), 'should keep trailing newline');
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test('dashboard subcommand forwards args to the launcher and propagates exit code', () => {
  const cwd = uniqueTemp('dash');
  mkdirSync(cwd, { recursive: true });
  // Stub stands in for the dashboard bin: echoes its args, exits with a fixed code.
  const stub = resolve(cwd, 'stub.js');
  writeFileSync(stub, 'console.log(process.argv.slice(2).join(" ")); process.exit(7);', 'utf8');
  try {
    const result = spawn(['dashboard', 'build', '--src', 'x'], { cwd, env: { WHEREFORE_DASHBOARD_BIN: stub } });
    assert.equal(result.status, 7, 'should propagate the child exit code');
    assert.ok(result.stdout.includes('build --src x'), 'should forward args to the dashboard');
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});
