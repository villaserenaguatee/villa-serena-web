/** Read an existing historical field without adding it to the published API DTO. */
export function historicalPassportIssuer(value: unknown): string | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const issuer = (value as Record<string, unknown>).paisEmisorPasaporte;
  return typeof issuer === 'string' ? issuer : undefined;
}
