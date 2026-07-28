'use client';

import React from 'react';
import LoungeCard from './LoungeCard';
import { ILoungeItem } from '.';
import { useStaggeredGridReveal } from '@/hooks/useStaggeredGridReveal';

type ILoungeGrid = {
  lounges: ILoungeItem[];
};

const COLUMN_QUERIES = [] as const;

// Full-width cards: a gentler scale keeps the pop small.
const REVEAL_MOTION = {
  hidden: { opacity: 0, y: 5, scale: 0.98 },
  reveal: { opacity: 1, y: 0, scale: 1 },
};

const LoungeGrid = ({ lounges }: ILoungeGrid) => {
  const { animationKey, setRef, getItemProps } = useStaggeredGridReveal(
    COLUMN_QUERIES,
    lounges.length,
    REVEAL_MOTION,
  );

  return (
    <React.Fragment key={animationKey}>
      {lounges.map((lounge, index) => {
        if (!lounge || !('_id' in lounge)) return null;

        return (
          <LoungeCard
            key={`${lounge._id}-${index}`}
            lounge={lounge}
            number={lounges.length - index}
            index={index}
            revealRef={setRef}
            revealProps={getItemProps(index)}
          />
        );
      })}
    </React.Fragment>
  );
};

export default LoungeGrid;
