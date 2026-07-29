'use client';

import React from 'react';
import { motion } from 'framer-motion';

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
 * Peeking carousel for 2+ tickets, using native scroll-snap. Desktop prev/next
 * buttons scroll one card at a time and disable at the ends.
 */
export function TicketCarousel({
  heading,
  className,
  children,
}: TicketCarouselProps) {
  const scrollerRef = React.useRef<HTMLDivElement>(null);
  const [prevDisabled, setPrevDisabled] = React.useState(true);
  const [nextDisabled, setNextDisabled] = React.useState(false);

  const slides = React.Children.toArray(children);

  // Disable each arrow at its end of the range (1px slack for rounding).
  const updateArrows = React.useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setPrevDisabled(scrollLeft <= 1);
    setNextDisabled(scrollLeft >= scrollWidth - clientWidth - 1);
  }, []);

  React.useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    // rAF-defer so the first setState isn't synchronous in the effect (repo lint).
    const raf = requestAnimationFrame(updateArrows);
    el.addEventListener('scroll', updateArrows, { passive: true });
    window.addEventListener('resize', updateArrows);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener('scroll', updateArrows);
      window.removeEventListener('resize', updateArrows);
    };
  }, [updateArrows]);

  // One "card" step = distance between two slide starts (card width + gap).
  const scrollByStep = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const first = el.children[0] as HTMLElement | undefined;
    const second = el.children[1] as HTMLElement | undefined;
    const step =
      first && second
        ? second.offsetLeft - first.offsetLeft
        : (first?.offsetWidth ?? el.clientWidth);
    el.scrollBy({ left: dir * step, behavior: 'smooth' });
  };

  return (
    <section
      className={`page-x-spacing flex flex-col gap-4 h-fit lg:gap-6 ${className ?? ''}`}
      data-sanity-edit-target
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
            onClick={() => scrollByStep(-1)}
            disabled={prevDisabled}
            className={arrowButtonClass}
          >
            <Arrow className='rotate-180' />
          </button>
          <button
            type='button'
            aria-label='Nästa'
            onClick={() => scrollByStep(1)}
            disabled={nextDisabled}
            className={arrowButtonClass}
          >
            <Arrow />
          </button>
        </div>
      </div>

      {/* Full-bleed both edges; pl/scroll-pl re-inset the first card to the gutter. */}
      <motion.div
        ref={scrollerRef}
        className='flex gap-2.5 overflow-x-auto overscroll-x-contain snap-x snap-mandatory -ml-p-mobile -mr-p-mobile pl-p-mobile scroll-pl-p-mobile lg:ml-0 lg:gap-6 lg:pl-0 lg:scroll-pl-0 lg:-mr-p-desktop [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden'
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeInOut' }}
        viewport={{ once: true }}
      >
        {slides.map((child, i) => (
          <div
            key={i}
            className='min-w-0 shrink-0 snap-start flex-[0_0_82%] last:mr-p-mobile lg:flex-[0_0_63%] lg:last:mr-p-desktop'
          >
            {child}
          </div>
        ))}
      </motion.div>
    </section>
  );
}
