import { getCountries, parsePhoneNumberFromString } from 'libphonenumber-js/max';
export const phoneCountries = getCountries().filter(c => !['AC', 'TA', 'XK'].includes(c));
export function validBookingEmail(value: string) {
  if (value.length > 150 || value !== value.trim()) return false;
  const parts = value.split('@');
  if (parts.length !== 2) return false;
  const [local, domain] = parts;
  if (!local || local.length > 64 || local.startsWith('.') || local.endsWith('.') || local.includes('..') ||
      !/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+$/.test(local)) return false;
  const labels = domain.split('.');
  return labels.length >= 2 && labels.every(label => label.length <= 63 && /^[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$/.test(label));
}
export function filterGuestNameInput(value: string) {
  return value.replace(/[^\p{L}\p{M}\p{Zs}\p{Pd}'‘’ʼ]/gu, '');
}
export function validGuestName(value: string) {
  // Include combining accents and common typographic apostrophes/hyphens, not numbers or control characters.
  return /\p{L}/u.test(value) && /^[\p{L}\p{M}\p{Zs}\p{Pd}'‘’ʼ]+$/u.test(value);
}
export function validDocument(type: string, value: string) {
  // New MVP documents are DPI only; historical records are not migrated.
  return type.toUpperCase() === 'DPI' && /^[0-9]{13}$/.test(value.trim());
}
export function validNationalPhone(prefix: string, national: string) {
  if (!/^\+[1-9][0-9]{0,2}$/.test(prefix) || national.length > 24 || !/^[0-9][0-9 ()-]*$/.test(national)) return false;
  const digits = national.replace(/\D/g, '');
  if (prefix === '+502') return digits.length === 8;
  if (digits.length + prefix.length - 1 > 15) return false;
  const phone = parsePhoneNumberFromString(prefix + digits);
  return Boolean(phone?.isValid() && phone.countryCallingCode === prefix.slice(1));
}
export function validPhone(value: string) {
  const text = value.trim(), digits = text.replace(/[^0-9]/g, '');
  return /^\+?[0-9][0-9 ()-]*$/.test(text) && digits.length >= 7 && digits.length <= 15;
}
