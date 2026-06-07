import { sanityFetch } from '@/sanity/lib/live';
import {
  fetchPage,
  fetchFooter,
  fetchAllPageSlugs,
} from '@/sanity/lib/queries';
import { notFound } from 'next/navigation';
import { generateMetadata } from '@/utils/generateMetadata';
import BlockRenderer from '@/components/PageBuilder/BlockRenderer';
import type {
  FetchPageResult,
  FetchFooterResult,
  FetchAllPageSlugsResult,
} from '../../../../../sanity.types';
import Header from '@/components/Header/Header';
import Footer from '@/components/Footer/Footer';
import { client } from '@/sanity/lib/client';
import JsonLd from '@/components/JsonLd';
import { getBreadcrumbJsonLd } from '@/utils/jsonld';
import { getSiteUrl, SITE_NAME } from '@/utils/siteUrl';

export { generateMetadata };

// Generate static params for all pages at build time
export async function generateStaticParams() {
  const pages = await client.fetch<FetchAllPageSlugsResult>(fetchAllPageSlugs);

  return (
    pages
      ?.filter((page) => page.slug && page.slug !== '/') // Filter out home page since it's handled separately
      .map((page) => ({
        slug: page.slug,
      })) || []
  );
}

// Optional: Set to false to return 404 for paths not returned by generateStaticParams
// export const dynamicParams = false;

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const { data }: { data: FetchPageResult } = await sanityFetch({
    query: fetchPage,
    params: { slug },
  });

  if (!data) {
    notFound();
  }

  const { data: footer }: { data: FetchFooterResult } = await sanityFetch({
    query: fetchFooter,
  });

  // Breadcrumb hierarchy (Home › <Page>) so this page is understood as part of
  // the site rather than a standalone URL.
  const baseUrl = getSiteUrl();
  const breadcrumbJsonLd = getBreadcrumbJsonLd({
    items: [
      { name: SITE_NAME, url: `${baseUrl}/` },
      {
        name: data.pageTitle || slug,
        url: `${baseUrl}/${slug.replace(/^\/+/, '')}`,
      },
    ],
  });

  return (
    <>
      <JsonLd data={breadcrumbJsonLd} />
      <Header />
      <main
        className="grid grid-cols-1 max-lg:pt-[22%] mt-[var(--header-height-mobile)] lg:mt-0 lg:col-span-10 lg:row-span-full lg:overflow-y-scroll lg:py-p-desktop"
        id="page-main-content"
      >
        {data.blockList?.map((block, idx) => {
          if (!('_type' in block)) return null;
          return (
            <BlockRenderer
              key={'_key' in block ? block._key : idx}
              block={block}
              index={idx}
              slug={data.slug || undefined}
              className="grid grid-cols-1"
            />
          );
        })}
        <Footer footer={footer} />
      </main>
    </>
  );
}
