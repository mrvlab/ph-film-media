import { ListIcon } from '@sanity/icons/List';
import { defineArrayMember, defineField, defineType } from 'sanity';

export const movieClubList = defineType({
  name: 'movieClubList',
  title: 'Movie Club List',
  type: 'object',
  icon: ListIcon,
  fields: [
    defineField({
      name: 'movies',
      title: 'Movies',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{ type: 'movieClub' }],
        }),
      ],
    }),
  ],
  preview: {
    prepare() {
      return {
        title: 'Movie Club List',
        media: ListIcon,
      };
    },
  },
});
