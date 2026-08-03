import { createImageUrlBuilder } from '@sanity/image-url';

import { createDataAttribute, CreateDataAttributeProps } from 'next-sanity';
import { dataset, projectId, studioUrl } from '../env';
import type { LinkInput } from '@/types/linkTypes';

const imageBuilder = createImageUrlBuilder({
  projectId: projectId || '',
  dataset: dataset || '',
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const urlForImage = (source: any) => {
  // Accept either _ref or _id for the asset
  if (!source?.asset?._ref && !source?.asset?._id) {
    return undefined;
  }
  return imageBuilder?.image(source).auto('format').fit('max');
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function resolveOpenGraphImage(image: any, width = 1200, height = 627) {
  if (!image) return;
  const url = urlForImage(image)?.width(1200).height(627).fit('crop').url();
  if (!url) return;
  return { url, alt: image?.alt as string, width, height };
}

type DataAttributeConfig = CreateDataAttributeProps &
  Required<Pick<CreateDataAttributeProps, 'id' | 'type' | 'path'>>;

export function dataAttr(config: DataAttributeConfig) {
  return createDataAttribute({
    projectId,
    dataset,
    baseUrl: studioUrl,
  }).combine(config);
}

export function linkResolver(link: LinkInput) {
  if (!link) return null;

  if (!link.linkType && link.externalLink) {
    (link as { linkType: string }).linkType = 'externalLink';
  }

  if (
    link.linkType === 'externalLink' ||
    (link.linkType as string) === 'href'
  ) {
    return link.externalLink || null;
  }

  if (link.linkType === 'internalLink') {
    if (
      'internalLink' in link &&
      link.internalLink &&
      'slug' in link.internalLink &&
      link.internalLink.slug?.current
    ) {
      return `/${link.internalLink.slug.current}`;
    }
    return null;
  }

  return null;
}

// for sanity image component url
export const baseUrl = `https://cdn.sanity.io/images/${projectId}/${dataset}/`;
