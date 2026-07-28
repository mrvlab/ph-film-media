import { TransferIcon } from '@sanity/icons';

import { defineField, defineType } from 'sanity';

export const inPartnerWith = defineType({
  name: 'inPartnerWith',
  title: 'In Partner With',
  type: 'object',
  icon: TransferIcon,
  fields: [
    defineField({
      name: 'items',
      title: 'Marquee Texts',
      description: 'Short phrases that loop endlessly across the bar.',
      type: 'array',
      of: [{ type: 'string' }],
    }),
  ],
  preview: {
    select: {
      first: 'items.0',
      second: 'items.1',
    },
    prepare({ first, second }) {
      const parts = [first, second].filter(Boolean);
      return {
        title: 'In Partner With',
        subtitle: parts.length ? parts.join(' · ') : 'No texts',
      };
    },
  },
});
