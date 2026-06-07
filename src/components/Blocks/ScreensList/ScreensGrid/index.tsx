'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import ScreenCard from '../ScreenCard';
import { IScreensListBlocks } from '..';
import { useViewTransitionAnimation } from '@/hooks/useViewTransitionReady';
import { VIEW_TRANSITION_CONFIG } from '@/config/viewTransitionConfig';

type IScreensGrid = {
  screens: IScreensListBlocks['screens'];
};

const ScreensGrid = ({ screens }: IScreensGrid) => {
  const pathname = usePathname();
  const { isReady, animationKey } = useViewTransitionAnimation(pathname);

  return (
    <React.Fragment key={animationKey}>
      {screens?.map((screenItem, index) => {
        if (
          !screenItem ||
          !('_id' in screenItem) ||
          !('title' in screenItem)
        ) {
          return null;
        }

        return (
          <motion.div
            key={`${screenItem._id}-${index}`}
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={
              isReady
                ? {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    transition: {
                      duration: 0.9,
                      ease: [0.25, 0.46, 0.45, 0.94],
                      delay:
                        index * (VIEW_TRANSITION_CONFIG.staggerDelay / 1000), // Stagger effect
                    },
                  }
                : undefined
            }
            whileInView={
              !isReady
                ? undefined
                : {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    transition: {
                      duration: 0.9,
                      ease: [0.25, 0.46, 0.45, 0.94],
                    },
                  }
            }
            viewport={{
              once: true,
              amount: 0.4,
            }}
          >
            <ScreenCard screen={screenItem} />
          </motion.div>
        );
      })}
    </React.Fragment>
  );
};

export default ScreensGrid;
