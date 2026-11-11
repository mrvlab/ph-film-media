// Fills in soldOutAt and seatChanges on upcoming tickets from the Sanity
// document history, which covers the last 30 days. Only those two fields are
// written, and only where they're missing: seat totals and seats sold (which
// come from Stripe) are never touched.
//
//   bun scripts/migrate-seat-history.ts           dry run, prints what it'd set
//   bun scripts/migrate-seat-history.ts --apply   writes it
import { createClient } from '@sanity/client';

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
const token = process.env.SANITY_WRITE_TOKEN;
if (!projectId || !dataset || !token) {
  throw new Error(
    'Set NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET and SANITY_WRITE_TOKEN',
  );
}
const apply = process.argv.includes('--apply');
const apiVersion = '2025-05-25';

const client = createClient({ projectId, dataset, token, apiVersion, useCdn: false });

type Ticket = {
  _id: string;
  title: string;
  totalSeats: number | null;
  seatsSold: number | null;
  soldOutAt: string | null;
  seatChanges: unknown[] | null;
};
type Snapshot = { at: string; total: number | null; sold: number };

async function history(id: string): Promise<Snapshot[]> {
  const base = `https://${projectId}.api.sanity.io/v${apiVersion}/data/history/${dataset}`;
  const headers = { Authorization: `Bearer ${token}` };
  const text = await (
    await fetch(`${base}/transactions/${id}?excludeContent=true`, { headers })
  ).text();
  const transactions = text
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line) as { id: string; timestamp: string });

  const snapshots: Snapshot[] = [];
  for (const tx of transactions) {
    const res = await fetch(`${base}/documents/${id}?revision=${tx.id}`, { headers });
    const doc = (await res.json()).documents?.[0];
    if (!doc) continue;
    snapshots.push({
      at: tx.timestamp,
      total: typeof doc.totalSeats === 'number' ? doc.totalSeats : null,
      sold: typeof doc.seatsSold === 'number' ? doc.seatsSold : 0,
    });
  }
  return snapshots.sort((a, b) => a.at.localeCompare(b.at));
}

const tickets = await client.fetch<Ticket[]>(
  `*[_type == "ticket" && !(_id in path("drafts.**")) && date > now()] | order(date asc){
    _id, title, totalSeats, seatsSold, soldOutAt, seatChanges
  }`,
);

for (const t of tickets) {
  const snaps = await history(t._id);
  let soldOutAt: string | null = null;
  const changes: Record<string, unknown>[] = [];
  for (let i = 0; i < snaps.length; i++) {
    const s = snaps[i];
    const prev = snaps[i - 1];
    if (prev && prev.total !== null && s.total !== null && prev.total !== s.total) {
      changes.push({
        _key: `backfill-${changes.length}`,
        _type: 'seatChange',
        from: prev.total,
        to: s.total,
        soldAtChange: prev.sold,
        changedAt: s.at,
      });
    }
    if (!soldOutAt && s.total && s.sold >= s.total) soldOutAt = s.at;
  }

  const set: Record<string, unknown> = {};
  if (!t.soldOutAt && soldOutAt) set.soldOutAt = soldOutAt;
  if (!t.seatChanges?.length && changes.length) set.seatChanges = changes;

  const summary = [
    `${t.title}: ${t.seatsSold ?? 0}/${t.totalSeats} sold, ${snaps.length} revisions since ${snaps[0]?.at.slice(0, 10) ?? '-'}`,
    set.soldOutAt ? `  soldOutAt ${set.soldOutAt}` : null,
    ...changes.map(
      (c) => `  seats ${c.from} → ${c.to} on ${String(c.changedAt).slice(0, 16)} with ${c.soldAtChange} sold`,
    ),
    Object.keys(set).length ? null : '  nothing to set',
  ].filter(Boolean);
  console.log(summary.join('\n'));

  if (apply && Object.keys(set).length) {
    await client.patch(t._id).setIfMissing(set).commit();
    await client
      .patch(`drafts.${t._id}`)
      .setIfMissing(set)
      .commit()
      .catch(() => {});
  }
}
console.log(`${apply ? 'Applied' : 'Dry run'} on "${dataset}".`);
