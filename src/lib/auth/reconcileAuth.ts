import 'server-only';

// Authorizes a reconcile request via `Authorization: Bearer <token>`, where the
// token must equal $CRON_SECRET. Vercel Cron sends this header automatically;
// there is no other caller (the manual Studio resync action was removed).
export async function authorizeReconcileRequest(
  request: Request
): Promise<boolean> {
  const header = request.headers.get('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return false;

  const cronSecret = process.env.CRON_SECRET;
  return Boolean(cronSecret) && token === cronSecret;
}
