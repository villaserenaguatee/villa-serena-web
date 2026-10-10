import type { ComponentProps } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, test, vi } from 'vitest';
import CuentaHuesped from '@/features/huesped/pages/CuentaHuesped';
import es from '@/i18n/messages/es.json';
import en from '@/i18n/messages/en.json';
import { reservation } from '../fixtures/reservation';

describe.each(['ES', 'EN'] as const)('apertura de reseña %s', lang => {
  const share = lang === 'EN' ? 'Share your experience' : 'Compartir tu experiencia';
  const close = lang === 'EN' ? 'Close review' : 'Cerrar reseña';
  function mount(changes: Partial<ComponentProps<typeof CuentaHuesped>> = {}) {
    localStorage.setItem('villa-serena-lang', lang);
    const props: ComponentProps<typeof CuentaHuesped> = {
      huesped: { id: 'hu-ana', nombre: 'Ana Morales', correo: 'guest@example.com', telefono: '55555555', nacionalidad: 'Guatemala', tipoDocumento: 'DPI', documento: '123', creadoEn: '2026-10-01' },
      reserva: reservation({ id: 'portal-RES-1201', codigo: 'RES-1201', huespedId: 'hu-ana', estado: 'finalizada', checkOutEn: '2026-10-05T12:00:00Z' }),
      habitacion: undefined, estadoHabitacion: 'en-limpieza', cargos: [],
      cuenta: { extras: 0, noches: 3, precioNoche: 420, alojamiento: 1260, descuento: 0, total: 1260, anticipo: 1260, abonado: 0, pagado: 1260, saldo: 0 },
      fiscales: { nombre: '', nit: '', correo: '', direccion: '' }, facturaEmitida: null, puntos: 0, estanciaCerrada: true,
      onGuardarFiscales: vi.fn(), onPagar: vi.fn(), onCheckOut: vi.fn(), ...changes,
    };
    const before = JSON.stringify(props.reserva);
    render(<NextIntlClientProvider locale={lang === 'EN' ? 'en' : 'es'} messages={lang === 'EN' ? en : es} timeZone="America/Guatemala">
      <CuentaHuesped {...props} />
    </NextIntlClientProvider>);
    return { props, before, user: userEvent.setup() };
  }
  test('el botón abre/cierra los dos campos sin persistir ni modificar la reserva', async () => {
    const { props, before, user } = mount();
    const writes = vi.spyOn(Storage.prototype, 'setItem');
    expect(screen.queryByRole('button', { name: close })).not.toBeInTheDocument();
    const button = screen.getByRole('button', { name: share }); expect(button).toBeEnabled();
    await user.click(button);
    expect(screen.getByRole('button', { name: close })).toBeVisible();
    expect(screen.getAllByRole('textbox')).toHaveLength(2);
    expect({ ...localStorage }).toEqual({ 'villa-serena-lang': lang });
    expect(writes).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: close }));
    expect(screen.queryByRole('button', { name: close })).not.toBeInTheDocument();
    expect(writes).not.toHaveBeenCalled(); expect(JSON.stringify(props.reserva)).toBe(before);
    expect(props.onPagar).not.toHaveBeenCalled(); expect(props.onCheckOut).not.toHaveBeenCalled();
  });
  test('apertura solicitada por prop consume la petición y muestra la reseña', () => {
    const consumed = vi.fn(); mount({ abrirResena: true, onResenaAbierta: consumed });
    expect(consumed).toHaveBeenCalledOnce();
    expect(screen.getByRole('button', { name: close })).toBeVisible();
  });
  test('una estancia abierta no ofrece compartir ni abre la reseña por prop', () => {
    const consumed = vi.fn();
    mount({ estanciaCerrada: false, abrirResena: true, onResenaAbierta: consumed });
    expect(screen.queryByRole('button', { name: share })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: close })).not.toBeInTheDocument();
    expect(consumed).not.toHaveBeenCalled();
  });
});
