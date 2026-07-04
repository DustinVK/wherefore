// Shared test scaffolding: the bin path, the fixtures dir, and helpers for
// spawning the CLI and minting unique temp dirs. Imported by the *.test files
// so these paths and the spawn/cleanup dance live in one place.

import { spawnSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const BIN = resolve(__dirname, '..', 'bin', 'wherefore-dashboard.js');
export const FIXTURES = resolve(__dirname, 'fixtures', 'wherefore');

/** Run the dashboard CLI with the given args; returns the spawnSync result. */
export function runBin(args, opts = {}) {
  return spawnSync(process.execPath, [BIN, ...args], {
    encoding: 'utf-8',
    timeout: opts.timeout ?? 10000,
    cwd: opts.cwd,
  });
}

/** A unique temp path (pid + timestamp so concurrent processes never collide). */
export function uniqueTemp(label) {
  return resolve(tmpdir(), `wherefore-dashboard-test-${label}-${process.pid}-${Date.now()}`);
}
