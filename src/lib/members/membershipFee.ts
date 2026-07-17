// Membership-fee helpers shared by the API route (the actual charge) and the
// signup modal (the displayed price), so the two never drift apart.

export const DEFAULT_MEMBERSHIP_FEE = 49;
export const DEFAULT_MEMBERSHIP_CURRENCY = "sek";

// Converts the fee (major units, e.g. 29 kr) to Stripe minor units (öre).
export function membershipUnitAmount(feeMajor?: number | null): number {
  return Math.round((feeMajor ?? DEFAULT_MEMBERSHIP_FEE) * 100);
}

// User-facing price label, e.g. "29 kr" (SEK) or "29 EUR".
export function formatMembershipFee(
  feeMajor?: number | null,
  currency?: string | null,
): string {
  const fee = feeMajor ?? DEFAULT_MEMBERSHIP_FEE;
  const c = (currency ?? DEFAULT_MEMBERSHIP_CURRENCY).toLowerCase();
  return c === "sek" ? `${fee} kr` : `${fee} ${c.toUpperCase()}`;
}
