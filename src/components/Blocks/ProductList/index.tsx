import type {
  FetchHomeResult,
  FetchPageResult,
} from '../../../../sanity.types';
import ProductCard from './ProductCard';

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

  return (
    <section
      key={block._key || 'productList'}
      className='page-x-spacing flex flex-col gap-6 lg:gap-8'
    >
      {title ? (
        <h2 className='text-h-67 lg:text-h-37 !leading-[1] uppercase'>
          {title}
        </h2>
      ) : null}

      {/* One product: 1 col mobile / 2 col tablet+desktop. Many: dense grid. */}
      <div
        className={
          products.length === 1
            ? 'grid grid-cols-1 gap-2 md:grid-cols-2'
            : 'grid grid-cols-2 gap-2 md:grid-cols-2 lg:grid-cols-3 lg:gap-2 2xl:grid-cols-4'
        }
      >
        {products.map((product, i) => (
          <ProductCard
            key={('_id' in product && product._id) || i}
            product={product}
          />
        ))}
      </div>
    </section>
  );
};

export default ProductList;
