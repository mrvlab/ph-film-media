'use client';

import { useEffect, useState } from 'react';

/**
 * Column counts mirror the Tailwind grid classes on the MovieClubList section:
 *   grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4
 * Ordered widest-first so the first match wins.
 */
const COLUMN_QUERIES: ReadonlyArray<readonly [string, number]> = [
  ['(min-width: 1280px)', 4], // xl
  ['(min-width: 1024px)', 3], // lg
  ['(min-width: 768px)', 2], //  md
];

function currentColumns(): number {
  if (typeof window === 'undefined') return 4; // SSR fallback
  for (const [query, columns] of COLUMN_QUERIES) {
    if (window.matchMedia(query).matches) return columns;
  }
  return 1;
}

/**
 * Live grid column count, matching the CSS grid exactly. The cascade orders its
 * stagger by column, so this must reflect the *actual* columns on screen — an
 * SSR/real mismatch scrambles the reveal order and reads as "no continuity".
 *
 * It only drives the animation's stagger delay (never the DOM), so the initial
 * client value differing from SSR is harmless — no hydration risk.
 */
export function useGridColumns(): number {
  // Lazy-init from matchMedia on the client so the very first client render
  // already has the correct column count (SSR still uses the fallback).
  const [columns, setColumns] = useState(currentColumns);

  useEffect(() => {
    const update = () => setColumns(currentColumns());
    update();
    window.addEventListener('resize', update, { passive: true });
    return () => window.removeEventListener('resize', update);
  }, []);

  return columns;
}
