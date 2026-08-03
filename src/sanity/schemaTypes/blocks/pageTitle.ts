import { TextIcon } from '@sanity/icons/Text';
import { useEffect } from 'react';

import { defineField, defineType, ObjectInputProps, set, unset } from 'sanity';

// Custom input component that clears inactive media fields
function PageTitleInput(props: ObjectInputProps) {
  const { value, onChange } = props;

  useEffect(() => {
    if (!value) return;

    const titleTypeValue = value.titleType || 'text';

    // Set default titleType if not present
    if (!value.titleType) {
      onChange(set('text', ['titleType']));
      return;
    }

    if (titleTypeValue === 'text' && value.pageTitleImage) {
      onChange(unset(['pageTitleImage']));
    }

    if (titleTypeValue === 'image' && value.title) {
      onChange(unset(['title']));
    }
  }, [value, onChange]);

  return props.renderDefault(props);
}

export const pageTitle = defineType({
  name: 'pageTitle',
  title: 'Page Title',
  type: 'object',
  icon: TextIcon,
  components: {
    input: PageTitleInput,
  },
  fields: [
    defineField({
      name: 'titleType',
      title: 'Title Type',
      type: 'string',
      options: {
        list: [
          { title: 'Text', value: 'text' },
          { title: 'Image', value: 'image' },
        ],
        layout: 'radio',
      },
      initialValue: 'text',
    }),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'If no title is provided, the page title will be used',
      hidden: ({ parent }) => parent?.titleType === 'image',
    }),
    defineField({
      name: 'pageTitleImage',
      title: 'Page Title Image',
      type: 'mediaType',
      description: 'If no image is provided, the page title will be used',
      hidden: ({ parent }) => parent?.titleType === 'text',
    }),
    defineField({
      name: 'visibility',
      title: 'Visibility',
      type: 'visibilityType',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      pageTitleImage: 'pageTitleImage.media',
      pageTitleImageAlt: 'pageTitleImage.media.alt',
      visibility: 'visibility',
    },
    prepare({ title, pageTitleImage, visibility, pageTitleImageAlt }) {
      const displayTitle = pageTitleImage
        ? pageTitleImageAlt || 'Image Logo'
        : title || 'No title';

      return {
        title: displayTitle,
        media: pageTitleImage || TextIcon,
        subtitle: visibility
          ? `Visible on - Mobile: ${visibility.hideOnMobile ? '🔴' : '🟢'} | Desktop: ${visibility.hideOnDesktop ? '🔴' : '🟢'}`
          : 'Visible on - Mobile: 🟢 | Desktop: 🟢',
      };
    },
  },
});
