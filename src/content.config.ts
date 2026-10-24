import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    date: z.string(),
    slug: z.string(),
    categories: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
    image: z.string().optional(),
    excerpt: z.string().default(''),
    wpId: z.number(),
  }),
});

const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    path: z.string(),
    template: z.string().optional(),
    wpId: z.number(),
  }),
});

const part = z.object({
  type: z.string().default(''),
  name: z.string().default(''),
  url: z.string().default(''),
  desc: z.string().default(''),
});

const vehicles = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/vehicles' }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    vehicleType: z.string().default(''),
    description: z.string().default(''),
    year: z.string().default(''),
    make: z.string().default(''),
    model: z.string().default(''),
    engineMaker: z.string().default(''),
    engineModel: z.string().default(''),
    image: z.string().optional(),
    gallery: z.array(z.string()).default([]),
    engine: z.array(part).default([]),
    fuel: z.array(part).default([]),
    ignition: z.array(part).default([]),
    transmission: z.array(part).default([]),
    exhaust: z.array(part).default([]),
    additional: z.array(part).default([]),
    customMods: z.array(z.object({ name: z.string().default(''), desc: z.string().default('') })).default([]),
    relatedPosts: z.array(z.string()).default([]),
    wpId: z.number(),
  }),
});

export const collections = { posts, pages, vehicles };
