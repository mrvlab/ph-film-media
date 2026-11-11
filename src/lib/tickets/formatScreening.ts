const screeningParts = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/Stockholm',
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

function parts(date: Date): Record<string, string> {
  return Object.fromEntries(
    screeningParts.formatToParts(date).map((p) => [p.type, p.value]),
  );
}

// "Tue 1 Dec, 17:30" in Stockholm time, with the year only when it isn't this
// year's: "Wed 11 Aug 2027, 17:30".
export function formatScreening(date: string): string {
  const p = parts(new Date(date));
  const year = p.year === parts(new Date()).year ? '' : ` ${p.year}`;
  return `${p.weekday} ${p.day} ${p.month}${year}, ${p.hour}:${p.minute}`;
}

// "3 Nov", with the year only when it isn't this year's.
export function formatDay(date: string): string {
  const p = parts(new Date(date));
  const year = p.year === parts(new Date()).year ? '' : ` ${p.year}`;
  return `${p.day} ${p.month}${year}`;
}
