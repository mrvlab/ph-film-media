import { PlayIcon } from '@sanity/icons';
import { defineField, defineType } from 'sanity';

export const lounge = defineType({
  name: 'lounge',
  title: 'Lounge',
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
      name: 'date',
      title: 'Date',
      description: 'The date shown next to the item. (Released date)',
      type: 'date',
    }),
    defineField({
      name: 'loungeImage',
      title: 'Lounge Image',
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
      date: 'date',
      updatedAt: '_updatedAt',
      loungeImage: 'loungeImage.media',
    },
    prepare({ title, date, updatedAt, loungeImage }) {
      const referenceDate = date || updatedAt;
      const formattedDate = referenceDate
        ? new Date(referenceDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })
        : 'No date set';

      return {
        title: title || 'Lounge',
        subtitle: date ? formattedDate : `Last edited: ${formattedDate}`,
        media: loungeImage ? loungeImage : PlayIcon,
      };
    },
  },
});
