import { UsersIcon } from '@sanity/icons/Users';
import { defineField, defineType } from 'sanity';

export const member = defineType({
  name: 'member',
  title: 'Members',
  type: 'document',
  icon: UsersIcon,
  groups: [
    { name: 'membership', title: 'Membership' },
    { name: 'payment', title: 'Payment' },
  ],
  fieldsets: [
    { name: 'name', title: 'Name', options: { columns: 2 } },
    { name: 'amountPaid', title: 'Amount paid', options: { columns: 2 } },
  ],
  fields: [
    // ----- Membership -----
    defineField({
      name: 'firstName',
      title: 'First name',
      type: 'string',
      group: 'membership',
      fieldset: 'name',
      description: 'Entered when the member joins.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'lastName',
      title: 'Last name (optional)',
      type: 'string',
      group: 'membership',
      fieldset: 'name',
    }),
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
      group: 'membership',
      description:
        'Filmklubben member. This is the key used to confirm membership at ticket checkout.',
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
      group: 'membership',
      options: {
        list: [
          { title: 'Active', value: 'active' },
          { title: 'Disabled', value: 'disabled' },
        ],
        layout: 'radio',
      },
      description:
        'Set to "active" 🟢 automatically once the membership payment completes. Only "active" members can buy tickets. Set to "disabled" 🔴 to revoke access manually.',
    }),
    defineField({
      name: 'newsletterConsent',
      title: 'Newsletter consent',
      type: 'boolean',
      group: 'membership',
      initialValue: true,
      readOnly: true,
      description:
        'Read-only. Members consent to the newsletter when they join via the membership form.',
    }),
    defineField({
      name: 'joinedAt',
      title: 'Joined at',
      type: 'datetime',
      group: 'membership',
      readOnly: true,
      description:
        'Read-only. Set automatically when the membership payment completes.',
    }),
    // ----- Payment (initial membership fee) -----
    defineField({
      name: 'amount',
      title: 'Amount paid (major units, e.g. SEK)',
      type: 'number',
      group: 'payment',
      fieldset: 'amountPaid',
      readOnly: true,
      description:
        'Read-only. The initial membership fee. This can be changed for upcoming memberships under settings here in Sanity.',
    }),
    defineField({
      name: 'currency',
      title: 'Currency',
      type: 'string',
      group: 'payment',
      fieldset: 'amountPaid',
      readOnly: true,
    }),
    defineField({
      name: 'paidAt',
      title: 'Paid at',
      type: 'datetime',
      group: 'payment',
      readOnly: true,
    }),
    // Stamped by the "Mark as existing member" document action when an admin
    // grandfathers in a member who joined before online payments existed. Its
    // presence both records that the fee was bypassed (not paid via Stripe) and
    // locks the action so it can only be applied once. Hidden until set.
    defineField({
      name: 'paymentBypassedAt',
      title: 'Payment bypassed at',
      type: 'datetime',
      group: 'payment',
      readOnly: true,
      hidden: ({ value }) => !value,
      description:
        'Read-only. Set when this member was marked as an existing member (payment bypassed) instead of paying online.',
    }),
    // Hidden from the Studio UI — kept only as an audit trail linking a member
    // to their initial payment in the Stripe dashboard (written by the webhook).
    defineField({
      name: 'stripeSessionId',
      title: 'Stripe Checkout Session ID',
      type: 'string',
      group: 'payment',
      readOnly: true,
      hidden: true,
    }),
    defineField({
      name: 'stripePaymentIntentId',
      title: 'Stripe PaymentIntent ID',
      type: 'string',
      group: 'payment',
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
  ],
  preview: {
    select: {
      firstName: 'firstName',
      lastName: 'lastName',
      email: 'email',
      joinedAt: 'joinedAt',
      amount: 'amount',
      currency: 'currency',
      status: 'status',
      paymentBypassedAt: 'paymentBypassedAt',
    },
    prepare({
      firstName,
      lastName,
      email,
      joinedAt,
      amount,
      currency,
      status,
      paymentBypassedAt,
    }) {
      const name = [firstName, lastName].filter(Boolean).join(' ');
      // Members grandfathered in before online payments read "Existing member"
      // rather than a join date.
      const when = paymentBypassedAt
        ? 'Existing member'
        : joinedAt
          ? `Joined: ${new Date(joinedAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}`
          : 'Not joined yet';
      const paid =
        amount != null
          ? `${amount} ${(currency || '').toUpperCase()}`.trim()
          : '—';
      const dot = status === 'active' ? '🟢' : '🔴';
      return {
        title: name || email || 'Untitled member',
        subtitle: `${when} · ${paid} ${dot}`,
        media: UsersIcon,
      };
    },
  },
});
