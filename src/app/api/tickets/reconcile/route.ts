import { NextResponse } from 'next/server';

import { computeSeatsSold } from '@/lib/tickets/computeSeatsSold';
import { setSeatsSold } from '@/lib/tickets/setSeatsSold';
import { client } from '@/sanity/lib/client';

export const runtime = 'nodejs';
// Reconciling can take longer than the default budget on large ticket sets.
export const maxDuration = 300;

const CRON_SECRET = process.env.CRON_SECRET;

type TicketRow = { _id: string; title: string | null; seatsSold: number | null };

// POST /api/tickets/reconcile
//   - No body → reconcile every ticket document.
//   - Body { "ticketId": "<id>" } → reconcile only that one.
//
// Auth: requires `Authorization: Bearer $CRON_SECRET`. Vercel Cron sends this
// header automatically for scheduled invocations; for manual use pass it via
// curl or from the Studio action.
export async function POST(request: Request) {
  if (!CRON_SECRET) {
    return NextResponse.json(
      { error: 'server_misconfigured', message: 'Missing CRON_SECRET' },
      { status: 500 }
    );
  }
  const auth = request.headers.get('authorization');
  if (auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let body: { ticketId?: string } = {};
  try {
    body = (await request.json()) as { ticketId?: string };
  } catch {
    // No body — reconcile all.
  }

  const targets = body.ticketId
    ? [{ _id: body.ticketId, title: null, seatsSold: null } as TicketRow]
    : await client.fetch<TicketRow[]>(
        `*[_type == "ticket"]{ _id, title, seatsSold }`
      );

  const results = await Promise.all(
    targets.map(async (t) => {
      try {
        const computed = await computeSeatsSold(t._id);
        await setSeatsSold(t._id, computed);
        return {
          ticketId: t._id,
          title: t.title,
          before: t.seatsSold,
          after: computed,
          diff: computed - (t.seatsSold ?? 0),
          ok: true as const,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'unknown';
        return { ticketId: t._id, ok: false as const, error: message };
      }
    })
  );

  return NextResponse.json({ reconciled: results.length, results });
}

// GET is used by Vercel Cron — same behavior, no body means "all".
export async function GET(request: Request) {
  return POST(request);
}
