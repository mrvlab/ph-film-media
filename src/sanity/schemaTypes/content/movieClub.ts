import { PlayIcon } from '@sanity/icons/Play';
import { defineField, defineType } from 'sanity';

export const movieClub = defineType({
  name: 'movieClub',
  title: 'Movie Club',
  type: 'document',
  icon: PlayIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required().error('Title is required.'),
    }),
    defineField({
      name: 'movieBanner',
      title: 'Movie Banner',
      type: 'mediaType',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      updatedAt: '_updatedAt',
      movieBanner: 'movieBanner.media',
    },
    prepare({ title, updatedAt, movieBanner }) {
      const formattedDate = updatedAt
        ? new Date(updatedAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })
        : 'No edits yet';

      return {
        title: title || 'Movie',
        subtitle: `Last edited: ${formattedDate}`,
        media: movieBanner ? movieBanner : PlayIcon,
      };
    },
  },
});
