'use client';

import React from 'react';
import { motion } from 'framer-motion';
import ProductCard from './ProductCard';
import { IProductListBlock } from '.';
import {
  useStaggeredGridReveal,
  type ColumnQuery,
} from '@/hooks/useStaggeredGridReveal';
import { trackEcommerce } from '@/lib/analytics/gtag';
import { toProductItem } from './analyticsItem';

type IProductGrid = {
  products: NonNullable<IProductListBlock['products']>;
  single: boolean;
};

const SINGLE_QUERIES: readonly ColumnQuery[] = [['(min-width: 768px)', 2]];
const MANY_QUERIES: readonly ColumnQuery[] = [
  ['(min-width: 1536px)', 4],
  ['(min-width: 1024px)', 3],
  ['(min-width: 0px)', 2],
];

const ProductGrid = ({ products, single }: IProductGrid) => {
  const { animationKey, setRef, getItemProps } = useStaggeredGridReveal(
    single ? SINGLE_QUERIES : MANY_QUERIES,
    products.length,
  );

  return (
    <div
      key={animationKey}
      className={
        single
          ? 'grid grid-cols-1 gap-2 md:grid-cols-2'
          : 'grid grid-cols-2 gap-2 md:grid-cols-2 lg:grid-cols-3 lg:gap-2 2xl:grid-cols-4'
      }
    >
      {products.map((product, index) => {
        if (!product || !('_id' in product)) return null;

        // Click-through from the grid — GA4's step between impression and detail.
        const trackSelect = () => {
          const item = toProductItem(product);
          if (!item) return;
          trackEcommerce('select_item', {
            items: [{ ...item, index, item_list_id: 'shop' }],
            currency: 'currency' in product ? product.currency : null,
            item_list_id: 'shop',
            value: 0,
          });
        };

        return (
          <motion.div
            key={`${product._id}-${index}`}
            ref={setRef}
            data-index={index}
            onClick={trackSelect}
            {...getItemProps(index)}
          >
            <ProductCard product={product} />
          </motion.div>
        );
      })}
    </div>
  );
};

export default ProductGrid;
