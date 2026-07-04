// Unit tests for the pure body-parsing helpers. These import the TypeScript
// source directly; Node's native type stripping (>=22.18) handles it, no build.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  splitSections,
  splitDecision,
  splitAlternative,
  splitQuestion,
  renderInline,
  parseEntry,
} from '../src/lib/entry-sections.ts';

test('splitSections keys headings and drops the pre-heading banner', () => {
  const body = [
    'SUPERSEDED 2026-01-03 -> see other. Kept for history.',
    '## Summary',
    'A summary line.',
    '## Why',
    'Because reasons.',
  ].join('\n');
  const s = splitSections(body);
  assert.equal(s['summary'], 'A summary line.');
  assert.equal(s['why'], 'Because reasons.');
  // The banner text before the first heading is not captured under any key.
  assert.ok(!Object.values(s).some(v => v.includes('SUPERSEDED')));
});

test('splitDecision separates first sentence (verdict) from the rest (detail)', () => {
  assert.deepEqual(
    splitDecision('Chose option A. It scaled better under load.'),
    { verdict: 'Chose option A.', detail: 'It scaled better under load.' }
  );
  assert.deepEqual(
    splitDecision('Single sentence with no detail.'),
    { verdict: 'Single sentence with no detail.', detail: '' }
  );
});

test('splitAlternative extracts a bolded option and a cleaned reason', () => {
  assert.deepEqual(
    splitAlternative('Option B, rejected for complexity'),
    { option: 'Option B.', reason: 'Complexity' }
  );
  // No comma -> whole thing is the option, no reason.
  assert.deepEqual(
    splitAlternative('The old approach'),
    { option: 'The old approach.', reason: '' }
  );
});

test('splitQuestion pulls a leading Q-NNN id, or null when absent', () => {
  assert.deepEqual(
    splitQuestion('Q-001: Should we rate-limit per user?'),
    { id: 'Q-001', text: 'Should we rate-limit per user?' }
  );
  assert.deepEqual(
    splitQuestion('No id on this one'),
    { id: null, text: 'No id on this one' }
  );
});

test('renderInline escapes HTML then renders code, links, and bold', () => {
  assert.equal(renderInline('a < b & c > d'), 'a &lt; b &amp; c &gt; d');
  assert.equal(renderInline('use `computeRate()`'), 'use <code>computeRate()</code>');
  assert.equal(renderInline('see [docs](/x)'), 'see <a href="/x">docs</a>');
  assert.equal(renderInline('**bold** and __also__'), '<b>bold</b> and <b>also</b>');
});

test('parseEntry drops "None" items and structures every section', () => {
  const body = [
    '## Summary',
    'The summary.',
    '## Decisions / outcomes',
    '- Chose A. Because fast.',
    '## Why',
    'Rationale.',
    '## Alternatives considered',
    '- None documented.',
    '## Open questions / follow-ups',
    'None.',
  ].join('\n');
  const parsed = parseEntry(body);
  assert.deepEqual(parsed.summary, ['The summary.']);
  assert.deepEqual(parsed.why, ['Rationale.']);
  assert.equal(parsed.decisions.length, 1);
  assert.equal(parsed.decisions[0].verdict, 'Chose A.');
  // "None"/"None documented." are filtered out, not rendered as items.
  assert.deepEqual(parsed.alternatives, []);
  assert.deepEqual(parsed.questions, []);
});
