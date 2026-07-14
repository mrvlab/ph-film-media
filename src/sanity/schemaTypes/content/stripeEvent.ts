import { defineField, defineType } from 'sanity';

// Idempotency log for Stripe webhooks. The webhook uses `createIfNotExists`
// on `stripeEvent.<event.id>` to guarantee at-most-once processing of each
// Stripe event, even under Stripe's at-least-once redelivery.
export const stripeEvent = defineType({
  name: 'stripeEvent',
  title: 'Stripe event log',
  type: 'document',
  fields: [
    defineField({ name: 'type', title: 'Event type', type: 'string' }),
    defineField({ name: 'ticketId', title: 'Related ticket id', type: 'string' }),
    defineField({ name: 'receivedAt', title: 'Received at', type: 'datetime' }),
  ],
  preview: {
    select: { title: 'type', subtitle: 'ticketId' },
  },
});
