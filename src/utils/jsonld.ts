// Helper for WebSite JSON-LD (for search box sitelinks)
export function getWebSiteJsonLd({
  name,
  url,
  alternateName,
  searchUrl,
}: {
  name: string;
  url: string;
  alternateName?: string;
  searchUrl?: string;
}) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name,
    ...(alternateName && { alternateName }),
    url,
    inLanguage: 'sv-SE',
  };

  // Add search action if search functionality exists
  if (searchUrl) {
    schema.potentialAction = {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${searchUrl}?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    };
  }

  return schema;
}

// Helper for Organization JSON-LD (for knowledge panel)
export function getOrganizationJsonLd({
  name,
  url,
  alternateName,
  logo,
  description,
  email,
  socialLinks,
}: {
  name: string;
  url: string;
  alternateName?: string;
  logo?: string;
  description?: string;
  email?: string;
  socialLinks?: string[];
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name,
    ...(alternateName && { alternateName }),
    url,
    logo,
    description,
    email,
    sameAs: socialLinks,
  };
}

// Helper for Breadcrumb JSON-LD
export function getBreadcrumbJsonLd({
  items,
}: {
  items: Array<{ name: string; url: string }>;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

// Helper for Movie JSON-LD
export function getMovieJsonLd({
  title,
  description,
  datePublished,
  duration,
  actors,
  directors,
  image,
}: {
  title: string;
  description?: string;
  datePublished?: string;
  duration?: string;
  actors?: { name: string | null }[];
  directors?: { name: string | null }[];
  image?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Movie',
    name: title,
    description,
    datePublished,
    duration: duration ? `PT${duration}M` : undefined,
    actor: actors?.map((a) => ({ '@type': 'Person', name: a.name })),
    director: directors?.map((d) => ({ '@type': 'Person', name: d.name })),
    image,
  };
}
