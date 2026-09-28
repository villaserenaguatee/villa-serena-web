'use client';
import { useContext } from 'react';
import { AuthContext } from '@/app/providers/AuthProvider';
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value)
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  return value;
}
