'use client';

import { useState } from 'react';

import SanityImage from '@/components/Media/SanityImage';
import type { SanityImageObject } from '@/components/Media/SanityImage/SanityImageObject';

export default function ProductGallery({
  gallery,
}: {
  gallery: SanityImageObject[];
}) {
  const [selected, setSelected] = useState(0);

  if (gallery.length === 0) return null;
  const active = gallery[selected] ?? gallery[0];

  return (
    <div className='flex flex-col gap-3'>
      <SanityImage
        {...active}
        aspectRatio='square'
        mode='contain'
        className='aspect-4/5 object-cover rounded-lg bg-white'
      />

      {gallery.length > 1 ? (
        <div className='grid grid-cols-4 gap-2'>
          {gallery.map((g, i) => (
            <button
              key={i}
              type='button'
              onClick={() => setSelected(i)}
              aria-label={`Show product image ${i + 1}`}
              aria-pressed={i === selected}
              className={`cursor-pointer rounded-lg outline-none transition focus-visible:ring-2 focus-visible:ring-white ${
                i === selected
                  ? 'ring-2 ring-white'
                  : 'opacity-70 hover:opacity-100'
              }`}
            >
              <SanityImage
                {...g}
                aspectRatio='square'
                mode='contain'
                className='aspect-4/5 object-cover rounded-lg bg-white'
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
