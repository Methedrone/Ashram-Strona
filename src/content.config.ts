// src/content.config.ts  (was src/content/config.ts)
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const teachingsCollection = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/teachings' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.date(),
    author: z.string().default('Babaji'),
    lang: z.enum(['pl', 'en']),
    featuredImage: z.string().optional(),
    tags: z.array(z.string()).optional(),
    faqs: z.array(z.object({
      question: z.string(),
      answer: z.string(),
    })).optional(),
    relatedTeachings: z.array(z.string()).optional(),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
    duration: z.string().optional(),
    updatedAt: z.date().optional(),
  }),
});

const eventsCollection = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/events' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.date(),
    endDate: z.date().optional(),
    time: z.string().optional(),
    location: z.string().default('Ashram Babaji, Mąkolno 129'),
    lang: z.enum(['pl', 'en']),
    featuredImage: z.string().optional(),
    tags: z.array(z.string()).optional(),
    faqs: z.array(z.object({
      question: z.string(),
      answer: z.string(),
    })).optional(),
    registrationUrl: z.string().optional(),
    isOnline: z.boolean().default(false),
    featured: z.boolean().default(false),
    eventType: z.string().optional(),
    updatedAt: z.date().optional(),
  }),
});

export const collections = {
  teachings: teachingsCollection,
  events: eventsCollection,
};
