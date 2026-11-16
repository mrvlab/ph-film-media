"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence } from "framer-motion";

import { trackEcommerce, type AnalyticsItem } from "@/lib/analytics/gtag";
import { TicketGateModal, type GateMode } from "./TicketGateModal";

// Lets the buy button and the whole-card trigger open one shared gate modal.
const OpenGateContext = createContext<(() => void) | null>(null);

export function useTicketGate(): () => void {
  return useContext(OpenGateContext) ?? (() => {});
}

type TicketGateProps = {
  /** Omitted in membership mode, where there is no screening behind the gate. */
  ticketId?: string;
  /**
   * "ticket" gates a screening (join → code → checkout); "membership" only sells
   * the membership itself, so it opens straight on the join step and never
   * offers the access-code step.
   */
  mode?: GateMode;
  contactEmail?: string | null;
  membershipFeeLabel?: string;
  /** GA4 item for this screening; null when the ticket ref is unresolved. */
  item?: AnalyticsItem | null;
  currency?: string | null;
  /** The screening's date, which decides the season a new membership covers. */
  ticketDate?: string | null;
  children: ReactNode;
};

const PENDING_JOIN_KEY = "phmedia:pendingJoin";

// Stands in for a ticket id when the gate sells the membership on its own —
// it's also the item_id useMembershipGate already reports for that checkout.
const MEMBERSHIP_GATE_ID = "membership";

/**
 * Wraps a ticket card and hosts a single members-only gate modal. Both the
 * desktop "Köp biljett" button and the mobile whole-card trigger call the
 * context callback to open it, so there's never more than one modal per ticket.
 *
 * Also reopens this ticket's modal on the thank-you step after the member
 * returns from the membership Stripe checkout.
 */
export function TicketGate({
  ticketId,
  mode = "ticket",
  contactEmail,
  membershipFeeLabel,
  item,
  currency,
  ticketDate,
  children,
}: TicketGateProps) {
  const isMembership = mode === "membership";
  const gateId = ticketId ?? MEMBERSHIP_GATE_ID;
  const firstView = isMembership ? "join" : "choice";

  const [open, setOpen] = useState(false);
  const [initialView, setInitialView] = useState<
    "choice" | "join" | "joined" | "code"
  >(firstView);
  const [prefillEmail, setPrefillEmail] = useState("");
  const [prefillCode, setPrefillCode] = useState("");
  const [paid, setPaid] = useState<{
    season: string | null;
    renewed: boolean;
  } | null>(null);

  // After Stripe redirects back with `?membership=joined`, reopen this ticket's
  // modal on the thank-you step with the email prefilled. The email + ticket id
  // were stashed in sessionStorage before the redirect. Deferred to a frame so
  // the state update isn't synchronous inside the effect body.
  useEffect(() => {
    let cancelled = false;
    const frame = requestAnimationFrame(async () => {
      const params = new URLSearchParams(window.location.search);
      if (params.get("membership") !== "joined") return;

      let pending: {
        ticketId?: string;
        email?: string;
        code?: string;
        season?: string | null;
        renewed?: boolean;
      } | null = null;
      try {
        const raw = sessionStorage.getItem(PENDING_JOIN_KEY);
        pending = raw ? JSON.parse(raw) : null;
      } catch {
        pending = null;
      }
      if (!pending || pending.ticketId !== gateId) return;

      // Record the paid season before the code step can reach checkout, which
      // would otherwise turn the buyer away if the webhook hasn't landed yet.
      const sessionId = params.get("session_id");
      if (sessionId) {
        try {
          await fetch("/api/membership/confirm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId }),
          });
        } catch {
          // The webhook still registers the membership.
        }
      }
      if (cancelled) return;

      setPrefillEmail(pending.email ?? "");
      // A renewal goes straight back to the code step to finish the purchase.
      const renewed = pending.renewed === true;
      setPrefillCode(renewed ? (pending.code ?? "") : "");
      setPaid({ season: pending.season ?? null, renewed });
      setInitialView(renewed ? "code" : "joined");
      setOpen(true);

      // One-shot: clear the breadcrumb and strip the flag so a refresh or a
      // non-matching gate won't reopen it again.
      try {
        sessionStorage.removeItem(PENDING_JOIN_KEY);
      } catch {
        // ignore
      }
      params.delete("membership");
      // PurchaseTracker reads session_id during render, so it's safe to drop.
      params.delete("session_id");
      const qs = params.toString();
      window.history.replaceState(
        null,
        "",
        window.location.pathname + (qs ? `?${qs}` : "") + window.location.hash,
      );
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, [gateId]);

  // Manual opens always start fresh on the gate's first step.
  function openFresh() {
    // Clicking the card is both the click-through and the detail view — there
    // is no separate ticket page, the modal is the product detail.
    if (item) {
      trackEcommerce("select_item", {
        items: [{ ...item, item_list_id: "tickets" }],
        currency,
        item_list_id: "tickets",
        item_list_name: "Visningar",
        value: 0,
      });
      trackEcommerce("view_item", { items: [item], currency });
    }
    setInitialView(firstView);
    setPrefillEmail("");
    setPrefillCode("");
    setPaid(null);
    setOpen(true);
  }

  return (
    <OpenGateContext.Provider value={openFresh}>
      {children}
      <AnimatePresence>
        {open ? (
          <TicketGateModal
            key="gate"
            ticketId={gateId}
            mode={mode}
            item={item}
            currency={currency}
            contactEmail={contactEmail}
            membershipFeeLabel={membershipFeeLabel}
            initialView={initialView}
            initialEmail={prefillEmail}
            initialCode={prefillCode}
            paid={paid}
            ticketDate={ticketDate}
            onClose={() => setOpen(false)}
          />
        ) : null}
      </AnimatePresence>
    </OpenGateContext.Provider>
  );
}
