export function validGuatemalaNit(input: string) {
  const value = input.trim().toUpperCase().replace(/-/g, '');
  if (value.length > 12 || !/^\d+[\dK]$/.test(value)) return false;
  const digits = value.slice(0, -1);
  if (!/[1-9]/.test(digits)) return false;
  const sum = [...digits].reverse().reduce((total, digit, i) => total + Number(digit) * (i + 2), 0);
  const check = (11 - sum % 11) % 11;
  return value.at(-1) === (check === 10 ? 'K' : String(check));
}
