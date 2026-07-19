// Unit tests for the pure plan helpers. Imports the TypeScript source directly;
// Node's native type stripping (>=22.18) handles it, no build.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  taskProgress,
  isBlocked,
  planRank,
  byPlanOrder,
  PLAN_STATUS_ORDER,
} from '../src/lib/plan.ts';

test('taskProgress counts GFM task lines (checked / total)', () => {
  const body = [
    'intro prose',
    '- [x] done one',
    '- [ ] todo one',
    '- [X] done two (capital X)',
    '* [ ] star-bullet todo',
    '- regular bullet, not a task',
  ].join('\n');
  assert.deepEqual(taskProgress(body), { done: 2, total: 4 });
});

test('taskProgress returns zero for a prose-only body', () => {
  assert.deepEqual(taskProgress('just prose, no checkboxes here'), { done: 0, total: 0 });
});

test('isBlocked: only a todo/doing item with a still-open question_ref', () => {
  const q = new Map([['Q-001', 'open'], ['Q-002', 'resolved']]);
  assert.equal(isBlocked({ status: 'doing', questionRef: 'Q-001' }, q), true);
  assert.equal(isBlocked({ status: 'todo', questionRef: 'Q-001' }, q), true);
  assert.equal(isBlocked({ status: 'doing', questionRef: 'Q-002' }, q), false, 'resolved question does not block');
  assert.equal(isBlocked({ status: 'done', questionRef: 'Q-001' }, q), false, 'done is never blocked');
  assert.equal(isBlocked({ status: 'dropped', questionRef: 'Q-001' }, q), false, 'dropped is never blocked');
  assert.equal(isBlocked({ status: 'doing', questionRef: null }, q), false);
  assert.equal(isBlocked({ status: 'doing', questionRef: 'Q-404' }, q), false, 'unknown question does not block');
});

test('planRank / byPlanOrder: doing -> blocked -> todo -> done -> dropped', () => {
  const facets = [
    { status: 'dropped', blocked: false },
    { status: 'done', blocked: false },
    { status: 'todo', blocked: false },
    { status: 'doing', blocked: true },   // blocked outranks a plain todo
    { status: 'doing', blocked: false },
  ];
  const ordered = [...facets].sort(byPlanOrder).map(f => (f.blocked ? 'blocked' : f.status));
  assert.deepEqual(ordered, ['doing', 'blocked', 'todo', 'done', 'dropped']);
  assert.equal(planRank({ status: 'doing', blocked: false }), 0);
  assert.equal(planRank({ status: 'doing', blocked: true }), 1);
});

test('PLAN_STATUS_ORDER excludes the derived blocked state', () => {
  assert.deepEqual(PLAN_STATUS_ORDER, ['doing', 'todo', 'done', 'dropped']);
});
