import { z, defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';

const projectsCollection = defineCollection({
  loader: glob({ pattern: "*.yaml", base: "./src/content/projects" }),
  schema: z.object({
    client: z.string(),
    title: z.string(),
    category: z.string(),
    year: z.number(),
    image: z.string(),
    summary: z.string(),
    specs: z.array(z.string()),
    order: z.number().default(99)
  })
});

const servicesCollection = defineCollection({
  loader: glob({ pattern: "*.yaml", base: "./src/content/services" }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    scope: z.array(z.string()),
    anchorId: z.string().optional(),
    order: z.number().default(99)
  })
});

export const collections = {
  'projects': projectsCollection,
  'services': servicesCollection,
};
