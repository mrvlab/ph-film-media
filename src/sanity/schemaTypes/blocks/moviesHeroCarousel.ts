import { ListIcon } from '@sanity/icons/List';
import { defineField, defineType } from 'sanity';

export const moviesHeroCarousel = defineType({
  name: 'moviesHeroCarousel',
  title: 'Movies Hero Carousel',
  type: 'object',
  icon: ListIcon,
  fields: [
    defineField({
      name: 'mediaItems',
      title: 'Media Items',
      type: 'array',
      of: [{ type: 'mediaType' }],
    }),
  ],
  preview: {
    prepare() {
      return {
        title: 'Movies Hero Carousel',
        media: ListIcon,
      };
    },
  },
});
