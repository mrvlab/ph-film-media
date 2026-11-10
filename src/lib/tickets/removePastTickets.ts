import 'server-only';

import { writeClient } from '@/sanity/lib/writeClient';

type PageRow = {
  _id: string;
  lists: { _key: string; past: { _key: string; title: string | null }[] }[];
};

// Removes past screenings from every Ticket List block, on published pages and
// drafts alike (a draft left untouched would bring them back on publish).
// The site query already hides them; this keeps the Studio in step and makes
// the page revalidate.
export async function removePastTickets(): Promise<
  { pageId: string; removed: string[] }[]
> {
  const pages = await writeClient.fetch<PageRow[]>(
    `*[_type == "page" && count(blockList[_type == "ticketList"].tickets[@->date < now()]) > 0]{
      _id,
      "lists": blockList[_type == "ticketList"]{
        _key,
        "past": tickets[@->date < now()]{ _key, "title": @->title }
      }
    }`,
    {},
    { perspective: 'raw' },
  );

  if (!pages.length) return [];

  const tx = writeClient.transaction();
  for (const page of pages) {
    const paths = page.lists.flatMap((list) =>
      list.past.map(
        (item) => `blockList[_key=="${list._key}"].tickets[_key=="${item._key}"]`,
      ),
    );
    tx.patch(page._id, (patch) => patch.unset(paths));
  }
  await tx.commit();

  return pages.map((page) => ({
    pageId: page._id,
    removed: page.lists.flatMap((list) =>
      list.past.map((item) => item.title ?? item._key),
    ),
  }));
}
