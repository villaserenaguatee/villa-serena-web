export interface CardForm { titular: string; numero: string; vencimiento: string; cvv: string }
export function marcaTarjeta(numero: string) {
  const n = numero.replace(/\D/g, "");
  if (/^4/.test(n)) return "Visa";
  if (/^3[47]/.test(n)) return "American Express";
  if (/^(5[1-5]|2[2-7])/.test(n)) return "Mastercard";
  return "";
}
export function validarTarjeta(t: CardForm, en = false, hoy = new Date()) {
  const errors: Partial<Record<keyof CardForm, string>> = {};
  const n = t.numero.replace(/\s/g, ""), brand = marcaTarjeta(n);
  let sum = 0, double = false;
  for (let i = n.length - 1; i >= 0; i--) { let digit = Number(n[i]); if (double) { digit *= 2; if (digit > 9) digit -= 9; } sum += digit; double = !double; }
  if (!brand || !/^\d{13,19}$/.test(n) || sum % 10 !== 0 || (brand === "American Express" ? n.length !== 15 : n.length !== 16)) errors.numero = en ? "Enter a valid supported card number." : "Introduce un número de tarjeta válido.";
  if (t.titular.trim().length < 2) errors.titular = en ? "Enter the cardholder name." : "Introduce el nombre del titular.";
  const m = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(t.vencimiento);
  if (!m || new Date(2000 + Number(m[2]), Number(m[1]), 1) <= hoy) errors.vencimiento = en ? "Use a future MM/YY expiry." : "Usa un vencimiento futuro MM/AA.";
  if (!(brand === "American Express" ? /^\d{4}$/ : /^\d{3}$/).test(t.cvv)) errors.cvv = en ? "Check the security code." : "Revisa el código de seguridad.";
  return errors;
}
