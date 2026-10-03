'use client';
import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { loginLocal, reconstruirSesion } from '@/lib/auth/local-auth';
import { EMPLEADOS_EVENT } from '@/store/employeeStore';
import { HUESPEDES_EVENT } from '@/store/guestStore';
import type { SessionUser } from '@/lib/auth/types';
interface AuthContextValue {
  user: SessionUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<SessionUser>;
  logout: () => void;
}
export const AuthContext = createContext<AuthContextValue | null>(null);
const KEY = 'villa-serena-session';
export function AuthProvider({ children }: {
  children: ReactNode;
}) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const sync = () => {
      try {
        const raw = localStorage.getItem(KEY);
        if (!raw) { setUser(null); return; }
        const next = reconstruirSesion(JSON.parse(raw));
        if (!next) {
          localStorage.removeItem(KEY);
          setUser(null);
          return;
        }
        const canonical = JSON.stringify(next);
        if (canonical !== raw) localStorage.setItem(KEY, canonical);
        setUser(next);
      }
      catch {
        localStorage.removeItem(KEY);
        setUser(null);
      }
      finally { setLoading(false); }
    };
    const storage = (event: StorageEvent) => {
      if (event.key === null || event.key === KEY || event.key === 'vs-empleados' || event.key === 'vs-huespedes')
        sync();
    };
    sync();
    window.addEventListener('storage', storage);
    window.addEventListener(EMPLEADOS_EVENT, sync);
    window.addEventListener(HUESPEDES_EVENT, sync);
    return () => {
      window.removeEventListener('storage', storage);
      window.removeEventListener(EMPLEADOS_EVENT, sync);
      window.removeEventListener(HUESPEDES_EVENT, sync);
    };
  }, []);
  const login = useCallback(async (email: string, password: string) => {
    const next = reconstruirSesion(await loginLocal(email, password));
    if (!next) throw new Error("Invalid local session");
    localStorage.setItem(KEY, JSON.stringify(next));
    setUser(next);
    return next;
  }, []);
  const logout = useCallback(() => {
    localStorage.removeItem(KEY);
    setUser(null);
  }, []);
  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading, login, logout]);
  return <AuthContext.Provider value={value}>
    {children}
  </AuthContext.Provider>;
}
