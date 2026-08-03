import { DocumentsIcon } from '@sanity/icons/Documents';
import { defineField, defineType } from 'sanity';

export const projects = defineType({
  name: 'projects',
  title: 'Projects',
  type: 'document',
  icon: DocumentsIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required().error('Title is required.'),
    }),

    defineField({
      name: 'description',
      title: 'Description',
      type: 'richText',
    }),

    defineField({
      name: 'projectImage',
      title: 'Project Image',
      type: 'mediaType',
    }),
    defineField({
      name: 'link',
      title: 'Link',
      type: 'linkType',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      updatedAt: '_updatedAt',
      projectImage: 'projectImage.media',
    },
    prepare({ title, updatedAt, projectImage }) {
      const formattedDate = updatedAt
        ? new Date(updatedAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })
        : 'No edits yet';

      return {
        title: title || 'Project',
        subtitle: `Last edited: ${formattedDate}`,
        media: projectImage ? projectImage : DocumentsIcon,
      };
    },
  },
});
