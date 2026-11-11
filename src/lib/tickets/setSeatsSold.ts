import 'server-only';

import { writeClient } from '@/sanity/lib/writeClient';
import { isPastScreening } from '@/lib/tickets/isPastScreening';

// Sets seatsSold on both the published document and its draft (if one exists),
// so Studio and the storefront agree. A missing draft is not an error.
//
// The first time sales reach the seat total, soldOutAt is stamped too. It's
// kept when seats are added later, so the sell-out stays on record. Past
// screenings are skipped, so a recount never dates an old sell-out to today.
export async function setSeatsSold(
  ticketId: string,
  seatsSold: number
): Promise<void> {
  const publishedId = ticketId.replace(/^drafts\./, '');
  const draftId = `drafts.${publishedId}`;

  const ticket = await writeClient.fetch<{
    date: string | null;
    totalSeats: number | null;
    soldOutAt: string | null;
  } | null>(`*[_id == $id][0]{ date, totalSeats, soldOutAt }`, {
    id: publishedId,
  });
  const soldOut =
    !!ticket?.totalSeats &&
    seatsSold >= ticket.totalSeats &&
    !ticket.soldOutAt &&
    !isPastScreening(ticket);
  const fields = soldOut
    ? { seatsSold, soldOutAt: new Date().toISOString() }
    : { seatsSold };

  await writeClient.patch(publishedId).set(fields).commit();

  await writeClient
    .patch(draftId)
    .set(fields)
    .commit()
    .catch(() => {});
}
