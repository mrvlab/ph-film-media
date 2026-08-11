import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { sanityFetch } from '@/sanity/lib/live';
import {
  fetchProduct,
  fetchFooter,
  fetchAllProductSlugs,
} from '@/sanity/lib/queries';
import { client } from '@/sanity/lib/client';
import { urlFor } from '@/sanity/lib/image';
import { dataAttr } from '@/sanity/lib/utils';
import Header from '@/components/Header/Header';
import Footer from '@/components/Footer/Footer';
import ProductPurchase, {
  type PurchaseVariant,
} from '@/components/Blocks/ProductList/ProductPurchase';
import ProductGallery from './ProductGallery';
import JsonLd from '@/components/JsonLd';
import TrackItemView from '@/components/Analytics/TrackItemView';
import { formatPrice } from '@/lib/products/formatPrice';
import { getSiteUrl } from '@/utils/siteUrl';
import type {
  FetchProductResult,
  FetchFooterResult,
  FetchAllProductSlugsResult,
} from '../../../../../../sanity.types';

export async function generateStaticParams() {
  const products =
    await client.fetch<FetchAllProductSlugsResult>(fetchAllProductSlugs);
  return (products ?? [])
    .filter((p) => p.slug)
    .map((p) => ({ slug: p.slug as string }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { data: product }: { data: FetchProductResult } = await sanityFetch({
    query: fetchProduct,
    params: { slug },
  });
  if (!product) return {};
  const ogMedia = product.gallery?.find((g) => g?.media?.asset)?.media;
  const ogImage = ogMedia
    ? urlFor(ogMedia).width(1200).fit('max').url()
    : undefined;
  return {
    title: product.title ?? undefined,
    description: product.description ?? undefined,
    ...(ogImage ? { openGraph: { images: [ogImage] } } : {}),
  };
}

// Drop invalid variants and coerce to the client shape.
function toPurchaseVariants(
  variants: NonNullable<FetchProductResult>['variants'],
): PurchaseVariant[] {
  return (variants ?? [])
    .filter((v) => v.size != null && typeof v.stock === 'number')
    .map((v) => ({
      _key: v._key,
      size: v.size as string,
      stock: v.stock as number,
      sold: v.sold ?? 0,
    }));
}

export default async function ProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ size?: string }>;
}) {
  const { slug } = await params;
  const { size: sizeParam } = await searchParams;

  const { data: product }: { data: FetchProductResult } = await sanityFetch({
    query: fetchProduct,
    params: { slug },
  });

  if (!product) notFound();

  const { data: footer }: { data: FetchFooterResult } = await sanityFetch({
    query: fetchFooter,
  });

  const variants = toPurchaseVariants(product.variants);

  // ?size= if it names a real variant, else first in-stock, else first size.
  const inStock = variants.filter((v) => v.sold < v.stock);
  const initialSize =
    (sizeParam && variants.some((v) => v.size === sizeParam) && sizeParam) ||
    inStock[0]?.size ||
    variants[0]?.size ||
    '';

  // First gallery image is the primary (used for SEO/OG); ProductGallery lets
  // the shopper swap the large image by clicking any thumbnail.
  const gallery = (product.gallery ?? []).filter((g) => g?.media?.asset);
  const mainImage = gallery[0] ?? null;

  // Product JSON-LD for SEO.
  const anyInStock = inStock.length > 0;
  const imageUrl = mainImage?.media
    ? urlFor(mainImage.media).width(1200).fit('max').url()
    : undefined;
  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title ?? undefined,
    description: product.description ?? undefined,
    ...(imageUrl ? { image: imageUrl } : {}),
    offers: {
      '@type': 'Offer',
      price: product.price ?? undefined,
      priceCurrency: (product.currency ?? 'sek').toUpperCase(),
      availability: anyInStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      url: `${getSiteUrl()}/shop/products/${product.slug ?? slug}`,
    },
  };

  return (
    <>
      <JsonLd data={productJsonLd} />
      <TrackItemView
        item={{
          item_id: product._id,
          item_name: product.title ?? 'Produkt',
          item_category: 'Produkt',
          price: product.price ?? undefined,
          quantity: 1,
          ...(initialSize ? { item_variant: initialSize } : {}),
        }}
        currency={product.currency}
      />
      <Header />
      <main
        className='grid grid-cols-1 max-lg:pt-[22%] mt-[var(--header-height-mobile)] lg:mt-0 lg:col-span-10 lg:row-span-full lg:overflow-y-scroll lg:py-p-desktop'
        id='product-main-content'
      >
        <section className='page-x-spacing grid gap-8 lg:grid-cols-2 lg:gap-12'>
          <ProductGallery productId={product._id} gallery={gallery} />

          <div className='flex flex-col gap-6 lg:pt-4'>
            {product.title ? (
              <h1 className='text-h-37 uppercase leading-[1]'>
                {product.title}
              </h1>
            ) : null}

            {product.description ? (
              <p className='max-w-[48ch] whitespace-pre-line text-b-16 text-white/70'>
                {product.description}
              </p>
            ) : null}

            {variants.length > 0 ? (
              <ProductPurchase
                productId={product._id}
                productTitle={product.title ?? 'Produkt'}
                price={product.price ?? 0}
                currency={product.currency}
                variants={variants}
                initialSize={initialSize}
              />
            ) : (
              <p
                className='text-b-16 text-white/50'
                data-sanity={dataAttr({
                  id: product._id,
                  type: 'product',
                  path: 'price',
                }).toString()}
              >
                {formatPrice(product.price ?? 0, product.currency)}
              </p>
            )}
          </div>
        </section>

        <Footer footer={footer} />
      </main>
    </>
  );
}
