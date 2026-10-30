/** The seeded example number must never be a public contact destination. */
export function publicWhatsAppNumber(value?: string | null): string {
  const digits = (value || '').replace(/\D/g, '');
  return ['919876543210', '9876543210'].includes(digits) ? '' : digits;
}
