import { MetadataRoute } from 'next';
import { client } from '@/sanity/lib/client';
import {
  fetchAllPageSlugs,
  fetchAllDistributionMovieSlugs,
  fetchDistributionParentSlug,
} from '@/sanity/lib/queries';
import { getSiteUrl } from '@/utils/siteUrl';
import type {
  FetchAllPageSlugsResult,
  FetchAllDistributionMovieSlugsResult,
  FetchDistributionParentSlugResult,
} from '../../sanity.types';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl();

  // Fetch all data in parallel
  const [pages, movies, parent] = await Promise.all([
    client.fetch<FetchAllPageSlugsResult>(fetchAllPageSlugs),
    client.fetch<FetchAllDistributionMovieSlugsResult>(
      fetchAllDistributionMovieSlugs
    ),
    client.fetch<FetchDistributionParentSlugResult>(
      fetchDistributionParentSlug
    ),
  ]);

  const movieParentSlug = parent?.slug || 'distribution';

  return [
    // Homepage
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    // Main pages
    ...(pages?.map((page) => ({
      url: `${baseUrl}/${page.slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })) || []),
    // Movie pages
    ...(movies?.map((movie) => ({
      url: `${baseUrl}/${movieParentSlug}/${movie.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })) || []),
  ];
}
