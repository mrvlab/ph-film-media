// One-off migration from per-ticket access codes to one code per season.
// Creates a season access code from the tickets' existing codes, then clears
// the old field from those tickets.
//
//   bun scripts/migrate-access-codes.ts                         dry run
//   bun scripts/migrate-access-codes.ts --apply                 write everything
//   bun scripts/migrate-access-codes.ts --apply --create-only   codes only
//
// --create-only leaves the old ticket field in place, so a site still running
// the old checkout keeps working until the new code is deployed.
//
// A season whose tickets disagree on the code is skipped and reported, so an
// editor can fix the odd ticket first. Runs against NEXT_PUBLIC_SANITY_DATASET.
import { createClient } from '@sanity/client';

import { seasonLabel, seasonOf } from '../src/lib/members/seasons';

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

type Ticket = { _id: string; title: string | null; date: string | null; accessCode: string };

const apply = process.argv.includes('--apply');
const createOnly = process.argv.includes('--create-only');

// Drafts included, so an unpublished edit doesn't keep the old code around.
const tickets = await client.fetch<Ticket[]>(
  `*[_type == "ticket" && defined(accessCode)]{ _id, title, date, accessCode }`,
);
const existing = new Set(
  await client.fetch<string[]>(`*[_type == "seasonAccessCode"].season`),
);

const bySeason = new Map<string, Ticket[]>();
for (const t of tickets) {
  if (!t.date) {
    console.log(`  skip ${t.title ?? t._id}: no screening date`);
    continue;
  }
  const season = seasonOf(t.date);
  bySeason.set(season, [...(bySeason.get(season) ?? []), t]);
}

const tx = client.transaction();
for (const [season, group] of bySeason) {
  const codes = new Set(group.map((t) => t.accessCode.trim()));
  const label = `Säsong ${seasonLabel(season)}`;
  if (codes.size > 1) {
    console.log(`  skip ${label}: tickets use ${codes.size} different codes`);
    for (const t of group) console.log(`    ${t.title ?? t._id}`);
    continue;
  }
  const [code] = codes;
  if (existing.has(season)) {
    console.log(`  ${label}: already has a code, clearing ${group.length} tickets`);
  } else {
    console.log(`  ${label}: create code, clear ${group.length} tickets`);
    tx.createIfNotExists({
      _id: `seasonAccessCode-${season}`,
      _type: 'seasonAccessCode',
      scope: 'season',
      season,
      code,
    });
  }
  if (createOnly) continue;
  for (const t of group) tx.patch(t._id, (patch) => patch.unset(['accessCode']));
}

if (!apply) {
  console.log(`Dry run on "${dataset}". Pass --apply to write.`);
} else {
  await tx.commit();
  console.log(`Done on "${dataset}".`);
}
