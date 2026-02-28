import { sanityFetch } from '@/sanity/lib/live';
import { fetchHome, fetchFooter, settingsQuery } from '@/sanity/lib/queries';
import { generateMetadata } from '@/utils/generateMetadata';
import BlockRenderer from '@/components/PageBuilder/BlockRenderer';
import JsonLd from '@/components/JsonLd';
import { getOrganizationJsonLd, getWebSiteJsonLd } from '@/utils/jsonld';

export { generateMetadata };

export default async function HomePage() {
  // Fetch all data in parallel
  const [{ data }, { data: footer }, { data: settings }] = await Promise.all([
    sanityFetch({ query: fetchHome, params: { slug: '/' } }),
    sanityFetch({ query: fetchFooter }),
    sanityFetch({ query: settingsQuery }),
  ]);

  if (!data?.blockList) return null;

  const baseUrl =
    (process.env.NEXT_PUBLIC_SANITY_STUDIO_PREVIEW_URL || '').trim() ||
    'http://localhost:3000';

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
    name: data.pageTitle || 'PH Film & Media',
    url: baseUrl,
  });

  // Organization schema for knowledge panel
  const orgJsonLd = getOrganizationJsonLd({
    name: settings?.seo?.metaTitle || data.pageTitle || 'PH Film & Media',
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
