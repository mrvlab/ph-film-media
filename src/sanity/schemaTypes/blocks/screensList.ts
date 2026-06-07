import { ListIcon } from '@sanity/icons';
import { defineArrayMember, defineField, defineType } from 'sanity';

export const screensList = defineType({
  name: 'screensList',
  title: 'Screens List',
  type: 'object',
  icon: ListIcon,
  fields: [
    defineField({
      name: 'screens',
      title: 'Screens',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{ type: 'screen' }],
        }),
      ],
    }),
  ],
  preview: {
    prepare() {
      return {
        title: 'Screens List',
        media: ListIcon,
      };
    },
  },
});
