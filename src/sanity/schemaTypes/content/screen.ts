import { PlayIcon } from '@sanity/icons';
import { defineField, defineType } from 'sanity';

export const screen = defineType({
  name: 'screen',
  title: 'Screen',
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
      name: 'screenImage',
      title: 'Screen Image',
      type: 'mediaType',
    }),
    defineField({
      name: 'link',
      title: 'Link',
      description:
        'YouTube or Vimeo links open in an in-page video overlay. Any other external link opens in a new tab.',
      type: 'linkType',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      updatedAt: '_updatedAt',
      screenImage: 'screenImage.media',
    },
    prepare({ title, updatedAt, screenImage }) {
      const formattedDate = updatedAt
        ? new Date(updatedAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })
        : 'No edits yet';

      return {
        title: title || 'Screen',
        subtitle: `Last edited: ${formattedDate}`,
        media: screenImage ? screenImage : PlayIcon,
      };
    },
  },
});
