import { UserIcon } from '@sanity/icons/User';
import { defineField, defineType } from 'sanity';

export const directors = defineType({
  name: 'directors',
  title: 'Directors',
  type: 'document',
  icon: UserIcon,
  fields: [
    defineField({
      name: 'director',
      title: 'Director',
      type: 'string',
      validation: (Rule) => Rule.required().error('Director name is required.'),
    }),
  ],
  preview: {
    select: {
      title: 'director',
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
        title: title || 'Director',
        subtitle: `Last edited: ${formattedDate}`,
      };
    },
  },
});
