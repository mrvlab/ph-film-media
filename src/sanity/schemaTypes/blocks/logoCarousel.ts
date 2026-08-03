import { ListIcon } from '@sanity/icons/List';

import { defineField, defineType } from 'sanity';

export const logoCarousel = defineType({
  name: 'logoCarousel',
  title: 'Logo Carousel',
  type: 'object',
  icon: ListIcon,
  fields: [
    defineField({
      name: 'logoItems',
      title: 'Logo Items',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'logoItem',
          title: 'Logo Item',
          fields: [
            {
              name: 'mediaItem',
              title: 'Media Item',
              type: 'mediaType',
            },
          ],
          preview: {
            select: {
              title: 'mediaItem.media.alt',
              media: 'mediaItem.media',
            },
          },
        },
      ],
    }),
  ],
  preview: {
    select: {
      media: 'logoItems.0.mediaItem.media',
    },
    prepare({ media }) {
      return {
        title: 'Logo Carousel',
        media: media || ListIcon,
      };
    },
  },
});
