'use client';
import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { loginLocal, reconstruirSesion } from '@/lib/auth/local-auth';
import { EMPLEADOS_EVENT } from '@/store/employeeStore';
import { HUESPEDES_EVENT } from '@/store/guestStore';
import { sessionUser } from '@/lib/auth/staff-contract';
import { staffLogin, staffRequest } from '@/lib/auth/staff-client';
import type { Employee } from '@/lib/auth/staff-contract';
import type { SessionUser } from '@/lib/auth/types';
interface AuthContextValue {
  user: SessionUser | null;
  loading: boolean;
  login: (email: string, password: string, staffOnly?: boolean) => Promise<SessionUser>;
  logout: () => Promise<void>;
}
export const AuthContext = createContext<AuthContextValue | null>(null);
const KEY = 'villa-serena-session';
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null), [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    const sync = async () => {
      // Conserva el portal demo del huésped. Ninguna sesión local autoriza al personal.
      let guest: SessionUser | null = null;
      try {
        const raw = localStorage.getItem(KEY);
        const local = raw ? reconstruirSesion(JSON.parse(raw)) : null;
        if (local?.role === 'huesped') guest = local;
        else if (raw) localStorage.removeItem(KEY);
      } catch { localStorage.removeItem(KEY); }
      try {
        const employee = await staffRequest<Employee>('yo');
        if (active) setUser(sessionUser(employee));
      } catch { if (active) setUser(guest); }
      finally { if (active) setLoading(false); }
    };
    const storage = (event: StorageEvent) => { if (event.key === null || event.key === KEY || event.key === 'vs-huespedes') void sync(); };
    const focus = () => { void sync(); };
    void sync();
    const timer = window.setInterval(focus, 4 * 60 * 1000);
    window.addEventListener('focus', focus); window.addEventListener('storage', storage);
    window.addEventListener(EMPLEADOS_EVENT, focus); window.addEventListener(HUESPEDES_EVENT, focus);
    return () => {
      active = false; window.clearInterval(timer);
      window.removeEventListener('focus', focus); window.removeEventListener('storage', storage);
      window.removeEventListener(EMPLEADOS_EVENT, focus); window.removeEventListener(HUESPEDES_EVENT, focus);
    };
  }, []);
  const login = useCallback(async (email: string, password: string, staffOnly = false) => {
    let next: SessionUser;
    if (!staffOnly && email.trim().toLowerCase() === 'anamorales@gmail.com' && !window.location.pathname.startsWith('/panel')) {
      next = await loginLocal(email, password); localStorage.setItem(KEY, JSON.stringify(next));
    } else {
      next = sessionUser(await staffLogin({ correo: email, contrasena: password })); localStorage.removeItem(KEY);
    }
    setUser(next); return next;
  }, []);
  const logout = useCallback(async () => {
    if (user?.role !== 'huesped') await staffRequest<void>('logout', {});
    localStorage.removeItem(KEY); setUser(null);
  }, [user]);
  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
