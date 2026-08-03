import { ImageIcon } from '@sanity/icons/Image';
import { TextIcon } from '@sanity/icons/Text';
import { defineField, defineType } from 'sanity';

export const imageWithText = defineType({
  name: 'imageWithText',
  title: 'Image With Text',
  type: 'object',
  icon: ImageIcon,
  fields: [
    defineField({
      name: 'mediaItem',
      title: 'Media Item',
      type: 'mediaType',
    }),
    defineField({
      name: 'mediaTitle',
      title: 'Media Title',
      type: 'string',
    }),
    defineField({
      name: 'textSection',
      title: 'Text Section',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'textItem',
          title: 'Text Item',
          fields: [
            defineField({
              name: 'title',
              title: 'Title',
              type: 'string',
            }),
            defineField({
              name: 'richText',
              title: 'Rich Text',
              type: 'richText',
            }),
          ],
          preview: {
            select: {
              title: 'title',
            },
            prepare({ title }) {
              return {
                title: title || 'Text Item',
                media: TextIcon,
              };
            },
          },
        },
      ],
    }),
  ],
  preview: {
    select: {
      media: 'mediaItem.media',
    },
    prepare({ media }) {
      return {
        title: 'Image With Text',
        media: media || TextIcon,
      };
    },
  },
});
