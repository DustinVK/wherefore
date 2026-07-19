// Unit tests for the cross-link map builder and href rewriter. buildMdLinkMap
// scans the fixture wherefore dir; rewriteMdHref is pure.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildMdLinkMap, rewriteMdHref } from '../src/lib/md-links.mjs';
import { FIXTURES } from './helpers.mjs';

test('buildMdLinkMap maps plan by id, questions to /questions, log by slug', () => {
  const map = buildMdLinkMap(FIXTURES);

  // plan: filename -> /plan/<id> (id from frontmatter, not the filename)
  assert.equal(map.get('P-001-checkout-rate-limiter.md'), '/plan/P-001');
  assert.equal(map.get('P-004-billing-webhook-retries.md'), '/plan/P-004');
  // plan/README.md is not an item and must not be mapped
  assert.equal(map.has('README.md'), false);

  // questions: filename -> /questions (single page, no per-question route)
  assert.equal(map.get('Q-001.md'), '/questions');

  // log: filename -> /log/<slug> (slug = filename without .md)
  assert.equal(map.get('2026-01-03-replacement-example.md'), '/log/2026-01-03-replacement-example');
});

test('buildMdLinkMap returns an empty map when src is undefined', () => {
  assert.equal(buildMdLinkMap(undefined).size, 0);
});

test('rewriteMdHref resolves known relative .md links, preserving fragments', () => {
  const map = buildMdLinkMap(FIXTURES);

  assert.equal(rewriteMdHref('P-001-checkout-rate-limiter.md', map), '/plan/P-001');
  // cross-collection relative path resolves by basename
  assert.equal(rewriteMdHref('../log/2026-01-03-replacement-example.md', map), '/log/2026-01-03-replacement-example');
  // fragment is carried through
  assert.equal(rewriteMdHref('P-001-checkout-rate-limiter.md#why', map), '/plan/P-001#why');
});

test('rewriteMdHref leaves everything else untouched', () => {
  const map = buildMdLinkMap(FIXTURES);

  assert.equal(rewriteMdHref('https://example.com/a.md', map), 'https://example.com/a.md');
  assert.equal(rewriteMdHref('/log/already-a-route', map), '/log/already-a-route');
  assert.equal(rewriteMdHref('#anchor', map), '#anchor');
  assert.equal(rewriteMdHref('P-999-does-not-exist.md', map), 'P-999-does-not-exist.md');
  assert.equal(rewriteMdHref('notes.txt', map), 'notes.txt');
  assert.equal(rewriteMdHref('', map), '');
});
