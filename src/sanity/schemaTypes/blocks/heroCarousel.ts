import { ImageIcon } from '@sanity/icons/Image';
import { ListIcon } from '@sanity/icons/List';
import { TextIcon } from '@sanity/icons/Text';
import { defineField, defineType } from 'sanity';

export const heroCarousel = defineType({
  name: 'heroCarousel',
  title: 'Hero Carousel',
  type: 'object',
  icon: ListIcon,
  fields: [
    defineField({
      name: 'mediaCard',
      title: 'Media Card',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'content',
          title: 'Content',
          fields: [
            {
              name: 'cardImage',
              type: 'mediaType',
            },
            {
              name: 'title',
              title: 'Title',
              type: 'string',
            },
            {
              name: 'infoItems',
              title: 'Info Items',
              description:
                'Add info items to the media card, to highlight the title',
              type: 'array',
              of: [
                {
                  type: 'object',
                  name: 'infoItem',
                  title: 'Info Item',
                  fields: [
                    {
                      name: 'infoItemTitle',
                      title: 'Info Item Title',
                      type: 'string',
                    },
                  ],
                  preview: {
                    select: {
                      title: 'infoItemTitle',
                    },
                    prepare({ title }) {
                      return {
                        title: title || 'No title',
                        media: TextIcon,
                      };
                    },
                  },
                },
              ],
            },
            {
              name: 'cardLink',
              title: 'Card Link',
              type: 'linkType',
              description:
                'Takes you to an internal page or external page, upon clicking the card.',
            },
          ],
          preview: {
            select: {
              title: 'title',
              media: 'cardImage.media',
              linkType: 'cardLink.linkType',
              externalLink: 'cardLink.externalLink',
              internalLink: 'cardLink.internalLink',
              pageTitle: 'cardLink.internalLink.pageTitle',
            },
            prepare({
              title,
              media,
              linkType,
              externalLink,
              internalLink,
              pageTitle,
            }) {
              let subtitle = '';

              if (linkType === 'externalLink' && externalLink) {
                subtitle = `Link to: ${externalLink}`;
              } else if (
                (linkType === 'internalLink' || linkType === 'page') &&
                internalLink
              ) {
                subtitle = `Link to page: ${pageTitle || 'Unknown page'}`;
              }

              return {
                title: title || 'No title',
                media: media || ImageIcon,
                ...(subtitle && { subtitle }),
              };
            },
          },
        },
      ],
    }),
  ],
  preview: {
    prepare() {
      return {
        title: 'Hero Carousel',
        media: ListIcon,
      };
    },
  },
});
