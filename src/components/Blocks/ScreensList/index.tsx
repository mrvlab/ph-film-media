'use client';

import React from 'react';
import { FetchHomeResult, FetchPageResult } from '../../../../sanity.types';
import ScreensGrid from './ScreensGrid';

export type IScreensListBlocks = Extract<
  NonNullable<
    NonNullable<FetchPageResult | FetchHomeResult>['blockList']
  >[number],
  { _type: 'screensList' }
>;

const ScreensList = (block: IScreensListBlocks) => {
  if (block._type !== 'screensList') return null;

  const { screens } = block;
  if (!screens || screens.length === 0) return null;

  return (
    <section
      key={block._key || 'screensList'}
      className='grid gap-x-2 gap-y-5 grid-cols-1 md:grid-cols-2 lg:gap-y-10 lg:grid-cols-3 2xl:grid-cols-4 auto-rows-fr'
    >
      <ScreensGrid screens={screens} />
    </section>
  );
};

export default ScreensList;
