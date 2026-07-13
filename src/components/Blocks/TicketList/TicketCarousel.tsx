'use client';

import React from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { WheelGesturesPlugin } from 'embla-carousel-wheel-gestures';
import { usePrevNextButtons } from '@/components/Media/Carousel/CarouselArrowButtons';

/** Right-pointing arrow; rotated 180° for the previous button. */
const Arrow = ({ className }: { className?: string }) => (
  <svg
    width='10'
    height='8'
    viewBox='0 0 10 8'
    fill='none'
    aria-hidden='true'
    className={className}
  >
    <path
      d='M0.714844 3.69231H8.25331L5.02254 0.461538L5.42869 0L9.42869 4L5.42869 8L5.02254 7.53846L8.25331 4.30769H0.714844V3.69231Z'
      fill='white'
    />
  </svg>
);

const arrowButtonClass =
  'rounded-lg border border-white/30 p-[0.9rem] cursor-pointer transition-opacity hover:border-white/60 disabled:cursor-default disabled:opacity-30';

type TicketCarouselProps = {
  heading?: string | null;
  className?: string;
  children: React.ReactNode;
};

/**
 * Peeking carousel for 2+ tickets. Each child is one <Ticket> card, sized so the
 * next card peeks. Prev/next buttons show on desktop; mobile is drag/scroll only.
 */
export function TicketCarousel({
  heading,
  className,
  children,
}: TicketCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: 'start' }, [
    WheelGesturesPlugin({ forceWheelAxis: 'x' }),
  ]);
  const {
    prevBtnDisabled,
    nextBtnDisabled,
    onPrevButtonClick,
    onNextButtonClick,
  } = usePrevNextButtons(emblaApi);

  const slides = React.Children.toArray(children);

  return (
    <section
      className={`page-x-spacing flex flex-col gap-4 h-fit lg:gap-3 ${className ?? ''}`}
    >
      <div className='flex items-center gap-4 lg:gap-6'>
        {heading ? (
          <h2 className='text-h-67 uppercase lg:text-h-37 !leading-[1]'>
            {heading}
          </h2>
        ) : null}

        <div className='hidden items-center gap-2 lg:flex'>
          <button
            type='button'
            aria-label='Föregående'
            onClick={onPrevButtonClick}
            disabled={prevBtnDisabled}
            className={arrowButtonClass}
          >
            <Arrow className='rotate-180' />
          </button>
          <button
            type='button'
            aria-label='Nästa'
            onClick={onNextButtonClick}
            disabled={nextBtnDisabled}
            className={arrowButtonClass}
          >
            <Arrow />
          </button>
        </div>
      </div>

      {/* Bleed past page-x-spacing's right gutter so cards run to the edge. */}
      <div
        className='overflow-hidden -mr-p-mobile lg:-mr-p-desktop'
        ref={emblaRef}
      >
        <div className='flex gap-2.5 lg:gap-6'>
          {slides.map((child, i) => (
            <div
              key={i}
              className='min-w-0 flex-[0_0_82%] last:mr-p-mobile lg:flex-[0_0_63%] lg:last:mr-p-desktop'
            >
              {child}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
