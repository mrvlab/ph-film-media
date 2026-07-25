'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import MovieClubCard from '../MovieClubCard';
import { IMovieClubListBlocks } from '..';
import { useViewTransitionAnimation } from '@/hooks/useViewTransitionReady';
import { useGridColumns } from './useGridColumns';

type IMovieClubGrid = {
  movies: IMovieClubListBlocks['movies'];
};

// A snappy scale-in reveal, echoing the menu. Tune here.
const HIDDEN = { opacity: 0, y: 5, scale: 0.95 };
const REVEAL = { opacity: 1, y: 0, scale: 1 } as const;
const EASE = [0.25, 0.46, 0.45, 0.94] as const;
const DURATION = 0.8;

// Column-by-column sweep: the dominant stagger is per column, so column 1
// reveals, then column 2, then column 3. A much smaller per-row offset makes
// the top item in each column lead, so it reads top-to-bottom within a column.
const COL_STAGGER = 0.09; // seconds between columns (the visible sweep)
const ROW_STAGGER = 0.04; // seconds between rows inside a column (subtle)
// How many rows count as "one screenful" — the row offset resets here so long
// lists don't accumulate an ever-growing delay down the page.
const ROWS_PER_SCREEN = 3;

const MovieClubGrid = ({ movies }: IMovieClubGrid) => {
  const pathname = usePathname();
  const { isReady, animationKey } = useViewTransitionAnimation(pathname);
  const columns = useGridColumns();
  const prefersReducedMotion = useReducedMotion();

  const itemsPerScreen = columns * ROWS_PER_SCREEN;

  return (
    <React.Fragment key={animationKey}>
      {movies?.map((movieItem, index) => {
        if (!movieItem || !('_id' in movieItem) || !('title' in movieItem)) {
          return null;
        }

        // CSS grid fills row-major, so column = index % columns.
        const col = index % columns;
        // Row within the current screenful, so the vertical offset resets each
        // screenful instead of growing without bound.
        const rowInScreen = Math.floor((index % itemsPerScreen) / columns);
        const delay = col * COL_STAGGER + rowInScreen * ROW_STAGGER;

        return (
          <motion.div
            key={`${movieItem._id}-${index}`}
            initial={prefersReducedMotion ? false : HIDDEN}
            // In-view driven so screenfuls below the fold reveal as they scroll
            // in. Gated on `isReady` so the IntersectionObserver isn't set up
            // mid next-view-transitions navigation.
            whileInView={
              isReady && !prefersReducedMotion
                ? {
                    ...REVEAL,
                    transition: { duration: DURATION, ease: EASE, delay },
                  }
                : undefined
            }
            viewport={{ once: true, amount: 0.15 }}
          >
            <MovieClubCard movie={movieItem} />
          </motion.div>
        );
      })}
    </React.Fragment>
  );
};

export default MovieClubGrid;
