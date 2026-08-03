import React from 'react';
import { FetchHomeResult, FetchPageResult } from '../../../../sanity.types';
import SanityImage from '@/components/Media/SanityImage';

type IPageTitleBlock = Extract<
  NonNullable<
    NonNullable<FetchPageResult | FetchHomeResult>['blockList']
  >[number],
  { _type: 'pageTitle' }
>;
type IPageDataTitle = Extract<
  NonNullable<NonNullable<FetchPageResult | FetchHomeResult>['pageTitle']>,
  { _type: 'pageTitle' }
>;

type PageTitleProps = IPageTitleBlock | IPageDataTitle;

const PageTitle = (block: PageTitleProps) => {
  const { titleType, title, pageTitleImage, visibility } = block;

  // Build visibility classes based on settings
  const visibilityClasses = [
    visibility?.hideOnMobile && 'max-lg:hidden',
    visibility?.hideOnDesktop && 'lg:hidden',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <section
      className={`grid page-x-spacing pb-2 ${visibilityClasses}`}
      data-sanity-edit-target
    >
      {titleType === 'image' && pageTitleImage?.media ? (
        <div className='grid md:grid-cols-2 md:gap-2 lg:gap-2 lg:grid-cols-3 2xl:grid-cols-4'>
          <div className='w-full max-w-2xl col-span-full md:col-span-1 lg:col-start-3 lg:col-span-1 xl:col-start-4'>
            <SanityImage
              _type='mediaType'
              media={pageTitleImage.media}
              useImageAspect={true}
              className='!w-full !aspect-[unset]'
            />
          </div>
        </div>
      ) : (
        <h1 className='text-h-50 break-words uppercase lg:leading-[1.4] 2xl:text-h-67'>
          {title}
        </h1>
      )}
    </section>
  );
};

export default PageTitle;
