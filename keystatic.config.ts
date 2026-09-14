import { config, fields, collection } from '@keystatic/core';

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
  },
});
