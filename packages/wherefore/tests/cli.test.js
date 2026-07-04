import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BIN = resolve(__dirname, '..', 'bin', 'wherefore.js');

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

test('default init scaffolds the log + AGENTS.md floor but installs NO skills', () => {
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

    // No skills by default.
    assert.ok(!existsSync(resolve(cwd, '.agents', 'skills')), 'must not install .agents/skills by default');
    assert.ok(!existsSync(resolve(cwd, '.claude', 'skills')), 'must not install .claude/skills by default');
    assert.ok(!existsSync(resolve(cwd, '.codex', 'skills')), 'must not install .codex/skills by default');
  });
});

test('init --skills installs into the shared .agents/skills path', () => {
  withProject('skills', (cwd) => {
    const result = spawn(['init', '--skills'], { cwd });
    assert.equal(result.status, 0);
    for (const skill of ['capture', 'ask', 'resolve', 'supersede']) {
      assert.ok(
        existsSync(resolve(cwd, '.agents', 'skills', skill, 'SKILL.md')),
        `missing .agents/skills/${skill}/SKILL.md`
      );
    }
    assert.ok(!existsSync(resolve(cwd, '.claude', 'skills')), 'should not touch .claude/skills');
  });
});

test('init --skills --agent claude,codex writes only those targets', () => {
  withProject('named', (cwd) => {
    const result = spawn(['init', '--skills', '--agent', 'claude,codex'], { cwd });
    assert.equal(result.status, 0);
    assert.ok(existsSync(resolve(cwd, '.claude', 'skills', 'capture', 'SKILL.md')), 'missing claude skill');
    assert.ok(existsSync(resolve(cwd, '.codex', 'skills', 'capture', 'SKILL.md')), 'missing codex skill');
    assert.ok(!existsSync(resolve(cwd, '.agents', 'skills')), 'should not write .agents/skills for named agents');
  });
});

test('init --skills --agent all writes all three roots', () => {
  withProject('all', (cwd) => {
    const result = spawn(['init', '--skills', '--agent', 'all'], { cwd });
    assert.equal(result.status, 0);
    assert.ok(existsSync(resolve(cwd, '.claude', 'skills', 'ask', 'SKILL.md')), 'missing claude');
    assert.ok(existsSync(resolve(cwd, '.codex', 'skills', 'ask', 'SKILL.md')), 'missing codex');
    assert.ok(existsSync(resolve(cwd, '.agents', 'skills', 'ask', 'SKILL.md')), 'missing agents');
  });
});

test('init --skills --agent auto installs for detected markers only', () => {
  withProject('auto', (cwd) => {
    mkdirSync(resolve(cwd, '.codex'), { recursive: true });
    const result = spawn(['init', '--skills', '--agent', 'auto'], { cwd });
    assert.equal(result.status, 0);
    assert.ok(existsSync(resolve(cwd, '.codex', 'skills', 'capture', 'SKILL.md')), 'auto should install codex');
    assert.ok(!existsSync(resolve(cwd, '.cursor', 'skills')), 'auto should not install undetected cursor');
  });
});

test('init --agent bogus exits non-zero', () => {
  withProject('bogus', (cwd) => {
    const result = spawn(['init', '--skills', '--agent', 'bogus'], { cwd });
    assert.notEqual(result.status, 0);
  });
});

test('init --agent claude skips existing skill, --force overwrites', () => {
  withProject('force', (cwd) => {
    mkdirSync(resolve(cwd, '.claude', 'skills', 'capture'), { recursive: true });
    writeFileSync(resolve(cwd, '.claude', 'skills', 'capture', 'SKILL.md'), 'custom-capture', 'utf8');

    const r1 = spawn(['init', '--skills', '--agent', 'claude'], { cwd });
    assert.equal(r1.status, 0);
    assert.equal(readFileSync(resolve(cwd, '.claude', 'skills', 'capture', 'SKILL.md'), 'utf8'), 'custom-capture');

    const r2 = spawn(['init', '--skills', '--agent', 'claude', '--force'], { cwd });
    assert.equal(r2.status, 0);
    assert.notEqual(readFileSync(resolve(cwd, '.claude', 'skills', 'capture', 'SKILL.md'), 'utf8'), 'custom-capture');
  });
});

test('init --global --agent claude installs into ~/.claude/skills (temp HOME)', () => {
  const home = uniqueTemp('home');
  mkdirSync(home, { recursive: true });
  withProject('global', (cwd) => {
    const result = spawn(['init', '--global', '--agent', 'claude'], { cwd, env: { HOME: home } });
    assert.equal(result.status, 0);
    assert.ok(existsSync(resolve(home, '.claude', 'skills', 'capture', 'SKILL.md')), 'missing global claude skill');
  });
  rmSync(home, { recursive: true, force: true });
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
