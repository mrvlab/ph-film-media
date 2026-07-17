import "server-only";
import { createHash } from "crypto";

import { writeClient } from "@/sanity/lib/writeClient";

// Normalizes an email for storage and lookup (the member key).
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

// Basic email shape check for API input (mirrors the schema's .email() rule).
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

// Deterministic Sanity document id derived from the normalized email, so webhook
// retries and concurrent checkouts collapse to a single member document.
export function memberDocId(email: string): string {
  const hash = createHash("sha256").update(normalizeEmail(email)).digest("hex");
  return `member.${hash.slice(0, 32)}`;
}

export type MemberLookup = { _id: string; status: string | null } | null;

// Looks up a member by email using the no-CDN write client, so a just-registered
// member (written by the webhook) is never missed due to CDN staleness.
export async function findMemberByEmail(email: string): Promise<MemberLookup> {
  return writeClient.fetch<MemberLookup>(
    // lower(email) so admin-created members with mixed-case emails still match.
    `*[_type == "member" && lower(email) == $email][0]{ _id, status }`,
    { email: normalizeEmail(email) },
  );
}

export function isActiveMember(member: MemberLookup): boolean {
  return !!member && member.status === "active";
}

// An admin has explicitly revoked this member's access.
export function isDisabledMember(member: MemberLookup): boolean {
  return !!member && member.status === "disabled";
}
