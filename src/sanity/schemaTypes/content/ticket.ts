import { TagIcon } from '@sanity/icons';
import { defineField, defineType } from 'sanity';

export const ticket = defineType({
  name: 'ticket',
  title: 'Tickets',
  type: 'document',
  icon: TagIcon,
  fieldsets: [
    { name: 'pricing', title: 'Pricing', options: { columns: 2 } },
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
    }),
    defineField({
      name: 'date',
      title: 'Date & time',
      type: 'datetime',
    }),
    defineField({
      name: 'poster',
      title: 'Poster',
      type: 'image',
      options: { hotspot: true },
      description: 'Shown on the Stripe Checkout page and the test page.',
    }),
    defineField({
      name: 'price',
      title: 'Price (major units, e.g. SEK)',
      type: 'number',
      fieldset: 'pricing',
      validation: (Rule) => Rule.required().min(0),
    }),
    defineField({
      name: 'currency',
      title: 'Currency (ISO 4217, lowercase)',
      type: 'string',
      initialValue: 'sek',
      fieldset: 'pricing',
      validation: (Rule) => Rule.required().lowercase().length(3),
    }),
    defineField({
      name: 'totalSeats',
      title: 'Total seats',
      type: 'number',
      validation: (Rule) => Rule.required().integer().min(1),
    }),
    defineField({
      name: 'seatsSold',
      title: 'Seats sold',
      type: 'number',
      initialValue: 0,
      readOnly: true,
    }),
  ],
  preview: {
    select: {
      title: 'title',
      date: 'date',
      sold: 'seatsSold',
      total: 'totalSeats',
    },
    prepare({ title, date, sold, total }) {
      const when = date ? new Date(date).toLocaleString() : 'no date';
      return {
        title: title || 'Untitled ticket',
        subtitle: `${when} · ${sold ?? 0}/${total ?? '?'} sold`,
      };
    },
  },
});
