'use client';

import { useEffect } from 'react';

import { trackEcommerce, type AnalyticsItem } from '@/lib/analytics/gtag';

type TrackItemViewProps = {
  item: AnalyticsItem;
  currency?: string | null;
};

/** Reports GA4 `view_item` for a product detail page. */
const TrackItemView = ({ item, currency }: TrackItemViewProps) => {
  useEffect(() => {
    trackEcommerce('view_item', { items: [item], currency });
    // Re-fire when the shopper view-transitions to another product.
  }, [item, currency]);

  return null;
};

export default TrackItemView;
