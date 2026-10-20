import type { Pago, Reserva, ServicioAdicional } from '@/lib/pms/types';

export const reservation = (changes: Partial<Reserva> = {}): Reserva => ({
  id: 'stay', codigo: 'TEST', huespedId: 'guest', habitacionId: null,
  estado: 'pendiente', tipoHabitacion: 'Standard', fechaEntrada: '2026-10-02', fechaSalida: '2026-10-05',
  personas: 1, acompanantes: [], servicios: [], pagos: [], descuento: 0, creadoEn: '2026-10-01T10:00:00Z',
  ...changes,
});
export const payment = (changes: Partial<Pago>): Pago => ({
  id: 'payment', fecha: '2026-10-02', monto: 50, metodo: 'efectivo', comprobante: '', ...changes,
});
export const service: ServicioAdicional = {
  id: 'service', tipo: 'otro', descripcion: 'Servicio de prueba', cantidad: 1,
  precioUnitario: 200, fecha: '2026-10-02',
};
