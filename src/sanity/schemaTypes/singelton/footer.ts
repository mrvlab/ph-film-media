import { DoubleChevronDownIcon } from '@sanity/icons/DoubleChevronDown';
import { defineField, defineType } from 'sanity';

export const footer = defineType({
  name: 'footer',
  title: 'Footer',
  type: 'document',
  icon: DoubleChevronDownIcon,
  groups: [
    {
      name: 'text',
      title: 'Text',
    },
    {
      name: 'socialMedia',
      title: 'Social Media',
    },
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      group: 'text',
    }),
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
      group: 'text',
    }),
    defineField({
      name: 'socialMediaLinks',
      title: 'Social Media Links',
      description: 'The links to the social media pages.',
      group: 'socialMedia',
      type: 'array',
      of: [{ type: 'linkType' }],
      validation: (Rule) => Rule.max(3),
    }),
    defineField({
      name: 'text',
      type: 'richText',
      description: 'The text to display underneath the email address.',
      group: 'text',
    }),
    defineField({
      name: 'rights',
      title: 'Rights',
      type: 'string',
      description: 'The rights text to display in the footer.',
      group: 'text',
    }),
  ],

  preview: {
    select: {
      updatedAt: '_updatedAt',
    },
    prepare({ updatedAt }) {
      const formattedDate = updatedAt
        ? new Date(updatedAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })
        : 'No edits yet';

      return {
        title: 'Footer',
        subtitle: `Last edited: ${formattedDate}`,
        media: DoubleChevronDownIcon,
      };
    },
  },
});
