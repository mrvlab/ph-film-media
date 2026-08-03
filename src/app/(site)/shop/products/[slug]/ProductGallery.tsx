'use client';

import { useState } from 'react';

import SanityImage from '@/components/Media/SanityImage';
import type { SanityImageObject } from '@/components/Media/SanityImage/SanityImageObject';
import { dataAttr } from '@/sanity/lib/utils';

type GalleryItem = SanityImageObject & { _key?: string };

export default function ProductGallery({
  productId,
  gallery,
}: {
  productId: string;
  gallery: GalleryItem[];
}) {
  const [selected, setSelected] = useState(0);

  if (gallery.length === 0) return null;
  const active = gallery[selected] ?? gallery[0];

  // Route each image to its own gallery array item on the product document, so
  // Presentation highlights the media and opens the exact item in the studio.
  const mediaAttr = (item: GalleryItem) =>
    item._key
      ? dataAttr({
          id: productId,
          type: 'product',
          path: `gallery[_key=="${item._key}"]`,
        }).toString()
      : undefined;

  return (
    <div className='flex flex-col gap-3'>
      <div data-sanity={mediaAttr(active)}>
        <SanityImage
          {...active}
          aspectRatio='square'
          mode='contain'
          className='aspect-4/5 object-cover rounded-lg bg-white'
        />
      </div>

      {gallery.length > 1 ? (
        <div className='grid grid-cols-4 gap-2'>
          {gallery.map((g, i) => (
            <button
              key={g._key ?? i}
              type='button'
              onClick={() => setSelected(i)}
              aria-label={`Show product image ${i + 1}`}
              aria-pressed={i === selected}
              data-sanity={mediaAttr(g)}
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
