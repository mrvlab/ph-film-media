"use client";

import { useEffect, useState } from "react";

// Swedish, user-facing messages for the API error envelope.
function membershipErrorMessage(code: unknown, status: number): string {
  switch (code) {
    case "missing_name":
      return "Ange ditt namn.";
    case "invalid_email":
      return "Ange en giltig e-postadress.";
    case "rate_limited":
      return "För många försök. Vänta en stund och försök igen.";
    default:
      return `Något gick fel (${code ?? status}). Försök igen.`;
  }
}

function checkoutErrorMessage(code: unknown, status: number): string {
  switch (code) {
    case "invalid_code":
      return "Fel kod. Kontrollera och försök igen.";
    case "not_member":
      return "Du är inte medlem ännu.";
    case "sold_out":
      return "Slutsåld.";
    case "missing_fields":
    case "invalid_email":
      return "Fyll i alla fält.";
    case "no_access_code":
      return "Den här visningen saknar en kod ännu. Kontakta oss.";
    case "rate_limited":
      return "För många försök. Vänta en stund och försök igen.";
    default:
      return `Något gick fel (${code ?? status}). Försök igen.`;
  }
}

export type JoinOutcome = "is_member" | "redirecting" | "disabled" | null;

/**
 * Drives the two-step members-only ticket gate:
 *  - checkOrJoin: is this email a member? If yes → caller shows the code step;
 *    if no → redirect to the 29 kr membership Stripe Checkout.
 *  - buyTicket: validate member + access code, then redirect to ticket Checkout.
 */
export function useMembershipGate(ticketId: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          cancelPath: cancelPath(),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setLoading(false);
        // Revoked members get a dedicated support view, not an inline error.
        if (json?.error === "membership_disabled") return "disabled";
        setError(membershipErrorMessage(json?.error, res.status));
        return null;
      }
      if (json.isMember) {
        setLoading(false);
        return "is_member";
      }
      if (json.url) {
        // Remember who is joining (and for which ticket) so that when Stripe
        // redirects back to the shop we can reopen this ticket's modal on the
        // thank-you step with the email prefilled. sessionStorage survives the
        // round-trip to Stripe and back within the same tab.
        try {
          sessionStorage.setItem(
            "phmedia:pendingJoin",
            JSON.stringify({ ticketId, email }),
          );
        } catch {
          // Ignore storage failures (private mode, etc.) — the join still works.
        }
        // Stay in loading through the redirect (no reset here).
        window.location.assign(json.url);
        return "redirecting";
      }
      setError("Något gick fel. Försök igen.");
      setLoading(false);
      return null;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
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
        // Revoked members get a dedicated support view, not an inline error.
        if (json?.error !== "membership_disabled") {
          setError(checkoutErrorMessage(json?.error, res.status));
        }
        return json?.error ?? "error";
      }
      if (json.url) {
        window.location.assign(json.url);
        return null;
      }
      setError("Något gick fel. Försök igen.");
      setLoading(false);
      return "no_url";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
      setLoading(false);
      return "network";
    }
  }

  return { loading, error, setError, checkOrJoin, buyTicket };
}
