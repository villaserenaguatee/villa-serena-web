import type { DocumentoCargado, HabitacionHotel, Huesped, Reserva } from '@/lib/pms/types';
import { payment, reservation, service } from './reservation';

export const document: DocumentoCargado = {
  nombre: 'pasaporte.png', formato: 'PNG', pesoKb: 1, lado: 'unico', previewUrl: 'data:image/png;base64,aGVsbG8=',
};
export const guest: Huesped = {
  id: 'hu-ana', nombre: 'Ana', correo: 'anamorales@gmail.com', telefono: '55555555',
  nacionalidad: 'Guatemala', creadoEn: '2026-10-01', tipoDocumento: 'Pasaporte', documento: 'ABC123',
};
export const room: HabitacionHotel = {
  id: 'room', numero: '101', estado: 'reservada', capacidad: 2, piso: 1, tipo: 'Standard', precioNoche: 420,
};
export const stay = reservation({
  id: 'reservation', codigo: 'PORTAL-1', huespedId: guest.id, habitacionId: room.id, estado: 'confirmada',
  fechaEntrada: '2026-10-09', fechaSalida: '2026-10-11', personas: 1,
  pagos: [payment({ monto: 100 })], servicios: [service], acompanantes: [{ nombre: 'Luis', documento: 'ABC456' }],
  actividadPortal: [{ id: 'activity', tipo: 'reservacion', categoria: 'Spa', detalle: 'Historial', fechaHora: '2026-10-01T12:00:00Z', estado: 'Confirmada' }],
  checkInWeb: { estado: 'pendiente', documento: document, documentos: [document], terminosAceptados: true,
    enviadoEn: '2026-10-09T10:00:00Z', peticiones: [], notaPeticiones: '' },
});
export function seedPortal(r: Reserva = stay, h: HabitacionHotel = room, g: Huesped = guest) {
  localStorage.setItem('vs-reservas', JSON.stringify([r]));
  localStorage.setItem('vs-huespedes', JSON.stringify([g]));
  localStorage.setItem('vs-habitaciones', JSON.stringify([h]));
}
