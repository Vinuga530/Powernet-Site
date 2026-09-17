import { config, fields, collection, singleton } from '@keystatic/core';

export default config({
  storage: import.meta.env.DEV
    ? { kind: 'local' }
    : { kind: 'github', repo: 'Vinuga530/Powernet-Site' },

  ui: {
    brand: { name: 'Powernet' },
  },

  singletons: {
    company: singleton({
      label: 'Company Information',
      path: 'src/content/settings/company',
      format: { data: 'yaml' },
      schema: {
        addressLine1: fields.text({ label: 'Address Line 1', defaultValue: 'No 9, Park Avenue' }),
        addressLine2: fields.text({ label: 'Address Line 2', defaultValue: 'Colombo 8' }),
        country: fields.text({ label: 'Country', defaultValue: 'Sri Lanka' }),
        primaryPhone: fields.text({ label: 'Primary Phone', defaultValue: '+94 11 234 5678' }),
        primaryEmail: fields.text({ label: 'General Email', defaultValue: 'info@powernet.lk' }),
        mapsEmbedUrl: fields.text({
          label: 'Google Maps Embed URL',
          multiline: true,
          defaultValue: 'https://www.google.com/maps?q=No+9%2C+Park+Avenue%2C+Colombo+8%2C+Sri+Lanka&output=embed',
        }),
        mapsSearchUrl: fields.text({
          label: 'Google Maps Search Link',
          multiline: true,
          defaultValue: 'https://www.google.com/maps/search/?api=1&query=No+9%2C+Park+Avenue%2C+Colombo+8%2C+Sri+Lanka',
        }),
      },
    }),
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
          name: {
            label: 'Department Name',
            description: 'e.g. "Network & Cabling Support"',
          },
        }),
        phone: fields.text({ label: 'Phone Number' }),
        order: fields.integer({
          label: 'Display Order',
          defaultValue: 1,
        }),
      },
    }),
  },
});
