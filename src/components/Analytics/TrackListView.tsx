'use client';

import { useEffect } from 'react';

import { trackEcommerce, type AnalyticsItem } from '@/lib/analytics/gtag';

type TrackListViewProps = {
  /** Stable id, e.g. 'tickets' or 'shop'. */
  listId: string;
  listName: string;
  items: AnalyticsItem[];
  currency?: string | null;
};

/**
 * Reports a GA4 `view_item_list` impression — the top of the Monetization
 * funnel. Fired when the list renders rather than when it scrolls into view:
 * blocks are server-rendered per page, so "rendered" is a straight answer, and
 * a scroll-gated version would hang off a 1px marker element that's easy to
 * break with a layout change.
 */
const TrackListView = ({
  listId,
  listName,
  items,
  currency,
}: TrackListViewProps) => {
  // Serialised so a re-render with an equivalent list doesn't re-report.
  const signature = JSON.stringify(items);

  useEffect(() => {
    const listItems: AnalyticsItem[] = JSON.parse(signature);
    if (listItems.length === 0) return;

    trackEcommerce('view_item_list', {
      items: listItems.map((item, index) => ({
        ...item,
        index,
        item_list_id: listId,
        item_list_name: listName,
      })),
      currency,
      item_list_id: listId,
      item_list_name: listName,
      // Impressions aren't revenue; only purchase should carry a value.
      value: 0,
    });
  }, [signature, listId, listName, currency]);

  return null;
};

export default TrackListView;
