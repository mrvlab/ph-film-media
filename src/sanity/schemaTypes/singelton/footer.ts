import { DoubleChevronDownIcon } from '@sanity/icons/DoubleChevronDown';
import { LinkIcon } from '@sanity/icons/Link';
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
      name: 'contact',
      title: 'Contact',
    },
  ],
  fields: [
    defineField({
      name: 'ctaText',
      title: 'Medlemskapstext',
      type: 'text',
      rows: 4,
      description:
        'Texten ovanför medlemskapsknappen i sidfoten. Lämnas den tom används en standardtext.',
      group: 'text',
    }),
    defineField({
      name: 'ctaLabel',
      title: 'Knapptext',
      type: 'string',
      initialValue: 'Bli medlem',
      description: 'Texten på medlemskapsknappen i sidfoten.',
      group: 'text',
    }),
    defineField({
      name: 'contactLinks',
      title: 'Kontaktlänkar',
      description:
        'Raderna längst ner i sidfoten, t.ex. e-post, Instagram, nyhetsbrev och YouTube.',
      group: 'contact',
      type: 'array',
      of: [
        defineField({
          name: 'footerContactLink',
          title: 'Kontaktlänk',
          type: 'object',
          fields: [
            defineField({
              name: 'label',
              title: 'Label',
              type: 'string',
              validation: (Rule) => Rule.required(),
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
              const title = label || 'Kontaktlänk';
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
      name: 'email',
      title: 'Kontakt-e-post (support)',
      type: 'string',
      description:
        'Visas inte i sidfoten. Används som supportadress i medlemsrutan när ett medlemskap är spärrat.',
      group: 'contact',
    }),
    defineField({
      name: 'rights',
      title: 'Rights',
      type: 'string',
      description:
        'Visas efter årtalet i sidfotens copyright-rad, t.ex. "PH Media. All rights reserved."',
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
