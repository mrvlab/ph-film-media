import { NextResponse } from 'next/server';

import { computeProductSales } from '@/lib/products/computeProductSales';
import { setProductSales } from '@/lib/products/setProductSales';
import { authorizeReconcileRequest } from '@/lib/auth/reconcileAuth';
import { client } from '@/sanity/lib/client';

export const runtime = 'nodejs';
// Reconciling can take longer than the default budget on large catalogs.
export const maxDuration = 300;

type ProductRow = { _id: string; title: string | null };

// POST /api/products/reconcile
//   - No body → reconcile every product document.
//   - Body { "productId": "<id>" } → reconcile only that one.
//
// Auth: `Authorization: Bearer <token>`, where token is either $CRON_SECRET
// (Vercel Cron sends this automatically) or a signed-in Studio editor's Sanity
// session token (used by the "Resync stock from Stripe" document action).
export async function POST(request: Request) {
  if (!(await authorizeReconcileRequest(request))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let body: { productId?: string } = {};
  try {
    body = (await request.json()) as { productId?: string };
  } catch {
    // No body — reconcile all.
  }

  const targets = body.productId
    ? [{ _id: body.productId, title: null } as ProductRow]
    : await client.fetch<ProductRow[]>(
        `*[_type == "product"]{ _id, title }`
      );

  const results = await Promise.all(
    targets.map(async (p) => {
      try {
        const sales = await computeProductSales(p._id);
        await setProductSales(p._id, sales);
        return {
          productId: p._id,
          title: p.title,
          sales,
          ok: true as const,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'unknown';
        return { productId: p._id, ok: false as const, error: message };
      }
    })
  );

  return NextResponse.json({ reconciled: results.length, results });
}

// GET is used by Vercel Cron — same behavior, no body means "all".
export async function GET(request: Request) {
  return POST(request);
}
