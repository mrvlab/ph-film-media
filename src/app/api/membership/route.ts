import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { client } from "@/sanity/lib/client";
import { settingsQuery } from "@/sanity/lib/queries";
import { stripe } from "@/lib/stripe";
import {
  findMemberByEmail,
  isActiveMember,
  isDisabledMember,
  isValidEmail,
  normalizeEmail,
} from "@/lib/members/members";
import {
  DEFAULT_MEMBERSHIP_CURRENCY,
  membershipUnitAmount,
} from "@/lib/members/membershipFee";
import { clientIp, rateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!rateLimit(`membership:${clientIp(request)}`, 10, 60_000)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let body: {
    firstName?: string;
    lastName?: string;
    email?: string;
    cancelPath?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const firstName = (
    typeof body.firstName === "string" ? body.firstName : ""
  ).trim();
  if (!firstName) {
    return NextResponse.json({ error: "missing_name" }, { status: 400 });
  }
  const lastName = (
    typeof body.lastName === "string" ? body.lastName : ""
  ).trim();

  const rawEmail = typeof body.email === "string" ? body.email : "";
  if (!isValidEmail(rawEmail)) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }
  const email = normalizeEmail(rawEmail);

  // Already a member → let the client switch straight to the code modal. No charge.
  const existing = await findMemberByEmail(email);
  if (isActiveMember(existing)) {
    return NextResponse.json({ isMember: true });
  }

  // Access revoked by an admin — don't let them re-pay; surface a support message.
  if (isDisabledMember(existing)) {
    return NextResponse.json({ error: "membership_disabled" }, { status: 403 });
  }

  // Only accept same-origin relative paths to avoid open-redirect abuse.
  const cancelPath =
    typeof body.cancelPath === "string" && body.cancelPath.startsWith("/")
      ? body.cancelPath
      : "/";

  const origin = request.headers.get("origin") ?? new URL(request.url).origin;

  // On success, return to the page the user came from (the shop) with a flag so
  // the client can reopen that ticket's modal on the thank-you step — no more
  // standalone success page. Respect any existing query string on cancelPath.
  // session_id lets the client report the join as a GA4 purchase (and sign_up)
  // once Stripe confirms it; the ticket gate strips both flags after reading.
  const returnPath = `${cancelPath}${cancelPath.includes("?") ? "&" : "?"}membership=joined&session_id={CHECKOUT_SESSION_ID}`;

  // The fee is configured in Settings → Membership (falls back to the default).
  const settings = await client.fetch(settingsQuery);
  const currency = (
    settings?.membership?.currency ?? DEFAULT_MEMBERSHIP_CURRENCY
  ).toLowerCase();
  const unitAmount = membershipUnitAmount(settings?.membership?.fee);

  const membershipMetadata = {
    type: "membership",
    email,
    firstName,
    ...(lastName ? { lastName } : {}),
  };

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: email,
      // Add 'swish' back here once activated at
      // https://dashboard.stripe.com/account/payments/settings
      payment_method_types: [
        "card",
      ] as Stripe.Checkout.SessionCreateParams.PaymentMethodType[],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency,
            unit_amount: unitAmount,
            product_data: {
              name: "Medlemskap Filmklubben",
              description:
                "Engångsavgift för medlemskap i Filmklubben. Ger tillgång till exklusiva visningar.",
            },
          },
        },
      ],
      metadata: membershipMetadata,
      // Also stamp on the PaymentIntent so the payment is searchable/labelled in
      // the Stripe dashboard, and the webhook can route refunds correctly.
      payment_intent_data: {
        metadata: membershipMetadata,
        description: "Medlemskap Filmklubben",
      },
      success_url: `${origin}${returnPath}`,
      cancel_url: `${origin}${cancelPath}`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    console.error("[membership] Stripe error:", message);
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
