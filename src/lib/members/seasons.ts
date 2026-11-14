// Filmklubben runs in half-year seasons: H1 (Jan–Jun) and H2 (Jul–Dec). A
// membership payment covers one season and lapses when that season ends.
// Shared by the API routes, the webhook and the Studio, so no server-only deps.

export type SeasonId = `${number}-H${1 | 2}`;

const TIME_ZONE = 'Europe/Stockholm';

const yearMonthFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: 'numeric',
});

function parseSeason(season: string): { year: number; half: 1 | 2 } {
  const match = /^(\d{4})-H([12])$/.exec(season);
  if (!match) throw new Error(`Invalid season id: ${season}`);
  return { year: Number(match[1]), half: match[2] === '1' ? 1 : 2 };
}

// The season a moment falls in, judged on the Stockholm calendar.
export function seasonOf(date: Date | string = new Date()): SeasonId {
  const parts = yearMonthFormatter.formatToParts(new Date(date));
  const year = Number(parts.find((p) => p.type === 'year')?.value);
  const month = Number(parts.find((p) => p.type === 'month')?.value);
  return `${year}-H${month <= 6 ? 1 : 2}`;
}

// Last instant of a season in Stockholm, as a UTC ISO string. 30 June is always
// summer time (UTC+2) and 31 December always winter time (UTC+1).
export function seasonEnd(season: string): string {
  const { year, half } = parseSeason(season);
  return half === 1
    ? `${year}-06-30T21:59:59.999Z`
    : `${year}-12-31T22:59:59.999Z`;
}

export function nextSeason(season: string): SeasonId {
  const { year, half } = parseSeason(season);
  return half === 1 ? `${year}-H2` : `${year + 1}-H1`;
}

// Studio label, e.g. "Jul–Dec 2026 (HT)".
export function seasonLabel(season: string): string {
  const { year, half } = parseSeason(season);
  return half === 1 ? `Jan–Jun ${year} (VT)` : `Jul–Dec ${year} (HT)`;
}

// Customer-facing Swedish label, e.g. "HT 2026" (hösttermin) or "VT 2027".
export function seasonLabelSv(season: string): string {
  const { year, half } = parseSeason(season);
  return `${half === 1 ? 'VT' : 'HT'} ${year}`;
}

// Whether a membership paid through `validUntil` covers the given season.
export function coversSeason(
  validUntil: string | null | undefined,
  season: string,
): boolean {
  return !!validUntil && validUntil >= seasonEnd(season);
}

// The later of two validUntil values, so a payment never shortens a membership.
export function laterValidUntil(
  current: string | null | undefined,
  candidate: string,
): string {
  return current && current > candidate ? current : candidate;
}

// Every season from `from` up to and including `to`, oldest first.
export function seasonRange(from: string, to: string): SeasonId[] {
  const seasons: SeasonId[] = [];
  for (let s = from as SeasonId; seasonEnd(s) <= seasonEnd(to); s = nextSeason(s)) {
    seasons.push(s);
  }
  return seasons;
}

// The season a membership payment should cover: the screening's season, or
// the current one if the screening is earlier or unknown. Paying for a later
// season also covers the ones before it (see coversSeason).
export function seasonToCover(screeningDate?: string | null): SeasonId {
  const current = seasonOf();
  if (!screeningDate) return current;
  const screening = seasonOf(screeningDate);
  return seasonEnd(screening) > seasonEnd(current) ? screening : current;
}
