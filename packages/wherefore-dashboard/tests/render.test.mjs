// Integration tests: build the fixture wherefore once, then assert the rendered
// HTML (server output) and the client-side filter scripts (executed via jsdom).

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { JSDOM } from 'jsdom';
import { runBin, FIXTURES, uniqueTemp } from './helpers.mjs';

const OUT = uniqueTemp('render-out');

let build; // spawn result of the fixture build

const html = (rel) => readFileSync(resolve(OUT, rel), 'utf-8');
const parse = (rel, opts) => new JSDOM(html(rel), opts).window.document;
const text = (el) => (el ? el.textContent.replace(/\s+/g, ' ').trim() : null);
const visible = (rows) => rows.filter((r) => !r.hidden);

before(() => {
  build = runBin(['build', '--src', FIXTURES, '--out', OUT], { timeout: 90000 });
  // Fail fast with the build error itself; otherwise every downstream test throws an
  // opaque ENOENT when it reads a file the failed build never produced.
  assert.equal(build.status, 0, `fixture build failed:\n${build.stderr || build.stdout}`);
}, { timeout: 100000 });

after(() => {
  if (existsSync(OUT)) rmSync(OUT, { recursive: true, force: true });
});

// ---- build regression ------------------------------------------------------

test('build emits no duplicate-id warnings', () => {
  // (build.status === 0 is asserted in the before() hook.)
  const out = `${build.stdout ?? ''}${build.stderr ?? ''}`;
  assert.ok(!/Duplicate id/.test(out), 'build must not emit Duplicate id warnings');
});

// ---- static render ---------------------------------------------------------

test('index (now view): counts and active/open-only footers', () => {
  const d = parse('index.html');

  // Header count strip: in flight (doing not blocked)=2, blocked=1, queued (todo)=1, open=1
  const counts = [...d.querySelectorAll('.now-counts .count')].map(text);
  assert.deepEqual(counts, ['2 in flight', '1 blocked', '1 queued', '1 open']);

  const titles = [...d.querySelectorAll('.entry-list .entry-title')].map(text);
  assert.ok(titles.includes('Active example decision'));
  assert.ok(titles.includes('Replacement example decision'));
  assert.ok(!titles.includes('Superseded example decision'), 'retired entry must not be listed');
  assert.ok(!titles.includes('Obsolete example decision'), 'obsolete entry must not be listed');

  const qids = [...d.querySelectorAll('.question-list .q-id-date')].map(text);
  assert.ok(qids.some((t) => t.startsWith('Q-001')), 'open question listed');
  assert.ok(!qids.some((t) => t.startsWith('Q-002')), 'resolved question must not be listed');
});

test('index (now view): in-flight cards and blocked card with inline question', () => {
  const d = parse('index.html');

  const cardTitles = [...d.querySelectorAll('.plan-card-title')].map(text);
  assert.ok(cardTitles.includes('Wire up the checkout rate limiter'), 'doing item is in flight');
  assert.ok(cardTitles.includes('Spike per-user vs per-IP limiting'), 'spike (answers) is in flight, not blocked');
  assert.ok(cardTitles.includes('Choose the checkout rate-limit key'), 'blocked item shown in its own card');

  const blockedCard = d.querySelector('.blocked-card');
  assert.match(text(blockedCard), /Choose the checkout rate-limit key/);
  assert.match(text(blockedCard.querySelector('.blocked-q')), /rate-limit the checkout API/, 'blocking question rendered inline');

  const upNext = [...d.querySelectorAll('.plan-list .plan-row-title')].map(text);
  assert.ok(upNext.includes('Paginate the catalog search endpoint'), 'todo item queued under Up next');
});

test('log entry page: superseded callout links to its replacement', () => {
  const d = parse('log/2026-01-02-superseded-example/index.html');
  const callout = d.querySelector('.callout');
  assert.ok(callout, 'superseded callout present');
  assert.match(text(callout), /Superseded on 2026-01-03/);
  assert.match(text(callout), /Current decision:/);
  assert.equal(callout.querySelector('a').getAttribute('href'), '/log/2026-01-03-replacement-example');

  const status = d.querySelector('.wf-status');
  assert.equal(text(status), 'superseded');
  assert.ok(status.classList.contains('is-superseded'));
});

test('log entry page: obsolete callout, no replacement', () => {
  const d = parse('log/2026-01-04-obsolete-example/index.html');
  const callout = d.querySelector('.callout.callout-obs');
  assert.ok(callout, 'obsolete callout present');
  assert.match(text(callout), /Obsolete since 2026-01-15/);
  assert.match(text(callout), /Retired without replacement/);
});

test('log entry page: replacement links back via supersedes-note', () => {
  const d = parse('log/2026-01-03-replacement-example/index.html');
  const note = d.querySelector('.supersedes-note');
  assert.ok(note, 'supersedes-note present');
  assert.match(text(note), /Supersedes:/);
  assert.equal(note.querySelector('a').getAttribute('href'), '/log/2026-01-02-superseded-example');
});

test('log entry page: chips, body sections, and inline markdown rendering', () => {
  const d = parse('log/2026-01-01-active-example/index.html');
  assert.equal(text(d.querySelector('.wf-chip.area')), 'checkout');
  assert.equal(text(d.querySelector('.wf-chip.topic')), 'api-design');
  assert.equal(text(d.querySelector('.wf-chip.story')), '[PROJ-101]');

  const labels = [...d.querySelectorAll('.wf-label')].map(text);
  assert.ok(labels.includes('Decisions / outcomes'));
  assert.ok(labels.includes('Why'));
  assert.ok(labels.includes('Alternatives considered'));
  assert.match(text(d.querySelector('.wf-alt')), /Option B\./);
  assert.match(text(d.querySelector('.wf-q')), /Q-001/);

  // renderInline: bold, code, link, and an escaped "<"
  const why = d.querySelector('.wf-why').innerHTML;
  assert.match(why, /<b>simpler<\/b>/);
  assert.match(why, /<code>computeRate\(\)<\/code>/);
  assert.match(why, /<a href="\/log\/2026-01-03-replacement-example">replacement<\/a>/);
  assert.match(why, /&lt; 50ms/);
});

test('questions page: counts and linked-vs-plain resolution', () => {
  const d = parse('questions/index.html');
  assert.equal(text(d.querySelector('.summary-line')), '1 open · 2 resolved');

  const rows = [...d.querySelectorAll('.row')];
  const byId = (id) => rows.find((r) => text(r.querySelector('.q-id-date')).startsWith(id));

  const q2 = byId('Q-002');
  assert.equal(q2.getAttribute('data-status'), 'resolved');
  const q2res = q2.querySelector('.q-resolution');
  assert.match(text(q2res), /Resolved:/);
  assert.equal(q2res.querySelector('a').getAttribute('href'), '/log/2026-01-03-replacement-example');

  // Q-003: resolved without a slug -> plain (no link), special chars rendered safely
  const q3res = byId('Q-003').querySelector('.q-resolution');
  assert.equal(q3res.querySelector('a'), null, 'Q-003 resolution is not linked');
  assert.match(text(q3res), /Yes: use backoff\. See MDN: Foo <bar> & baz\./);

  const q1 = byId('Q-001');
  assert.equal(q1.getAttribute('data-status'), 'open');
  assert.equal(q1.querySelector('.q-resolution'), null, 'open question has no resolution block');
});

test('tags page: counts exclude retired, zero-count tags shown', () => {
  const d = parse('tags/index.html');
  assert.equal(text(d.querySelector('.summary-line')), '2 active entries · counts exclude retired');

  const countIn = (colSelector, name) => {
    const col = d.querySelector(colSelector);
    const line = [...col.querySelectorAll('.tagline')].find(
      (a) => text(a.querySelector('.tag-nm')) === name
    );
    return { count: Number(text(line.querySelector('.tag-ct'))), zero: line.classList.contains('zero') };
  };
  assert.deepEqual(countIn('.tags-col-areas', 'checkout'), { count: 2, zero: false });
  assert.deepEqual(countIn('.tags-col-areas', 'catalog'), { count: 1, zero: false });
  assert.deepEqual(countIn('.tags-col-areas', 'billing'), { count: 0, zero: true });
  assert.deepEqual(countIn('.tags-col-topics', 'api-design'), { count: 2, zero: false });
  assert.deepEqual(countIn('.tags-col-topics', 'auth'), { count: 0, zero: true });
});

// ---- plan collection -------------------------------------------------------

test('plan browse: count strip, overall progress, and section membership', () => {
  const d = parse('plan/index.html');

  const counts = [...d.querySelectorAll('.count-strip .count')].map(text);
  assert.deepEqual(counts, ['2 doing', '1 blocked', '1 todo', '1 done', '1 dropped']);

  // Overall progress excludes dropped: 1 done of the 5 non-dropped items.
  assert.match(text(d.querySelector('.overall-label')), /1 of 5 done/);

  const sectionTitles = (key) => {
    const sec = d.querySelector(`.plan-section[data-section="${key}"]`);
    return [...sec.querySelectorAll('.plan-row-title')].map(text).sort();
  };
  assert.deepEqual(sectionTitles('in-flight'),
    ['Spike per-user vs per-IP limiting', 'Wire up the checkout rate limiter']);
  assert.deepEqual(sectionTitles('blocked'), ['Choose the checkout rate-limit key']);
  assert.deepEqual(sectionTitles('up-next'), ['Paginate the catalog search endpoint']);
  assert.deepEqual(sectionTitles('done'), ['Ship the billing webhook retries']);
  assert.deepEqual(sectionTitles('dropped'), ['Build a bespoke per-tenant schema']);
});

test('plan browse: blocked derived from open question_ref; answers does not block', () => {
  const d = parse('plan/index.html');
  const rowByTitle = (t) =>
    [...d.querySelectorAll('.plan-row')].find((r) => text(r.querySelector('.plan-row-title')) === t);

  // P-003: status doing but question_ref -> open Q-001, so it derives blocked.
  const p3 = rowByTitle('Choose the checkout rate-limit key');
  assert.equal(p3.dataset.blocked, 'true');
  assert.ok(p3.querySelector('.status-dot').classList.contains('is-blocked'));
  assert.equal(text(p3.querySelector('.plan-status-label')), 'blocked');

  // P-006: answers Q-001 (a spike) is the opposite relation, not blocked.
  const p6 = rowByTitle('Spike per-user vs per-IP limiting');
  assert.equal(p6.dataset.blocked, 'false');
  assert.ok(p6.querySelector('.status-dot').classList.contains('is-doing'));

  // Checklist progress renders n/m from the body.
  assert.equal(text(rowByTitle('Wire up the checkout rate limiter').querySelector('.progress-count')), '2/4');
});

test('plan browse: README is excluded by the P-*.md glob', () => {
  const d = parse('plan/index.html');
  const rows = [...d.querySelectorAll('.plan-row')];
  assert.equal(rows.length, 6, 'exactly the 6 P-*.md items, plan/README.md not collected');
  assert.ok(!rows.map((r) => text(r.querySelector('.plan-row-title'))).some((t) => /readme|fixture/i.test(t)));
});

test('plan detail: progress, metadata, and decision cross-reference', () => {
  const d = parse('plan/P-004/index.html');
  assert.equal(text(d.querySelector('.detail-title')), 'Ship the billing webhook retries');
  assert.match(text(d.querySelector('.progress-count')), /3 of 3 done/);
  assert.ok(d.querySelector('.plan-detail-head .status-dot').classList.contains('is-done'));

  const ref = d.querySelector('.ref-list a');
  assert.equal(ref.getAttribute('href'), '/log/2026-01-01-active-example');
  assert.equal(text(ref), 'Active example decision', 'decision_ref resolves to the log title');
});

test('plan detail: blocked item callout links its open question', () => {
  const d = parse('plan/P-003/index.html');
  const callout = d.querySelector('.callout-blocked');
  assert.ok(callout, 'blocked callout present');
  assert.match(text(callout), /Q-001/);
  assert.match(text(callout), /rate-limit the checkout API/, 'question text surfaced inline');
});

test('plan detail: dropped item shown (not hidden) with reason and retired-by link', () => {
  const d = parse('plan/P-005/index.html');
  assert.ok(d.querySelector('.plan-detail.is-dropped'), 'dropped items are dimmed, not removed');
  assert.ok(d.querySelector('.callout.callout-obs'), 'dropped callout');
  assert.match(text(d.querySelector('.dropped-reason')), /row-level security/);

  const kinds = [...d.querySelectorAll('.ref-kind')].map(text);
  assert.ok(kinds.includes('Retired by'), 'decision_ref reads as "Retired by" on a dropped item');
  assert.equal(d.querySelector('.ref-list a').getAttribute('href'), '/log/2026-01-03-replacement-example');
});

// ---- client-side filters (scripts executed by jsdom) -----------------------

test('questions filter: resolved tab and no-results search', () => {
  const { window } = new JSDOM(html('questions/index.html'), { runScripts: 'dangerously' });
  const d = window.document;
  const rows = [...d.querySelectorAll('.row')];
  const open = rows.filter((r) => r.dataset.status === 'open');
  const resolved = rows.filter((r) => r.dataset.status === 'resolved');

  // default tab is "open"
  assert.ok(open.every((r) => !r.hidden), 'open rows visible on load');
  assert.ok(resolved.every((r) => r.hidden), 'resolved rows hidden on load');

  d.querySelector('.tab-chip[data-tab="resolved"]').dispatchEvent(
    new window.MouseEvent('click', { bubbles: true })
  );
  assert.ok(resolved.every((r) => !r.hidden), 'resolved rows shown after tab click');
  assert.ok(open.every((r) => r.hidden), 'open rows hidden after tab click');

  const search = d.getElementById('q-search');
  search.value = 'zzz-nonexistent';
  search.dispatchEvent(new window.Event('input', { bubbles: true }));
  assert.equal(d.getElementById('q-no-results').style.display, 'block');
});

test('log filter: retired toggle and area filter', () => {
  const { window } = new JSDOM(html('log/index.html'), { runScripts: 'dangerously' });
  const d = window.document;
  const rows = [...d.querySelectorAll('.row')];

  const active = rows.filter((r) => r.dataset.status === 'active');
  const retired = rows.filter((r) => r.dataset.status !== 'active');
  assert.ok(active.every((r) => !r.hidden), 'active visible on load');
  assert.ok(retired.every((r) => r.hidden), 'retired hidden on load');

  const toggle = d.getElementById('retired-toggle');
  toggle.checked = true;
  toggle.dispatchEvent(new window.Event('input', { bubbles: true }));
  assert.ok(rows.every((r) => !r.hidden), 'all rows visible when retired shown');

  const area = d.getElementById('area-filter');
  area.value = 'billing';
  area.dispatchEvent(new window.Event('input', { bubbles: true }));
  const shown = visible(rows);
  assert.equal(shown.length, 1, 'only the billing entry matches');
  assert.equal(shown[0].dataset.areas, 'billing');
});

test('log filter: ?area= URL param pre-selects and actually filters', () => {
  const { window } = new JSDOM(html('log/index.html'), {
    runScripts: 'dangerously',
    url: 'http://localhost/log?area=catalog',
  });
  const d = window.document;
  assert.equal(d.getElementById('area-filter').value, 'catalog');

  const shown = visible([...d.querySelectorAll('.row')]);
  // Only the active 'catalog' entry (2026-01-01) matches; the checkout-only active
  // entry (2026-01-03) is excluded -- so this fails if the pre-set filter is ignored
  // (an unfiltered default view would show both active entries).
  assert.equal(shown.length, 1);
  assert.ok(shown[0].dataset.areas.split(',').includes('catalog'));
  assert.equal(shown[0].dataset.status, 'active');
});

test('plan filter: dropped hidden by default, shown via toggle, and area narrows', () => {
  const { window } = new JSDOM(html('plan/index.html'), { runScripts: 'dangerously' });
  const d = window.document;

  const droppedSection = d.querySelector('.plan-section[data-section="dropped"]');
  assert.ok(droppedSection.hidden, 'dropped section hidden on load');

  const toggle = d.getElementById('dropped-toggle');
  toggle.checked = true;
  toggle.dispatchEvent(new window.Event('input', { bubbles: true }));
  assert.ok(!droppedSection.hidden, 'dropped section shown after toggling show-dropped');

  const area = d.getElementById('plan-area');
  area.value = 'billing';
  area.dispatchEvent(new window.Event('input', { bubbles: true }));
  const shown = visible([...d.querySelectorAll('.plan-row')]);
  assert.equal(shown.length, 1, 'only the billing item matches');
  assert.equal(text(shown[0].querySelector('.plan-row-title')), 'Ship the billing webhook retries');
});
