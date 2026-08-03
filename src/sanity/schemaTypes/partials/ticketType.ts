import { LinkIcon } from '@sanity/icons/Link';
import { defineField, defineType } from 'sanity';

export const ticketType = defineType({
  name: 'ticketType',
  title: 'Ticket Type',
  type: 'object',
  icon: LinkIcon,
  fields: [
    defineField({
      name: 'ticketLinkLabel',
      title: 'Ticket Link Label',
      type: 'string',
    }),
    defineField({
      name: 'ticketLink',
      title: 'Ticket Link',
      type: 'linkType',
    }),
  ],
  preview: {
    select: {
      ticketLinkLabel: 'ticketLinkLabel',
    },
    prepare({ ticketLinkLabel }) {
      return {
        title: ticketLinkLabel || 'No Button Label',
      };
    },
  },
});
