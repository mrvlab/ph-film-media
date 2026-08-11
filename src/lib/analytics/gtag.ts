/**
 * Thin gtag.js wrapper. Every call is a no-op when GA hasn't loaded (dev,
 * previews, ad blockers), so callers never need to guard.
 *
 * Event names follow GA4's recommended set wherever one exists — that's what
 * makes them land in the built-in reports (Monetization, Engagement) instead of
 * sitting as unmapped custom events. See docs/analytics.md for the mapping and
 * the custom dimensions that need registering in the GA UI.
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

/** GA4 item shape (ecommerce events). */
export type AnalyticsItem = {
  item_id: string;
  item_name: string;
  /** 'Biljett' | 'Produkt' | 'Medlemskap' — groups revenue in Monetization. */
  item_category?: string;
  /** Size for products, venue for tickets. */
  item_variant?: string;
  price?: number;
  quantity?: number;
  index?: number;
  item_list_id?: string;
  item_list_name?: string;
};

export type EventParams = Record<string, unknown>;

/**
 * Fire any GA4 event. Falls back to queueing in dataLayer if gtag itself hasn't
 * been defined yet (blocked script, unexpected ordering) so no event is lost;
 * with no GA at all the queue is simply never drained.
 */
export const trackEvent = (name: string, params: EventParams = {}) => {
  if (typeof window === 'undefined') return;
  if (window.gtag) {
    window.gtag('event', name, params);
    return;
  }
  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push(['event', name, params]);
};

/** Fire a GA4 ecommerce event; `value` defaults to the sum of the items. */
export const trackEcommerce = (
  name: string,
  {
    items,
    currency,
    value,
    ...params
  }: { items: AnalyticsItem[]; currency?: string | null; value?: number } & EventParams
) => {
  trackEvent(name, {
    currency: (currency ?? 'SEK').toUpperCase(),
    value: value ?? itemsValue(items),
    items,
    ...params,
  });
};

/** Sum of price × quantity across items, rounded to 2 decimals. */
export const itemsValue = (items: AnalyticsItem[]): number =>
  Math.round(
    items.reduce((sum, i) => sum + (i.price ?? 0) * (i.quantity ?? 1), 0) * 100
  ) / 100;

/**
 * Failed checkouts, invalid codes, network errors. `exception` is GA4's
 * recommended name, so these surface without extra reporting setup.
 */
export const trackException = (description: string, context?: EventParams) =>
  trackEvent('exception', { description, fatal: false, ...context });
