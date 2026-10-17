import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
const articles = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/articles' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    keyword: z.string(),
    category: z.enum(['cats', 'dogs', 'birds', 'fish', 'small-pets']),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    illustration: z.string().default('cat'),
    health: z.boolean().default(false),
    tools: z.array(z.string()).default([]),
    related: z.array(z.string()).default([]),
    faq: z.array(z.object({ q: z.string(), a: z.string() })).default([]),
  }),
});
export const collections = { articles };
