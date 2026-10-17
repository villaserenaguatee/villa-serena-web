import type { EstadoReserva } from '@/lib/pms/types';

export const CALENDAR_STATUS: Record<EstadoReserva, { label: string; chip: string }> = {
  confirmada: { label: 'Confirmada', chip: 'bg-[#DBEAFE] text-[#1E40AF] border-[#93B8EB]' },
  'en-curso': { label: 'En curso', chip: 'bg-[#DCF0DF] text-[#166534] border-[#8BC99B]' },
  pendiente: { label: 'Pendiente', chip: 'bg-[#FFF0C2] text-[#78450A] border-[#E6C36B]' },
  cancelada: { label: 'Cancelada', chip: 'bg-[#FADDDD] text-[#991B1B] border-[#E8A5A5]' },
  finalizada: { label: 'Finalizada', chip: 'bg-[#E5E7EB] text-[#374151] border-[#B9BEC7]' },
};
