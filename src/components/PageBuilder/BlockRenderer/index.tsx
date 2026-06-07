import React from 'react';
import HeroCarouselBlock from '@/components/Blocks/HeroCarousel';
import MediaCarousel from '@/components/Blocks/MediaCarousel';
import MovieClubList from '@/components/Blocks/MovieClubList';
import ImageWithText from '@/components/Blocks/ImageWithText';
import LogoCarousel from '@/components/Blocks/LogoCarousel';
import PageTitle from '@/components/Blocks/PageTitle';
import MoviesHeroCarousel from '@/components/Blocks/MoviesHeroCarousel';
import DistributionList from '@/components/Blocks/DistributionList';
import ProjectsList from '@/components/Blocks/ProjectsList';
import ScreensList from '@/components/Blocks/ScreensList';
import type {
  FetchHomeResult,
  FetchPageResult,
  Slug,
} from '../../../../sanity.types';

// Extract block types from the generated Sanity types
type HomeBlockType = NonNullable<
  NonNullable<FetchHomeResult>['blockList']
>[number];
type PageBlockType = NonNullable<
  NonNullable<FetchPageResult>['blockList']
>[number];
type IBlockType = HomeBlockType | PageBlockType;

// Filter out empty objects and ensure we have a block with _type
type ValidBlockType = IBlockType & { _type: string };

type IBlockRenderer = {
  index: number;
  block: ValidBlockType;
  slug?: Slug;
  // Add any other props that specific blocks might need
  [key: string]: unknown;
};

// Block registry - single source of truth for all blocks
const BLOCK_COMPONENTS = {
  heroCarousel: HeroCarouselBlock,
  pageTitle: PageTitle,
  mediaCarousel: MediaCarousel,
  movieClubList: MovieClubList,
  moviesHeroCarousel: MoviesHeroCarousel,
  imageWithText: ImageWithText,
  logoCarousel: LogoCarousel,
  distributionList: DistributionList,
  projectsList: ProjectsList,
  screensList: ScreensList,
} as const;

export default function BlockRenderer({
  block,
  index,
  slug,
  ...additionalProps
}: IBlockRenderer) {
  const Component =
    BLOCK_COMPONENTS[block._type as keyof typeof BLOCK_COMPONENTS];

  if (!Component) {
    return (
      <div
        key={'_key' in block ? block._key : index}
        className='w-full bg-red-50 border border-red-200 text-center text-red-600 p-8 rounded'
      >
        A &ldquo;{block._type}&rdquo; block hasn&apos;t been created yet
      </div>
    );
  }

  // Handle special cases where blocks need different props
  const getBlockProps = () => {
    const baseProps = {
      key: '_key' in block ? block._key : index,
    };

    // Special handling for blocks that need different prop structures
    switch (block._type) {
      case 'heroCarousel':
        return { ...baseProps, block, idx: index };
      case 'distributionList':
        return { ...baseProps, block, slug };
      default:
        return { ...baseProps, ...block };
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return React.createElement(Component as any, {
    ...getBlockProps(),
    ...additionalProps,
  });
}
