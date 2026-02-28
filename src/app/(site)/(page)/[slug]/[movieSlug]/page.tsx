import { sanityFetch } from '@/sanity/lib/live';
import {
  fetchDistributionMovie,
  settingsQuery,
  fetchAllDistributionMovieSlugs,
  fetchDistributionParentSlug,
  fetchPage,
} from '@/sanity/lib/queries';
import { notFound } from 'next/navigation';
import { generateMetadata } from '@/utils/generateMetadata';
import type {
  FetchAllDistributionMovieSlugsResult,
  FetchDistributionMovieResult,
  FetchDistributionParentSlugResult,
  FetchPageResult,
  SettingsQueryResult,
} from '../../../../../../sanity.types';
import { getMovieJsonLd, getBreadcrumbJsonLd } from '@/utils/jsonld';
import JsonLd from '@/components/JsonLd';
import MovieDetailHero from '@/components/Blocks/DistributionList/DistributionMovieDetail/MovieDetailHero';
import MovieDetail from '@/components/Blocks/DistributionList/DistributionMovieDetail/MovieDetail';
import { client } from '@/sanity/lib/client';

export { generateMetadata };

// Generate static params for all distribution movie pages at build time
export async function generateStaticParams() {
  // Get the parent page slug (the page that contains the distributionList block)
  const parentPage = await client.fetch<FetchDistributionParentSlugResult>(
    fetchDistributionParentSlug
  );

  // Get all distribution movie slugs
  const movies = await client.fetch<FetchAllDistributionMovieSlugsResult>(
    fetchAllDistributionMovieSlugs
  );

  // If no parent page or no movies, return empty array
  if (!parentPage?.slug || !movies?.length) {
    return [];
  }

  // Return array of params for each movie under the parent page
  return movies.map((movie) => ({
    slug: parentPage.slug,
    movieSlug: movie.slug,
  }));
}

// Optional: Set to false to return 404 for paths not returned by generateStaticParams
// export const dynamicParams = false;

type Props = {
  params: Promise<{ slug: string; movieSlug: string }>;
};

export default async function MoviePage({ params }: Props) {
  const { slug, movieSlug } = await params;

  const { data: movie }: { data: FetchDistributionMovieResult } =
    await sanityFetch({
      query: fetchDistributionMovie,
      params: { slug: movieSlug },
    });
  const { data: settings }: { data: SettingsQueryResult } = await sanityFetch({
    query: settingsQuery,
  });
  const { data: parentPage }: { data: FetchPageResult } = await sanityFetch({
    query: fetchPage,
    params: { slug },
  });

  if (!movie) notFound();

  const baseUrl =
    (process.env.NEXT_PUBLIC_SANITY_STUDIO_PREVIEW_URL || '').trim() ||
    'http://localhost:3000';

  // Movie schema for rich snippets
  const movieJsonLd = getMovieJsonLd({
    title: movie.title || '',
    description:
      typeof movie.description === 'string' ? movie.description : undefined,
    datePublished: movie.releaseDate || undefined,
    duration: movie.duration || undefined,
    actors: movie.actors?.map((a) => ({ name: a.actor })),
    directors: movie.directors?.map((d) => ({ name: d.director })),
    image: movie.moviePoster?.media?.asset?.url,
  });

  // Breadcrumb schema for navigation
  const breadcrumbJsonLd = getBreadcrumbJsonLd({
    items: [
      { name: 'Home', url: baseUrl },
      {
        name: parentPage?.pageTitle || 'Distribution',
        url: `${baseUrl}/${slug}`,
      },
      {
        name: movie.title || '',
        url: `${baseUrl}/${slug}/${movieSlug}`,
      },
    ],
  });

  return (
    <>
      <JsonLd data={movieJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />
      <MovieDetailHero {...movie} />
      <MovieDetail movie={movie} settings={settings} />
    </>
  );
}
