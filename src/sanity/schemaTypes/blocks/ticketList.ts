import { TagIcon } from '@sanity/icons/Tag';
import { defineArrayMember, defineField, defineType } from 'sanity';

export const ticketList = defineType({
  name: 'ticketList',
  title: 'Ticket List',
  type: 'object',
  icon: TagIcon,
  fields: [
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
      name: 'showTitle',
      title: 'Show title',
      type: 'boolean',
      description:
        'Show the section title (from Settings → Ticket Settings). On by default.',
      initialValue: true,
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
      ticket0: 'tickets.0.title',
      count: 'tickets.length',
    },
    prepare({ ticket0, count }) {
      const subtitle = count
        ? `${count} ticket${count === 1 ? '' : 's'}`
        : 'No tickets';
      return {
        title: ticket0 || 'Ticket List',
        subtitle,
        media: TagIcon,
      };
    },
  },
});
