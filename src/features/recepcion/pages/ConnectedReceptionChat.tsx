'use client';
import { useEffect, useState } from 'react';
import { getReservation, searchReservations } from '@/lib/api/reception';
import type { Huesped, Reserva, TipoHabitacion } from '@/lib/pms/types';
import EstanciaChat from '@/components/common/EstanciaChat';
import { usePublicLanguage } from '@/components/common/PublicLanguageToggle';

export default function ConnectedReceptionChat() {
  const { en } = usePublicLanguage();
  const [data, setData] = useState<{ huespedes: Huesped[]; reservas: Reserva[]; habitaciones: { id: string; numero: string }[] }>({ huespedes: [], reservas: [], habitaciones: [] });
  const [selected,setSelected]=useState('');
  const selectConversation = (code: string) => {
    setSelected(code);
    const url = new URL(window.location.href);
    url.searchParams.set('reserva', code);
    window.history.replaceState(null, '', url);
  };
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const groups = await Promise.all(['EN_ESTADIA', 'FINALIZADA'].map(async estado => {
          const rows = [];
          for (let page = 0; ; page++) {
            const result = await searchReservations(new URLSearchParams({ estado, page: String(page), size: '100' }), controller.signal);
            rows.push(...result.contenido);
            if (page + 1 >= result.totalPaginas) break;
          }
          return rows;
        }));
        const summaries = groups.flat();
        const details = await Promise.all(summaries.map(r => getReservation(r.codigo, controller.signal)));
        const huespedes: Huesped[] = [], reservas: Reserva[] = [], habitaciones: { id: string; numero: string }[] = [];
        for (const d of details) {
          const checkInEn = d.historial.filter(h => h.estadoNuevo === 'EN_ESTADIA').at(-1)?.fechaHora;
          const checkOutEn = d.historial.find(h => h.estadoNuevo === 'FINALIZADA')?.fechaHora;
          if (!['EN_ESTADIA', 'FINALIZADA'].includes(d.estado) || !d.habitacion || !checkInEn) continue;
          if (d.estado === 'FINALIZADA') {
            const response = await fetch(`/api/estancias/${d.codigo}/chat`, { cache: 'no-store', signal: controller.signal });
            if (!response.ok) throw new Error('No se pudo consultar el historial de mensajes.');
            const history: unknown = await response.json();
            if (!Array.isArray(history)) throw new Error('No se pudo consultar el historial de mensajes.');
            if (!history.length) continue;
          }
          const guestId = `bff-guest-${d.huesped.id}`, roomId = `bff-room-${d.habitacion.id}`;
          if (!huespedes.some(h => h.id === guestId)) huespedes.push({ id: guestId, nombre: d.huesped.nombreCompleto, correo: d.huesped.correo, telefono: d.huesped.telefono, nacionalidad: d.huesped.nacionalidad, documento: d.huesped.numeroDocumento, tipoDocumento: d.huesped.tipoDocumento === 'DPI' ? 'DPI' : 'Pasaporte', creadoEn: d.creadaEn });
          if (!habitaciones.some(h => h.id === roomId)) habitaciones.push({ id: roomId, numero: d.habitacion.numero });
          reservas.push({ id: `bff-reservation-${d.codigo}`, codigo: d.codigo, codigoBff: d.codigo, huespedId: guestId, habitacionId: roomId, tipoHabitacion: d.tipoHabitacion.nombre as TipoHabitacion, fechaEntrada: d.entrada, fechaSalida: d.salida, personas: d.numeroHuespedes, estado: d.estado === 'FINALIZADA' ? 'finalizada' : 'en-curso', checkInEn, checkOutEn, acompanantes: [], servicios: [], pagos: [], descuento: 0, creadoEn: d.creadaEn });
        }
        if (!controller.signal.aborted) {
          setData({ huespedes, reservas, habitaciones }); setError('');
          const requested = new URL(window.location.href).searchParams.get('reserva');
          setSelected(current => reservas.some(r => r.codigo === current) ? current : reservas.some(r => r.codigo === requested) ? requested! : '');
        }
      } catch (e) { if (!controller.signal.aborted) { setData({ huespedes: [], reservas: [], habitaciones: [] }); setError(e instanceof Error ? e.message : 'No se pudieron consultar las estancias.'); } }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }
    void load();
    window.addEventListener('focus', load);
    return () => { controller.abort(); window.removeEventListener('focus', load); };
  }, []);
  return <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
    {loading && <p role="status" className="p-3 text-sm">Consultando estancias…</p>}
    {error && <p role="alert" className="p-3 text-sm text-red-800">{error}</p>}
    <div className="flex min-h-0 flex-1 flex-col sm:flex-row"><aside className="w-full sm:w-64 shrink-0 border-r border-[#E5E0D8] bg-white p-3"><h1 className="text-2xl font-semibold text-[#18345C] mb-3">Mensajes</h1>{data.reservas.map(r=><button key={r.codigo} onClick={()=>selectConversation(r.codigo)} className={`mb-2 block w-full rounded-xl border p-3 text-left ${selected===r.codigo?'bg-[#18345C] text-white':'text-[#18345C]'}`}>{data.huespedes.find(h=>h.id===r.huespedId)?.nombre}<span className="block text-xs">{r.codigo} · Habitación {data.habitaciones.find(h=>h.id===r.habitacionId)?.numero}</span></button>)}</aside>{selected?<EstanciaChat key={selected} code={selected} blockedReason={data.reservas.find(r=>r.codigo===selected)?.estado==='finalizada'?(en?'This stay has ended. You can read the history, but cannot send new messages.':'La estancia terminó. Puedes consultar el historial, pero no enviar nuevos mensajes.'):''} protectedTerms={data.huespedes.filter(h=>h.id===data.reservas.find(r=>r.codigo===selected)?.huespedId).map(h=>h.nombre)} staff/>:<p className="p-5 text-[#71839B]">Selecciona una estancia para conversar.</p>}</div>
  </div>;
}
