// Seeds dummy tickets covering every seat state, for testing the Seats panel
// and the ticket list in the Studio. Refuses to run against production.
//
//   bun scripts/seed-dummy-tickets.ts           create or replace the dummies
//   bun scripts/seed-dummy-tickets.ts --clean   delete them again
import { createClient } from '@sanity/client';

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

const day = 24 * 60 * 60 * 1000;
const at = (days: number) => new Date(Date.now() + days * day).toISOString();

type Change = { from: number; to: number; soldAtChange: number; daysAgo: number };
type Dummy = {
  key: string;
  title: string;
  inDays: number;
  total: number;
  sold: number;
  soldOutDaysAgo?: number;
  changes?: Change[];
};

const DUMMIES: Dummy[] = [
  { key: 'on-sale', title: 'Dummy: On sale', inDays: 20, total: 40, sold: 12 },
  { key: 'nearly-full', title: 'Dummy: Nearly full', inDays: 14, total: 40, sold: 35 },
  { key: 'sold-out', title: 'Dummy: Sold out', inDays: 10, total: 40, sold: 40, soldOutDaysAgo: 2 },
  {
    key: 'high-demand',
    title: 'Dummy: Sold out, seats raised',
    inDays: 7,
    total: 50,
    sold: 46,
    soldOutDaysAgo: 4,
    changes: [{ from: 40, to: 50, soldAtChange: 40, daysAgo: 3 }],
  },
  {
    key: 'high-demand-twice',
    title: 'Dummy: Raised twice, sold out again',
    inDays: 5,
    total: 60,
    sold: 60,
    soldOutDaysAgo: 6,
    changes: [
      { from: 40, to: 50, soldAtChange: 40, daysAgo: 5 },
      { from: 50, to: 60, soldAtChange: 50, daysAgo: 2 },
    ],
  },
  {
    key: 'raised-early',
    title: 'Dummy: Raised before selling out',
    inDays: 12,
    total: 50,
    sold: 22,
    changes: [{ from: 40, to: 50, soldAtChange: 15, daysAgo: 6 }],
  },
  {
    key: 'past-high-demand',
    title: 'Dummy: Past, high demand',
    inDays: -9,
    total: 50,
    sold: 50,
    soldOutDaysAgo: 20,
    changes: [{ from: 40, to: 50, soldAtChange: 40, daysAgo: 19 }],
  },
  {
    key: 'past-sold-out',
    title: 'Dummy: Past, sold out',
    inDays: -6,
    total: 40,
    sold: 40,
    soldOutDaysAgo: 12,
  },
  { key: 'past-quiet', title: 'Dummy: Past, not sold out', inDays: -3, total: 40, sold: 18 },
];

async function clean() {
  const ids = await client.fetch<string[]>(
    `*[_type == "ticket" && _id match "dummy-ticket-*"]._id`,
  );
  const tx = client.transaction();
  for (const id of ids) tx.delete(id);
  await tx.commit();
  console.log(`Deleted ${ids.length} dummy tickets.`);
}

async function seed() {
  const tx = client.transaction();
  for (const d of DUMMIES) {
    tx.createOrReplace({
      _id: `dummy-ticket-${d.key}`,
      _type: 'ticket',
      title: d.title,
      slug: { _type: 'slug', current: `dummy-${d.key}` },
      date: at(d.inDays),
      venue: 'Dummy venue',
      price: 120,
      currency: 'sek',
      totalSeats: d.total,
      seatsSold: d.sold,
      ...(d.soldOutDaysAgo !== undefined ? { soldOutAt: at(-d.soldOutDaysAgo) } : {}),
      ...(d.changes
        ? {
            seatChanges: d.changes.map((c, i) => ({
              _key: `change-${i}`,
              _type: 'seatChange',
              from: c.from,
              to: c.to,
              soldAtChange: c.soldAtChange,
              changedAt: at(-c.daysAgo),
            })),
          }
        : {}),
    });
  }
  await tx.commit();
  console.log(`Seeded ${DUMMIES.length} dummy tickets into "${dataset}".`);
}

await (process.argv.includes('--clean') ? clean() : seed());
