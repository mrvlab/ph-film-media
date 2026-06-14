import { MetadataRoute } from 'next';
import { client } from '@/sanity/lib/client';
import {
  fetchAllPageSlugs,
  fetchAllDistributionMovieSlugs,
  fetchDistributionParentSlug,
  fetchHeader,
} from '@/sanity/lib/queries';
import { getSiteUrl } from '@/utils/siteUrl';
import type {
  FetchAllPageSlugsResult,
  FetchAllDistributionMovieSlugsResult,
  FetchDistributionParentSlugResult,
  FetchHeaderResult,
} from '../../sanity.types';

const normalizeSlug = (slug: string) => slug.replace(/^\/+/, '');

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl();

  // Fetch all data in parallel
  const [pages, movies, parent, header] = await Promise.all([
    client.fetch<FetchAllPageSlugsResult>(fetchAllPageSlugs),
    client.fetch<FetchAllDistributionMovieSlugsResult>(
      fetchAllDistributionMovieSlugs
    ),
    client.fetch<FetchDistributionParentSlugResult>(
      fetchDistributionParentSlug
    ),
    client.fetch<FetchHeaderResult>(fetchHeader),
  ]);

  const movieParentSlug = parent?.slug || 'distribution';

  // Slugs that appear in the main navigation menu get a higher priority so the
  // sitemap mirrors the human-facing site hierarchy.
  const navSlugs = new Set(
    (header?.linkReference ?? [])
      .filter((item) => item?.link?.linkType === 'internalLink')
      .map((item) => item.link?.internalLink?.slug?.current)
      .filter((slug): slug is string => Boolean(slug))
      .map(normalizeSlug)
  );

  return [
    // Homepage
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    // Main pages — priority reflects whether the page is in the main nav
    ...(pages
      ?.filter((page) => page.slug && page.slug !== '/')
      .map((page) => ({
        url: `${baseUrl}/${normalizeSlug(page.slug!)}`,
        lastModified: page._updatedAt ? new Date(page._updatedAt) : new Date(),
        changeFrequency: 'monthly' as const,
        priority: navSlugs.has(normalizeSlug(page.slug!)) ? 0.8 : 0.6,
      })) || []),
    // Movie pages
    ...(movies?.map((movie) => ({
      url: `${baseUrl}/${movieParentSlug}/${movie.slug}`,
      lastModified: movie._updatedAt ? new Date(movie._updatedAt) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })) || []),
  ];
}
