import { ListIcon } from '@sanity/icons/List';
import { defineField, defineType } from 'sanity';

export const mediaCarousel = defineType({
  name: 'mediaCarousel',
  title: 'Media Carousel',
  type: 'object',
  icon: ListIcon,
  fields: [
    defineField({
      name: 'carouselItems',
      title: 'Carousel Items',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'carouselItem',
          title: 'Carousel Item',
          fields: [
            {
              name: 'mediaItem',
              title: 'Media Item',
              type: 'mediaType',
            },
            {
              name: 'title',
              title: 'Title',
              type: 'string',
            },
          ],
          preview: {
            select: {
              title: 'title',
              media: 'mediaItem.media',
            },
          },
        },
      ],
    }),
  ],
  preview: {
    prepare() {
      return {
        title: 'Media Carousel',
        media: ListIcon,
      };
    },
  },
});
