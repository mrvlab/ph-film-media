import { NextResponse } from 'next/server';

import { authorizeReconcileRequest } from '@/lib/auth/reconcileAuth';
import { removePastTickets } from '@/lib/tickets/removePastTickets';

export const runtime = 'nodejs';

// POST /api/tickets/remove-past
// Removes screenings that have already started from every Ticket List block.
// Auth: `Authorization: Bearer <token>` where token equals $CRON_SECRET
// (Vercel Cron sends this automatically).
export async function POST(request: Request) {
  if (!(await authorizeReconcileRequest(request))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const results = await removePastTickets();
  for (const r of results) {
    console.log(
      `[remove-past] ${r.pageId}: removed ${r.removed.join(', ')}`,
    );
  }
  return NextResponse.json({ pages: results.length, results });
}

// GET is used by Vercel Cron.
export async function GET(request: Request) {
  return POST(request);
}
