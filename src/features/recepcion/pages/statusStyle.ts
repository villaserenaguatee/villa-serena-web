const tones = {
  green: 'bg-[#EDF7EF] border-[#B7DCC2] text-[#21603A]',
  amber: 'bg-[#FFF7E5] border-[#EAD39A] text-[#785510]',
  red: 'bg-[#FDEEEE] border-[#E8BABA] text-[#922E2E]',
  slate: 'bg-[#EFF3F7] border-[#C8D3DF] text-[#435A70]',
};

export function statusTone(state: string): string {
  const key = state.toUpperCase().replace(/-/g, '_');
  if (['CONFIRMADA', 'EN_ESTADIA', 'EN_CURSO', 'LIMPIA', 'DISPONIBLE', 'LIBRE', 'APROBADO', 'ATENDIDA', 'CUENTA_ABIERTA'].includes(key)) return tones.green;
  if (['PENDIENTE', 'PENDIENTE_PAGO', 'EN_LIMPIEZA', 'EN_PROCESO'].includes(key)) return tones.amber;
  if (['CANCELADA', 'SUCIA', 'BLOQUEADA', 'REPORTADA', 'FUERA_DE_SERVICIO'].includes(key)) return tones.red;
  return tones.slate;
}

export function statusBadge(state: string): string {
  return `inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold ${statusTone(state)}`;
}
