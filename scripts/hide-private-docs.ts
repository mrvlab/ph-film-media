// Moves members and access codes with plain ids to "<type>.<id>", which Sanity
// hides from public queries. Same as the nightly /api/sanity/hide-private job.
//
//   bun --conditions=react-server scripts/hide-private-docs.ts           dry run
//   bun --conditions=react-server scripts/hide-private-docs.ts --apply   write
//
// Runs against NEXT_PUBLIC_SANITY_DATASET.
import { hidePrivateDocs } from '../src/lib/sanity/hidePrivateDocs';

const apply = process.argv.includes('--apply');
const moves = await hidePrivateDocs({ dryRun: !apply });
for (const m of moves) {
  console.log(`  ${m.type} ${m.from} → ${m.to}${m.skipped ? `  SKIPPED: ${m.skipped}` : ''}`);
}
console.log(
  `${moves.length} documents on "${process.env.NEXT_PUBLIC_SANITY_DATASET}". ${apply ? 'Done.' : 'Dry run. Pass --apply to write.'}`,
);
