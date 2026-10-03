'use client';
import { useEffect, useState } from 'react';
import type { Huesped } from '@/lib/pms/types';
import { useAuth } from '@/hooks/useAuth';
import { HUESPEDES_EVENT, leerHuespedes } from '@/store/guestStore';

function resolveGuest(guestId?: string): Huesped | null {
  if (!guestId)
    return null;
  return leerHuespedes().find(guest => guest.id === guestId) ?? null;
}

export function useCurrentGuest(): Huesped | null {
  const { user } = useAuth();
  const [guest, setGuest] = useState<Huesped | null>(() => resolveGuest(user?.role === 'huesped' ? user.guestId : undefined));

  useEffect(() => {
    const sync = () => setGuest(resolveGuest(user?.role === 'huesped' ? user.guestId : undefined));
    sync();
    window.addEventListener(HUESPEDES_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(HUESPEDES_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, [user?.guestId, user?.role]);

  return guest;
}
