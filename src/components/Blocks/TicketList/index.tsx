'use client';

import React from 'react';
import { FetchHomeResult, FetchPageResult } from '../../../../sanity.types';
import TicketGrid from './TicketGrid';

export type ITicketListBlocks = Extract<
  NonNullable<
    NonNullable<FetchPageResult | FetchHomeResult>['blockList']
  >[number],
  { _type: 'ticketList' }
>;

const TicketList = (block: ITicketListBlocks) => {
  if (block._type !== 'ticketList') return null;

  const { screens } = block;
  if (!screens || screens.length === 0) return null;

  return (
    <section
      key={block._key || 'ticketList'}
      className='grid gap-x-2 gap-y-5 grid-cols-1 md:grid-cols-2 lg:gap-y-10 lg:grid-cols-3 2xl:grid-cols-4 auto-rows-fr'
    >
      <TicketGrid screens={screens} />
    </section>
  );
};

export default TicketList;
