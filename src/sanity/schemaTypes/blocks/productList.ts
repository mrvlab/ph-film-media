import { BasketIcon } from '@sanity/icons';
import { defineArrayMember, defineField, defineType } from 'sanity';

export const productList = defineType({
  name: 'productList',
  title: 'Product List',
  type: 'object',
  icon: BasketIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'Optional heading shown above the grid. Leave empty for none.',
    }),
    defineField({
      name: 'products',
      title: 'Products',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{ type: 'product' }],
        }),
      ],
    }),
  ],
  preview: {
    select: {
      title: 'title',
      product0: 'products.0.title',
      count: 'products.length',
    },
    prepare({ title, product0, count }) {
      const subtitle = count
        ? `${count} product${count === 1 ? '' : 's'}`
        : 'No products';
      return {
        title: title || product0 || 'Product List',
        subtitle,
        media: BasketIcon,
      };
    },
  },
});
