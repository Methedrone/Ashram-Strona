import { defineCollection, z } from 'astro:content';

const teachingsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.date(),
    author: z.string().default('Babaji'),
    lang: z.enum(['pl', 'en']),
  }),
});

const eventsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.date(),
    location: z.string().default('Ashram Babaji, Mąkolno 129'),
    lang: z.enum(['pl', 'en']),
  }),
});

export const collections = {
  'teachings': teachingsCollection,
  'events': eventsCollection,
};
