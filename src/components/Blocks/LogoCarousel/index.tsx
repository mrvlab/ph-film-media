import React from 'react';
import { FetchHomeResult, FetchPageResult } from '../../../../sanity.types';
import SanityImage from '@/components/Media/SanityImage';
import Marquee from 'react-fast-marquee';

type ILogoCarouselBlocks = Extract<
  NonNullable<
    NonNullable<FetchPageResult | FetchHomeResult>['blockList']
  >[number],
  { _type: 'logoCarousel' }
>;

const LogoCarousel = (block: ILogoCarouselBlocks) => {
  const { logoItems } = block;

  // Calculate speed based on the number of items to maintain consistent visual speed
  // More items = slower speed, fewer items = faster speed
  const itemCount = logoItems?.length || 0;
  const baseSpeed = 40;
  const speed =
    itemCount > 0
      ? Math.max(10, Math.min(50, baseSpeed * (5 / itemCount)))
      : baseSpeed;

  return (
    <section className='py-10' data-sanity-edit-target>
      <Marquee
        autoFill
        className='w-full'
        speed={speed}
        gradient={true}
        gradientColor={'var(--color-background)'}
        gradientWidth={100}
        direction='right'
      >
        <ul className='flex w-fit h-fit overflow-x-auto items-center justify-center gap-16 pr-16'>
          {logoItems?.map((logo, idx) =>
            logo.mediaItem?.media ? (
              <li key={idx} className='w-[20rem] h-20'>
                <SanityImage
                  useImageAspect
                  className='w-full h-full !object-contain'
                  {...logo.mediaItem}
                />
              </li>
            ) : null
          )}
        </ul>
      </Marquee>
    </section>
  );
};

export default LogoCarousel;
