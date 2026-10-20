// Solo JSON público: los tokens de Spring no forman parte del contrato web.
export function withoutSessionTokens(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(withoutSessionTokens);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value)
    .filter(([key]) => !['accessToken', 'refreshToken', 'tipoToken', 'expiraEn'].includes(key))
    .map(([key, child]) => [key, withoutSessionTokens(child)]));
  return value;
}
