import { NextResponse } from 'next/server';

import { authorizeReconcileRequest } from '@/lib/auth/reconcileAuth';
import { hidePrivateDocs } from '@/lib/sanity/hidePrivateDocs';

export const runtime = 'nodejs';

// POST /api/sanity/hide-private
// Moves members and access codes created in the Studio to ids Sanity hides
// from public queries. Auth: `Authorization: Bearer <token>` where token
// equals $CRON_SECRET (Vercel Cron sends this automatically).
export async function POST(request: Request) {
  if (!(await authorizeReconcileRequest(request))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const moves = await hidePrivateDocs();
  for (const m of moves) {
    console.log(
      `[hide-private] ${m.type} ${m.from} → ${m.to}${m.skipped ? ` skipped: ${m.skipped}` : ''}`,
    );
  }
  return NextResponse.json({ moves });
}

// GET is used by Vercel Cron.
export async function GET(request: Request) {
  return POST(request);
}
