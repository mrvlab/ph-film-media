import "server-only";
import type Stripe from "stripe";

import { writeClient } from "@/sanity/lib/writeClient";
import { findMemberByEmail, memberDocId, normalizeEmail } from "./members";
import { laterValidUntil, seasonEnd, seasonOf } from "./seasons";

// Registers a Filmklubben member from a completed membership Checkout Session.
//
// Idempotent: the document id is derived deterministically from the normalized
// email, so webhook retries and concurrent checkouts collapse to a single member
// document (createIfNotExists never overwrites an existing member).
export async function registerMemberFromSession(
  session: Stripe.Checkout.Session,
): Promise<void> {
  const email = normalizeEmail(
    session.metadata?.email ||
      session.customer_email ||
      session.customer_details?.email ||
      "",
  );
  if (!email) {
    console.error("[membership webhook] session has no email; skipping");
    return;
  }

  const firstName = (session.metadata?.firstName || "").trim();
  const lastName = (session.metadata?.lastName || "").trim();

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : (session.payment_intent?.id ?? null);

  // Members added in the Studio have other ids, so renew the existing document
  // rather than creating a second one for the same email.
  const _id = (await findMemberByEmail(email))?._id ?? memberDocId(email);
  const now = new Date().toISOString();
  // The checkout stamps the season it charged for; older sessions predate that
  // and paid for the season they were bought in.
  const season = session.metadata?.season || seasonOf(now);

  const existing = await writeClient.fetch<{
    validUntil: string | null;
    hasSeason: boolean;
  } | null>(
    `*[_id == $id][0]{ validUntil, "hasSeason": $season in membershipHistory[].season }`,
    { id: _id, season },
  );

  const amount =
    session.amount_total != null ? session.amount_total / 100 : null;
  const currency = session.currency ?? null;

  // Create the doc if it's new, then patch to guarantee the membership is set
  // "active" and the payment is recorded — even if the document already existed
  // (e.g. a disabled member paying again). `setIfMissing` keeps joinedAt stable
  // across webhook retries; `set` always (re)activates on a completed payment.
  // The history entry is skipped on retries so each season appears once.
  await writeClient
    .transaction()
    .createIfNotExists({ _id, _type: "member", email })
    .patch(_id, (patch) => {
      const base = patch
        .setIfMissing({
          joinedAt: now,
          newsletterConsent: true,
          membershipHistory: [],
        })
        .set({
          email,
          ...(firstName ? { firstName } : {}),
          ...(lastName ? { lastName } : {}),
          status: "active",
          newsletterConsent: true,
          amount,
          currency,
          paidAt: now,
          validUntil: laterValidUntil(existing?.validUntil, seasonEnd(season)),
          stripeSessionId: session.id,
          stripePaymentIntentId: paymentIntentId,
        });
      return existing?.hasSeason
        ? base
        : base.prepend("membershipHistory", [
            {
              _key: season,
              _type: "membershipPeriod",
              season,
              amount,
              currency,
              paidAt: now,
              source: "stripe",
              stripeSessionId: session.id,
              stripePaymentIntentId: paymentIntentId,
            },
          ]);
    })
    .commit();
}
