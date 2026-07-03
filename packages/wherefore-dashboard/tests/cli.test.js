import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { runBin, uniqueTemp, FIXTURES } from './helpers.mjs';

test('--help exits 0 and does not create dist/', () => {
  const tempCwd = uniqueTemp('help-cwd');
  mkdirSync(tempCwd, { recursive: true });
  try {
    const result = runBin(['--help'], { cwd: tempCwd });
    assert.equal(result.status, 0);
    assert.ok(!existsSync(resolve(tempCwd, 'dist')), 'help must not create dist/');
  } finally {
    rmSync(tempCwd, { recursive: true, force: true });
  }
});

test('build --help exits 0 and does not create dist/', () => {
  const tempCwd = uniqueTemp('build-help-cwd');
  mkdirSync(tempCwd, { recursive: true });
  try {
    const result = runBin(['build', '--help'], { cwd: tempCwd });
    assert.equal(result.status, 0);
    assert.ok(!existsSync(resolve(tempCwd, 'dist')), 'build --help must not create dist/');
  } finally {
    rmSync(tempCwd, { recursive: true, force: true });
  }
});

test('build with missing src exits 1', () => {
  const nonexistent = resolve(tmpdir(), `wherefore-no-such-${process.pid}-${Date.now()}`);
  const result = runBin(['build', '--src', nonexistent]);
  assert.equal(result.status, 1);
});

test('dev with missing src exits 1', () => {
  const nonexistent = resolve(tmpdir(), `wherefore-no-such-${process.pid}-${Date.now()}`);
  const result = runBin(['dev', '--src', nonexistent], { timeout: 5000 });
  assert.equal(result.status, 1);
});

test('build happy path produces expected output files', { timeout: 60000 }, () => {
  const out = uniqueTemp('build-out');
  try {
    const result = runBin(['build', '--src', FIXTURES, '--out', out], { timeout: 60000 });
    assert.equal(result.status, 0);

    assert.ok(existsSync(resolve(out, 'index.html')), 'missing index.html');
    assert.ok(existsSync(resolve(out, 'log', 'index.html')), 'missing log/index.html');
    assert.ok(existsSync(resolve(out, 'questions', 'index.html')), 'missing questions/index.html');
    assert.ok(existsSync(resolve(out, 'tags', 'index.html')), 'missing tags/index.html');
    assert.ok(
      existsSync(resolve(out, 'log', '2026-01-01-active-example', 'index.html')),
      'missing log/2026-01-01-active-example/index.html'
    );
    assert.ok(
      existsSync(resolve(out, 'log', '2026-01-02-superseded-example', 'index.html')),
      'missing log/2026-01-02-superseded-example/index.html'
    );
  } finally {
    if (existsSync(out)) rmSync(out, { recursive: true, force: true });
  }
});

test('init command scaffolds expected directories and files', () => {
  const tempCwd = uniqueTemp('init-cwd');
  mkdirSync(tempCwd, { recursive: true });
  // write a dummy package.json to test scaffolding
  const dummyPkg = { name: "test-project", version: "1.0.0" };
  writeFileSync(resolve(tempCwd, 'package.json'), JSON.stringify(dummyPkg, null, 2), 'utf8');
  
  try {
    const result = runBin(['init'], { cwd: tempCwd });
    assert.equal(result.status, 0);

    // Verify wherefore directories and seeded topics.md
    assert.ok(existsSync(resolve(tempCwd, 'wherefore', 'log')), 'missing wherefore/log');
    assert.ok(existsSync(resolve(tempCwd, 'wherefore', 'questions')), 'missing wherefore/questions');
    assert.ok(existsSync(resolve(tempCwd, 'wherefore', 'plan')), 'missing wherefore/plan');
    assert.ok(existsSync(resolve(tempCwd, 'wherefore', 'topics.md')), 'missing wherefore/topics.md');

    // Verify package.json updated
    const updatedPkg = JSON.parse(readFileSync(resolve(tempCwd, 'package.json'), 'utf8'));
    assert.ok(updatedPkg.devDependencies['@dustinvk/wherefore-dashboard'], 'missing devDependency');

    // Verify .gitignore updated
    const gitignore = readFileSync(resolve(tempCwd, '.gitignore'), 'utf8');
    assert.ok(gitignore.includes('dist/'), 'missing dist/ in gitignore');
    assert.ok(gitignore.includes('.test-dist/'), 'missing .test-dist/ in gitignore');

    // Verify AGENTS.md and CLAUDE.md
    assert.ok(existsSync(resolve(tempCwd, 'AGENTS.md')), 'missing AGENTS.md');
    assert.ok(existsSync(resolve(tempCwd, 'CLAUDE.md')), 'missing CLAUDE.md');
    const claudeContent = readFileSync(resolve(tempCwd, 'CLAUDE.md'), 'utf8');
    assert.ok(claudeContent.includes('## Wherefore'), 'missing CLAUDE.md snippet');

    // Verify local Antigravity skills
    assert.ok(existsSync(resolve(tempCwd, '.agents', 'skills', 'capture', 'SKILL.md')), 'missing capture skill');
    assert.ok(existsSync(resolve(tempCwd, '.agents', 'skills', 'ask', 'SKILL.md')), 'missing ask skill');
    assert.ok(existsSync(resolve(tempCwd, '.agents', 'skills', 'resolve', 'SKILL.md')), 'missing resolve skill');
    assert.ok(existsSync(resolve(tempCwd, '.agents', 'skills', 'supersede', 'SKILL.md')), 'missing supersede skill');

  } finally {
    rmSync(tempCwd, { recursive: true, force: true });
  }
});
