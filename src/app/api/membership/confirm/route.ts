import { NextResponse } from "next/server";

import { stripe } from "@/lib/stripe";
import { registerMemberFromSession } from "@/lib/members/registerMember";
import { clientIp, rateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";

// POST /api/membership/confirm  { sessionId }
// Called when the buyer returns from the membership checkout. The webhook can
// arrive after the buyer is already back in the shop, so this registers the
// paid season straight from Stripe and they can buy a ticket right away.
// registerMemberFromSession is idempotent, so the webhook running too is fine.
export async function POST(request: Request) {
  if (!rateLimit(`membership-confirm:${clientIp(request)}`, 10, 60_000)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let body: { sessionId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const sessionId = typeof body.sessionId === "string" ? body.sessionId : "";
  if (!sessionId.startsWith("cs_")) {
    return NextResponse.json({ error: "invalid_session_id" }, { status: 400 });
  }

  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch {
    return NextResponse.json({ error: "session_not_found" }, { status: 404 });
  }

  if (session.metadata?.type !== "membership") {
    return NextResponse.json({ error: "not_membership" }, { status: 400 });
  }
  if (session.payment_status !== "paid") {
    return NextResponse.json({ error: "not_paid" }, { status: 409 });
  }

  try {
    await registerMemberFromSession(session);
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    console.error(`[membership confirm] Failed for ${session.id}: ${message}`);
    return NextResponse.json({ error: "register_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
