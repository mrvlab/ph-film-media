import { TagIcon } from '@sanity/icons/Tag';
import { defineField, defineType } from 'sanity';

import { formatScreening } from '@/lib/tickets/formatScreening';
import { isPastScreening } from '@/lib/tickets/isPastScreening';
import { seatStats } from '@/lib/tickets/seatStats';
import { SeasonAccessCodeInput } from '../../components/SeasonAccessCodeInput';
import { SeatsInput } from '../../components/SeatsInput';

export const ticket = defineType({
  name: 'ticket',
  title: 'Tickets',
  type: 'document',
  icon: TagIcon,
  // Past screenings are sales history; delete/unpublish are locked too (see
  // sanity.config.ts).
  readOnly: ({ document }) => isPastScreening(document),
  groups: [
    { name: 'details', title: 'Details', default: true },
    { name: 'sales', title: 'Sales' },
    { name: 'media', title: 'Media' },
  ],
  fieldsets: [
    { name: 'pricing', title: 'Price', options: { columns: 2 } },
  ],
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
      description: 'Also decides which season’s access code applies.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'venue',
      title: 'Venue',
      type: 'string',
      group: 'details',
    }),
    // ----- Sales -----
    defineField({
      name: 'price',
      title: 'Amount',
      type: 'number',
      group: 'sales',
      fieldset: 'pricing',
      validation: (Rule) => Rule.required().min(0),
    }),
    defineField({
      name: 'currency',
      title: 'Currency',
      type: 'string',
      initialValue: 'sek',
      group: 'sales',
      fieldset: 'pricing',
      validation: (Rule) => Rule.required().lowercase().length(3),
    }),
    defineField({
      name: 'totalSeats',
      title: 'Seats',
      type: 'number',
      group: 'sales',
      description: 'Sales update automatically from Stripe.',
      validation: (Rule) => Rule.required().integer().min(1),
      components: { input: SeatsInput },
    }),
    // Shown in the Seats panel above, so the fields themselves stay hidden.
    defineField({
      name: 'seatsSold',
      title: 'Sold',
      type: 'number',
      initialValue: 0,
      readOnly: true,
      hidden: true,
    }),
    // Set the first time sales reach the seat total.
    defineField({
      name: 'soldOutAt',
      title: 'Sold out at',
      type: 'datetime',
      readOnly: true,
      hidden: true,
    }),
    // Added on publish when the seat total changes (see recordSeatChange).
    defineField({
      name: 'seatChanges',
      title: 'Seat changes',
      type: 'array',
      readOnly: true,
      hidden: true,
      of: [
        {
          type: 'object',
          name: 'seatChange',
          fields: [
            { name: 'from', type: 'number' },
            { name: 'to', type: 'number' },
            { name: 'soldAtChange', type: 'number' },
            { name: 'changedAt', type: 'datetime' },
          ],
        },
      ],
    }),
    // Empty means the season code applies (looked up from the date at
    // checkout); a picked screening code replaces it for this ticket.
    defineField({
      name: 'accessCodeOverride',
      title: 'Access code',
      type: 'reference',
      group: 'sales',
      to: [{ type: 'seasonAccessCode' }],
      options: {
        filter: 'scope == "screening"',
        disableNew: true,
      },
      components: { input: SeasonAccessCodeInput },
    }),
    // Replaced by season access codes; kept hidden until the migration has
    // cleared it from every ticket.
    defineField({
      name: 'accessCode',
      title: 'Access code (legacy)',
      type: 'string',
      hidden: true,
    }),
    // ----- Media -----
    defineField({
      name: 'poster',
      title: 'Poster (portrait)',
      type: 'mediaType',
      group: 'media',
      description: 'Mobile and Stripe Checkout. Portrait, e.g. 3:4.',
    }),
    defineField({
      name: 'banner',
      title: 'Banner (landscape)',
      type: 'mediaType',
      group: 'media',
      description: 'Desktop. Landscape, e.g. 16:9. Falls back to the poster.',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      date: 'date',
      venue: 'venue',
      sold: 'seatsSold',
      total: 'totalSeats',
      soldOutAt: 'soldOutAt',
      seatChanges: 'seatChanges',
      poster: 'poster.media',
      banner: 'banner.media',
    },
    prepare({ title, date, venue, sold, total, soldOutAt, seatChanges, poster, banner }) {
      // Leads with the sales state so the list can be scanned at a glance:
      // "🟢 Tue 1 Dec, 17:30 · 12/40 sold". Past screenings only say so; their
      // sales history is in the Seats panel.
      const when = date ? formatScreening(date) : 'No date';
      if (isPastScreening({ date })) {
        return {
          title: title || 'Untitled ticket',
          subtitle: `${when} · Past`,
          description: venue,
          media: poster || banner || TagIcon,
        };
      }
      const stats = seatStats({ totalSeats: total, seatsSold: sold, soldOutAt, seatChanges });
      const dot = stats.soldOut ? '🔴' : stats.nearlyFull ? '🟠' : '🟢';
      const seats = `${stats.sold}/${total ?? '?'}`;
      const sales = [
        stats.soldOut ? `Sold out ${seats}` : `${seats} sold`,
        stats.initialSeats !== stats.total ? `from ${stats.initialSeats}` : null,
      ]
        .filter(Boolean)
        .join(' · ');
      return {
        title: title || 'Untitled ticket',
        subtitle: `${dot} ${when} · ${sales}`,
        description: venue,
        media: poster || banner || TagIcon,
      };
    },
  },
});
