'use client';
import type { Employee, LoginInput, PasswordInput } from './staff-contract';
export async function staffRequest<T>(path: string, input?: unknown): Promise<T> {
  const response = await fetch(`/api/auth/${path}`, { method: input ? 'POST' : 'GET', credentials: 'same-origin', cache: 'no-store',
    ...(input ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) } : {}) });
  const value = response.status === 204 ? null : await response.json();
  if (!response.ok) throw new Error(value?.mensaje ?? 'No se pudo completar la sesión.');
  return value;
}
export const staffLogin = (input: LoginInput) => staffRequest<Employee>('login', input);
export const staffPassword = (input: PasswordInput) => staffRequest<Employee>('cambiar-contrasena', input);
