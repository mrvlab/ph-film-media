import { TagIcon } from '@sanity/icons/Tag';
import { defineField, defineType } from 'sanity';

import { isPastScreening } from '@/lib/tickets/isPastScreening';
import { SeasonAccessCodeInput } from '../../components/SeasonAccessCodeInput';

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
    { name: 'seats', title: 'Seats', options: { columns: 2 } },
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
      title: 'Total',
      type: 'number',
      group: 'sales',
      fieldset: 'seats',
      validation: (Rule) => Rule.required().integer().min(1),
    }),
    defineField({
      name: 'seatsSold',
      title: 'Sold',
      type: 'number',
      group: 'sales',
      fieldset: 'seats',
      initialValue: 0,
      readOnly: true,
      description: 'Read-only. Updated automatically from Stripe.',
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
      poster: 'poster.media',
      banner: 'banner.media',
    },
    prepare({ title, date, venue, sold, total, poster, banner }) {
      // Leads with the sales state so the list can be scanned at a glance:
      // "🟢 Tue 1 Dec, 17:30 · 12/40 sold".
      const soldNum = sold ?? 0;
      const seats = `${soldNum}/${total ?? '?'} sold`;
      const past = isPastScreening({ date });
      const soldOut = !!total && soldNum >= total;
      const nearlyFull = !!total && soldNum >= total * 0.8;
      const dot = past ? '⚪' : soldOut ? '🔴' : nearlyFull ? '🟠' : '🟢';
      const sales = past
        ? `Past · ${seats}`
        : soldOut
          ? `Sold out (${seats.replace(' sold', '')})`
          : seats;
      return {
        title: title || 'Untitled ticket',
        subtitle: `${dot} ${date ? formatScreening(date) : 'No date'} · ${sales}`,
        description: venue,
        media: poster || banner || TagIcon,
      };
    },
  },
});

const screeningParts = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/Stockholm',
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

// "Tue 1 Dec, 17:30" in Stockholm time, with the year only when it isn't this
// year's: "Wed 11 Aug 2027, 17:30".
function formatScreening(date: string): string {
  const get = (d: Date) =>
    Object.fromEntries(
      screeningParts.formatToParts(d).map((p) => [p.type, p.value]),
    );
  const p = get(new Date(date));
  const year = p.year === get(new Date()).year ? '' : ` ${p.year}`;
  return `${p.weekday} ${p.day} ${p.month}${year}, ${p.hour}:${p.minute}`;
}
