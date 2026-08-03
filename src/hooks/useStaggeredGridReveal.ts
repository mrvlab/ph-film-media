'use client';

import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { useViewTransitionAnimation } from '@/hooks/useViewTransitionReady';

export type RevealTarget = Record<string, number>;

const DEFAULT_HIDDEN: RevealTarget = { opacity: 0, y: 5, scale: 0.95 };
const DEFAULT_REVEAL: RevealTarget = { opacity: 1, y: 0, scale: 1 };
const EASE = [0.25, 0.46, 0.45, 0.94] as const; // easeOutCubic
const DURATION = 0.4;

const ROW_GAP = 0.22;
const COL_OFFSET = 0.03;
const ROWS_PER_SCREEN = 3;
const SCROLL_MARGIN = '0px 0px -15% 0px';

export type ColumnQuery = readonly [query: string, columns: number];

function columnsFor(queries: readonly ColumnQuery[]): number {
  if (typeof window === 'undefined') return queries[0]?.[1] ?? 1;
  for (const [query, cols] of queries) {
    if (window.matchMedia(query).matches) return cols;
  }
  return 1;
}

export type StaggeredRevealOptions = {
  hidden?: RevealTarget;
  reveal?: RevealTarget;
};

export function useStaggeredGridReveal(
  queries: readonly ColumnQuery[],
  itemCount: number,
  options?: StaggeredRevealOptions,
) {
  const pathname = usePathname();
  const { isReady, animationKey } = useViewTransitionAnimation(pathname);
  const prefersReducedMotion = useReducedMotion();

  const hidden = options?.hidden ?? DEFAULT_HIDDEN;
  const reveal = options?.reveal ?? DEFAULT_REVEAL;

  const [columns, setColumns] = useState(() => columnsFor(queries));
  const els = useRef<Map<number, HTMLDivElement>>(new Map());
  const [initialSet, setInitialSet] = useState<Set<number> | null>(null);

  const setRef = useCallback((el: HTMLDivElement | null) => {
    if (!el) return;
    const idx = Number(el.dataset.index);
    els.current.set(idx, el);
    return () => {
      els.current.delete(idx);
    };
  }, []);

  useLayoutEffect(() => {
    const update = () => setColumns(columnsFor(queries));
    update();
    window.addEventListener('resize', update, { passive: true });
    return () => window.removeEventListener('resize', update);
  }, [queries]);

  useLayoutEffect(() => {
    const vh = window.innerHeight;
    const initial = new Set<number>();
    els.current.forEach((el, idx) => {
      if (el.getBoundingClientRect().top < vh) initial.add(idx);
    });
    // eslint-disable-next-line react-hooks/set-state-in-effect -- classification requires the laid-out DOM, which only exists after mount
    setInitialSet(initial);
  }, [pathname, columns, itemCount]);

  const itemsPerScreen = columns * ROWS_PER_SCREEN;
  const animating = isReady && !prefersReducedMotion && initialSet !== null;

  const getItemProps = useCallback(
    (index: number) => {
      const col = index % columns;
      const rowInScreen = Math.floor((index % itemsPerScreen) / columns);
      const cascadeDelay = rowInScreen * ROW_GAP + col * COL_OFFSET;
      const isInitial = initialSet?.has(index) ?? false;

      return {
        initial: prefersReducedMotion ? false : hidden,
        animate:
          animating && isInitial
            ? {
                ...reveal,
                transition: { duration: DURATION, ease: EASE, delay: cascadeDelay },
              }
            : undefined,
        whileInView:
          animating && !isInitial
            ? {
                ...reveal,
                transition: {
                  duration: DURATION,
                  ease: EASE,
                  delay: col * COL_OFFSET,
                },
              }
            : undefined,
        viewport: { once: true, margin: SCROLL_MARGIN } as const,
      };
    },
    [
      columns,
      itemsPerScreen,
      initialSet,
      prefersReducedMotion,
      animating,
      hidden,
      reveal,
    ],
  );

  return { animationKey, isReady, setRef, getItemProps };
}
