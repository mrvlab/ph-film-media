import type { Metadata, ResolvingMetadata } from 'next';
import { resolveOpenGraphImage } from '@/sanity/lib/utils';
import {
  fetchHome,
  fetchPage,
  settingsQuery,
  fetchDistributionMovie,
} from '@/sanity/lib/queries';
import { sanityFetch } from '@/sanity/lib/live';
import { getSiteUrl, SITE_NAME } from '@/utils/siteUrl';

// ============================================================================
// Types & Constants
// ============================================================================

type RichTextBlock = {
  children?: Array<{ text?: string }>;
  _type?: string;
  _key?: string;
};

type Props = {
  params: Promise<{ slug: string; movieSlug?: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

type ProjectData = {
  title: string | null;
  description: RichTextBlock[] | null;
  image: unknown | null;
};

const DEFAULTS = {
  TITLE: 'PH Film & Media',
  DESCRIPTION: 'Default description',
  IMAGE_URL: '/images/default-image.png',
  IMAGE_WIDTH: 1200,
  IMAGE_HEIGHT: 630,
  MAX_DESCRIPTION_LENGTH: 155,
} as const;

const DEFAULT_IMAGE = {
  url: DEFAULTS.IMAGE_URL,
  alt: 'Page',
  width: DEFAULTS.IMAGE_WIDTH,
  height: DEFAULTS.IMAGE_HEIGHT,
};

// ============================================================================
// Text Processing Helpers
// ============================================================================

function extractTextFromRichText(
  description: string | RichTextBlock[] | undefined | null
): string {
  if (typeof description === 'string') return description;
  if (!description?.length) return DEFAULTS.DESCRIPTION;

  const text = description
    .filter((block) => block._type === 'block' && block.children)
    .map((block) =>
      block
        .children!.map((child) => child.text || '')
        .join('')
        .trim()
    )
    .filter(Boolean)
    .join(' ');

  return text || DEFAULTS.DESCRIPTION;
}

function truncateText(
  text: string,
  maxLength = DEFAULTS.MAX_DESCRIPTION_LENGTH
): string {
  return text.length <= maxLength ? text : `${text.slice(0, maxLength - 3)}...`;
}

// ============================================================================
// Project Data Extraction
// ============================================================================

async function getProjectData(
  blockList: Array<{ _type: string; [key: string]: unknown }> | undefined | null
): Promise<ProjectData | null> {
  const projectsList = blockList?.find(
    (block) => block._type === 'projectsList'
  ) as
    | {
        showFeaturedProjectCard?: boolean;
        featuredProjectCardOverride?: ProjectData & {
          projectImage?: { media?: unknown };
        };
      }
    | undefined;

  // No projectsList block found
  if (!projectsList) return null;

  // If featured project card is enabled and has an override, use it
  if (
    projectsList.showFeaturedProjectCard &&
    projectsList.featuredProjectCardOverride
  ) {
    const { title, description, projectImage } =
      projectsList.featuredProjectCardOverride;
    return {
      title: title || null,
      description: description || null,
      image: projectImage?.media || null,
    };
  }

  // Otherwise, always fetch the first project for metadata
  // (regardless of showFeaturedProjectCard setting)
  try {
    const { client } = await import('@/sanity/lib/client');
    const { defineQuery } = await import('groq');

    return await client.fetch(
      defineQuery(`*[_type == "projects"] | order(_createdAt desc) [0] {
        title,
        description,
        "image": projectImage.media
      }`),
      {},
      { next: { revalidate: 3600 } }
    );
  } catch (error) {
    console.error('Error fetching project metadata:', error);
    return null;
  }
}

// ============================================================================
// Metadata Resolution Helpers
// ============================================================================

type MovieData = {
  title?: string | null;
  description?: RichTextBlock[] | null;
  movieBanner?: { media?: unknown } | null;
  moviePoster?: { media?: unknown } | null;
};

type SeoData = {
  metaTitle?: string | null;
  metaDescription?: string | null;
  metaImage?: { media?: unknown } | null;
};

function resolveTitle(
  movie: MovieData | undefined | null,
  pageSeo: SeoData | undefined | null,
  projectData: ProjectData | null,
  pageTitle?: string | null
): string {
  const title =
    movie?.title ||
    pageSeo?.metaTitle ||
    projectData?.title ||
    pageTitle ||
    DEFAULTS.TITLE;

  return title !== DEFAULTS.TITLE
    ? `${title} | ${DEFAULTS.TITLE}`
    : DEFAULTS.TITLE;
}

function resolveDescription(
  movie: MovieData | undefined | null,
  pageSeo: SeoData | undefined | null,
  projectData: ProjectData | null,
  settingsSeo: SeoData | undefined | null
): string {
  const description =
    (movie?.description && extractTextFromRichText(movie.description)) ||
    pageSeo?.metaDescription ||
    (projectData?.description &&
      extractTextFromRichText(projectData.description)) ||
    settingsSeo?.metaDescription ||
    DEFAULTS.DESCRIPTION;

  return truncateText(description);
}

function resolveImage(
  movie: MovieData | undefined | null,
  pageSeo: SeoData | undefined | null,
  projectData: ProjectData | null,
  settingsSeo: SeoData | undefined | null
) {
  const image =
    movie?.movieBanner?.media ||
    movie?.moviePoster?.media ||
    pageSeo?.metaImage?.media ||
    projectData?.image ||
    settingsSeo?.metaImage?.media;

  return (
    resolveOpenGraphImage(image, DEFAULTS.IMAGE_WIDTH, DEFAULTS.IMAGE_HEIGHT) ||
    DEFAULT_IMAGE
  );
}

function buildCanonicalUrl(
  baseUrl: string,
  isHome: boolean,
  isDistributionMovie: boolean,
  slug?: string,
  movieSlug?: string
): string {
  const cleanBaseUrl = baseUrl.replace(/\/$/, '');

  if (isHome) return `${cleanBaseUrl}/`;
  if (isDistributionMovie) return `${cleanBaseUrl}/${slug}/${movieSlug}`;
  return `${cleanBaseUrl}/${slug?.replace(/^\/+/, '')}`;
}

// ============================================================================
// Main Metadata Generator
// ============================================================================

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { slug, movieSlug } = await params;
  const isHome = !slug || slug === '/';
  const isDistributionMovie = !!(slug && movieSlug);

  // Canonical base URL (phmedia.se in production), decoupled from preview URL.
  const baseUrl = getSiteUrl();

  // Fetch all data in parallel
  const [{ data: settings }, { data: page }, { data: movie }] =
    await Promise.all([
      sanityFetch({ query: settingsQuery }),
      isHome
        ? sanityFetch({ query: fetchHome, params: { slug: '/' } })
        : sanityFetch({ query: fetchPage, params: { slug } }),
      isDistributionMovie
        ? sanityFetch({
            query: fetchDistributionMovie,
            params: { slug: movieSlug },
          })
        : Promise.resolve({ data: undefined }),
    ]);

  const projectData = await getProjectData(page?.blockList);

  // Resolve metadata fields
  const title = resolveTitle(movie, page?.seo, projectData, page?.pageTitle);
  const description = resolveDescription(
    movie,
    page?.seo,
    projectData,
    settings?.seo
  );
  const ogImage = resolveImage(movie, page?.seo, projectData, settings?.seo);
  const canonical = buildCanonicalUrl(
    baseUrl,
    isHome,
    isDistributionMovie,
    slug,
    movieSlug
  );
  const previousImages = (await parent).openGraph?.images || [];

  // Safely create metadataBase - only include if URL is valid
  // This prevents "Invalid URL" errors during build
  let metadataBase: URL | undefined;
  try {
    if (baseUrl && baseUrl.trim()) {
      metadataBase = new URL(baseUrl.trim());
    }
  } catch {
    // If URL is invalid, metadataBase will be undefined
    // Next.js will handle this gracefully
    metadataBase = undefined;
  }

  return {
    title,
    description,
    ...(metadataBase && { metadataBase }),
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: SITE_NAME,
      locale: 'sv_SE',
      type: 'website',
      images: [ogImage, ...previousImages],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage.url],
    },
    other: {
      'og:site_name': SITE_NAME,
      'og:locale': 'sv_SE',
      'og:type': 'website',
      'og:image:width': String(DEFAULTS.IMAGE_WIDTH),
      'og:image:height': String(DEFAULTS.IMAGE_HEIGHT),
      'og:image:alt': ogImage.alt,
      'og:image:secure_url': ogImage.url,
      'og:image:type': 'image/jpeg',
    },
  };
}
