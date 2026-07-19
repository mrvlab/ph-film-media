'use client';

import { useState } from 'react';

import { formatPrice } from '@/lib/products/formatPrice';
import { useBuyProduct } from './useBuyProduct';

export type PurchaseVariant = {
  _key: string;
  size: string;
  stock: number;
  sold: number;
};

type ProductPurchaseProps = {
  productId: string;
  price: number;
  currency: string | null;
  variants: PurchaseVariant[];
  initialSize: string;
};

const isSoldOut = (v: PurchaseVariant) => (v.sold ?? 0) >= v.stock;

export default function ProductPurchase({
  productId,
  price,
  currency,
  variants,
  initialSize,
}: ProductPurchaseProps) {
  const [size, setSize] = useState(initialSize);
  const { startCheckout, loading, error } = useBuyProduct();

  const selected = variants.find((v) => v.size === size) ?? variants[0] ?? null;
  const soldOut = selected ? isSoldOut(selected) : true;

  // Hide the selector for a lone "One size"; otherwise let the buyer pick.
  const showSizes =
    variants.length > 1 ||
    (variants.length === 1 && variants[0].size !== 'One size');

  function selectSize(next: string) {
    setSize(next);
    // Reflect the choice in the URL so it's shareable/bookmarkable (?size=M).
    const url = new URL(window.location.href);
    url.searchParams.set('size', next);
    window.history.replaceState(null, '', url);
  }

  return (
    <div className='flex flex-col gap-6'>
      <p className='text-b-21'>{formatPrice(price, currency)}</p>

      {showSizes ? (
        <div className='flex flex-col gap-2'>
          <span className='text-b-9 uppercase tracking-[0.12em] text-white/50'>
            Storlek
          </span>
          <div className='flex flex-wrap gap-2'>
            {variants.map((v) => {
              const vSoldOut = isSoldOut(v);
              const isSelected = v.size === size;
              return (
                <button
                  key={v._key}
                  type='button'
                  onClick={() => selectSize(v.size)}
                  disabled={vSoldOut}
                  aria-pressed={isSelected}
                  className={`min-w-[3.5rem] border px-4 py-2 text-b-14 uppercase transition-colors ${
                    isSelected
                      ? 'border-white bg-white text-black'
                      : 'border-white/30 text-white hover:border-white'
                  } ${vSoldOut ? 'cursor-not-allowed line-through opacity-40' : ''}`}
                >
                  {v.size}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <button
        type='button'
        onClick={() => selected && startCheckout(productId, selected.size)}
        disabled={loading || soldOut || !selected}
        className='primary-button w-full disabled:cursor-not-allowed disabled:opacity-50'
        aria-label='Köp produkt'
      >
        {soldOut ? 'Slutsåld' : loading ? 'Laddar…' : 'Köp'}
      </button>

      {error ? <p className='text-b-14 text-red-400'>{error}</p> : null}
    </div>
  );
}
