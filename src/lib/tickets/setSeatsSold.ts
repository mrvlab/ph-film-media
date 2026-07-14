import 'server-only';

import { writeClient } from '@/sanity/lib/writeClient';

// Sets seatsSold on both the published document and its draft (if one exists),
// so Studio and the storefront agree. A missing draft is not an error.
export async function setSeatsSold(
  ticketId: string,
  seatsSold: number
): Promise<void> {
  const publishedId = ticketId.replace(/^drafts\./, '');
  const draftId = `drafts.${publishedId}`;

  await writeClient.patch(publishedId).set({ seatsSold }).commit();

  await writeClient
    .patch(draftId)
    .set({ seatsSold })
    .commit()
    .catch(() => {});
}
