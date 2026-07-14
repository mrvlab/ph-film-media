import 'server-only';

import { createClient } from '@sanity/client';

import { apiVersion, dataset, projectId } from '@/sanity/env';

// True if the token belongs to a user of THIS project — the project-scoped
// `/users/me` returns an identity only for a valid, project-authorized token.
export async function isSanityProjectUser(token: string): Promise<boolean> {
  if (!token) return false;
  try {
    const client = createClient({
      projectId,
      dataset,
      apiVersion,
      token,
      useCdn: false,
    });
    const me = await client.request<{ id?: string } | null>({
      uri: '/users/me',
    });
    return Boolean(me?.id);
  } catch {
    return false;
  }
}

// Authorizes via Bearer token: either $CRON_SECRET (cron) or a signed-in
// Studio editor's Sanity session token (the resync document action).
export async function authorizeReconcileRequest(
  request: Request
): Promise<boolean> {
  const header = request.headers.get('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return false;

  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && token === cronSecret) return true;

  return isSanityProjectUser(token);
}
