import type { ComponentProps } from 'react';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import HuespedApp from '@/features/huesped/pages/HuespedApp';
import MiHabitacion from '@/features/huesped/pages/MiHabitacion';
import { AuthContext } from '@/app/providers/AuthProvider';
import { DOMOTICA_INICIAL } from '@/data/pms';
import { fotoHabitacion } from '@/store/roomStore';
import { asignarHabitacionReserva } from '@/store/reservationAssignment';
import { completarCheckInReserva, completarCheckOutReserva, leerReservas } from '@/store/reservationStore';
import { guest, room, seedPortal } from '../fixtures/portal-checkin';
import { reservation } from '../fixtures/reservation';
import es from '@/i18n/messages/es.json';
import en from '@/i18n/messages/en.json';

const completed = reservation({ id: 'ended', codigo: 'ENDED', huespedId: guest.id, habitacionId: room.id,
  estado: 'finalizada', fechaEntrada: '2026-10-02', fechaSalida: '2026-10-09', checkOutEn: '2026-10-09T12:00:00Z' });
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date('2026-10-09T18:00:00Z'));
  window.history.replaceState(null, '', '/huesped'); seedPortal(completed);
});
afterEach(() => { vi.useRealTimers(); window.history.replaceState(null, '', '/'); });

function roomProps(): ComponentProps<typeof MiHabitacion> {
  return {
    reserva: completed, habitacion: room, domotica: DOMOTICA_INICIAL, turnos: [], reservasAmenidad: [],
    estanciaCerrada: true, llaveActiva: true,
    onCompartirExperiencia: vi.fn(), onReservarEstancia: vi.fn(), onVerCuentaFinal: vi.fn(),
    onActualizarDomotica: vi.fn(), onActualizarLuz: vi.fn(), onConectarWifi: vi.fn(), onReservarTurno: vi.fn(),
    onCancelarTurno: vi.fn(), onIrCheckin: vi.fn(),
  };
}
function mountPortal(lang: 'ES' | 'EN' = 'ES') {
  localStorage.setItem('villa-serena-lang', lang);
  const auth = {
    user: { id: `guest-account-${guest.id}`, guestId: guest.id, email: guest.correo, name: guest.nombre, role: 'huesped' as const },
    loading: false, login: vi.fn(), logout: vi.fn(),
  };
  const view = render(<AuthContext.Provider value={auth}>
    <NextIntlClientProvider locale={lang === 'EN' ? 'en' : 'es'} messages={lang === 'EN' ? en : es} timeZone="America/Guatemala">
      <HuespedApp onCambiarModulo={vi.fn()} />
    </NextIntlClientProvider>
  </AuthContext.Provider>);
  return { ...view, user: userEvent.setup() };
}
async function navigate(user: ReturnType<typeof userEvent.setup>, name: RegExp) {
  // Both responsive menus exist in jsdom; use the desktop menu's first button.
  await user.click(screen.getAllByRole('button', { name })[0]);
}

describe.each(['ES', 'EN'] as const)('estancia finalizada %s', lang => {
  const english = lang === 'EN';
  const tr = (spanish: string, translated: string) => english ? translated : spanish;
  test('habitación histórica muestra foto y tres acciones; no expone controles de estancia', async () => {
    localStorage.setItem('villa-serena-lang', lang); const props = roomProps(); const original = JSON.stringify(props.reserva);
    const before = { ...localStorage }; const user = userEvent.setup(); const { container } = render(<MiHabitacion {...props} />);
    expect(screen.getByRole('heading', { name: tr('Gracias por hospedarte en Villa Serena', 'Thank you for staying at Villa Serena') })).toBeVisible();
    expect(screen.getByText('ENDED')).toBeVisible(); expect(screen.getByRole('img')).toHaveAttribute('src', fotoHabitacion(room.numero));
    expect(screen.getAllByRole('button')).toHaveLength(3); expect(container.querySelector('input, select')).toBeNull();
    await user.click(screen.getByRole('button', { name: tr('Compartir tu experiencia', 'Share your experience') }));
    await user.click(screen.getByRole('button', { name: tr('Reservar otra estancia', 'Book another stay') }));
    await user.click(screen.getByRole('button', { name: tr('Ver cuenta final', 'View final account') }));
    expect(props.onCompartirExperiencia).toHaveBeenCalledOnce(); expect(props.onReservarEstancia).toHaveBeenCalledOnce();
    expect(props.onVerCuentaFinal).toHaveBeenCalledOnce();
    for (const callback of [props.onActualizarDomotica, props.onActualizarLuz, props.onConectarWifi, props.onReservarTurno, props.onCancelarTurno, props.onIrCheckin]) expect(callback).not.toHaveBeenCalled();
    expect(JSON.stringify(props.reserva)).toBe(original); expect({ ...localStorage }).toEqual(before);
  });

  test('habitación cerrada sin resumen de reserva tampoco expone botones ni inputs', () => {
    localStorage.setItem('villa-serena-lang', lang); const props = roomProps(); props.reserva = undefined;
    const { container } = render(<MiHabitacion {...props} />);
    expect(container.querySelector('button, input, select')).toBeNull();
    expect(container).toHaveTextContent(`${room.numero} · ${room.tipo}`);
  });

  test('portal restaura habitación por URL y sus acciones solo navegan a reseña, reserva nueva y cuenta final', async () => {
    window.history.replaceState(null, '', '/huesped?seccion=habitacion');
    const view = mountPortal(lang); const before = localStorage.getItem('vs-reservas'); const guestBefore = localStorage.getItem('vs-huespedes');
    const thankYou = tr('Gracias por hospedarte en Villa Serena', 'Thank you for staying at Villa Serena');
    expect(screen.getByRole('heading', { name: thankYou })).toBeVisible();
    await view.user.click(screen.getByRole('button', { name: tr('Compartir tu experiencia', 'Share your experience') }));
    expect(screen.getByRole('button', { name: tr('Cerrar reseña', 'Close review') })).toBeVisible();
    await navigate(view.user, /^(Mi habitación|My room)$/);
    await view.user.click(screen.getByRole('button', { name: tr('Ver cuenta final', 'View final account') }));
    expect(screen.queryByRole('button', { name: tr('Cerrar reseña', 'Close review') })).not.toBeInTheDocument();
    await navigate(view.user, /^(Mi habitación|My room)$/);
    await view.user.click(screen.getByRole('button', { name: tr('Reservar otra estancia', 'Book another stay') }));
    expect(screen.getByRole('button', { name: /^(Buscar|Search)$/ })).toBeVisible();
    expect(localStorage.getItem('vs-reservas')).toBe(before); expect(localStorage.getItem('vs-huespedes')).toBe(guestBefore);
    view.unmount(); mountPortal(lang);
    expect(screen.getByRole('heading', { name: thankYou })).toBeVisible(); expect(leerReservas()).toEqual([completed]);
  });
});

test('portal finalizado inicia en cuenta y elimina operaciones activas de ambos menús', () => {
  const { container } = mountPortal();
  expect(screen.queryByRole('heading', { name: 'Gracias por hospedarte en Villa Serena' })).not.toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Check-out completado' })).toBeVisible();
  for (const name of [/^Check-in/, /^Menú$/, /^Servicios$/]) expect(screen.queryByRole('button', { name })).not.toBeInTheDocument();
  expect(container).toHaveTextContent('ENDED');
});

test('guards del portal siguen la reserva real por eventos: sin habitación, asignada, activa y finalizada', async () => {
  const pending = reservation({ id: 'pending', codigo: 'CURRENT', huespedId: guest.id, fechaEntrada: '2026-10-09', fechaSalida: '2026-10-12' });
  seedPortal(pending, { ...room, estado: 'disponible' }); const view = mountPortal();
  for (const name of [/^Check-in/, /^Menú$/, /^Servicios$/, /^Mi habitación$/]) {
    await navigate(view.user, name); expect(screen.getByText('Recepción debe asignar primero una habitación a esta reserva.')).toBeVisible();
  }
  act(() => { asignarHabitacionReserva(pending.id, room.id); });
  await navigate(view.user, /^Check-in/); expect(screen.getByText('Verifica tus datos')).toBeVisible();
  await navigate(view.user, /^Menú$/);
  expect(screen.getByText('Esta sección está disponible durante una estancia activa, después del check-in.')).toBeVisible();
  await navigate(view.user, /^Servicios$/);
  expect(screen.getByText('Esta sección está disponible durante una estancia activa, después del check-in.')).toBeVisible();
  await navigate(view.user, /^Mi habitación$/);
  expect(screen.queryByText('Recepción debe asignar primero una habitación a esta reserva.')).not.toBeInTheDocument();
  act(() => { completarCheckInReserva(pending.id, 'recepcion'); });
  for (const name of [/^Menú$/, /^Servicios$/, /^Mi habitación$/, /^Check-in/]) {
    await navigate(view.user, name);
    expect(screen.queryByText('Esta sección está disponible durante una estancia activa, después del check-in.')).not.toBeInTheDocument();
    expect(screen.queryByText('Recepción debe asignar primero una habitación a esta reserva.')).not.toBeInTheDocument();
  }
  act(() => { completarCheckOutReserva(pending.id, 'recepcion'); });
  expect(screen.getByRole('heading', { name: 'Check-out completado' })).toBeVisible();
  for (const name of [/^Check-in/, /^Menú$/, /^Servicios$/]) expect(screen.queryByRole('button', { name })).not.toBeInTheDocument();
  expect(leerReservas()[0].estado).toBe('finalizada');
}, 15000);

test.each(['Mi estancia', 'Check-in', 'Menú', 'Servicios'])('checkout mientras está abierta %s sustituye la operación por cuenta final', async section => {
  const active = reservation({ id: 'active', codigo: 'ACTIVE', huespedId: guest.id, habitacionId: room.id, estado: 'en-curso',
    fechaEntrada: '2026-10-09', fechaSalida: '2026-10-12', checkInEn: '2026-10-09T12:00:00Z' });
  seedPortal(active, { ...room, estado: 'ocupada' }); const view = mountPortal();
  await navigate(view.user, new RegExp(`^${section}`));
  act(() => { completarCheckOutReserva(active.id, 'recepcion'); });
  expect(screen.getByRole('heading', { name: 'Check-out completado' })).toBeVisible();
  expect(leerReservas()[0].estado).toBe('finalizada');
});
