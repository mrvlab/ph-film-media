'use client';

import React from 'react';
import { motion } from 'framer-motion';

import { useStaggeredGridReveal } from '@/hooks/useStaggeredGridReveal';

// Single column → 1 column at every breakpoint, so cards cascade straight down.
const COLUMN_QUERIES = [] as const;

// Match LoungeList: full-width cards use a gentler scale to keep the pop small.
const REVEAL_MOTION = {
  hidden: { opacity: 0, y: 5, scale: 0.98 },
  reveal: { opacity: 1, y: 0, scale: 1 },
};

/**
 * Wraps the desktop-only vertical ticket column so each big card reveals with
 * the same staggered scroll-in used by LoungeList. Ticket cards are rendered on
 * the server and passed in as children; each one is wrapped in a reveal motion
 * element here.
 */
export function TicketColumn({ children }: { children: React.ReactNode }) {
  const items = React.Children.toArray(children);
  const { animationKey, setRef, getItemProps } = useStaggeredGridReveal(
    COLUMN_QUERIES,
    items.length,
    REVEAL_MOTION,
  );

  return (
    <React.Fragment key={animationKey}>
      {items.map((child, index) => (
        <motion.div
          key={index}
          ref={setRef}
          data-index={index}
          {...getItemProps(index)}
        >
          {child}
        </motion.div>
      ))}
    </React.Fragment>
  );
}
