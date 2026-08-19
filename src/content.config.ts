import { z, defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';

const projectsCollection = defineCollection({
  loader: glob({ pattern: "*.{md,mdx}", base: "./src/content/projects" }),
  schema: z.object({
    title: z.string(),
    client: z.string(),
    sector: z.string().optional(),
    location: z.string().optional(),
    year: z.number().optional(),
    category: z.string(),
    services: z.array(z.string()),
    summary: z.string(),
    challenge: z.string().optional(),
    solution: z.string().optional(),
    scope: z.array(z.string()),
    technologies: z.array(z.string()).optional(),
    heroImage: z.string(),
    gallery: z.array(z.string()).optional(),
    featured: z.boolean().default(false),
    order: z.number().default(99)
  })
});

const servicesCollection = defineCollection({
  loader: glob({ pattern: "*.{md,mdx}", base: "./src/content/services" }),
  schema: z.object({
    title: z.string(),
    shortDescription: z.string(),
    iconIdentifier: z.string().optional(),
    includes: z.array(z.string()),
    order: z.number()
  })
});

export const collections = {
  'projects': projectsCollection,
  'services': servicesCollection,
};
