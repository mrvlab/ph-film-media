import { TagIcon } from '@sanity/icons';
import { defineArrayMember, defineField, defineType } from 'sanity';

export const ticketsList = defineType({
  name: 'ticketsList',
  title: 'Tickets List',
  type: 'object',
  icon: TagIcon,
  fields: [
    defineField({
      name: 'heading',
      title: 'Heading (optional)',
      type: 'string',
    }),
    defineField({
      name: 'tickets',
      title: 'Tickets',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{ type: 'ticket' }],
        }),
      ],
    }),
  ],
  preview: {
    select: {
      heading: 'heading',
      ticket0: 'tickets.0.title',
      count: 'tickets.length',
    },
    prepare({ heading, ticket0, count }) {
      const subtitle = count ? `${count} ticket${count === 1 ? '' : 's'}` : 'No tickets';
      return {
        title: heading || ticket0 || 'Tickets List',
        subtitle,
        media: TagIcon,
      };
    },
  },
});
