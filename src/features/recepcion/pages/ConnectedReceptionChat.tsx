'use client';
import ApprovedReceptionChatFrame from './ApprovedReceptionChatFrame';
import { useCallback, useEffect, useState } from 'react';
import { getReservation, searchReservations } from '@/lib/api/reception';
import type { Huesped, Reserva, TipoHabitacion } from '@/lib/pms/types';
import EstanciaChat from '@/components/common/EstanciaChat';
import { usePublicLanguage } from '@/components/common/PublicLanguageToggle';

export default function ConnectedReceptionChat() {
  const { en } = usePublicLanguage();
  const [data, setData] = useState<{ huespedes: Huesped[]; reservas: Reserva[]; habitaciones: { id: string; numero: string }[] }>({ huespedes: [], reservas: [], habitaciones: [] });
  type Preference={codigo:string;favorita:boolean;archivada:boolean;eliminada:boolean;ultimoId:number;noLeidos:number};
  const [preferences,setPreferences]=useState<Preference[]>([]);
  const [preferencesAvailable,setPreferencesAvailable]=useState(false),[preferencesError,setPreferencesError]=useState('');
  const [selected,setSelected]=useState('');
  const refreshPreferences=useCallback(async(signal?:AbortSignal)=>{const r=await fetch('/api/estancias/chat-preferencias',{cache:'no-store',signal});if(!r.ok)throw Error(en?'Could not load chat folders.':'No se pudieron cargar las carpetas del chat.');const rows:Preference[]=await r.json();if(!Array.isArray(rows)||rows.some(p=>typeof p.codigo!=='string'||typeof p.favorita!=='boolean'||typeof p.archivada!=='boolean'||typeof p.eliminada!=='boolean'||!Number.isInteger(p.ultimoId)||!Number.isInteger(p.noLeidos)))throw Error(en?'Chat folders are unavailable.':'Las carpetas del chat no están disponibles.');if(!signal?.aborted){setPreferences(rows);setPreferencesAvailable(true);setPreferencesError('');}return rows;},[en]);
  async function action(code:string,accion:string,valor?:boolean,hasta?:number){if(!preferencesAvailable)return;try{const r=await fetch('/api/estancias/'+encodeURIComponent(code)+'/chat-preferencias',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({accion,valor,hasta})});if(!r.ok){setError(en?'Could not save the change. Try again.':'No se pudo guardar el cambio. Intenta nuevamente.');return;}if(accion==='eliminar')selectConversation('');setError('');await refreshPreferences();}catch{setError(en?'Could not save the change. Try again.':'No se pudo guardar el cambio. Intenta nuevamente.');}}
  useEffect(()=>{const controller=new AbortController();let running=false;async function load(){if(running)return;running=true;try{const rows=await refreshPreferences(controller.signal);const current=rows.find(p=>p.codigo===selected);if(selected&&current?.noLeidos){const response=await fetch('/api/estancias/'+encodeURIComponent(selected)+'/chat-preferencias',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({accion:'leido',hasta:current.ultimoId}),signal:controller.signal});if(!response.ok)throw Error('Read status unavailable');await refreshPreferences(controller.signal);}}catch{if(!controller.signal.aborted){setPreferencesAvailable(false);setPreferencesError(en?'Chat folders are unavailable. You can still open conversations.':'Las carpetas del chat no están disponibles. Puedes abrir las conversaciones.');}}finally{running=false;}}void load();const timer=setInterval(load,5000);return()=>{controller.abort();clearInterval(timer);};},[en,selected,refreshPreferences]);
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
          if (!huespedes.some(h => h.id === guestId)) huespedes.push({ id: guestId, nombre: d.huesped.nombreCompleto, correo: d.huesped.correo, telefono: d.huesped.telefono, nacionalidad: d.huesped.nacionalidad ?? '', documento: d.huesped.numeroDocumento, tipoDocumento: d.huesped.tipoDocumento === 'DPI' ? 'DPI' : 'Pasaporte', creadoEn: d.creadaEn });
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
  const conversations=data.reservas.filter(r=>!preferencesAvailable||preferences.some(p=>p.codigo===r.codigo)).map(r=>({code:r.codigo,name:data.huespedes.find(h=>h.id===r.huespedId)?.nombre??'',room:data.habitaciones.find(h=>h.id===r.habitacionId)?.numero??'',closed:r.estado==='finalizada',favorite:preferencesAvailable?preferences.find(p=>p.codigo===r.codigo)?.favorita:undefined,archived:preferencesAvailable?preferences.find(p=>p.codigo===r.codigo)?.archivada:undefined,deleted:preferencesAvailable?preferences.find(p=>p.codigo===r.codigo)?.eliminada:undefined,unread:preferencesAvailable?preferences.find(p=>p.codigo===r.codigo)?.noLeidos:undefined}));
  return <ApprovedReceptionChatFrame foldersAvailable={preferencesAvailable} foldersMessage={preferencesError} onAction={action} conversations={conversations} selected={selected} onSelect={selectConversation} loading={loading} error={error}>{selected&&conversations.some(c=>c.code===selected)?<EstanciaChat approved staff guestName={conversations.find(c=>c.code===selected)?.name??''} key={selected} code={selected} blockedReason={data.reservas.find(r=>r.codigo===selected)?.estado==='finalizada'?(en?'This stay has ended. You can read the history, but cannot send new messages.':'La estancia terminó. Puedes consultar el historial, pero no enviar nuevos mensajes.'):''} protectedTerms={data.huespedes.filter(h=>h.id===data.reservas.find(r=>r.codigo===selected)?.huespedId).map(h=>h.nombre)}/>:<main className="grid min-h-0 flex-1 place-items-center bg-[#F8F6F0] p-5 text-sm text-[#71839B]">{en?'Select a stay to chat.':'Selecciona una estancia para conversar.'}</main>}</ApprovedReceptionChatFrame>;
}
