// Unit tests for parseTopics -- reads a topics.md and returns the two-facet vocab.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { parseTopics } from '../src/lib/topics.ts';
import { FIXTURES } from './helpers.mjs';

test('parseTopics reads Areas and Topics sections from topics.md', () => {
  const vocab = parseTopics(FIXTURES);
  assert.deepEqual(vocab.areas, ['checkout', 'billing', 'catalog']);
  assert.deepEqual(vocab.topics, ['auth', 'api-design', 'performance', 'data-model']);
});

test('parseTopics returns empty vocab when topics.md is missing', () => {
  const vocab = parseTopics(resolve(FIXTURES, '..', 'no-such-dir'));
  assert.deepEqual(vocab, { areas: [], topics: [] });
});
