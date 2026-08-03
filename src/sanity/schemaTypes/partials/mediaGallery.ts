import { ImageIcon } from '@sanity/icons/Image';
import { defineField, defineType } from 'sanity';

export const mediaGallery = defineType({
  name: 'mediaGallery',
  title: 'Media Gallery',
  type: 'object',
  icon: ImageIcon,
  fields: [
    defineField({
      name: 'mediaItems',
      title: 'Media Items',
      type: 'array',
      of: [
        defineField({
          name: 'image',
          title: 'Image',
          type: 'image',
          options: { hotspot: true, metadata: ['lqip'] },
          fields: [
            defineField({
              name: 'alt',
              title: 'Alternative Text',
              type: 'string',
            }),
          ],
        }),
      ],
    }),
  ],
  preview: {
    select: {
      title: 'title',
      media: 'mediaItems.0.image',
    },
    prepare({ title, media }) {
      return {
        title: title || 'Media Gallery',
        media: media || ImageIcon,
      };
    },
  },
});
