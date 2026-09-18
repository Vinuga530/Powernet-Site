import { z, defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';

const projectsCollection = defineCollection({
  loader: glob({ pattern: "*.yaml", base: "./src/content/projects" }),
  schema: z.object({
    client: z.string(),
    title: z.string(),
    category: z.string(),
    year: z.number(),
    image: z.string().nullable().optional(),
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

const settingsCollection = defineCollection({
  loader: glob({ pattern: "*.yaml", base: "./src/content/settings" }),
  schema: z.object({
    addressLine1: z.string(),
    addressLine2: z.string(),
    country: z.string().default("Sri Lanka"),
    warehouseAddressLine1: z.string(),
    warehouseAddressLine2: z.string(),
    primaryPhone: z.string(),
    fax: z.string(),
    primaryEmail: z.string(),
    mapsEmbedUrl: z.string(),
    mapsSearchUrl: z.string(),
  }),
});

const hotlinesCollection = defineCollection({
  loader: glob({ pattern: "*.yaml", base: "./src/content/hotlines" }),
  schema: z.object({
    department: z.string(),
    phone: z.string(),
    order: z.number().default(99),
  }),
});

const statsCollection = defineCollection({
  loader: glob({ pattern: "*.yaml", base: "./src/content/stats" }),
  schema: z.object({
    ownershipValue: z.string(),
    ownershipLabel: z.string(),
    permanentStaffValue: z.string(),
    permanentStaffLabel: z.string(),
    contractualStaffValue: z.string(),
    contractualStaffLabel: z.string(),
    coverageValue: z.string(),
    coverageLabel: z.string(),
    annualTurnover: z.string(),
  }),
});

const clientsCollection = defineCollection({
  loader: glob({ pattern: "*.yaml", base: "./src/content/clients" }),
  schema: z.object({
    name: z.string(),
    logo: z.string(),
    order: z.number().default(99),
  }),
});

const processStepsCollection = defineCollection({
  loader: glob({ pattern: "*.yaml", base: "./src/content/process-steps" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    order: z.number().default(99),
  }),
});

const heroCollection = defineCollection({
  loader: glob({ pattern: "*.yaml", base: "./src/content/hero" }),
  schema: z.object({
    headlineLine1: z.string(),
    headlineLine2: z.string(),
    subtitle: z.string(),
    primaryButtonLabel: z.string(),
    secondaryButtonLabel: z.string(),
  }),
});

const homepageAboutCollection = defineCollection({
  loader: glob({ pattern: "*.yaml", base: "./src/content/homepage-about" }),
  schema: z.object({
    eyebrow: z.string(),
    title: z.string(),
    body: z.string(),
    specialties: z.array(z.string()),
    watermarkWord: z.string(),
    primaryButtonLabel: z.string(),
    secondaryButtonLabel: z.string(),
  }),
});

const aboutPageCollection = defineCollection({
  loader: glob({ pattern: "*.yaml", base: "./src/content/about-page" }),
  schema: z.object({
    heroTitle: z.string(),
    heroBody: z.string(),
    boardMembers: z.array(z.string()),
  }),
});

export const collections = {
  'projects': projectsCollection,
  'services': servicesCollection,
  'settings': settingsCollection,
  'hotlines': hotlinesCollection,
  'stats': statsCollection,
  'clients': clientsCollection,
  'processSteps': processStepsCollection,
  'hero': heroCollection,
  'homepageAbout': homepageAboutCollection,
  'aboutPage': aboutPageCollection,
};
