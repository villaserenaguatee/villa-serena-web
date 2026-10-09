import { describe, expect, test } from 'vitest';
import { marcaTarjeta, validarTarjeta, type CardForm } from '@/lib/cardForm';

const today = new Date(2026, 9, 9, 12);
const valid: CardForm = { titular: 'Guest Test', numero: '4242424242424242', cvv: '987', vencimiento: '12/99' };

test.each([
  ['4242424242424242', 'Visa'],
  ['5555555555554444', 'Mastercard'],
  ['378282246310005', 'American Express'],
])('identifica la marca de %s', (number, brand) => {
  expect(marcaTarjeta(number)).toBe(brand);
});

describe.each([false, true])('validación de tarjeta (inglés=%s)', en => {
  test('acepta los datos válidos sin mutarlos', () => {
    const before = { ...valid };
    expect(validarTarjeta(valid, en, today)).toEqual({});
    expect(valid).toEqual(before);
  });
  test.each<[keyof CardForm, string]>([
    ['numero', '4242424242424241'], ['titular', ''], ['cvv', '12'], ['vencimiento', '01/20'],
  ])('rechaza %s inválido', (field, value) => {
    expect(validarTarjeta({ ...valid, [field]: value }, en, today)[field]).toBeTruthy();
  });
  test('American Express requiere CVV de cuatro dígitos', () => {
    const amex = { ...valid, numero: '378282246310005', cvv: '1234' };
    expect(validarTarjeta(amex, en, today)).toEqual({});
    expect(validarTarjeta({ ...amex, cvv: '123' }, en, today).cvv).toBeTruthy();
  });
});
