import { EyeOpenIcon } from '@sanity/icons/EyeOpen';
import { defineField, defineType } from 'sanity';

export const visibilityType = defineType({
  name: 'visibilityType',
  title: 'Visibility Type',
  type: 'object',
  icon: EyeOpenIcon,
  fields: [
    defineField({
      name: 'hideOnMobile',
      title: 'Hide on Mobile',
      type: 'boolean',
      description: 'Enable to hide the block on mobile devices.',
      initialValue: false,
    }),
    defineField({
      name: 'hideOnDesktop',
      title: 'Hide on Desktop',
      type: 'boolean',
      description: 'Enable to hide the block on desktop devices.',
      initialValue: false,
    }),
  ],
  preview: {
    select: {
      hideOnMobile: 'hideOnMobile',
      hideOnDesktop: 'hideOnDesktop',
    },
    prepare({ hideOnMobile, hideOnDesktop }) {
      return {
        title: 'Visibility Type',
        subtitle: `Visible on - Mobile: ${hideOnMobile ? '🔴' : '🟢'} | Desktop: ${hideOnDesktop ? '🔴' : '🟢'}`,
      };
    },
  },
});
