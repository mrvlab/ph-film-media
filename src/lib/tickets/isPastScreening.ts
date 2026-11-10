// A screening is past once its start time has passed: tickets can no longer be
// bought, and the ticket is locked in the Studio and hidden from the site.
export function isPastScreening(
  doc: Record<string, unknown> | null | undefined,
): boolean {
  return (
    !!doc &&
    typeof doc.date === 'string' &&
    doc.date < new Date().toISOString()
  );
}
