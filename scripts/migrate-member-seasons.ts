// One-off migration to season-based memberships: every active member without a
// "Paid through" date is treated as paid for the current season, and their
// existing payment becomes the first entry in their membership history.
//
//   bun scripts/migrate-member-seasons.ts           dry run, lists what changes
//   bun scripts/migrate-member-seasons.ts --apply   writes the changes
//
// Runs against NEXT_PUBLIC_SANITY_DATASET, so check .env.local first.
import { createClient } from '@sanity/client';

import { seasonEnd, seasonOf } from '../src/lib/members/seasons';

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
const token = process.env.SANITY_WRITE_TOKEN;
if (!projectId || !dataset || !token) {
  throw new Error(
    'Set NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET and SANITY_WRITE_TOKEN',
  );
}

const client = createClient({
  projectId,
  dataset,
  token,
  apiVersion: '2025-05-25',
  useCdn: false,
});

type Row = {
  _id: string;
  email: string | null;
  amount: number | null;
  currency: string | null;
  paidAt: string | null;
  joinedAt: string | null;
  paymentBypassedAt: string | null;
  stripeSessionId: string | null;
  stripePaymentIntentId: string | null;
};

const apply = process.argv.includes('--apply');
const season = seasonOf();

// Published documents only; drafts pick the change up when next published.
const rows = await client.fetch<Row[]>(
  `*[_type == "member" && status == "active" && !defined(validUntil) && !(_id in path("drafts.**"))]{
    _id, email, amount, currency, paidAt, joinedAt, paymentBypassedAt,
    stripeSessionId, stripePaymentIntentId
  }`,
);

console.log(
  `${rows.length} active members in "${dataset}" get paid through ${season} (${seasonEnd(season)}).`,
);
for (const r of rows) console.log(`  ${r._id}  ${r.email ?? ''}`);

if (!apply) {
  console.log('Dry run. Pass --apply to write.');
} else if (rows.length) {
  const tx = client.transaction();
  for (const r of rows) {
    tx.patch(r._id, (patch) =>
      patch.set({
        validUntil: seasonEnd(season),
        membershipHistory: [
          {
            _key: season,
            _type: 'membershipPeriod',
            season,
            amount: r.amount,
            currency: r.currency,
            paidAt: r.paidAt ?? r.paymentBypassedAt ?? r.joinedAt,
            source: r.paymentBypassedAt ? 'existing' : 'stripe',
            stripeSessionId: r.stripeSessionId,
            stripePaymentIntentId: r.stripePaymentIntentId,
          },
        ],
      }),
    );
  }
  await tx.commit();
  console.log('Done.');
}
