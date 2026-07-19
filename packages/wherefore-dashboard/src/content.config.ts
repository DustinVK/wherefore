import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const SRC = process.env.WHEREFORE_SRC;
if (!SRC) throw new Error('WHEREFORE_SRC environment variable is required');

const yamlDate = z.union([z.string(), z.date()]).transform(d =>
  d instanceof Date ? d.toISOString().slice(0, 10) : d
);

const yamlDateNullable = z.union([z.string(), z.date(), z.null()]).transform(d =>
  d instanceof Date ? d.toISOString().slice(0, 10) : (d ?? null)
).default(null);

const log = defineCollection({
  loader: glob({ pattern: '*.md', base: `${SRC}/log` }),
  schema: z.object({
    date: yamlDate,
    title: z.string(),
    areas: z.array(z.string()).default([]),
    topics: z.array(z.string()).default([]),
    stories: z.array(z.string()).default([]),
    status: z.enum(['active', 'current', 'superseded', 'obsolete']).default('active'),
    supersedes: z.string().nullable().default(null),
    superseded_by: z.string().nullable().default(null),
    superseded_date: yamlDateNullable,
  }).transform(d => ({
    date: d.date,
    title: d.title,
    areas: d.areas,
    topics: d.topics,
    stories: d.stories,
    status: (d.status === 'current' ? 'active' : d.status) as 'active' | 'superseded' | 'obsolete',
    supersedes: d.supersedes || null,
    supersededBy: d.superseded_by || null,
    supersededDate: d.superseded_date || null,
  })),
});

const questions = defineCollection({
  loader: glob({
    pattern: '*.md',
    base: `${SRC}/questions`,
    generateId: ({ entry, data }) =>
      data.id ? String(data.id) : entry.replace(/\.md$/, ''),
  }),
  schema: z.object({
    question: z.string(),
    status: z.enum(['open', 'resolved']).default('open'),
    areas: z.array(z.string()).default([]),
    asked_date: yamlDate,
    asked_slug: z.string(),
    resolution: z.string().nullable().default(null),
    resolution_slug: z.string().nullable().default(null),
  }),
});

const plan = defineCollection({
  // Glob P-*.md (not *.md) so plan/README.md and any other non-item doc are skipped.
  // ID derives from the id: frontmatter (P-NNN is authoritative), same as questions.
  loader: glob({
    pattern: 'P-*.md',
    base: `${SRC}/plan`,
    generateId: ({ entry, data }) =>
      data.id ? String(data.id) : entry.replace(/\.md$/, ''),
  }),
  schema: z.object({
    title: z.string(),
    status: z.enum(['todo', 'doing', 'done', 'dropped']).default('todo'),
    created: yamlDate,
    updated: yamlDateNullable,
    area: z.string().nullable().default(null),   // single area, unlike log/questions' areas[]
    topics: z.array(z.string()).default([]),
    milestone: z.string().nullable().default(null),
    decision_ref: z.string().nullable().default(null),
    question_ref: z.string().nullable().default(null),
    answers: z.string().nullable().default(null),
    dropped_reason: z.string().nullable().default(null),
  }).transform(d => ({
    title: d.title,
    status: d.status,
    created: d.created,
    updated: d.updated,
    area: d.area || null,
    topics: d.topics,
    milestone: d.milestone || null,
    // decision_ref may be a single slug or a comma-separated list, mirroring supersedes.
    decisionRefs: d.decision_ref
      ? d.decision_ref.split(',').map(s => s.trim()).filter(Boolean)
      : [],
    questionRef: d.question_ref || null,
    answers: d.answers || null,
    droppedReason: d.dropped_reason || null,
  })),
});

export const collections = { log, questions, plan };
