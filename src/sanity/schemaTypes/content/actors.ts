import { UserIcon } from '@sanity/icons/User';
import { defineField, defineType } from 'sanity';

export const actors = defineType({
  name: 'actors',
  title: 'Actors',
  type: 'document',
  icon: UserIcon,
  fields: [
    defineField({
      name: 'actor',
      title: 'Actor',
      type: 'string',
      validation: (Rule) => Rule.required().error('Actor name is required.'),
    }),
  ],
  preview: {
    select: {
      title: 'actor',
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
        title: title || 'Actor',
        subtitle: `Last edited: ${formattedDate}`,
      };
    },
  },
});
