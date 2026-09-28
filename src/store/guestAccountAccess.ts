export const GUEST_ACCESS_KEY = 'vs-guest-post-checkout-access';
export const POST_CHECKOUT_ACCESS_MS = 24 * 60 * 60 * 1000;
type GuestAccess = {
  email: string;
  checkOutEn: string;
  expiresAt: string;
};
export function guardarAccesoPostCheckout(email: string,
  checkOutEn: string) {
  if (typeof window === 'undefined')
    return;
  const expiresAt = new Date(new Date(checkOutEn).getTime() + POST_CHECKOUT_ACCESS_MS).toISOString();
  const value: GuestAccess = { email: email.toLowerCase().trim(), checkOutEn, expiresAt };
  localStorage.setItem(GUEST_ACCESS_KEY, JSON.stringify(value));
}
export function leerAccesoPostCheckout(email?: string): GuestAccess | null {
  if (typeof window === 'undefined')
    return null;
  try {
    const raw = localStorage.getItem(GUEST_ACCESS_KEY);
    if (!raw)
      return null;
    const value = JSON.parse(raw) as GuestAccess;
    if (email && value.email !== email.toLowerCase().trim())
      return null;
    return value;
  }
  catch {
    return null;
  }
}
export function cuentaHuespedExpirada(email: string) {
  const access = leerAccesoPostCheckout(email);
  return Boolean(access && Date.now() >= new Date(access.expiresAt).getTime());
}
