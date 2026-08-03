import { NextResponse } from 'next/server';
import type Stripe from 'stripe';

import { client } from '@/sanity/lib/client';
import { urlFor } from '@/sanity/lib/image';
import { stripe } from '@/lib/stripe';

export const runtime = 'nodejs';

type SanityMedia = {
  media?: {
    asset?: { _id?: string; _ref?: string } | null;
    alt?: string | null;
    crop?: unknown;
    hotspot?: unknown;
  } | null;
} | null;

type ProductVariant = {
  size: string;
  stock: number;
  sold: number | null;
};

type ProductSummary = {
  _id: string;
  title: string;
  description: string | null;
  price: number;
  currency: string;
  gallery: SanityMedia[] | null;
  variants: ProductVariant[] | null;
};

export async function POST(request: Request) {
  let body: { productId?: string; size?: string; cancelPath?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const productId = body.productId;
  if (!productId) {
    return NextResponse.json({ error: 'missing_product_id' }, { status: 400 });
  }
  const size = typeof body.size === 'string' ? body.size : null;
  if (!size) {
    return NextResponse.json({ error: 'missing_size' }, { status: 400 });
  }

  // Only accept same-origin relative paths to avoid open-redirect abuse.
  const cancelPath =
    typeof body.cancelPath === 'string' && body.cancelPath.startsWith('/')
      ? body.cancelPath
      : '/';

  const product = await client.fetch<ProductSummary | null>(
    `*[_type == "product" && _id == $id][0]{
      _id, title, description, price, currency,
      gallery[]{ _type, media{ _type, alt, crop, hotspot, asset->{ ... } } },
      variants[]{ size, stock, sold }
    }`,
    { id: productId }
  );

  if (!product) {
    return NextResponse.json({ error: 'product_not_found' }, { status: 404 });
  }

  const variant = product.variants?.find((v) => v.size === size);
  if (!variant) {
    return NextResponse.json({ error: 'size_not_found' }, { status: 404 });
  }

  const sold = variant.sold ?? 0;
  if (sold >= variant.stock) {
    return NextResponse.json({ error: 'sold_out' }, { status: 400 });
  }

  const origin = request.headers.get('origin') ?? new URL(request.url).origin;

  // First gallery image = the primary. Check `.asset` (not `._ref`) — the
  // GROQ dereferences it, so the resolved asset has `_id`.
  const checkoutMedia =
    product.gallery?.find((g) => g?.media?.asset)?.media ?? null;
  const checkoutImageUrl = checkoutMedia
    ? urlFor(checkoutMedia).width(800).fit('max').url()
    : undefined;

  // Append the size to the line-item name, except the catch-all "One size".
  const productName =
    size && size !== 'One size' ? `${product.title} — ${size}` : product.title;
  const description = product.description?.trim() || undefined;

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.create({
      mode: 'payment',
      // Add 'swish' back here once activated at
      // https://dashboard.stripe.com/account/payments/settings
      payment_method_types: [
        'card',
      ] as Stripe.Checkout.SessionCreateParams.PaymentMethodType[],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: product.currency,
            unit_amount: Math.round(product.price * 100),
            product_data: {
              name: productName,
              ...(description ? { description } : {}),
              ...(checkoutImageUrl ? { images: [checkoutImageUrl] } : {}),
            },
          },
        },
      ],
      metadata: { productId: product._id, size },
      // Also on the PaymentIntent — search only indexes PI/Charge metadata.
      // description is the label shown in the Stripe dashboard Transactions list.
      payment_intent_data: {
        metadata: { productId: product._id, size },
        description: productName,
      },
      success_url: `${origin}/shop/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}${cancelPath}`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown';
    console.error('[product checkout] Stripe error:', message);
    return NextResponse.json(
      { error: 'stripe_error', message },
      { status: 500 }
    );
  }

  if (!session.url) {
    return NextResponse.json({ error: 'no_session_url' }, { status: 500 });
  }

  return NextResponse.json({ url: session.url });
}
