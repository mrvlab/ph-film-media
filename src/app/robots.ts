import { MetadataRoute } from 'next';
import { getSiteUrl, isCanonicalDeployment } from '@/utils/siteUrl';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getSiteUrl();

  // Preview / vercel.app deployments must not be indexed — otherwise they
  // compete with phmedia.se as duplicate content and fragment site identity.
  if (!isCanonicalDeployment()) {
    return {
      rules: {
        userAgent: '*',
        disallow: '/',
      },
    };
  }

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/studio/', '/api/draft-mode/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
