// Parse a wherefore entry's raw markdown body into the structured pieces the
// "1A" reading view renders. Pure, Astro-free functions so they stay testable.
// Section headings follow the AGENTS.md capture template:
//   ## Summary / ## Decisions / outcomes / ## Why /
//   ## Alternatives considered / ## Open questions / follow-ups

import { rewriteMdHref } from './md-links.mjs';

export interface Decision { verdict: string; detail: string; }
export interface Alternative { option: string; reason: string; }
export interface OpenQuestion { id: string | null; text: string; }

export interface EntrySections {
  summary: string[];          // paragraphs
  decisions: Decision[];      // verdict-led rows
  why: string[];              // paragraphs
  alternatives: Alternative[];
  questions: OpenQuestion[];
}

const HEADING = /^#{2,3}\s+(.+?)\s*$/;

/**
 * Split a body into a map of lowercased-heading -> raw section text. Any content
 * before the first heading (e.g. a SUPERSEDED/OBSOLETE banner line the skill
 * writes) is dropped -- that state is shown from frontmatter instead.
 */
export function splitSections(body: string): Record<string, string> {
  const out: Record<string, string> = {};
  let key: string | null = null;
  let buf: string[] = [];
  const flush = () => { if (key !== null) out[key] = buf.join('\n').trim(); };
  for (const line of body.split('\n')) {
    const m = line.match(HEADING);
    if (m) { flush(); key = m[1].trim().toLowerCase(); buf = []; }
    else buf.push(line);
  }
  flush();
  return out;
}

function paragraphs(section: string): string[] {
  if (!section) return [];
  return section
    .split(/\n\s*\n/)
    .map(p => p.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

function listItems(section: string): string[] {
  if (!section) return [];
  const items: string[] = [];
  let cur: string | null = null;
  for (const raw of section.split('\n')) {
    const line = raw.replace(/\s+$/, '');
    const m = line.match(/^\s*[-*]\s+(.*)$/);
    if (m) { if (cur !== null) items.push(cur.trim()); cur = m[1]; }
    else if (cur !== null && line.trim()) cur += ' ' + line.trim();
  }
  if (cur !== null) items.push(cur.trim());
  return items;
}

const isNone = (s: string) => /^none\b/i.test(s.trim());

/**
 * Split a decision bullet into a verdict (through the first sentence-ending
 * period) and the remaining elaboration. A single-sentence bullet has no detail.
 */
export function splitDecision(text: string): Decision {
  const m = text.match(/^([\s\S]*?[.!?])\s+(\S[\s\S]*)$/);
  if (m) return { verdict: m[1].trim(), detail: m[2].trim() };
  return { verdict: text.trim(), detail: '' };
}

/**
 * Split an "Option X, rejected because Y" bullet into a bold option clause and
 * the muted reason (leading "rejected because/for/due to" stripped).
 */
export function splitAlternative(text: string): Alternative {
  const comma = text.indexOf(',');
  let option = text;
  let reason = '';
  if (comma !== -1) { option = text.slice(0, comma); reason = text.slice(comma + 1); }
  option = option.trim().replace(/[.,;:]+$/, '');
  if (option) option += '.';
  reason = reason.trim().replace(/^rejected\s+(?:because|for|due to)?\s*/i, '').trim();
  if (reason) reason = reason.charAt(0).toUpperCase() + reason.slice(1);
  return { option, reason };
}

/** Pull a leading "Q-NNN:" id off a question bullet; null when there is none. */
export function splitQuestion(text: string): OpenQuestion {
  const m = text.match(/^\s*(Q-\d+)\s*[:.)\-]?\s*(.*)$/i);
  if (m) return { id: m[1].toUpperCase(), text: m[2].trim() };
  return { id: null, text: text.trim() };
}

export function parseEntry(body: string): EntrySections {
  const s = splitSections(body ?? '');
  const decisions = listItems(s['decisions / outcomes'] ?? s['decisions'] ?? '');
  const alternatives = listItems(s['alternatives considered'] ?? s['alternatives'] ?? '');
  const questions = listItems(s['open questions / follow-ups'] ?? s['open questions'] ?? '');
  return {
    summary: paragraphs(s['summary'] ?? ''),
    decisions: decisions.map(splitDecision),
    why: paragraphs(s['why'] ?? ''),
    alternatives: alternatives.filter(i => !isNone(i)).map(splitAlternative),
    questions: questions.filter(i => !isNone(i)).map(splitQuestion),
  };
}

/**
 * Minimal inline markdown -> HTML for section text: escapes HTML, then renders
 * code spans, links, and bold. Used via set:html so authored `code`, links, and
 * **emphasis** don't leak through as literal markup. Content is repo-trusted.
 */
export function renderInline(text: string, mdLinkMap?: Map<string, string>): string {
  if (!text) return '';
  let h = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  // Pull code spans out to placeholders first, so link/bold syntax shown INSIDE a
  // code span (e.g. a `[label](path.md)` example) is not reprocessed into a real
  // link, matching how a real Markdown parser protects code spans.
  const codes: string[] = [];
  h = h.replace(/`([^`]+)`/g, (_m, c) => {
    codes.push(`<code>${c}</code>`);
    return `\u0000${codes.length - 1}\u0000`;
  });
  h = h.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g,
    (_m, t, u) => `<a href="${rewriteMdHref(u, mdLinkMap)}">${t}</a>`);
  h = h.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/__([^_]+)__/g, '<b>$1</b>');
  h = h.replace(/\u0000(\d+)\u0000/g, (_m, i) => codes[Number(i)]);
  return h;
}
