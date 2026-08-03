// Price as "250 SEK" — major units + uppercased currency code.
export function formatPrice(price: number, currency?: string | null): string {
  return `${price} ${(currency || 'sek').toUpperCase()}`;
}
