// ============================================================================
// resolveLinkUrl
// ----------------------------------------------------------------------------
// Resolves a Sanity link (header menu item, social link, etc.) to an absolute
// URL. Internal links resolve against the canonical base URL; external links
// (incl. mailto:/tel:) are returned as-is. Returns null when the link is empty
// or cannot be resolved, so callers can filter it out.
// ============================================================================

type ResolvableLink = {
  linkType?: string | null;
  externalLink?: string | null;
  internalLink?: {
    slug?: { current?: string | null } | null;
  } | null;
} | null;

const stripLeadingSlash = (value: string) => value.replace(/^\/+/, '');

export function resolveLinkUrl(
  link: ResolvableLink,
  baseUrl: string
): string | null {
  if (!link) return null;

  if (link.linkType === 'externalLink') {
    return link.externalLink?.trim() || null;
  }

  if (link.linkType === 'internalLink') {
    const current = link.internalLink?.slug?.current?.trim();
    if (!current) return null;
    // Home page is stored as '/' — keep it pointing at the root.
    if (current === '/') return `${baseUrl}/`;
    return `${baseUrl}/${stripLeadingSlash(current)}`;
  }

  return null;
}
