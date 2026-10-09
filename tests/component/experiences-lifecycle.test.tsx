import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';
import type { Reserva, ReservaAmenidad } from '@/lib/pms/types';
import ReservasExperiencias, { puedeCrearExperiencia } from '@/features/huesped/pages/ReservasExperiencias';
import { reservation } from '../fixtures/reservation';

const history: ReservaAmenidad[] = [{
  id: 'existing', turnoId: 'old-slot', area: 'Spa', detalle: 'Existing historical booking',
  fecha: '2026-10-02', hora: '12:00', personas: 1, creadaEn: '2026-10-01',
}];
const originalHistory = JSON.stringify(history);
function mount(estado: Reserva['estado'], huespedId = 'hu-ana') {
  const stay = reservation({ id: 'portal-RES-1201', codigo: 'RES-1201', huespedId: 'hu-ana', estado });
  localStorage.setItem('villa-serena-lang', 'ES');
  localStorage.setItem('vs-reservas', JSON.stringify([stay]));
  const onReservar = vi.fn(), onCancelar = vi.fn(), onCargoConfirmado = vi.fn();
  const element = () => <ReservasExperiencias reserva={stay} huespedId={huespedId} turnos={[]}
    reservas={history} onReservar={onReservar} onCancelar={onCancelar} onCargoConfirmado={onCargoConfirmado} />;
  const view = render(element());
  return { ...view, refresh: () => view.rerender(element()), stay, onReservar, onCancelar, onCargoConfirmado, user: userEvent.setup() };
}
function bookingButtons() {
  return screen.getAllByRole('button', { name: /^Reservar(?: traslado)?$/ });
}
function noCallbacks(view: ReturnType<typeof mount>) {
  expect(view.onReservar).not.toHaveBeenCalled(); expect(view.onCancelar).not.toHaveBeenCalled();
  expect(view.onCargoConfirmado).not.toHaveBeenCalled();
  expect(JSON.stringify(history)).toBe(originalHistory);
}

describe.each(['confirmada', 'en-curso', 'finalizada', 'cancelada'] as const)('experiencias con estancia %s', estado => {
  test('todas las opciones respetan el estado y la propiedad incluso al remontar', async () => {
    for (let reload = 0; reload < 2; reload++) {
      const view = mount(estado); const active = estado === 'en-curso';
      expect(puedeCrearExperiencia(view.stay.id, 'hu-ana')).toBe(active);
      expect(puedeCrearExperiencia(view.stay.id, 'another-guest')).toBe(false);
      expect(bookingButtons()).toHaveLength(21);
      for (const button of bookingButtons()) {
        if (active) {
          expect(button).toBeEnabled(); await view.user.click(button);
          expect(screen.getByRole('button', { name: 'Confirmar reserva' })).toBeVisible();
          await view.user.click(screen.getByRole('button', { name: '×' }));
        } else {
          expect(button).toBeDisabled(); await view.user.click(button);
          expect(screen.queryByRole('button', { name: 'Confirmar reserva' })).not.toBeInTheDocument();
        }
      }
      noCallbacks(view); expect(localStorage.getItem('vs-reservas')).toBe(JSON.stringify([view.stay]));
      view.unmount();
    }
  }, 15000);
});

test('otro huésped no puede reservar ni cancelar la experiencia histórica de una estancia activa', async () => {
  const view = mount('en-curso', 'another-guest');
  for (const button of bookingButtons()) expect(button).toBeDisabled();
  const cancel = screen.getByRole('button', { name: 'Cancelar' });
  expect(cancel).toBeDisabled(); await view.user.click(cancel); noCallbacks(view);
});

test('checkout después del render impide abrir opciones y cancelar el historial con botones aún habilitados', async () => {
  const view = mount('en-curso');
  await view.user.click(screen.getByRole('button', { name: /^Mis reservas/ }));
  const cancel = screen.getByRole('button', { name: 'Cancelar' }); expect(cancel).toBeEnabled();
  localStorage.setItem('vs-reservas', JSON.stringify([{ ...view.stay, estado: 'finalizada' }]));
  await view.user.click(cancel);
  for (const button of bookingButtons()) {
    await view.user.click(button);
    expect(screen.queryByRole('button', { name: 'Confirmar reserva' })).not.toBeInTheDocument();
  }
  noCallbacks(view); expect(screen.getByRole('button', { name: /^Mis reservas\s*1$/ })).toBeVisible();
});

test('checkout invalida confirmaciones abiertas de cada opción sin vincularlas a otra estancia activa', async () => {
  const view = mount('en-curso');
  for (const button of bookingButtons()) {
    await view.user.click(button);
    const confirm = screen.getByRole('button', { name: 'Confirmar reserva' });
    const afterCheckout = JSON.stringify([
      { ...view.stay, estado: 'finalizada', checkOutEn: '2026-10-09T12:00:00Z' },
      reservation({ id: 'future-stay', codigo: 'FUTURE', huespedId: view.stay.huespedId, estado: 'en-curso' }),
    ]);
    // Keep the old rendered props/modal: the handler must re-read the canonical store.
    localStorage.setItem('vs-reservas', afterCheckout);
    await view.user.click(confirm);
    expect(screen.queryByRole('button', { name: 'Confirmar reserva' })).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('No se pueden crear nuevas reservas');
    expect(screen.getByRole('button', { name: /^Mis reservas\s*1$/ })).toBeVisible();
    noCallbacks(view); expect(localStorage.getItem('vs-reservas')).toBe(afterCheckout);
    localStorage.setItem('vs-reservas', JSON.stringify([view.stay]));
    view.refresh();
  }
}, 15000);

test('reserva local se muestra en Mis reservas sin alterar el historial ni la reserva canónica', async () => {
  const view = mount('en-curso');
  const article = screen.getByRole('heading', { name: 'Reserva de Mesa' }).closest('article')!;
  await view.user.click(within(article).getByRole('button', { name: 'Reservar' }));
  await view.user.click(screen.getByRole('button', { name: 'Confirmar reserva' }));
  expect(screen.getByRole('button', { name: /^Mis reservas\s*2$/ })).toBeVisible();
  expect(screen.getByText('Por coordinar · Por coordinar · 1 persona(s)')).toBeVisible();
  expect(screen.getByText('Existing historical booking')).toBeVisible();
  expect(screen.getByText('Pendiente', { selector: 'span' })).toBeVisible();
  noCallbacks(view); expect(localStorage.getItem('vs-reservas')).toBe(JSON.stringify([view.stay]));
  // Local bookings have no persistence API; a fresh mount retains only the supplied history.
  view.unmount(); const reload = mount('en-curso');
  await reload.user.click(screen.getByRole('button', { name: /^Mis reservas\s*1$/ }));
  expect(screen.queryByText('Por coordinar · Por coordinar · 1 persona(s)')).not.toBeInTheDocument();
  expect(screen.getByText('Existing historical booking')).toBeVisible();
});
