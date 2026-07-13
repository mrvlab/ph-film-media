import { TagIcon } from '@sanity/icons';
import { defineArrayMember, defineField, defineType } from 'sanity';

export const ticketList = defineType({
  name: 'ticketList',
  title: 'Ticket List',
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
    defineField({
      name: 'bottomSpacing',
      title: 'Bottom spacing',
      type: 'boolean',
      description: 'Adds spacing below this block.',
      initialValue: true,
    }),
  ],
  preview: {
    select: {
      heading: 'heading',
      ticket0: 'tickets.0.title',
      count: 'tickets.length',
    },
    prepare({ heading, ticket0, count }) {
      const subtitle = count
        ? `${count} ticket${count === 1 ? '' : 's'}`
        : 'No tickets';
      return {
        title: heading || ticket0 || 'Ticket List',
        subtitle,
        media: TagIcon,
      };
    },
  },
});
