import { writeClient } from "@/sanity/lib/writeClient";

// The code a ticket is sold with: its own screening code, or else the code for
// the season of its screening date. Null when an editor hasn't added one yet.
// Reads without the CDN, since it decides whether someone may pay.
export async function ticketAccessCode(
  screeningCode: string | null | undefined,
  season: string | null,
): Promise<string | null> {
  if (screeningCode?.trim()) return screeningCode.trim();
  if (!season) return null;
  const code = await writeClient.fetch<string | null>(
    `*[_type == "seasonAccessCode" && scope != "screening" && season == $season && !(_id in path("drafts.**"))] | order(_updatedAt desc)[0].code`,
    { season },
  );
  return code?.trim() || null;
}
