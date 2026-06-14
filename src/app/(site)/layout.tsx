import { SanityLive, sanityFetch } from '@/sanity/lib/live';
import { draftMode } from 'next/headers';
import { VisualEditing } from 'next-sanity/visual-editing';
import { DisableDraftMode } from '@/components/DisableDraftMode';
import { fetchHeader } from '@/sanity/lib/queries';
import type { FetchHeaderResult } from '../../../sanity.types';
import JsonLd from '@/components/JsonLd';
import { getSiteNavigationJsonLd } from '@/utils/jsonld';
import { resolveLinkUrl } from '@/utils/resolveLinkUrl';
import { getSiteUrl, SITE_NAME } from '@/utils/siteUrl';

export default async function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { isEnabled: isDraftMode } = await draftMode();

  const { data: header }: { data: FetchHeaderResult } = await sanityFetch({
    query: fetchHeader,
  });

  // Build SiteNavigationElement structured data from the Sanity menu so Google
  // understands the main site sections. Home first, then internal menu links
  // (external links are skipped — they aren't part of this site's hierarchy).
  const baseUrl = getSiteUrl();
  const navItems = [
    {
      name: header?.homeMenuItemLabel || SITE_NAME,
      url: `${baseUrl}/`,
    },
    ...(header?.linkReference ?? [])
      .filter((item) => item?.link?.linkType === 'internalLink')
      .map((item) => ({
        name: item.label || item.link?.internalLink?.pageTitle || '',
        url: resolveLinkUrl(item.link, baseUrl),
      }))
      .filter(
        (item): item is { name: string; url: string } =>
          item.url !== null && item.name !== ''
      ),
  ];

  const siteNavigationJsonLd = getSiteNavigationJsonLd({ items: navItems });

  return (
    <>
      {isDraftMode && (
        <>
          <VisualEditing />
          <DisableDraftMode />
        </>
      )}
      {navItems.length > 1 && <JsonLd data={siteNavigationJsonLd} />}
      <SanityLive />
      {children}
    </>
  );
}
