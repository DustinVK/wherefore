// Pure, Astro-free helpers for the plan collection. Kept framework-free so the
// unit tests import this TypeScript source directly (Node native type stripping).
//
// Two derived facts live here, not in frontmatter:
//   - checklist progress, counted from GFM task lines in the body
//   - "blocked", true when a todo/doing item points at a still-open question
// and the status ordering the now view and browse page sort rows by.

export type PlanStatus = 'todo' | 'doing' | 'done' | 'dropped';

/** Status buckets in display order; `blocked` is derived, so it is not one of these. */
export const PLAN_STATUS_ORDER: PlanStatus[] = ['doing', 'todo', 'done', 'dropped'];

export interface PlanFacet {
  status: PlanStatus;
  blocked: boolean;
}

/**
 * Checklist progress from a plan item body. Counts GFM task list lines:
 * `- [ ]` / `- [x]` (and `*` bullets). Returns { done: 0, total: 0 } for
 * prose-only bodies, which callers use to hide the progress bar.
 */
export function taskProgress(body: string): { done: number; total: number } {
  const total = body.match(/^[ \t]*[-*] \[[ xX]\]/gm) ?? [];
  const done = body.match(/^[ \t]*[-*] \[[xX]\]/gm) ?? [];
  return { done: done.length, total: total.length };
}

/**
 * Derived blocked state: an item is blocked only while it is todo/doing AND its
 * single question_ref points at a question that is still open. Done/dropped items
 * are never blocked, and an item carrying `answers` (a spike) is not blocked here
 * because that relationship lives on a different field.
 */
export function isBlocked(
  item: { status: PlanStatus; questionRef: string | null },
  questionStatusById: Map<string, string>,
): boolean {
  if (item.status !== 'todo' && item.status !== 'doing') return false;
  if (!item.questionRef) return false;
  return questionStatusById.get(item.questionRef) === 'open';
}

const STATUS_RANK: Record<PlanStatus, number> = { doing: 0, todo: 2, done: 3, dropped: 4 };

/**
 * Priority rank: doing (0) -> blocked (1) -> todo (2) -> done (3) -> dropped (4).
 * Active work floats up, blocked sits just under in-flight, dropped sinks.
 */
export function planRank(facet: PlanFacet): number {
  return facet.blocked ? 1 : STATUS_RANK[facet.status];
}

/** Comparator over PlanFacet implementing the priority order above. */
export function byPlanOrder(a: PlanFacet, b: PlanFacet): number {
  return planRank(a) - planRank(b);
}
