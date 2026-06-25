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
    'superseded-by': z.string().nullable().default(null),
    'superseded-date': yamlDateNullable,
  }).transform(d => ({
    date: d.date,
    title: d.title,
    areas: d.areas,
    topics: d.topics,
    stories: d.stories,
    status: (d.status === 'current' ? 'active' : d.status) as 'active' | 'superseded' | 'obsolete',
    supersedes: d.supersedes || null,
    supersededBy: d['superseded-by'] || null,
    supersededDate: d['superseded-date'] || null,
  })),
});

const questions = defineCollection({
  loader: glob({ pattern: '*.md', base: `${SRC}/questions` }),
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

export const collections = { log, questions };
