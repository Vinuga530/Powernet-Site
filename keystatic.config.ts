import { config, fields, collection, singleton } from '@keystatic/core';

export default config({
  storage: import.meta.env.DEV
    ? { kind: 'local' }
    : { kind: 'github', repo: 'Vinuga530/Powernet-Site' },

  ui: {
    brand: { name: 'Powernet' },
  },

  collections: {
    projects: collection({
      label: 'Projects',
      slugField: 'title',
      path: 'src/content/projects/*',
      format: { data: 'yaml' },
      entryLayout: 'form',
      schema: {
        title: fields.slug({
          name: {
            label: 'Short Description',
            description: 'e.g. "Server Room Power & UPS Installation" — shown in red under the client name. Also used to generate the filename.',
          },
        }),
        client: fields.text({
          label: 'Client / Site Name',
          description: 'e.g. "The World Bank Sri Lanka" — shown as the big headline',
        }),
        category: fields.text({
          label: 'Category',
          description: 'e.g. "Electrical & UPS", "Network Infrastructure"',
        }),
        year: fields.integer({ label: 'Year', defaultValue: new Date().getFullYear() }),
        image: fields.image({
          label: 'Project Photo',
          description: 'Upload a project photo directly from your device (JPG, PNG, WebP)',
          directory: 'public/images/projects',
          publicPath: '/images/projects/',
        }),
        summary: fields.text({
          label: 'Summary',
          description: 'The paragraph shown under the title',
          multiline: true,
        }),
        specs: fields.array(
          fields.text({ label: 'Point' }),
          {
            label: 'Key Points',
            description: 'The bullet list (e.g. "Redundant UPS power backup")',
            itemLabel: (props) => props.value || 'New point',
          }
        ),
        order: fields.integer({
          label: 'Display Order',
          description: 'Lower numbers show first (1, 2, 3...)',
          defaultValue: 99,
        }),
      },
    }),

    services: collection({
      label: 'Services',
      slugField: 'title',
      path: 'src/content/services/*',
      format: { data: 'yaml' },
      entryLayout: 'form',
      schema: {
        title: fields.slug({
          name: {
            label: 'Service Title',
            description: 'e.g. "Backup Power & Industrial UPS"',
          },
        }),
        summary: fields.text({
          label: 'Description',
          description: 'The paragraph shown under the title',
          multiline: true,
        }),
        scope: fields.array(
          fields.text({ label: 'Item' }),
          {
            label: 'What This Covers',
            description: 'Shown as a single line separated by dots',
            itemLabel: (props) => props.value || 'New item',
          }
        ),
        anchorId: fields.text({
          label: 'Anchor ID (optional)',
          description: 'Only set this if the footer links to this specific service, e.g. "data-voice". Leave blank otherwise.',
        }),
        order: fields.integer({
          label: 'Display Order',
          description: 'Lower numbers show first (1, 2, 3...)',
          defaultValue: 99,
        }),
      },
    }),

    hotlines: collection({
      label: 'Department Hotlines',
      slugField: 'department',
      path: 'src/content/hotlines/*',
      format: { data: 'yaml' },
      entryLayout: 'form',
      schema: {
        department: fields.slug({
          name: { label: 'Department Name', description: 'e.g. "Network & Cabling Support"' },
        }),
        phone: fields.text({ label: 'Phone Number' }),
        order: fields.integer({
          label: 'Display Order',
          description: 'Lower numbers show first (1, 2, 3...)',
          defaultValue: 99,
        }),
      },
    }),

    clients: collection({
      label: 'Clients / Trusted By',
      slugField: 'name',
      path: 'src/content/clients/*',
      format: { data: 'yaml' },
      entryLayout: 'form',
      schema: {
        name: fields.slug({
          name: { label: 'Company Name', description: 'e.g. "Hemas Holdings"' },
        }),
        logo: fields.image({
          label: 'Logo',
          description: 'Shown on the homepage scrolling wall and the About page client grid',
          directory: 'public/images/logos',
          publicPath: '/images/logos/',
        }),
        order: fields.integer({
          label: 'Display Order',
          description: 'Lower numbers show first',
          defaultValue: 99,
        }),
      },
    }),

    processSteps: collection({
      label: 'How We Work (Process Steps)',
      slugField: 'title',
      path: 'src/content/process-steps/*',
      format: { data: 'yaml' },
      entryLayout: 'form',
      schema: {
        title: fields.slug({
          name: { label: 'Step Name', description: 'e.g. "Enquiry", "Survey", "Install", "Handover"' },
        }),
        description: fields.text({
          label: 'Description',
          description: 'One or two sentences explaining this step',
          multiline: true,
        }),
        order: fields.integer({
          label: 'Display Order',
          description: 'Steps display left-to-right in this order (1, 2, 3, 4...)',
          defaultValue: 99,
        }),
      },
    }),
  },

  singletons: {
    settings: singleton({
      label: 'Company Info',
      path: 'src/content/settings/company',
      format: { data: 'yaml' },
      entryLayout: 'form',
      schema: {
        addressLine1: fields.text({ label: 'Office Address Line 1', description: 'e.g. "No 9, Park Avenue"' }),
        addressLine2: fields.text({ label: 'Office Address Line 2', description: 'e.g. "Colombo 8"' }),
        country: fields.text({ label: 'Country', defaultValue: 'Sri Lanka' }),
        warehouseAddressLine1: fields.text({ label: 'Warehouse Address Line 1' }),
        warehouseAddressLine2: fields.text({ label: 'Warehouse Address Line 2' }),
        primaryPhone: fields.text({ label: 'General Phone Number' }),
        fax: fields.text({ label: 'Fax Number' }),
        primaryEmail: fields.text({ label: 'Email Address' }),
        mapsEmbedUrl: fields.text({
          label: 'Google Maps Embed URL',
          description: 'From Google Maps: Share → Embed a map → copy the src="..." link',
        }),
        mapsSearchUrl: fields.text({
          label: 'Google Maps Directions URL',
          description: 'A regular Google Maps link people can click for directions',
        }),
      },
    }),

    stats: singleton({
      label: 'Company Stats',
      path: 'src/content/stats/company',
      format: { data: 'yaml' },
      entryLayout: 'form',
      schema: {
        ownershipValue: fields.text({ label: 'Ownership Value', description: 'e.g. "100%"' }),
        ownershipLabel: fields.text({ label: 'Ownership Label', description: 'e.g. "Sri Lankan"' }),
        permanentStaffValue: fields.text({ label: 'Permanent Staff Value', description: 'e.g. "150+"' }),
        permanentStaffLabel: fields.text({ label: 'Permanent Staff Label' }),
        contractualStaffValue: fields.text({ label: 'Contractual Staff Value', description: 'e.g. "200+"' }),
        contractualStaffLabel: fields.text({ label: 'Contractual Staff Label' }),
        coverageValue: fields.text({ label: 'Coverage Value', description: 'e.g. "Islandwide"' }),
        coverageLabel: fields.text({ label: 'Coverage Label', description: 'e.g. "Delivery"' }),
        annualTurnover: fields.text({ label: 'Annual Turnover', description: 'e.g. "Rs. 120M"' }),
      },
    }),

    hero: singleton({
      label: 'Homepage Hero',
      path: 'src/content/hero/company',
      format: { data: 'yaml' },
      entryLayout: 'form',
      schema: {
        headlineLine1: fields.text({ label: 'Headline Line 1', description: 'e.g. "INFRASTRUCTURE,"' }),
        headlineLine2: fields.text({ label: 'Headline Line 2', description: 'e.g. "CONNECTED."' }),
        subtitle: fields.text({ label: 'Subtitle', multiline: true }),
        primaryButtonLabel: fields.text({ label: 'Primary Button Text', description: 'e.g. "Get a Quote"' }),
        secondaryButtonLabel: fields.text({ label: 'Secondary Button Text', description: 'e.g. "Explore Services"' }),
      },
    }),

    homepageAbout: singleton({
      label: 'Homepage About Section',
      path: 'src/content/homepage-about/company',
      format: { data: 'yaml' },
      entryLayout: 'form',
      schema: {
        eyebrow: fields.text({ label: 'Small Label Above Title' }),
        title: fields.text({ label: 'Title' }),
        body: fields.text({ label: 'Body Paragraph', multiline: true }),
        specialties: fields.array(
          fields.text({ label: 'Item' }),
          {
            label: 'Specialty List',
            description: 'The bullet list of specialties shown on the right side',
            itemLabel: (props) => props.value || 'New item',
          }
        ),
        watermarkWord: fields.text({
          label: 'Background Watermark Word',
          description: 'The large faint word in the background of this section',
        }),
        primaryButtonLabel: fields.text({ label: 'Primary Button Text' }),
        secondaryButtonLabel: fields.text({ label: 'Secondary Button Text' }),
      },
    }),

    aboutPage: singleton({
      label: 'About Page',
      path: 'src/content/about-page/company',
      format: { data: 'yaml' },
      entryLayout: 'form',
      schema: {
        heroTitle: fields.text({ label: 'Title' }),
        heroBody: fields.text({ label: 'Body Paragraph', multiline: true }),
        boardMembers: fields.array(
          fields.text({ label: 'Name' }),
          {
            label: 'Board of Directors',
            itemLabel: (props) => props.value || 'New member',
          }
        ),
      },
    }),
  },
});
