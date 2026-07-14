import { useState } from 'react';
import { SyncIcon } from '@sanity/icons';
import { useToast } from '@sanity/ui';
import {
  useClient,
  type DocumentActionComponent,
  type DocumentActionProps,
} from 'sanity';

import { apiVersion } from '../env';

type ResyncType = 'ticket' | 'product';

const ENDPOINT: Record<ResyncType, string> = {
  ticket: '/api/tickets/reconcile',
  product: '/api/products/reconcile',
};

const ID_KEY: Record<ResyncType, string> = {
  ticket: 'ticketId',
  product: 'productId',
};

// Formats a single reconcile result for the toast.
function describeResult(type: ResyncType, result: unknown): string {
  if (!result || typeof result !== 'object') return 'Done';
  const r = result as {
    after?: number;
    sales?: Record<string, number>;
    error?: string;
  };
  if (r.error) return r.error;
  if (type === 'ticket') {
    return typeof r.after === 'number' ? `Sold: ${r.after}` : 'Done';
  }
  if (r.sales && Object.keys(r.sales).length) {
    const parts = Object.entries(r.sales).map(([size, n]) => `${size}: ${n}`);
    return `Sold — ${parts.join(', ')}`;
  }
  return 'Sold: 0';
}

// Studio action to recompute this document's stock from Stripe on demand,
// authorized by the editor's Sanity session token.
export function createResyncStockAction(
  type: ResyncType,
): DocumentActionComponent {
  return function ResyncStockAction(props: DocumentActionProps) {
    const client = useClient({ apiVersion });
    const toast = useToast();
    const [running, setRunning] = useState(false);

    const publishedId = (props.published?._id ?? props.id).replace(
      /^drafts\./,
      '',
    );

    return {
      label: running ? 'Resyncing…' : 'Resync stock (Stripe)',
      icon: SyncIcon,
      disabled: running,
      onHandle: async () => {
        setRunning(true);
        const token = client.config().token;
        if (!token) {
          toast.push({
            status: 'error',
            title: 'Could not read your Studio session token',
            description: 'Try reloading the Studio and signing in again.',
          });
          setRunning(false);
          props.onComplete();
          return;
        }
        try {
          const res = await fetch(ENDPOINT[type], {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ [ID_KEY[type]]: publishedId }),
          });
          const json = await res.json().catch(() => ({}));
          if (!res.ok) {
            toast.push({
              status: 'error',
              title: 'Resync failed',
              description: String(json?.error ?? res.status),
            });
          } else {
            toast.push({
              status: 'success',
              title: 'Stock resynced from Stripe',
              description: describeResult(type, json?.results?.[0]),
            });
          }
        } catch (err) {
          toast.push({
            status: 'error',
            title: 'Resync failed',
            description: err instanceof Error ? err.message : 'unknown',
          });
        } finally {
          setRunning(false);
          props.onComplete();
        }
      },
    };
  };
}
