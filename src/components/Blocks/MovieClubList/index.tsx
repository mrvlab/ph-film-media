'use client';

import React from 'react';
import { FetchHomeResult, FetchPageResult } from '../../../../sanity.types';
import MovieClubGrid from './MovieClubGrid';

export type IMovieClubListBlocks = Extract<
  NonNullable<
    NonNullable<FetchPageResult | FetchHomeResult>['blockList']
  >[number],
  { _type: 'movieClubList' }
>;

const MovieClubList = (block: IMovieClubListBlocks) => {
  if (block._type !== 'movieClubList') return null;

  const { movies } = block;
  if (movies?.length === 0) return null;

  return (
    <section
      key={block._key || 'movieClubList'}
      className='page-x-spacing grid gap-10 grid-cols-1 md:grid-cols-2 md:gap-2 lg:gap-2 lg:grid-cols-3 xl:grid-cols-4'
    >
      <MovieClubGrid movies={movies} />
    </section>
  );
};

export default MovieClubList;
