"use client";

import { useEffect, useState } from "react";

import {
  trackEcommerce,
  trackException,
  type AnalyticsItem,
} from "@/lib/analytics/gtag";

// Swedish, user-facing messages for the API error envelope, shared by the
// join and ticket steps. Each says what happened and what to do next.
function errorMessage(code: unknown, status: number): string {
  switch (code) {
    case "missing_name":
      return "Ange ditt förnamn.";
    case "invalid_email":
      return "Ange en giltig e-postadress.";
    case "missing_fields":
      return "Fyll i e-post och kod.";
    case "invalid_code":
      return "Koden stämmer inte. Du hittar den i vårt senaste nyhetsbrev.";
    case "not_member":
      return "Vi hittar inget medlemskap för den e-postadressen. Kontrollera stavningen eller bli medlem nedan.";
    case "sold_out":
      return "Visningen är slutsåld.";
    case "screening_passed":
      return "Den här visningen har redan varit.";
    case "no_access_code":
      return "Något gick fel hos oss och biljetten kan inte köpas just nu. Försök igen senare.";
    case "rate_limited":
      return "För många försök. Vänta en minut och försök igen.";
    default:
      return `Något gick fel (${code ?? status}). Försök igen.`;
  }
}

export type JoinOutcome =
  | "is_member"
  | "redirecting"
  | "disabled"
  | "expired"
  | null;

/**
 * Drives the two-step members-only ticket gate:
 *  - checkOrJoin: is this email a member paid for the screening's season? If
 *    yes → caller shows the code step; if no → redirect to the membership
 *    Stripe Checkout (also used to renew an expired membership).
 *  - buyTicket: validate member + access code, then redirect to ticket Checkout.
 */
export function useMembershipGate(
  ticketId: string,
  item?: AnalyticsItem | null,
  currency?: string | null,
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // For an expired member: the season a renewal buys, and the season of the
  // screening (they differ when a renewal late in a season buys the next one).
  const [renewal, setRenewal] = useState<{
    season: string;
    screeningSeason: string | null;
  } | null>(null);

  // Reset loading if the page is restored from bfcache (back from Stripe).
  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) setLoading(false);
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  const cancelPath = () => window.location.pathname + window.location.search;

  async function checkOrJoin(
    firstName: string,
    lastName: string,
    email: string,
    // Set when renewing: the code is remembered so the buyer comes back to a
    // filled-in code step.
    renewCode?: string,
  ): Promise<JoinOutcome> {
    if (loading) return null;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/membership", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          // Decides which season the membership has to cover.
          ticketId,
          cancelPath: cancelPath(),
          renew: renewCode !== undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setLoading(false);
        trackException(`membership:${json?.error ?? res.status}`, {
          item_id: ticketId,
        });
        // Revoked members get a dedicated support view, not an inline error.
        if (json?.error === "membership_disabled") return "disabled";
        setError(errorMessage(json?.error, res.status));
        return null;
      }
      if (json.isMember) {
        setLoading(false);
        return "is_member";
      }
      if (json.expired) {
        setLoading(false);
        setRenewal({
          season: json.season,
          screeningSeason: json.screeningSeason ?? null,
        });
        return "expired";
      }
      if (json.url) {
        // Remember who is joining (and for which ticket) so that when Stripe
        // redirects back to the shop we can reopen this ticket's modal on the
        // thank-you step with the email prefilled. sessionStorage survives the
        // round-trip to Stripe and back within the same tab.
        try {
          sessionStorage.setItem(
            "phmedia:pendingJoin",
            JSON.stringify({
              ticketId,
              email,
              season: json.season ?? null,
              renewed: renewCode !== undefined,
              code: renewCode ?? "",
            }),
          );
        } catch {
          // Ignore storage failures (private mode, etc.) — the join still works.
        }
        // Fired before the redirect so gtag's beacon leaves with the unload.
        // The fee lives in Sanity Settings, so the sale value is filled in by
        // the `purchase` event on the way back from Stripe.
        trackEcommerce("begin_checkout", {
          items: [
            {
              item_id: "membership",
              item_name: "Medlemskap Filmklubben",
              item_category: "Medlemskap",
              quantity: 1,
            },
          ],
          currency,
          checkout_type: "membership",
        });
        // Stay in loading through the redirect (no reset here).
        window.location.assign(json.url);
        return "redirecting";
      }
      setError("Något gick fel. Försök igen.");
      setLoading(false);
      return null;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
      trackException("membership:network", { item_id: ticketId });
      setLoading(false);
      return null;
    }
  }

  // Returns the API error code on failure (so the caller can react, e.g. bounce
  // back to the email step on 'not_member'), or null when redirecting to Stripe.
  async function buyTicket(
    email: string,
    code: string,
  ): Promise<string | null> {
    if (loading) return null;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ticketId,
          email,
          code,
          cancelPath: cancelPath(),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setLoading(false);
        trackException(`ticket_checkout:${json?.error ?? res.status}`, {
          item_id: ticketId,
          item_name: item?.item_name,
        });
        if (json?.error === "membership_expired") {
          setRenewal({
            season: json.season,
            screeningSeason: json.screeningSeason ?? null,
          });
        }
        // Revoked and expired members get their own view, not an inline error.
        if (
          json?.error !== "membership_disabled" &&
          json?.error !== "membership_expired"
        ) {
          setError(errorMessage(json?.error, res.status));
        }
        return json?.error ?? "error";
      }
      if (json.url) {
        // Fired before the redirect so gtag's beacon leaves with the unload.
        if (item) {
          trackEcommerce("begin_checkout", {
            items: [item],
            currency,
            checkout_type: "ticket",
          });
        }
        window.location.assign(json.url);
        return null;
      }
      setError("Något gick fel. Försök igen.");
      setLoading(false);
      return "no_url";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
      trackException("ticket_checkout:network", { item_id: ticketId });
      setLoading(false);
      return "network";
    }
  }

  // Renews an expired membership: the server takes the name from the member's
  // record, so only the email is needed.
  function renew(email: string, code: string): Promise<JoinOutcome> {
    return checkOrJoin("", "", email, code);
  }

  return {
    loading,
    error,
    setError,
    renewal,
    checkOrJoin,
    buyTicket,
    renew,
  };
}
