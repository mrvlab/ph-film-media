'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Variants } from 'framer-motion';
import HeroCarouselWithIndicators from './HeroCarouselWithIndicators';
import { BlockListItem } from '@/types/IBlockListItem';

import HeroCardWithAnimation from './HeroCardWithAnimation';
import CardWrapper from './CardWrapper';

// Animation configuration
const CARD_VARIANTS: Variants = {
  hidden: {
    opacity: 0,
    y: 10,
    scale: 0.98,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.9,
    },
  },
};

// Animation queue management
const useAnimationQueue = () => {
  const [animatedCards, setAnimatedCards] = React.useState<Set<number>>(
    new Set(),
  );
  const hasAnimated = useRef(false);

  const startAnimations = React.useCallback((totalCards: number) => {
    if (hasAnimated.current) return;
    hasAnimated.current = true;

    Array.from({ length: totalCards }, (_, i) =>
      setTimeout(
        () => setAnimatedCards((prev) => new Set([...prev, i])),
        i * 150,
      ),
    );
  }, []);

  return { animatedCards, startAnimations };
};

// Custom hook to avoid hydration issues
const useIsDesktop = () => {
  const [isDesktop, setIsDesktop] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    let resizeTimeout: NodeJS.Timeout;
    const checkIsDesktop = () => setIsDesktop(window.innerWidth >= 1024);
    const debouncedCheck = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(checkIsDesktop, 100);
    };

    const raf = requestAnimationFrame(() => {
      setIsMounted(true);
      checkIsDesktop();
    });
    window.addEventListener('resize', debouncedCheck);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', debouncedCheck);
      clearTimeout(resizeTimeout);
    };
  }, []);

  return isMounted ? isDesktop : false;
};

const HeroCarouselBlock = ({ block }: { block: BlockListItem }) => {
  const isDesktop = useIsDesktop();
  const { animatedCards, startAnimations } = useAnimationQueue();
  const [isReady, setIsReady] = useState(false);

  React.useEffect(() => {
    if (isDesktop && 'mediaCard' in block && block.mediaCard?.length) {
      startAnimations(block.mediaCard.length);
      const timer = setTimeout(() => setIsReady(true), 50);
      return () => clearTimeout(timer);
    } else if (!isDesktop) {
      const raf = requestAnimationFrame(() => setIsReady(true));
      return () => cancelAnimationFrame(raf);
    }
  }, [block, startAnimations, isDesktop]);

  if (!block || !('mediaCard' in block)) return null;

  if (!isReady) {
    return (
      <div className='relative lg:flex lg:flex-col lg:h-full lg:w-full lg:gap-4 lg:overflow-hidden'>
        <div className='flex flex-col gap-4 lg:flex-1'>
          <div className='overflow-hidden h-full'>
            <div className='flex h-full'>
              {block.mediaCard?.map((card, idx) => (
                <div
                  key={`hero-card-${card.id ?? idx}`}
                  className='relative flex flex-col h-full flex-shrink-0 min-w-[85%] mr-2 lg:min-w-[33.3333%] max-lg:gap-4 opacity-0'
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const shouldDisableAutoplay =
    isDesktop && block.mediaCard && block.mediaCard.length <= 3;

  return (
    <HeroCarouselWithIndicators
      options={{
        align: isDesktop ? 'start' : 'center',
        loop: true,
        skipSnaps: !isReady,
        watchDrag: true,
        duration: 20,
        containScroll: false,
        dragThreshold: isDesktop ? 5 : 10,
      }}
      autoplayOptions={
        shouldDisableAutoplay
          ? undefined
          : {
              playOnInit: true,
              stopOnInteraction: false,
              stopOnMouseEnter: false,
              delay: isDesktop ? 3500 : 6000,
            }
      }
      showIndicators={true}
    >
      {block.mediaCard?.map((card, idx) =>
        isDesktop ? (
          <HeroCardWithAnimation
            key={`hero-card-${card.id ?? idx}`}
            card={card}
            index={idx}
            variants={CARD_VARIANTS}
            isAnimated={animatedCards.has(idx)}
            isDesktop={isDesktop}
          />
        ) : (
          // Mobile: Direct rendering without animation wrapper
          <CardWrapper
            key={`hero-card-${card.id ?? idx}`}
            card={card}
            index={idx}
          />
        ),
      )}
    </HeroCarouselWithIndicators>
  );
};

export default HeroCarouselBlock;
