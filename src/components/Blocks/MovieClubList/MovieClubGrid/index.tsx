'use client';

import React from 'react';
import { motion } from 'framer-motion';
import MovieClubCard from '../MovieClubCard';
import { IMovieClubListBlocks } from '..';
import {
  useStaggeredGridReveal,
  type ColumnQuery,
} from '@/hooks/useStaggeredGridReveal';

type IMovieClubGrid = {
  movies: IMovieClubListBlocks['movies'];
};

const COLUMN_QUERIES: readonly ColumnQuery[] = [
  ['(min-width: 1280px)', 4],
  ['(min-width: 1024px)', 3],
  ['(min-width: 768px)', 2],
];

const MovieClubGrid = ({ movies }: IMovieClubGrid) => {
  const { animationKey, setRef, getItemProps } = useStaggeredGridReveal(
    COLUMN_QUERIES,
    movies?.length ?? 0,
  );

  return (
    <React.Fragment key={animationKey}>
      {movies?.map((movieItem, index) => {
        if (!movieItem || !('_id' in movieItem) || !('title' in movieItem)) {
          return null;
        }

        return (
          <motion.div
            key={`${movieItem._id}-${index}`}
            ref={setRef}
            data-index={index}
            {...getItemProps(index)}
          >
            <MovieClubCard movie={movieItem} />
          </motion.div>
        );
      })}
    </React.Fragment>
  );
};

export default MovieClubGrid;
