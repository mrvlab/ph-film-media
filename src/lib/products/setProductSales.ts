import 'server-only';

import { writeClient } from '@/sanity/lib/writeClient';

type VariantRow = { _key: string; size: string | null };

// Writes per-size sold counts onto a product's variants (published + draft, so
// Studio and storefront agree). Every variant is written, so a size dropping
// out of `sales` resets to 0 — reflecting refunds. Missing draft is fine.
export async function setProductSales(
  productId: string,
  sales: Record<string, number>
): Promise<void> {
  const publishedId = productId.replace(/^drafts\./, '');
  const draftId = `drafts.${publishedId}`;

  const variants =
    (await writeClient.fetch<VariantRow[] | null>(
      `*[_id == $id][0].variants[]{ _key, size }`,
      { id: publishedId }
    )) ?? [];

  if (variants.length === 0) return;

  const applyTo = async (id: string) => {
    let patch = writeClient.patch(id);
    for (const v of variants) {
      const sold = v.size ? (sales[v.size] ?? 0) : 0;
      patch = patch.set({ [`variants[_key=="${v._key}"].sold`]: sold });
    }
    await patch.commit();
  };

  await applyTo(publishedId);
  await applyTo(draftId).catch(() => {});
}
