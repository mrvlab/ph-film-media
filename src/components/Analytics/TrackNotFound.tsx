'use client';

import { useEffect } from 'react';

import { trackEvent } from '@/lib/analytics/gtag';

/**
 * Reports the URL behind a 404. GA counts the page view either way, but only
 * this event tells them apart from real pages in the Engagement reports.
 */
const TrackNotFound = () => {
  useEffect(() => {
    trackEvent('page_not_found', {
      page_location: window.location.href,
      page_path: window.location.pathname,
      page_referrer: document.referrer || undefined,
    });
  }, []);

  return null;
};

export default TrackNotFound;
