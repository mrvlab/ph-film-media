import { CalendarIcon } from '@sanity/icons/Calendar';
import { CheckmarkCircleIcon } from '@sanity/icons/CheckmarkCircle';
import { ClockIcon } from '@sanity/icons/Clock';
import { CloseCircleIcon } from '@sanity/icons/CloseCircle';
import { UsersIcon } from '@sanity/icons/Users';
import { defineArrayMember, defineField, defineType } from 'sanity';

import { seasonLabel, seasonOf } from '@/lib/members/seasons';

export const member = defineType({
  name: 'member',
  title: 'Members',
  type: 'document',
  icon: UsersIcon,
  groups: [
    { name: 'member', title: 'Member', default: true },
    { name: 'membership', title: 'Membership' },
  ],
  fieldsets: [{ name: 'name', title: 'Name', options: { columns: 2 } }],
  fields: [
    // ----- Member -----
    defineField({
      name: 'firstName',
      title: 'First name',
      type: 'string',
      group: 'member',
      fieldset: 'name',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'lastName',
      title: 'Last name',
      type: 'string',
      group: 'member',
      fieldset: 'name',
    }),
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
      group: 'member',
      validation: (Rule) =>
        Rule.required()
          .email()
          .custom(async (email, context) => {
            if (!email) return true;
            const { getClient, document } = context;
            const client = getClient({ apiVersion: '2024-01-01' });
            const id = document?._id.replace(/^drafts\./, '');
            const params = {
              email: email.trim().toLowerCase(),
              draft: `drafts.${id}`,
              published: id,
            };
            const count = await client.fetch<number>(
              `count(*[_type == "member" && lower(email) == $email && !(_id in [$draft, $published])])`,
              params,
            );
            return count > 0
              ? 'A member with this email already exists.'
              : true;
          }),
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      group: 'member',
      options: {
        list: [
          { title: 'Active', value: 'active' },
          { title: 'Disabled', value: 'disabled' },
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      description:
        'Set to "active" 🟢 automatically when the membership is paid. Set to "disabled" 🔴 to revoke access manually.',
    }),
    defineField({
      name: 'newsletterConsent',
      title: 'Newsletter consent',
      type: 'boolean',
      group: 'member',
      initialValue: true,
      readOnly: true,
      description:
        'Read-only. Members consent to the newsletter when they join via the membership form.',
    }),
    // ----- Membership -----
    defineField({
      name: 'validUntil',
      title: 'Paid through',
      type: 'datetime',
      group: 'membership',
      readOnly: true,
      description:
        'Read-only. End of the last paid season. Seasons end on 30 June and 31 December.',
    }),
    defineField({
      name: 'joinedAt',
      title: 'Member since',
      type: 'datetime',
      group: 'membership',
      readOnly: true,
      description: 'Read-only. Set when the first membership payment completes.',
    }),
    defineField({
      name: 'membershipHistory',
      title: 'History',
      type: 'array',
      group: 'membership',
      readOnly: true,
      description: 'Read-only. One entry per paid season, newest first.',
      of: [
        defineArrayMember({
          name: 'membershipPeriod',
          title: 'Season',
          type: 'object',
          fields: [
            defineField({ name: 'season', title: 'Season', type: 'string' }),
            defineField({ name: 'amount', title: 'Amount', type: 'number' }),
            defineField({ name: 'currency', title: 'Currency', type: 'string' }),
            defineField({ name: 'paidAt', title: 'Paid at', type: 'datetime' }),
            defineField({
              name: 'source',
              title: 'Source',
              type: 'string',
              options: {
                list: [
                  { title: 'Stripe', value: 'stripe' },
                  { title: 'Existing member', value: 'existing' },
                ],
              },
            }),
            defineField({
              name: 'stripeSessionId',
              title: 'Stripe Checkout Session ID',
              type: 'string',
              hidden: true,
            }),
            defineField({
              name: 'stripePaymentIntentId',
              title: 'Stripe PaymentIntent ID',
              type: 'string',
              hidden: true,
            }),
          ],
          preview: {
            select: {
              season: 'season',
              amount: 'amount',
              currency: 'currency',
              paidAt: 'paidAt',
              source: 'source',
            },
            prepare({ season, amount, currency, paidAt, source }) {
              const paid =
                amount != null
                  ? `${amount} ${(currency || '').toUpperCase()}`.trim()
                  : '—';
              const when = paidAt
                ? new Date(paidAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : 'unknown date';
              const via = source === 'existing' ? 'Existing member' : 'Stripe';
              return {
                title: season ? `Säsong ${seasonLabel(season)}` : 'Unknown season',
                subtitle: `${paid} · Paid ${when} · ${via}`,
                media: CalendarIcon,
              };
            },
          },
        }),
      ],
    }),
    // ----- Hidden -----
    // The latest payment, mirrored from the newest history entry. Kept for the
    // Stripe audit trail and the "Mark as existing member" lock; the History
    // list is what admins read.
    defineField({ name: 'amount', type: 'number', readOnly: true, hidden: true }),
    defineField({ name: 'currency', type: 'string', readOnly: true, hidden: true }),
    defineField({ name: 'paidAt', type: 'datetime', readOnly: true, hidden: true }),
    defineField({
      name: 'paymentBypassedAt',
      type: 'datetime',
      readOnly: true,
      hidden: true,
    }),
    defineField({
      name: 'stripeSessionId',
      type: 'string',
      readOnly: true,
      hidden: true,
    }),
    defineField({
      name: 'stripePaymentIntentId',
      type: 'string',
      readOnly: true,
      hidden: true,
    }),
  ],
  orderings: [
    {
      title: 'Joined (newest first)',
      name: 'joinedAtDesc',
      by: [{ field: 'joinedAt', direction: 'desc' }],
    },
    {
      title: 'Paid through (latest first)',
      name: 'validUntilDesc',
      by: [{ field: 'validUntil', direction: 'desc' }],
    },
  ],
  preview: {
    select: {
      firstName: 'firstName',
      lastName: 'lastName',
      email: 'email',
      joinedAt: 'joinedAt',
      status: 'status',
      paymentBypassedAt: 'paymentBypassedAt',
      validUntil: 'validUntil',
      history: 'membershipHistory',
    },
    prepare({
      firstName,
      lastName,
      email,
      joinedAt,
      status,
      paymentBypassedAt,
      validUntil,
      history,
    }) {
      const name = [firstName, lastName].filter(Boolean).join(' ');
      // Leads with the membership state so the list can be scanned at a glance:
      // "🟢 Paid through Jul–Dec 2026 · since Nov 2026 · 3 seasons".
      const season = validUntil ? seasonLabel(seasonOf(validUntil)) : null;
      const isCurrent = !!validUntil && validUntil >= new Date().toISOString();
      const state =
        status === 'disabled'
          ? { dot: '🔴', text: 'Disabled', icon: CloseCircleIcon }
          : !season
            ? { dot: '⚪', text: 'No payment yet', icon: UsersIcon }
            : isCurrent
              ? { dot: '🟢', text: `Paid through ${season}`, icon: CheckmarkCircleIcon }
              : { dot: '🟠', text: `Expired, last paid ${season}`, icon: ClockIcon };
      // Members grandfathered in before online payments have no real join date.
      const since = paymentBypassedAt
        ? 'existing member'
        : joinedAt
          ? `since ${new Date(joinedAt).toLocaleDateString('en-US', {
              month: 'short',
              year: 'numeric',
            })}`
          : null;
      const count = Array.isArray(history) ? history.length : 0;
      const seasons = count ? `${count} season${count === 1 ? '' : 's'}` : null;
      return {
        title: name || email || 'Untitled member',
        subtitle: [`${state.dot} ${state.text}`, since, seasons]
          .filter(Boolean)
          .join(' · '),
        description: email,
        media: state.icon,
      };
    },
  },
});
