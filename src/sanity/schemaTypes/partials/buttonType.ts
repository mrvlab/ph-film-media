import { LinkIcon } from '@sanity/icons/Link';
import { defineField, defineType } from 'sanity';

export const buttonType = defineType({
  name: 'buttonType',
  title: 'Button Type',
  type: 'object',
  icon: LinkIcon,
  fields: [
    defineField({
      name: 'buttonLabel',
      title: 'Button Label',
      type: 'string',
    }),
    defineField({
      name: 'buttonLink',
      title: 'Button Link',
      type: 'linkType',
    }),
  ],
  preview: {
    select: {
      buttonLabel: 'buttonLabel',
    },
    prepare({ buttonLabel }) {
      return {
        title: buttonLabel || 'No Button Label',
      };
    },
  },
});
