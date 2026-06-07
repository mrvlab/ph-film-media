// ============================================================================
// Canonical site URL & brand constants
// ----------------------------------------------------------------------------
// Single source of truth for the public production URL. Used by canonical tags,
// sitemap.xml, robots.txt and JSON-LD so Google clusters every page under one
// host instead of treating preview/vercel.app URLs as separate sites.
// ============================================================================

// The canonical production host. Everything (www, vercel.app, http) should
// redirect here, and all SEO URLs are emitted against it.
export const CANONICAL_SITE_URL = 'https://phmedia.se';

// Stable brand name for WebSite/Organization schema (sitelink attribution).
export const SITE_NAME = 'PH Film & Media';
export const SITE_ALTERNATE_NAME = 'PH Film';

// Primary content language (Swedish).
export const SITE_LOCALE = 'sv';

const stripTrailingSlash = (url: string) => url.replace(/\/+$/, '');

/**
 * Resolve the base URL to use for absolute SEO URLs.
 *
 * Priority:
 *  1. NEXT_PUBLIC_SITE_URL  — explicit canonical, set in production (phmedia.se)
 *  2. NEXT_PUBLIC_SANITY_STUDIO_PREVIEW_URL — preview/branch deploy self-reference
 *  3. http://localhost:3000 — local dev fallback
 */
export const getSiteUrl = (): string => {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return stripTrailingSlash(explicit);

  const preview = process.env.NEXT_PUBLIC_SANITY_STUDIO_PREVIEW_URL?.trim();
  if (preview) return stripTrailingSlash(preview);

  return 'http://localhost:3000';
};

/**
 * True when this deployment is serving the canonical production host. Used to
 * decide whether robots.txt should allow indexing — preview/vercel.app deploys
 * return false and are kept out of the index so they don't compete as duplicates.
 */
export const isCanonicalDeployment = (): boolean =>
  getSiteUrl() === CANONICAL_SITE_URL;
