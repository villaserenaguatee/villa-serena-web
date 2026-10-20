import type { Metadata } from 'next';
import './globals.css';
import '@/styles/compactForms.css';
import '@/styles/hotelWorkspace.css';
import { AppProviders } from './providers/AppProviders';
export const metadata: Metadata = {
  title: 'Villa Serena - Hotel Management System',
  description: 'Sistema integral de gestión hotelera Villa Serena',
};
export default function RootLayout({ children, }: Readonly<{
  children: React.ReactNode;
}>) {
  return (<html lang="es">
    <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
      <AppProviders localDemo={process.env.NODE_ENV === 'development' && process.env.STAFF_AUTH_MODE === 'demo' && process.env.GUEST_AUTH_MODE === 'demo' && process.env.VILLA_SERENA_BFF_MODE === 'demo' && !process.env.API_URL}>
        {children}
      </AppProviders>
    </body>
  </html>);
}
