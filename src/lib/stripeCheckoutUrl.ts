/** Destinos de Checkout: nunca aceptar URLs arbitrarias devueltas por una pasarela. */
export function stripeCheckoutUrl(value: string, mode: string, origin: string, code: string) {
  const url = new URL(value, origin);
  if (url.username || url.password) throw new Error('Destino de pago inválido.');
  if (mode === 'spring' && url.protocol === 'https:' && url.hostname === 'checkout.stripe.com' && !url.port && url.pathname.startsWith('/c/pay/cs_test_')) return url.href;
  if (mode === 'demo' && url.origin === origin && url.pathname === '/reserva/resultado' && url.searchParams.get('codigo') === code) return url.href;
  throw new Error('El destino del pago no corresponde al entorno de pruebas.');
}
