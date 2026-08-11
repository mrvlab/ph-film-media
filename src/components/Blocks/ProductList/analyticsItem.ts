import type { AnalyticsItem } from '@/lib/analytics/gtag';
import type { IProductListBlock } from '.';

type ProductRef = NonNullable<IProductListBlock['products']>[number];

/** Shared product → GA4 item mapping, so every event describes a product the same way. */
export const toProductItem = (product: ProductRef): AnalyticsItem | null => {
  if (!product || !('_id' in product)) return null;
  return {
    item_id: product._id,
    item_name: product.title ?? 'Produkt',
    item_category: 'Produkt',
    price: typeof product.price === 'number' ? product.price : undefined,
    quantity: 1,
  };
};
