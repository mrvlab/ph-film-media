import { Link } from 'next-view-transitions';

import SanityImage from '@/components/Media/SanityImage';
import { formatPrice } from '@/lib/products/formatPrice';
import type { IProductListBlock } from '.';

type ProductCardProps = {
  product: NonNullable<IProductListBlock['products']>[number];
};

const ProductCard = ({ product }: ProductCardProps) => {
  if (!product || !('_id' in product)) return null;

  const { title, slug, price, currency, image } = product;
  const href = slug?.current ? `/shop/products/${slug.current}` : null;

  const card = (
    <article className='flex flex-col gap-4'>
      {image && image._type === 'mediaType' && image.media ? (
        <SanityImage
          {...image}
          aspectRatio='square'
          mode='contain'
          className='aspect-4/5 object-cover rounded-lg bg-white'
        />
      ) : (
        <div className='aspect-square w-full rounded-lg bg-white/5' />
      )}
      <div className='flex flex-col gap-0.5'>
        {title ? <h3 className='text-b-16 lg:text-b-14'>{title}</h3> : null}
        {typeof price === 'number' ? (
          <p className='text-b-16 text-white/70 lg:text-b-14'>
            {formatPrice(price, currency)}
          </p>
        ) : null}
      </div>
    </article>
  );

  if (!href) return card;

  return (
    <Link href={href} className='block' aria-label={title || 'Produkt'}>
      {card}
    </Link>
  );
};

export default ProductCard;
