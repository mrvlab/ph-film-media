import "server-only";
import type Stripe from "stripe";

import { writeClient } from "@/sanity/lib/writeClient";
import { memberDocId, normalizeEmail } from "./members";

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

  const _id = memberDocId(email);
  const now = new Date().toISOString();

  // Create the doc if it's new, then patch to guarantee the membership is set
  // "active" and the payment is recorded — even if the document already existed
  // (e.g. a disabled member paying again). `setIfMissing` keeps joinedAt stable
  // across webhook retries; `set` always (re)activates on a completed payment.
  await writeClient
    .transaction()
    .createIfNotExists({ _id, _type: "member", email })
    .patch(_id, (patch) =>
      patch.setIfMissing({ joinedAt: now, newsletterConsent: true }).set({
        email,
        ...(firstName ? { firstName } : {}),
        ...(lastName ? { lastName } : {}),
        status: "active",
        newsletterConsent: true,
        amount:
          session.amount_total != null ? session.amount_total / 100 : null,
        currency: session.currency ?? null,
        paidAt: now,
        stripeSessionId: session.id,
        stripePaymentIntentId: paymentIntentId,
      }),
    )
    .commit();
}
