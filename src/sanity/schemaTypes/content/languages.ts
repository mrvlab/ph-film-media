import { TranslateIcon } from '@sanity/icons/Translate';
import { defineField, defineType } from 'sanity';

export const languages = defineType({
  name: 'languages',
  title: 'Languages',
  type: 'document',
  icon: TranslateIcon,
  fields: [
    defineField({
      name: 'language',
      title: 'Language',
      type: 'string',
      validation: (Rule) => Rule.required().error('Language name is required.'),
    }),
  ],
  preview: {
    select: {
      title: 'language',
      updatedAt: '_updatedAt',
    },
    prepare({ title, updatedAt }) {
      const formattedDate = updatedAt
        ? new Date(updatedAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })
        : 'No edits yet';

      return {
        title: title || 'Language',
        subtitle: `Last edited: ${formattedDate}`,
      };
    },
  },
});
