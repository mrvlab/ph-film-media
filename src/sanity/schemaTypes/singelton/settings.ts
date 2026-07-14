import { CogIcon } from '@sanity/icons';
import { defineField, defineType } from 'sanity';

export const settings = defineType({
  name: 'settings',
  title: 'Settings',
  type: 'document',
  icon: CogIcon,
  groups: [
    {
      name: 'seo',
      title: 'SEO',
    },
    {
      name: 'distributionSettings',
      title: 'Distribution Settings',
    },
    {
      name: 'ticketSettings',
      title: 'Ticket Settings',
    },
  ],
  fields: [
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'seo',
      group: 'seo',
    }),
    defineField({
      name: 'distributionMovieDetailTitles',
      title: 'Distribution Movie Detail Titles',
      description:
        'This is used to display the distribution movie detail titles.',
      type: 'object',
      fields: [
        defineField({
          name: 'descriptionLabel',
          title: 'Description Label (Beskrivning titel)',
          type: 'string',
        }),
        defineField({
          name: 'directorsLabel',
          title: 'Directors Label (Regissör titel)',
          type: 'string',
        }),
        defineField({
          name: 'writersLabel',
          title: 'Writers Label (Skribent titel)',
          type: 'string',
        }),
        defineField({
          name: 'actorsLabel',
          title: 'Actors Label (Medverkande titel)',
          type: 'string',
        }),
        defineField({
          name: 'languagesLabel',
          title: 'Languages Label (Språk titel)',
          type: 'string',
        }),
        defineField({
          name: 'releaseDateLabel',
          title: 'Release Date Label (Premiär titel)',
          type: 'string',
        }),
        defineField({
          name: 'durationLabel',
          title: 'Duration Label (Längd titel)',
          type: 'string',
        }),
      ],
      group: 'distributionSettings',
    }),
    defineField({
      name: 'ticketLabels',
      title: 'Ticket Labels',
      description: 'Labels shown on the ticket cards.',
      type: 'object',
      fields: [
        defineField({
          name: 'titleSingular',
          title: 'Section title — one ticket (Visning)',
          type: 'string',
          initialValue: 'Visning',
        }),
        defineField({
          name: 'titlePlural',
          title: 'Section title — multiple tickets (Visningar)',
          type: 'string',
          initialValue: 'Visningar',
        }),
        defineField({
          name: 'viewingLabel',
          title: 'Viewing Label — (Visning)',
          type: 'string',
          initialValue: 'Visning',
        }),
        defineField({
          name: 'locationLabel',
          title: 'Location Label (Plats)',
          type: 'string',
          initialValue: 'Plats',
        }),
        defineField({
          name: 'priceLabel',
          title: 'Price Label (Pris)',
          type: 'string',
          initialValue: 'Pris',
        }),
      ],
      group: 'ticketSettings',
    }),
  ],
  preview: {
    select: {
      title: 'seo.title',
      updatedAt: '_updatedAt',
    },
    prepare({ title, updatedAt }) {
      const formattedDate = updatedAt
        ? new Date(updatedAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })
        : 'No edits yet';

      return {
        title: title || 'Settings',
        subtitle: `Last edited: ${formattedDate}`,
      };
    },
  },
});
