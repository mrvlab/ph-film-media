// Seeds dummy season access codes (past, current, upcoming) and one screening
// code for testing the Access codes list and the code shown on tickets.
//
//   bun scripts/seed-dummy-access-codes.ts           create or replace them
//   bun scripts/seed-dummy-access-codes.ts --clean   delete them again
//
// Seasons that already have a real code are left alone.
import { createClient } from '@sanity/client';

import { nextSeason, seasonOf } from '../src/lib/members/seasons';

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
const token = process.env.SANITY_WRITE_TOKEN;
if (!projectId || !dataset || !token) {
  throw new Error(
    'Set NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET and SANITY_WRITE_TOKEN',
  );
}
if (dataset === 'production') {
  throw new Error('Refusing to seed dummy access codes into production.');
}

const client = createClient({
  projectId,
  dataset,
  token,
  apiVersion: '2025-05-25',
  useCdn: false,
});

if (process.argv.includes('--clean')) {
  const ids = await client.fetch<string[]>(
    `*[_type == "seasonAccessCode" && _id match "seasonAccessCode.dummy-*"]._id`,
  );
  const tx = client.transaction();
  for (const id of ids) tx.delete(id);
  await tx.commit();
  console.log(`Deleted ${ids.length} dummy access codes.`);
} else {
  const current = seasonOf();
  const seasons = ['2026-H1', current, nextSeason(current)];
  const taken = new Set(
    await client.fetch<string[]>(
      `*[_type == "seasonAccessCode" && !(_id match "seasonAccessCode.dummy-*")].season`,
    ),
  );
  const tx = client.transaction();
  let count = 0;
  for (const season of new Set(seasons)) {
    if (taken.has(season)) continue;
    tx.createOrReplace({
      _id: `seasonAccessCode.dummy-${season}`,
      _type: 'seasonAccessCode',
      scope: 'season',
      season,
      code: `DUMMY-${season}`,
    });
    count++;
  }
  // A screening code to pick by hand on a ticket.
  tx.createOrReplace({
    _id: 'seasonAccessCode.dummy-screening',
    _type: 'seasonAccessCode',
    scope: 'screening',
    code: 'DUMMY-PREMIERE',
  });
  count++;
  await tx.commit();
  console.log(`Seeded ${count} dummy access codes into "${dataset}".`);
}
