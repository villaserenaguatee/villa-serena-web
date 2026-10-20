import 'server-only';
import type { ContractEntry } from './publicContractStore';
// Caso fijo de prueba, sin cobro ni cambios a reservas creadas normalmente.
export const confirmedBookingFixture: ContractEntry = {
  attempt: '', fingerprint: '', roomType: 'Standard',
  created: { codigo: 'VS-DEMO05', estado: 'CONFIRMADA', tipoHabitacion: { id: 1, nombre: 'Standard' }, entrada: '2027-04-20', salida: '2027-04-22', noches: 2, numeroHuespedes: 2, total: 840, pagoVenceEn: '2027-04-20T12:00:00Z' },
  guest: { nombreCompleto: 'Ana Morales', correo: 'ana.morales@correo.com', telefono: '55555555', nacionalidad: 'Guatemala', tipoDocumento: 'DPI', numeroDocumento: '1234567890101' },
};
