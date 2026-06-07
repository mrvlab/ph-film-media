import { sanityFetch } from '@/sanity/lib/live';
import { fetchHome, fetchFooter, settingsQuery } from '@/sanity/lib/queries';
import { generateMetadata } from '@/utils/generateMetadata';
import BlockRenderer from '@/components/PageBuilder/BlockRenderer';
import JsonLd from '@/components/JsonLd';
import { getOrganizationJsonLd, getWebSiteJsonLd } from '@/utils/jsonld';
import {
  getSiteUrl,
  SITE_NAME,
  SITE_ALTERNATE_NAME,
} from '@/utils/siteUrl';
import type {
  FetchHomeResult,
  FetchFooterResult,
  SettingsQueryResult,
} from '../../../../sanity.types';

export { generateMetadata };

export default async function HomePage() {
  const { data }: { data: FetchHomeResult } = await sanityFetch({
    query: fetchHome,
    params: { slug: '/' },
  });
  const { data: footer }: { data: FetchFooterResult } = await sanityFetch({
    query: fetchFooter,
  });
  const { data: settings }: { data: SettingsQueryResult } = await sanityFetch({
    query: settingsQuery,
  });

  if (!data?.blockList) return null;

  const baseUrl = getSiteUrl();

  // Extract social media links for Organization schema
  const socialLinks =
    footer?.socialMediaLinks
      ?.map((link) => {
        if (link.linkType === 'externalLink') return link.externalLink;
        if (
          link.linkType === 'internalLink' &&
          link.internalLink?.slug?.current
        ) {
          return `${baseUrl}/${link.internalLink.slug.current}`;
        }
        return null;
      })
      .filter((link): link is string => link !== null) || [];

  // WebSite schema for enhanced search appearance
  const websiteJsonLd = getWebSiteJsonLd({
    name: SITE_NAME,
    alternateName: SITE_ALTERNATE_NAME,
    url: baseUrl,
  });

  // Organization schema for knowledge panel
  const orgJsonLd = getOrganizationJsonLd({
    name: SITE_NAME,
    alternateName: SITE_ALTERNATE_NAME,
    url: baseUrl,
    description:
      settings?.seo?.metaDescription ||
      'Film production and distribution company',
    email: footer?.email || undefined,
    socialLinks: socialLinks.length > 0 ? socialLinks : undefined,
  });

  return (
    <>
      <JsonLd data={websiteJsonLd} />
      <JsonLd data={orgJsonLd} />

      {data.blockList.map((block, idx) => {
        if (!('_type' in block)) return null;
        return (
          <BlockRenderer
            key={'_key' in block ? block._key : idx}
            block={block}
            index={idx}
            slug={data.slug || undefined}
          />
        );
      })}
    </>
  );
}
