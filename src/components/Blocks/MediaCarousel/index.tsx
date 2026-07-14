'use client';

import { motion } from 'framer-motion';
import { FetchPageResult } from '../../../../sanity.types';
import Marquee from 'react-fast-marquee';
import MediaCard from './MediaCard';

export type IMediaCarouselBlock = NonNullable<
  NonNullable<FetchPageResult>['blockList']
>[number] & {
  _type: 'mediaCarousel';
};

const MediaCarousel = (block: IMediaCarouselBlock) => {
  if (block._type !== 'mediaCarousel') return null;
  const { carouselItems } = block;

  return (
    <section className="pb-3 md:pb-10" data-sanity-edit-target>
      <motion.div
        className="h-[calc(26.5rem+1.6rem+2.4rem)] lg:h-[calc(26.5rem+2.4rem+2.4rem)] overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeInOut', delay: 0.1 }}
      >
        <Marquee pauseOnHover autoFill speed={40}>
          <ul
            className="grid grid-flow-col gap-1.5 pr-1.5"
            role="list"
            aria-label="Scrolling list of featured media cards"
          >
            {carouselItems?.map((carouselItem, idx) => (
              <MediaCard
                key={carouselItem._key || idx}
                carouselItem={carouselItem}
              />
            ))}
          </ul>
        </Marquee>
      </motion.div>
    </section>
  );
};

export default MediaCarousel;
