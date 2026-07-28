import React from 'react';
import { client } from '@/sanity/lib/client';
import { fetchAllLounges } from '@/sanity/lib/queries';
import type {
  FetchAllLoungesResult,
  FetchHomeResult,
  FetchPageResult,
} from '../../../../sanity.types';
import LoungeGrid from './LoungeGrid';
import InPartnerWith from '@/components/Blocks/InPartnerWith';

export type ILoungeItem = FetchAllLoungesResult[number];

type ILoungeListBlock = Extract<
  NonNullable<
    NonNullable<FetchPageResult | FetchHomeResult>['blockList']
  >[number],
  { _type: 'loungeList' }
>;

const LoungeList = async (block: ILoungeListBlock) => {
  const lounges = await client.fetch(fetchAllLounges);

  if (!lounges?.length) return null;

  return (
    <section className='flex flex-col gap-y-10' data-sanity-edit-target>
      <InPartnerWith items={block.inPartnerWith?.items} />
      <div className='page-x-spacing flex flex-col gap-y-10'>
        <LoungeGrid lounges={lounges} />
      </div>
    </section>
  );
};

export default LoungeList;
