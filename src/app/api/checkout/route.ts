import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { client } from "@/sanity/lib/client";
import { urlFor } from "@/sanity/lib/image";
import { stripe } from "@/lib/stripe";
import {
  findMemberByEmail,
  isActiveMember,
  isDisabledMember,
  isValidEmail,
  normalizeEmail,
} from "@/lib/members/members";
import { clientIp, rateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";

// Case-insensitive, whitespace-tolerant comparison for the shared access code.
function normalizeCode(code: string): string {
  return code.trim().toLowerCase();
}

type SanityMedia = {
  media?: {
    asset?: { _id?: string; _ref?: string } | null;
    alt?: string | null;
    crop?: unknown;
    hotspot?: unknown;
  } | null;
} | null;

type TicketSummary = {
  _id: string;
  title: string;
  date: string | null;
  price: number;
  currency: string;
  totalSeats: number;
  seatsSold: number | null;
  venue: string | null;
  accessCode: string | null;
  poster: SanityMedia;
  banner: SanityMedia;
};

const dateFormatter = new Intl.DateTimeFormat("sv-SE", {
  dateStyle: "full",
  timeStyle: "short",
  timeZone: "Europe/Stockholm",
});

export async function POST(request: Request) {
  if (!rateLimit(`checkout:${clientIp(request)}`, 20, 60_000)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let body: {
    ticketId?: string;
    email?: string;
    code?: string;
    cancelPath?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const ticketId = body.ticketId;
  if (!ticketId) {
    return NextResponse.json({ error: "missing_ticket_id" }, { status: 400 });
  }

  const rawEmail = typeof body.email === "string" ? body.email : "";
  const rawCode = typeof body.code === "string" ? body.code : "";
  if (!rawEmail || !rawCode) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }
  if (!isValidEmail(rawEmail)) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }

  // Only accept same-origin relative paths to avoid open-redirect abuse.
  const cancelPath =
    typeof body.cancelPath === "string" && body.cancelPath.startsWith("/")
      ? body.cancelPath
      : "/";

  const ticket = await client.fetch<TicketSummary | null>(
    `*[_type == "ticket" && _id == $id][0]{
      _id, title, date, price, currency, totalSeats, seatsSold, venue, accessCode,
      poster{ _type, media{ _type, alt, crop, hotspot, asset->{ ... } } },
      banner{ _type, media{ _type, alt, crop, hotspot, asset->{ ... } } }
    }`,
    { id: ticketId },
  );

  if (!ticket) {
    return NextResponse.json({ error: "ticket_not_found" }, { status: 404 });
  }

  // Gate 1: buyer must be an active member. Uses the no-CDN client so a
  // just-registered member is never missed.
  const member = await findMemberByEmail(rawEmail);
  if (isDisabledMember(member)) {
    // Access revoked by an admin — distinct from "never a member".
    return NextResponse.json({ error: "membership_disabled" }, { status: 403 });
  }
  if (!isActiveMember(member)) {
    return NextResponse.json({ error: "not_member" }, { status: 403 });
  }

  // Gate 2: the shared per-screening access code must match.
  const storedCode = ticket.accessCode?.trim();
  if (!storedCode) {
    // Misconfigured ticket — admin forgot to set a code.
    console.error(`[checkout] ticket ${ticket._id} has no accessCode set`);
    return NextResponse.json({ error: "no_access_code" }, { status: 500 });
  }
  if (normalizeCode(rawCode) !== normalizeCode(storedCode)) {
    return NextResponse.json({ error: "invalid_code" }, { status: 403 });
  }

  const sold = ticket.seatsSold ?? 0;
  if (sold >= ticket.totalSeats) {
    return NextResponse.json({ error: "sold_out" }, { status: 400 });
  }

  const origin = request.headers.get("origin") ?? new URL(request.url).origin;

  // Prefer poster (portrait — looks best on Stripe Checkout), fall back to banner.
  // The asset check is `.asset` truthy (not `._ref`) because the GROQ
  // dereferences with `asset->{ ... }`, so the resolved asset has `_id` instead.
  const checkoutMedia = ticket.poster?.media?.asset
    ? ticket.poster.media
    : ticket.banner?.media?.asset
      ? ticket.banner.media
      : null;
  const checkoutImageUrl = checkoutMedia
    ? urlFor(checkoutMedia).width(800).fit("max").url()
    : undefined;

  const datePart = ticket.date
    ? dateFormatter.format(new Date(ticket.date))
    : null;
  const venuePart = ticket.venue?.trim() || null;
  const showDescription =
    [datePart, venuePart].filter(Boolean).join(" · ") || undefined;

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.create({
      mode: "payment",
      // Add 'swish' back here once activated at
      // https://dashboard.stripe.com/account/payments/settings
      payment_method_types: [
        "card",
      ] as Stripe.Checkout.SessionCreateParams.PaymentMethodType[],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: ticket.currency,
            unit_amount: Math.round(ticket.price * 100),
            product_data: {
              name: ticket.title,
              ...(showDescription ? { description: showDescription } : {}),
              ...(checkoutImageUrl ? { images: [checkoutImageUrl] } : {}),
            },
          },
        },
      ],
      customer_email: normalizeEmail(rawEmail),
      metadata: { ticketId: ticket._id, email: normalizeEmail(rawEmail) },
      // Also stamp ticketId on the PaymentIntent so we can search PIs by
      // metadata later (search only indexes PI/Charge metadata, not Session).
      payment_intent_data: {
        metadata: { ticketId: ticket._id, email: normalizeEmail(rawEmail) },
      },
      success_url: `${origin}/tickets/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}${cancelPath}`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    console.error("[checkout] Stripe error:", message);
    return NextResponse.json(
      { error: "stripe_error", message },
      { status: 500 },
    );
  }

  if (!session.url) {
    return NextResponse.json({ error: "no_session_url" }, { status: 500 });
  }

  return NextResponse.json({ url: session.url });
}
