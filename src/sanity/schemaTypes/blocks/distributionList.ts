import { ListIcon } from '@sanity/icons/List';
import { defineField, defineType } from 'sanity';

export const distributionList = defineType({
  name: 'distributionList',
  title: 'Distribution List',
  type: 'object',
  icon: ListIcon,
  fields: [
    defineField({
      name: 'movies',
      title: 'Movies',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{ type: 'distributions' }],
        },
      ],
    }),
  ],
  preview: {
    prepare() {
      return {
        title: 'Movie List',
        media: ListIcon,
      };
    },
  },
});
