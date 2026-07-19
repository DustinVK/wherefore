// Contract tripwire: verifies fixture files have the exact frontmatter keys the
// capture and supersede skills write. Fails loudly if the skill format changes
// without updating the fixtures (and vice versa).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { FIXTURES as FIXTURE } from './helpers.mjs';

function frontmatterKeys(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return [];
  return match[1].split('\n').map(l => l.split(':')[0].trim()).filter(Boolean);
}

test('log fixtures -- required frontmatter keys', () => {
  const required = ['date', 'title', 'areas', 'topics', 'stories', 'status',
    'supersedes', 'superseded_by', 'superseded_date'];
  const files = readdirSync(resolve(FIXTURE, 'log')).filter(f => f.endsWith('.md'));

  assert.ok(files.length >= 4, `Expected >= 4 log entries, got ${files.length}`);

  for (const file of files) {
    const keys = frontmatterKeys(readFileSync(resolve(FIXTURE, 'log', file), 'utf-8'));
    for (const key of required) {
      assert.ok(keys.includes(key), `${file}: missing frontmatter key "${key}"`);
    }
  }
});

test('log fixtures -- status values are valid', () => {
  const valid = new Set(['active', 'superseded', 'obsolete']);
  const files = readdirSync(resolve(FIXTURE, 'log')).filter(f => f.endsWith('.md'));

  for (const file of files) {
    const content = readFileSync(resolve(FIXTURE, 'log', file), 'utf-8');
    const match = content.match(/^status:\s*(.+)$/m);
    assert.ok(match, `${file}: no status line found`);
    const status = match[1].trim();
    assert.ok(valid.has(status), `${file}: invalid status "${status}" (expected active|superseded|obsolete)`);
  }
});

test('log fixtures -- superseded entry has superseded_by and superseded_date', () => {
  const file = '2026-01-02-superseded-example.md';
  const content = readFileSync(resolve(FIXTURE, 'log', file), 'utf-8');
  assert.match(content, /superseded_by:\s*\S+/, `${file}: superseded_by must be non-blank`);
  assert.match(content, /superseded_date:\s*\d{4}-\d{2}-\d{2}/, `${file}: superseded_date must be a date`);
});

test('question fixtures -- required frontmatter keys', () => {
  const required = ['id', 'question', 'status', 'areas', 'asked_date', 'asked_slug',
    'resolution', 'resolution_slug'];
  const files = readdirSync(resolve(FIXTURE, 'questions')).filter(f => f.endsWith('.md'));

  assert.ok(files.length >= 2, `Expected >= 2 questions, got ${files.length}`);

  for (const file of files) {
    const keys = frontmatterKeys(readFileSync(resolve(FIXTURE, 'questions', file), 'utf-8'));
    for (const key of required) {
      assert.ok(keys.includes(key), `${file}: missing frontmatter key "${key}"`);
    }
  }
});

test('question fixtures -- status values are valid', () => {
  const valid = new Set(['open', 'resolved']);
  const files = readdirSync(resolve(FIXTURE, 'questions')).filter(f => f.endsWith('.md'));

  for (const file of files) {
    const content = readFileSync(resolve(FIXTURE, 'questions', file), 'utf-8');
    const match = content.match(/^status:\s*(.+)$/m);
    assert.ok(match, `${file}: no status line found`);
    const status = match[1].trim();
    assert.ok(valid.has(status), `${file}: invalid status "${status}" (expected open|resolved)`);
  }
});

const planItemFiles = () =>
  readdirSync(resolve(FIXTURE, 'plan')).filter(f => f.startsWith('P-') && f.endsWith('.md'));

test('plan fixtures -- required frontmatter keys', () => {
  const required = ['id', 'title', 'status', 'created'];
  const files = planItemFiles();

  assert.ok(files.length >= 4, `Expected >= 4 plan items, got ${files.length}`);

  for (const file of files) {
    const keys = frontmatterKeys(readFileSync(resolve(FIXTURE, 'plan', file), 'utf-8'));
    for (const key of required) {
      assert.ok(keys.includes(key), `${file}: missing frontmatter key "${key}"`);
    }
  }
});

test('plan fixtures -- status values are valid', () => {
  const valid = new Set(['todo', 'doing', 'done', 'dropped']);
  for (const file of planItemFiles()) {
    const content = readFileSync(resolve(FIXTURE, 'plan', file), 'utf-8');
    const match = content.match(/^status:\s*(.+)$/m);
    assert.ok(match, `${file}: no status line found`);
    const status = match[1].trim();
    assert.ok(valid.has(status), `${file}: invalid status "${status}" (expected todo|doing|done|dropped)`);
  }
});

test('plan fixtures -- dropped item carries a reason or decision_ref', () => {
  for (const file of planItemFiles()) {
    const content = readFileSync(resolve(FIXTURE, 'plan', file), 'utf-8');
    const status = content.match(/^status:\s*(.+)$/m)?.[1].trim();
    if (status !== 'dropped') continue;
    assert.ok(
      /^dropped_reason:\s*\S/m.test(content) || /^decision_ref:\s*\S/m.test(content),
      `${file}: a dropped item needs a dropped_reason or decision_ref`,
    );
  }
});

test('fixture counts match expected', () => {
  const logFiles = readdirSync(resolve(FIXTURE, 'log')).filter(f => f.endsWith('.md'));
  const qFiles = readdirSync(resolve(FIXTURE, 'questions')).filter(f => f.endsWith('.md'));

  assert.equal(logFiles.length, 4, `Expected 4 log entries`);
  assert.equal(qFiles.length, 3, `Expected 3 questions`);
  assert.equal(planItemFiles().length, 6, `Expected 6 plan items`);

  // plan/README.md exists but must be excluded from the collection by the P-*.md glob.
  const planAll = readdirSync(resolve(FIXTURE, 'plan')).filter(f => f.endsWith('.md'));
  assert.ok(planAll.includes('README.md'), 'plan/README.md present (excluded by the P-*.md glob)');

  const statuses = logFiles.map(f => {
    const content = readFileSync(resolve(FIXTURE, 'log', f), 'utf-8');
    return content.match(/^status:\s*(.+)$/m)?.[1].trim();
  });
  assert.equal(statuses.filter(s => s === 'active').length, 2, 'Expected 2 active entries');
  assert.equal(statuses.filter(s => s === 'superseded').length, 1, 'Expected 1 superseded entry');
  assert.equal(statuses.filter(s => s === 'obsolete').length, 1, 'Expected 1 obsolete entry');
});
