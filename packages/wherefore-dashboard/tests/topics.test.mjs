// Unit tests for parseTopics -- reads a topics.md and returns the two-facet vocab.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseTopics } from '../src/lib/topics.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURE = resolve(__dirname, 'fixtures', 'wherefore');

test('parseTopics reads Areas and Topics sections from topics.md', () => {
  const vocab = parseTopics(FIXTURE);
  assert.deepEqual(vocab.areas, ['checkout', 'billing', 'catalog']);
  assert.deepEqual(vocab.topics, ['auth', 'api-design', 'performance', 'data-model']);
});

test('parseTopics returns empty vocab when topics.md is missing', () => {
  const vocab = parseTopics(resolve(__dirname, 'no-such-dir'));
  assert.deepEqual(vocab, { areas: [], topics: [] });
});
