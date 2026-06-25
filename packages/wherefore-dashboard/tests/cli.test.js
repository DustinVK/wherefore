import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BIN = resolve(__dirname, '..', 'bin', 'wherefore-dashboard.js');
const FIXTURES_WHEREFORE = resolve(__dirname, 'fixtures', 'wherefore');

function spawn(args, opts = {}) {
  return spawnSync(process.execPath, [BIN, ...args], {
    encoding: 'utf-8',
    timeout: opts.timeout ?? 10000,
    cwd: opts.cwd,
  });
}

function uniqueTemp(label) {
  return resolve(tmpdir(), `wherefore-dashboard-test-${label}-${Date.now()}`);
}

test('--help exits 0 and does not create dist/', () => {
  const tempCwd = uniqueTemp('help-cwd');
  mkdirSync(tempCwd, { recursive: true });
  try {
    const result = spawn(['--help'], { cwd: tempCwd });
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
    const result = spawn(['build', '--help'], { cwd: tempCwd });
    assert.equal(result.status, 0);
    assert.ok(!existsSync(resolve(tempCwd, 'dist')), 'build --help must not create dist/');
  } finally {
    rmSync(tempCwd, { recursive: true, force: true });
  }
});

test('build with missing src exits 1', () => {
  const nonexistent = resolve(tmpdir(), `wherefore-no-such-${Date.now()}`);
  const result = spawn(['build', '--src', nonexistent]);
  assert.equal(result.status, 1);
});

test('dev with missing src exits 1', () => {
  const nonexistent = resolve(tmpdir(), `wherefore-no-such-${Date.now()}`);
  const result = spawn(['dev', '--src', nonexistent], { timeout: 5000 });
  assert.equal(result.status, 1);
});

test('build happy path produces expected output files', { timeout: 60000 }, () => {
  const out = uniqueTemp('build-out');
  try {
    const result = spawn(['build', '--src', FIXTURES_WHEREFORE, '--out', out], { timeout: 60000 });
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
