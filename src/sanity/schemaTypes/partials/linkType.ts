import { LinkIcon } from '@sanity/icons/Link';
import { defineField, defineType } from 'sanity';

export const linkType = defineType({
  name: 'linkType',
  title: 'Link Type',
  type: 'object',
  icon: LinkIcon,
  fields: [
    defineField({
      name: 'linkType',
      title: 'Link Type',
      type: 'string',
      initialValue: 'internalLink',
      options: {
        list: [
          { title: 'Link (Internal)', value: 'internalLink' },
          { title: 'Link (External)', value: 'externalLink' },
        ],
        layout: 'radio',
      },
    }),
    defineField({
      name: 'internalLink',
      title: 'Link (Internal)',
      description: 'Select internal page that will be linked to.',
      type: 'reference',
      to: [{ type: 'page' }],
      hidden: ({ parent }) => parent?.linkType !== 'internalLink',
      validation: (Rule) =>
        // Custom validation to ensure page reference is provided if the link type is 'page'
        Rule.custom((value, context) => {
          const parent = context.parent as { linkType?: string };
          if (parent?.linkType === 'internalLink' && !value) {
            return 'Internal Link reference is required when Link Type is Internal Link';
          }
          return true;
        }),
    }),
    defineField({
      name: 'externalLink',
      title: 'Link (External)',
      description:
        'Enter the URL for the external link that will open in a new tab. You can use mailto: or tel: URLs.',
      type: 'string',
      hidden: ({ parent }) => parent?.linkType !== 'externalLink',
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const parent = context.parent as { linkType?: string };

          // Check if URL is required
          if (parent?.linkType === 'externalLink' && !value) {
            return 'External Link is required when Link Type is External Link';
          }

          // If URL is provided, validate the format
          if (value) {
            // Allow mailto: URLs
            if (value.startsWith('mailto:')) {
              return true;
            }

            // Allow tel: URLs
            if (value.startsWith('tel:')) {
              return true;
            }

            // Validate HTTP/HTTPS URLs
            try {
              const url = new URL(value);
              if (url.protocol === 'http:' || url.protocol === 'https:') {
                return true;
              }
            } catch {
              return 'Please enter a valid External Link (http://, https://, mailto:, or tel:)';
            }

            return 'Please enter a valid External Link (http://, https://, mailto:, or tel:)';
          }

          return true;
        }),
    }),
  ],
  preview: {
    select: {
      linkType: 'linkType',
      externalLink: 'externalLink',
      internalLink: 'internalLink',
    },
    prepare({ linkType, externalLink, internalLink }) {
      if (linkType === 'externalLink') {
        return {
          title: externalLink
            ? `Link to: ${externalLink}`
            : 'No link configured',
          media: LinkIcon,
        };
      } else if (linkType === 'internalLink') {
        return {
          title: internalLink?.pageTitle
            ? `Link to page: ${internalLink.pageTitle}`
            : 'No page selected',
          media: LinkIcon,
        };
      }
      return { title: 'No link configured', media: LinkIcon };
    },
  },
});
