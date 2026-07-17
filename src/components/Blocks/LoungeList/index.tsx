import React from 'react';
import { client } from '@/sanity/lib/client';
import { fetchAllLounges } from '@/sanity/lib/queries';
import type { FetchAllLoungesResult } from '../../../../sanity.types';
import LoungeCard from './LoungeCard';

export type ILoungeItem = FetchAllLoungesResult[number];

const LoungeList = async () => {
  const lounges = await client.fetch(fetchAllLounges);

  if (!lounges?.length) return null;

  return (
    <section
      className='page-x-spacing flex flex-col gap-y-10'
      data-sanity-edit-target
    >
      {lounges.map((lounge, index) => (
        <LoungeCard
          key={`${lounge._id}-${index}`}
          lounge={lounge}
          number={lounges.length - index}
        />
      ))}
    </section>
  );
};

export default LoungeList;
