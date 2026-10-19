import {render, screen, fireEvent} from '@testing-library/react';
import {expect, test, vi} from 'vitest';
import Huespedes from '@/features/recepcion/pages/Huespedes';
import NuevaReservaModal from '@/features/recepcion/pages/NuevaReservaModal';
import ScopedI18nProvider from '@/i18n/ScopedI18nProvider';

// Isolated UI tests; no API, real guests or reservations are created.
test('Reception registration removes nationality and cancel does not register anything', () => {
  const register = vi.fn();
  render(<ScopedI18nProvider><Huespedes huespedes={[]} reservas={[]} habitaciones={[]} onRegistrar={register} onActualizar={vi.fn()} onAbrirReserva={vi.fn()} /></ScopedI18nProvider>);
  fireEvent.click(screen.getByRole('button',{name:/Registrar huésped/i}));
  expect(screen.queryByLabelText('Nacionalidad')).not.toBeInTheDocument();
  expect(screen.getByLabelText('Nombre')).toBeInTheDocument();
  for (const [name,value] of [['Nombre','María'],['Apellidos','O’Neill'],['Número de documento','0012345678901'],['Correo electrónico','manual@example.test'],['Teléfono','55551234']]) {
    fireEvent.change(screen.getByRole('textbox',{name}),{target:{value}});
  }
  fireEvent.click(screen.getByRole('button',{name:'REVISAR DATOS'}));
  expect(screen.getByRole('heading',{name:'Revisar datos'})).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button',{name:'Cerrar'}));
  expect(register).not.toHaveBeenCalled();
});

test('Reception new reservation guest form has no nationality input or mandatory error', () => {
  render(<ScopedI18nProvider><NuevaReservaModal huespedes={[]} reservas={[]} habitaciones={[]} onCerrar={vi.fn()} onVerReserva={vi.fn()} onCrearHuesped={vi.fn()} onCrearReserva={vi.fn()} /></ScopedI18nProvider>);
  expect(screen.getByRole('dialog',{name:'Nueva reserva'})).toBeInTheDocument();
  expect(screen.queryByLabelText('Nacionalidad')).not.toBeInTheDocument();
  expect(screen.queryByText('Nacionalidad obligatoria.')).not.toBeInTheDocument();
});
