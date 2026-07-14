import { BasketIcon } from '@sanity/icons';
import { defineArrayMember, defineField, defineType } from 'sanity';

// Preset sizes. `value` goes into checkout metadata and the ?size= URL, so
// keep them stable — renaming after sales orphans the old label's count.
const SIZE_OPTIONS: { title: string; value: string }[] = [
  { title: 'One size', value: 'One size' },
  { title: 'XS', value: 'XS' },
  { title: 'S', value: 'S' },
  { title: 'M', value: 'M' },
  { title: 'L', value: 'L' },
  { title: 'XL', value: 'XL' },
  { title: 'XXL', value: 'XXL' },
];

type Variant = { size?: string };

export const product = defineType({
  name: 'product',
  title: 'Products',
  type: 'document',
  icon: BasketIcon,
  groups: [
    { name: 'details', title: 'Details' },
    { name: 'media', title: 'Media' },
    { name: 'inventory', title: 'Sizes & stock' },
  ],
  fieldsets: [{ name: 'pricing', title: 'Pricing', options: { columns: 2 } }],
  fields: [
    // ----- Details -----
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      group: 'details',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      group: 'details',
      options: { source: 'title', maxLength: 96 },
      description:
        'Used in the product URL, e.g. /shop/products/roses-t-shirt. One product per colour — a different colour is its own product with its own slug.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 4,
      group: 'details',
    }),
    defineField({
      name: 'price',
      title: 'Price (major units, e.g. SEK)',
      type: 'number',
      group: 'details',
      fieldset: 'pricing',
      description: 'Applies to every size of this product.',
      validation: (Rule) => Rule.required().min(0),
    }),
    defineField({
      name: 'currency',
      title: 'Currency (ISO 4217, lowercase)',
      type: 'string',
      initialValue: 'sek',
      group: 'details',
      fieldset: 'pricing',
      validation: (Rule) => Rule.required().lowercase().length(3),
    }),
    // ----- Media -----
    defineField({
      name: 'gallery',
      title: 'Images',
      type: 'array',
      group: 'media',
      of: [defineArrayMember({ type: 'mediaType' })],
      description:
        'The first image is the main one — used on the card, as the social share (OG) image, and on Stripe Checkout. Add more for the product page.',
      validation: (Rule) => Rule.required().min(1),
    }),
    // ----- Sizes & stock -----
    defineField({
      name: 'variants',
      title: 'Sizes',
      type: 'array',
      group: 'inventory',
      description:
        'One entry per size. For a single-size product, keep just the "One size" entry. Each size tracks its own stock.',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'productVariant',
          title: 'Size',
          fields: [
            defineField({
              name: 'size',
              title: 'Size',
              type: 'string',
              options: { list: SIZE_OPTIONS, layout: 'dropdown' },
              initialValue: 'One size',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'stock',
              title: 'Stock (available quantity)',
              type: 'number',
              validation: (Rule) => Rule.required().integer().min(0),
            }),
            defineField({
              name: 'sold',
              title: 'Sold',
              type: 'number',
              initialValue: 0,
              readOnly: true,
              description:
                'Read-only. Recomputed automatically from Stripe on every purchase and refund, and nightly by the reconcile cron. To force a resync, POST /api/products/reconcile.',
            }),
          ],
          preview: {
            select: { size: 'size', stock: 'stock', sold: 'sold' },
            prepare({ size, stock, sold }) {
              const s = sold ?? 0;
              const t = stock ?? 0;
              const status =
                t > 0 && s >= t ? 'Sold out' : `${s}/${t} sold`;
              return { title: size || 'Size', subtitle: status };
            },
          },
        }),
      ],
      validation: (Rule) =>
        Rule.required()
          .min(1)
          .custom((variants: Variant[] | undefined) => {
            if (!variants) return true;
            const sizes = variants
              .map((v) => v?.size)
              .filter((s): s is string => Boolean(s));
            const seen = new Set<string>();
            const dupes = new Set<string>();
            for (const s of sizes) {
              if (seen.has(s)) dupes.add(s);
              seen.add(s);
            }
            return dupes.size
              ? `Each size can only appear once. Duplicate: ${[...dupes].join(', ')}`
              : true;
          }),
    }),
  ],
  preview: {
    select: {
      title: 'title',
      price: 'price',
      currency: 'currency',
      image: 'gallery.0.media',
      v0: 'variants.0.size',
      count: 'variants.length',
    },
    prepare({ title, price, currency, image, v0, count }) {
      const priceLabel =
        typeof price === 'number'
          ? `${price} ${(currency || 'sek').toUpperCase()}`
          : 'no price';
      const sizes =
        count > 1 ? `${count} sizes` : v0 ? v0 : 'no sizes';
      return {
        title: title || 'Untitled product',
        subtitle: `${priceLabel} · ${sizes}`,
        media: image || BasketIcon,
      };
    },
  },
});
