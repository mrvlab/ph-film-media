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
import { TicketGateModal } from "./TicketGateModal";

// Lets the buy button and the whole-card trigger open one shared gate modal.
const OpenGateContext = createContext<(() => void) | null>(null);

export function useTicketGate(): () => void {
  return useContext(OpenGateContext) ?? (() => {});
}

type TicketGateProps = {
  ticketId: string;
  contactEmail?: string | null;
  membershipFeeLabel?: string;
  /** GA4 item for this screening; null when the ticket ref is unresolved. */
  item?: AnalyticsItem | null;
  currency?: string | null;
  children: ReactNode;
};

const PENDING_JOIN_KEY = "phmedia:pendingJoin";

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
  contactEmail,
  membershipFeeLabel,
  item,
  currency,
  children,
}: TicketGateProps) {
  const [open, setOpen] = useState(false);
  const [initialView, setInitialView] = useState<"choice" | "joined">("choice");
  const [prefillEmail, setPrefillEmail] = useState("");

  // After Stripe redirects back with `?membership=joined`, reopen this ticket's
  // modal on the thank-you step with the email prefilled. The email + ticket id
  // were stashed in sessionStorage before the redirect. Deferred to a frame so
  // the state update isn't synchronous inside the effect body.
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const params = new URLSearchParams(window.location.search);
      if (params.get("membership") !== "joined") return;

      let pending: { ticketId?: string; email?: string } | null = null;
      try {
        const raw = sessionStorage.getItem(PENDING_JOIN_KEY);
        pending = raw ? JSON.parse(raw) : null;
      } catch {
        pending = null;
      }
      if (!pending || pending.ticketId !== ticketId) return;

      setPrefillEmail(pending.email ?? "");
      setInitialView("joined");
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
    return () => cancelAnimationFrame(frame);
  }, [ticketId]);

  // Manual opens (clicking a ticket) always start fresh on the choice step.
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
    setInitialView("choice");
    setPrefillEmail("");
    setOpen(true);
  }

  return (
    <OpenGateContext.Provider value={openFresh}>
      {children}
      <AnimatePresence>
        {open ? (
          <TicketGateModal
            key="gate"
            ticketId={ticketId}
            item={item}
            currency={currency}
            contactEmail={contactEmail}
            membershipFeeLabel={membershipFeeLabel}
            initialView={initialView}
            initialEmail={prefillEmail}
            onClose={() => setOpen(false)}
          />
        ) : null}
      </AnimatePresence>
    </OpenGateContext.Provider>
  );
}
