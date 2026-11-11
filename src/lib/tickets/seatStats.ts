// One change of a ticket's seat total, recorded when the ticket is published.
export type SeatChange = {
  from: number;
  to: number;
  // Seats sold when the change was made.
  soldAtChange: number;
  changedAt: string;
};

export type SeatData = {
  totalSeats?: number | null;
  seatsSold?: number | null;
  soldOutAt?: string | null;
  seatChanges?: SeatChange[] | null;
};

export type SeatStats = {
  total: number;
  sold: number;
  initialSeats: number;
  // The seat total when the ticket first sold out.
  soldOutSeats: number | null;
  soldOut: boolean;
  nearlyFull: boolean;
  // The first seat total sold out and an editor raised it to meet demand.
  highDemand: boolean;
  // The raises made after a sell-out, oldest first.
  demandRaises: SeatChange[];
};

export const NEARLY_FULL_SHARE = 0.8;

export function seatStats(data: SeatData): SeatStats {
  const total = data.totalSeats ?? 0;
  const sold = data.seatsSold ?? 0;
  const changes = data.seatChanges ?? [];
  const demandRaises = changes.filter(
    (c) => c.to > c.from && c.soldAtChange >= c.from,
  );
  const initialSeats = changes[0]?.from ?? total;
  const soldOutAt = data.soldOutAt;
  const soldOutSeats = soldOutAt
    ? (changes.filter((c) => c.changedAt <= soldOutAt).at(-1)?.to ?? initialSeats)
    : null;
  return {
    total,
    sold,
    initialSeats,
    soldOutSeats,
    soldOut: total > 0 && sold >= total,
    nearlyFull: total > 0 && sold >= total * NEARLY_FULL_SHARE,
    highDemand: demandRaises.length > 0,
    demandRaises,
  };
}
