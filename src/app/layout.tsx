import type { Metadata } from 'next';
import './globals.css';
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
      <AppProviders>
        {children}
      </AppProviders>
    </body>
  </html>);
}
