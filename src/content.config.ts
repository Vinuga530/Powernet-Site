import { z, defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';

const projectsCollection = defineCollection({
  loader: glob({ pattern: "*.{md,mdx}", base: "./src/content/projects" }),
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
