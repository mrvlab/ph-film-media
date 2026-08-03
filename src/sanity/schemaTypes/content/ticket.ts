import { TagIcon } from '@sanity/icons/Tag';
import { defineField, defineType } from 'sanity';

export const ticket = defineType({
  name: 'ticket',
  title: 'Tickets',
  type: 'document',
  icon: TagIcon,
  groups: [
    { name: 'details', title: 'Details' },
    { name: 'access', title: 'Access code' },
    { name: 'media', title: 'Media' },
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
    }),
    defineField({
      name: 'date',
      title: 'Date & time',
      type: 'datetime',
      group: 'details',
    }),
    defineField({
      name: 'venue',
      title: 'Venue',
      type: 'string',
      group: 'details',
      description: 'Where this viewing takes place. Free text.',
    }),
    defineField({
      name: 'accessCode',
      title: 'Access code',
      type: 'string',
      group: 'access',
      description:
        'Shared secret code for this screening. Distribute it to members via the newsletter. Buyers must enter it (and be a member) to purchase a ticket.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'price',
      title: 'Price (major units, e.g. SEK)',
      type: 'number',
      group: 'details',
      fieldset: 'pricing',
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
    defineField({
      name: 'totalSeats',
      title: 'Total seats',
      type: 'number',
      group: 'details',
      validation: (Rule) => Rule.required().integer().min(1),
    }),
    defineField({
      name: 'seatsSold',
      title: 'Seats sold',
      type: 'number',
      group: 'details',
      initialValue: 0,
      readOnly: true,
      description:
        'Read-only. Recomputed automatically from Stripe on every purchase and refund, and nightly by the reconcile cron. To force a resync, POST /api/tickets/reconcile.',
    }),
    // ----- Media -----
    defineField({
      name: 'poster',
      title: 'Poster (portrait)',
      type: 'mediaType',
      group: 'media',
      description:
        'Used on mobile and on the Stripe Checkout page. Recommended portrait orientation (e.g. 3:4).',
    }),
    defineField({
      name: 'banner',
      title: 'Banner (landscape)',
      type: 'mediaType',
      group: 'media',
      description:
        'Used in the desktop layout. Recommended landscape orientation (e.g. 16:9). Falls back to Poster if not set.',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      date: 'date',
      sold: 'seatsSold',
      total: 'totalSeats',
      poster: 'poster.media',
      banner: 'banner.media',
    },
    prepare({ title, date, sold, total, poster, banner }) {
      const when = date
        ? new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })
        : 'no date';
      const soldNum = sold ?? 0;
      const totalNum = total ?? 0;
      const soldOut = totalNum > 0 && soldNum >= totalNum;
      const status = soldOut ? 'Sold out' : `${soldNum}/${total ?? '?'} sold`;
      const dot = soldOut ? '🔴' : '🟢';
      return {
        title: title || 'Untitled ticket',
        subtitle: `${when} · ${status} ${dot}`,
        media: poster || banner || TagIcon,
      };
    },
  },
});
