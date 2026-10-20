import { searchReservations } from '@/lib/api/reception';
import type { ReservationPage, ReservationSummary } from '@/lib/bff/contracts/reception';

type Search = (query: URLSearchParams, signal?: AbortSignal) => Promise<ReservationPage>;
export async function findRoomReservations(roomId: number, signal?: AbortSignal, search: Search = searchReservations): Promise<ReservationSummary[]> {
  const matches = new Map<string, ReservationSummary>();
  for (const state of ['EN_ESTADIA', 'CONFIRMADA', 'PENDIENTE_PAGO']) {
    let page = 0, pages = 1;
    do {
      const result = await search(new URLSearchParams({ estado: state, page: String(page), size: '100' }), signal);
      pages = result.totalPaginas;
      for (const reservation of result.contenido) {
        if (reservation.estado === state && reservation.habitacion?.id === roomId) matches.set(reservation.codigo, reservation);
      }
      page++;
    } while (page < pages);
  }
  return [...matches.values()];
}
