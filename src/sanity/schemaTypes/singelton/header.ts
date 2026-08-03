import { LinkIcon } from '@sanity/icons/Link';
import { defineField, defineType } from 'sanity';

export const header = defineType({
  name: 'header',
  title: 'Header',
  type: 'document',
  icon: LinkIcon,
  groups: [
    {
      name: 'logo',
      title: 'Logo',
    },
    {
      name: 'mobileMenu',
      title: 'Mobile Menu',
    },
    {
      name: 'desktopMenu',
      title: 'Desktop Menu',
    },
  ],
  fields: [
    defineField({
      name: 'mobileLogo',
      title: 'Mobile Logo',
      type: 'mediaType',
      group: 'logo',
      description: 'Logo displayed on mobile devices',
    }),
    defineField({
      name: 'desktopLogo',
      title: 'Desktop Logo',
      type: 'mediaType',
      group: 'logo',
      description: 'Logo displayed on desktop devices',
    }),
    defineField({
      name: 'linkReference',
      title: 'Link Reference',
      type: 'array',
      group: ['mobileMenu', 'desktopMenu'],
      of: [
        defineField({
          name: 'navigationItem',
          title: 'Navigation Item',
          type: 'object',
          fields: [
            defineField({
              name: 'label',
              title: 'Label',
              type: 'string',
              description:
                'This is used to override the default label for the navigation item.',
            }),
            defineField({
              name: 'link',
              title: 'Link',
              type: 'linkType',
            }),
          ],
          preview: {
            select: {
              label: 'label',
              linkType: 'link.linkType',
              externalLink: 'link.externalLink',
              internalLink: 'link.internalLink',
              pageTitle: 'link.internalLink.pageTitle',
            },
            prepare(selection) {
              const { label, linkType, externalLink, internalLink, pageTitle } =
                selection;
              const title = label || 'Navigation Item';
              let subtitle = '';

              if (linkType === 'externalLink' && externalLink) {
                subtitle = `Link to: ${externalLink}`;
              } else if (linkType === 'internalLink' && internalLink) {
                subtitle = `Link to page: ${pageTitle}`;
              } else {
                subtitle = 'No link configured';
              }

              return {
                title,
                subtitle,
                media: LinkIcon,
              };
            },
          },
        }),
      ],
    }),
    defineField({
      name: 'homeMenuItemLabel',
      title: 'Home Menu Item Label (Mobile)',
      description:
        'This is used to display a label for the home page in the menu on mobile.',
      group: 'mobileMenu',
      type: 'string',
    }),
    defineField({
      name: 'socialMediaLinks',
      title: 'Social Media Links (Mobile)',
      description: 'This is used to display icons in the mobile navigation.',
      group: 'mobileMenu',
      type: 'array',
      of: [{ type: 'linkType' }],
      validation: (Rule) => Rule.max(3),
    }),
  ],
  preview: {
    prepare() {
      return {
        title: 'Navigation Items',
        media: LinkIcon,
      };
    },
  },
});
