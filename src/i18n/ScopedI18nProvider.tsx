'use client';
import { NextIntlClientProvider } from 'next-intl';
import type { ReactNode } from 'react';
import es from './messages/es.json';
// Keep existing message keys and formatters; no runtime translation or DOM rewriting.
export default function ScopedI18nProvider({children}: {children: ReactNode}) {
  return <NextIntlClientProvider locale="es" messages={es} timeZone="America/Guatemala">{children}</NextIntlClientProvider>;
}
