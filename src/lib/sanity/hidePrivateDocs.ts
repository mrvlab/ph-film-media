import 'server-only';
import type { SanityDocument } from '@sanity/client';

import { writeClient } from '@/sanity/lib/writeClient';

// Sanity only serves documents whose _id contains a dot to authenticated
// requests, so members (names, emails) and access codes are kept on ids like
// "member.<id>". The payment webhook already creates members that way; this
// moves documents created in the Studio, which get a plain UUID.
const PRIVATE_TYPES = ['member', 'seasonAccessCode'];

type Move = { type: string; from: string; to: string; skipped?: string };

export async function hidePrivateDocs({
  dryRun = false,
}: { dryRun?: boolean } = {}): Promise<Move[]> {
  const docs = await writeClient.fetch<SanityDocument[]>(
    `*[_type in $types]`,
    { types: PRIVATE_TYPES },
    { perspective: 'raw' },
  );
  const byId = new Map(docs.map((d) => [d._id, d]));
  const exposed = [
    ...new Set(
      docs
        .map((d) => d._id.replace(/^drafts\./, ''))
        .filter((id) => !id.includes('.')),
    ),
  ];

  const moves: Move[] = [];
  const tx = writeClient.transaction();
  for (const id of exposed) {
    const published = byId.get(id);
    const draft = byId.get(`drafts.${id}`);
    const type = (published ?? draft)!._type;
    // "seasonAccessCode-2026-H2" → "seasonAccessCode.2026-H2", else prefix.
    const to = id.startsWith(`${type}-`)
      ? `${type}.${id.slice(type.length + 1)}`
      : `${type}.${id}`;

    // Only tickets reference these (a ticket's screening code); anything else
    // is unexpected, so leave that document for a person to look at.
    const referrers = await writeClient.fetch<
      { _id: string; _type: string; ref: string | null }[]
    >(
      `*[references($ids)]{ _id, _type, "ref": accessCodeOverride._ref }`,
      { ids: [id, `drafts.${id}`] },
      { perspective: 'raw' },
    );
    const unknown = referrers.find((r) => r._type !== 'ticket' || r.ref !== id);
    if (unknown) {
      moves.push({ type, from: id, to, skipped: `referenced by ${unknown._id}` });
      continue;
    }

    if (published) tx.createOrReplace({ ...strip(published), _id: to });
    if (draft) tx.createOrReplace({ ...strip(draft), _id: `drafts.${to}` });
    for (const r of referrers) {
      tx.patch(r._id, (patch) => patch.set({ 'accessCodeOverride._ref': to }));
    }
    if (published) tx.delete(id);
    if (draft) tx.delete(`drafts.${id}`);
    moves.push({ type, from: id, to });
  }

  if (!dryRun && moves.some((m) => !m.skipped)) await tx.commit();
  return moves;
}

function strip(doc: SanityDocument) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { _rev, _updatedAt, ...rest } = doc;
  return rest;
}
