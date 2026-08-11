import type {
  FetchHomeResult,
  FetchPageResult,
} from '../../../../sanity.types';
import TrackListView from '@/components/Analytics/TrackListView';
import ProductGrid from './ProductGrid';
import { toProductItem } from './analyticsItem';

export type IProductListBlock = Extract<
  NonNullable<
    NonNullable<FetchPageResult | FetchHomeResult>['blockList']
  >[number],
  { _type: 'productList' }
>;

const ProductList = (block: IProductListBlock) => {
  if (block._type !== 'productList') return null;

  const products = block.products ?? [];
  if (products.length === 0) return null;

  const title = block.title?.trim();

  const trackedItems = products
    .map(toProductItem)
    .filter((item) => item !== null);
  const currency = products.find((p) => p && 'currency' in p)?.currency ?? null;

  return (
    <section
      key={block._key || 'productList'}
      className='page-x-spacing flex flex-col gap-6 lg:gap-8'
    >
      <TrackListView
        listId='shop'
        listName={title || 'Produkter'}
        items={trackedItems}
        currency={currency}
      />

      {title ? (
        <h2 className='text-h-67 lg:text-h-37 !leading-[1] uppercase'>
          {title}
        </h2>
      ) : null}

      <ProductGrid products={products} single={products.length === 1} />
    </section>
  );
};

export default ProductList;
