'use client';
import type { ReactNode } from 'react';
import { QueryProvider } from './QueryProvider';
import { AuthProvider } from './AuthProvider';
export function AppProviders({ children, localDemo = false }: {
  children: ReactNode;
  localDemo?: boolean;
}) {
  return <QueryProvider>
    <AuthProvider localDemo={localDemo}>
      {children}
    </AuthProvider>
  </QueryProvider>;
}
export default AppProviders;
