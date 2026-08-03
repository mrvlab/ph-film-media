import { UserIcon } from '@sanity/icons/User';
import { defineField, defineType } from 'sanity';

export const writers = defineType({
  name: 'writers',
  title: 'Writers',
  type: 'document',
  icon: UserIcon,
  fields: [
    defineField({
      name: 'writer',
      title: 'Writer',
      type: 'string',
      validation: (Rule) => Rule.required().error('Writer name is required.'),
    }),
  ],
  preview: {
    select: {
      title: 'writer',
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
        title: title || 'Writer',
        subtitle: `Last edited: ${formattedDate}`,
      };
    },
  },
});
