import {
  defineLocations,
  PresentationPluginOptions,
} from 'sanity/presentation';

// Home is the page whose slug is exactly "/". Every other page lives at /{slug}.
const pageHref = (slug?: string) =>
  !slug ? undefined : slug === '/' ? '/' : `/${slug}`;

export const resolve: PresentationPluginOptions['resolve'] = {
  locations: {
    // Pages — the block-based documents that make up the site.
    page: defineLocations({
      select: {
        title: 'pageTitle',
        slug: 'slug.current',
      },
      resolve: (doc) => {
        const href = pageHref(doc?.slug);
        return {
          locations: [
            ...(href ? [{ title: doc?.title || 'Untitled page', href }] : []),
            { title: 'Home', href: '/' },
          ],
        };
      },
    }),

    // Products — each has its own shop detail route.
    product: defineLocations({
      select: {
        title: 'title',
        slug: 'slug.current',
      },
      resolve: (doc) => ({
        locations: doc?.slug
          ? [
              {
                title: doc?.title || 'Untitled product',
                href: `/shop/products/${doc.slug}`,
              },
            ]
          : [],
      }),
    }),

    // Tickets have no standalone route — they surface inside pages via the
    // ticketList block. Point editors at Home as a best-effort preview.
    ticket: defineLocations({
      select: {
        title: 'title',
      },
      resolve: (doc) => ({
        locations: [{ title: doc?.title || 'Ticket', href: '/' }],
      }),
    }),
  },
};
