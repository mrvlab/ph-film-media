import type Stripe from "stripe";

import { stripe } from "@/lib/stripe";
import { computeSeatsSold } from "@/lib/tickets/computeSeatsSold";
import { setSeatsSold } from "@/lib/tickets/setSeatsSold";
import { computeProductSales } from "@/lib/products/computeProductSales";
import { setProductSales } from "@/lib/products/setProductSales";
import { registerMemberFromSession } from "@/lib/members/registerMember";

export const runtime = "nodejs";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Stripe search is eventually consistent; wait before recomputing so the
// just-created PaymentIntent is indexed.
const SEARCH_INDEX_LAG_MS = 3000;

type Target =
  | { kind: "ticket"; id: string }
  | { kind: "product"; id: string }
  | { kind: "membership"; session: Stripe.Checkout.Session };

export async function POST(request: Request) {
  if (!webhookSecret) {
    return new Response("Missing STRIPE_WEBHOOK_SECRET", { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    return new Response(`Webhook signature verification failed: ${message}`, {
      status: 400,
    });
  }

  const target = await resolveTarget(event);
  if (!target) {
    // Unrelated event — ack it so Stripe stops retrying.
    return new Response(null, { status: 200 });
  }

  try {
    // Membership registration needs no Stripe search (no seats/stock involved),
    // so it skips the index-lag wait and the recompute paths entirely.
    if (target.kind === "membership") {
      await registerMemberFromSession(target.session);
      logResult(
        event,
        `member ${target.session.metadata?.email ?? target.session.id}`,
        "registered",
      );
      return new Response(null, { status: 200 });
    }

    const publishedId = target.id.replace(/^drafts\./, "");

    if (event.type === "checkout.session.completed") {
      await sleep(SEARCH_INDEX_LAG_MS);
    }

    if (target.kind === "ticket") {
      const seatsSold = await computeSeatsSold(publishedId);
      await setSeatsSold(publishedId, seatsSold);
      logResult(event, `ticket ${publishedId}`, `seatsSold=${seatsSold}`);
    } else {
      const sales = await computeProductSales(publishedId);
      await setProductSales(publishedId, sales);
      logResult(event, `product ${publishedId}`, JSON.stringify(sales));
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    const subject =
      target.kind === "membership" ? target.session.id : target.id;
    console.error(
      `[WEBHOOK] Failed to process ${target.kind} ${subject}: ${message}`,
    );
    return new Response("recompute_failed", { status: 500 });
  }

  return new Response(null, { status: 200 });
}

// Stripe sends its own receipt emails, so we only recompute stock and log.
function logResult(event: Stripe.Event, subject: string, detail: string) {
  console.log(
    `[WEBHOOK] Recomputed ${detail} for ${subject} after ${event.type}`,
  );
}

async function resolveTarget(event: Stripe.Event): Promise<Target | null> {
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    // Check membership first so a membership session never falls through to the
    // seat/stock recompute paths.
    if (session.metadata?.type === "membership") {
      return { kind: "membership", session };
    }
    if (session.metadata?.ticketId) {
      return { kind: "ticket", id: session.metadata.ticketId };
    }
    if (session.metadata?.productId) {
      return { kind: "product", id: session.metadata.productId };
    }
    return null;
  }

  if (event.type === "charge.refunded") {
    const charge = event.data.object as Stripe.Charge;
    // Membership refunds don't touch seats/stock; ack without recompute.
    if (charge.metadata?.type === "membership") {
      return null;
    }
    // Prefer metadata on the charge itself (which inherits from the PI).
    if (charge.metadata?.ticketId) {
      return { kind: "ticket", id: charge.metadata.ticketId };
    }
    if (charge.metadata?.productId) {
      return { kind: "product", id: charge.metadata.productId };
    }

    // Legacy fallback for pre-metadata charges: find the session via the PI.
    const paymentIntent =
      typeof charge.payment_intent === "string"
        ? charge.payment_intent
        : charge.payment_intent?.id;
    if (!paymentIntent) return null;
    const sessions = await stripe.checkout.sessions.list({
      payment_intent: paymentIntent,
      limit: 1,
    });
    const meta = sessions.data[0]?.metadata;
    if (meta?.ticketId) return { kind: "ticket", id: meta.ticketId };
    if (meta?.productId) return { kind: "product", id: meta.productId };
    return null;
  }

  return null;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
