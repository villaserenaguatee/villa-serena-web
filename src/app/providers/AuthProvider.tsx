'use client';
import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { loginLocal } from '@/lib/auth/local-auth';
import { leerEmpleados, EMPLEADOS_EVENT } from '@/store/employeeStore';
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
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const session = JSON.parse(raw) as SessionUser;
        if (session.role !== 'huesped') {
          const empleado = leerEmpleados().find(e => e.id === session.id || e.correo.toLowerCase() === session.email.toLowerCase());
          if (!empleado || !empleado.activo) {
            localStorage.removeItem(KEY);
            setUser(null);
          }
          else
            setUser(session);
        }
        else
          setUser(session);
      }
    }
    finally {
      setLoading(false);
    }
  },
    []);
  useEffect(() => {
    const syncEmpleado = () => {
      const current = user;
      if (!current || current.role === 'huesped')
        return;
      const empleado = leerEmpleados().find(e => e.id === current.id || e.correo.toLowerCase() === current.email.toLowerCase());
      if (!empleado || !empleado.activo) {
        localStorage.removeItem(KEY);
        setUser(null);
        return;
      }
      if (current.name !== empleado.nombre || current.email !== empleado.correo) {
        const next = { ...current, id: empleado.id, name: empleado.nombre, email: empleado.correo };
        localStorage.setItem(KEY, JSON.stringify(next));
        setUser(next);
      }
    };
    window.addEventListener(EMPLEADOS_EVENT, syncEmpleado);
    window.addEventListener('storage', syncEmpleado);
    return () => {
      window.removeEventListener(EMPLEADOS_EVENT, syncEmpleado);
      window.removeEventListener('storage', syncEmpleado);
    };
  },
    [user]);
  const login = useCallback(async (email: string, password: string) => {
    const next = await loginLocal(email, password);
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
