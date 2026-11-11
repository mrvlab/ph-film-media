// Seeds dummy Filmklubben members covering every membership state, for testing
// the season-based membership lists and history in the Studio. Refuses to run
// against production.
//
//   bun scripts/seed-dummy-members.ts           create or replace the dummies
//   bun scripts/seed-dummy-members.ts --clean   delete them again
//
// Every dummy has an id starting with "member.dummy-" and an @example.com email,
// so they're easy to spot and the clean flag never touches real members.
import { createClient } from '@sanity/client';

import { seasonEnd } from '../src/lib/members/seasons';

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
const token = process.env.SANITY_WRITE_TOKEN;
if (!projectId || !dataset || !token) {
  throw new Error(
    'Set NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET and SANITY_WRITE_TOKEN',
  );
}
if (dataset === 'production') throw new Error('Refusing to seed production.');

const client = createClient({
  projectId,
  dataset,
  token,
  apiVersion: '2025-05-25',
  useCdn: false,
});

type Period = { season: string; paidAt: string; source?: 'stripe' | 'existing' };

type Dummy = {
  key: string;
  firstName: string;
  lastName: string;
  status: 'active' | 'disabled';
  joinedAt: string;
  existingMember?: boolean;
  // Newest first, as the webhook writes it.
  history: Period[];
};

const DUMMIES: Dummy[] = [
  {
    key: 'current-loyal',
    firstName: 'Astrid',
    lastName: 'Lindqvist (dummy)',
    status: 'active',
    joinedAt: '2025-02-14T18:20:00Z',
    history: [
      { season: '2026-H2', paidAt: '2026-08-03T10:12:00Z' },
      { season: '2026-H1', paidAt: '2026-01-20T19:45:00Z' },
      { season: '2025-H2', paidAt: '2025-09-01T08:30:00Z' },
      { season: '2025-H1', paidAt: '2025-02-14T18:20:00Z' },
    ],
  },
  {
    key: 'current-new',
    firstName: 'Nils',
    lastName: 'Berg (dummy)',
    status: 'active',
    joinedAt: '2026-10-28T20:05:00Z',
    history: [{ season: '2026-H2', paidAt: '2026-10-28T20:05:00Z' }],
  },
  {
    key: 'paid-ahead',
    firstName: 'Freja',
    lastName: 'Holm (dummy)',
    status: 'active',
    joinedAt: '2026-03-02T12:00:00Z',
    history: [
      { season: '2027-H1', paidAt: '2026-11-04T16:40:00Z' },
      { season: '2026-H2', paidAt: '2026-07-10T09:15:00Z' },
      { season: '2026-H1', paidAt: '2026-03-02T12:00:00Z' },
    ],
  },
  {
    key: 'existing',
    firstName: 'Gunnar',
    lastName: 'Ek (dummy)',
    status: 'active',
    joinedAt: '2026-09-15T07:00:00Z',
    existingMember: true,
    history: [
      { season: '2026-H2', paidAt: '2026-09-15T07:00:00Z', source: 'existing' },
    ],
  },
  {
    key: 'expired-last-season',
    firstName: 'Maja',
    lastName: 'Sundberg (dummy)',
    status: 'active',
    joinedAt: '2025-08-22T17:30:00Z',
    history: [
      { season: '2026-H1', paidAt: '2026-02-11T11:11:00Z' },
      { season: '2025-H2', paidAt: '2025-08-22T17:30:00Z' },
    ],
  },
  {
    key: 'expired-long-ago',
    firstName: 'Oskar',
    lastName: 'Dahl (dummy)',
    status: 'active',
    joinedAt: '2025-03-09T14:00:00Z',
    history: [{ season: '2025-H1', paidAt: '2025-03-09T14:00:00Z' }],
  },
  {
    key: 'disabled',
    firstName: 'Linnea',
    lastName: 'Strand (dummy)',
    status: 'disabled',
    joinedAt: '2025-10-01T10:00:00Z',
    history: [
      { season: '2026-H2', paidAt: '2026-07-05T13:00:00Z' },
      { season: '2025-H2', paidAt: '2025-10-01T10:00:00Z' },
    ],
  },
];

const FEE = 49;
const CURRENCY = 'sek';

async function clean() {
  const ids = await client.fetch<string[]>(
    `*[_type == "member" && _id match "member.dummy-*"]._id`,
  );
  const tx = client.transaction();
  for (const id of ids) tx.delete(id);
  await tx.commit();
  console.log(`Deleted ${ids.length} dummy members.`);
}

async function seed() {
  const tx = client.transaction();
  for (const d of DUMMIES) {
    const latest = d.history[0];
    tx.createOrReplace({
      _id: `member.dummy-${d.key}`,
      _type: 'member',
      firstName: d.firstName,
      lastName: d.lastName,
      email: `dummy+${d.key}@example.com`,
      status: d.status,
      newsletterConsent: true,
      joinedAt: d.joinedAt,
      amount: FEE,
      currency: CURRENCY,
      paidAt: latest.paidAt,
      ...(d.existingMember ? { paymentBypassedAt: d.joinedAt } : {}),
      validUntil: seasonEnd(latest.season),
      membershipHistory: d.history.map((p) => ({
        _key: p.season,
        _type: 'membershipPeriod',
        season: p.season,
        amount: FEE,
        currency: CURRENCY,
        paidAt: p.paidAt,
        source: p.source ?? 'stripe',
      })),
    });
  }
  await tx.commit();
  console.log(`Seeded ${DUMMIES.length} dummy members into "${dataset}".`);
}

await (process.argv.includes('--clean') ? clean() : seed());
