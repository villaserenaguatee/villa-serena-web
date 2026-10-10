import { estanciaHabilitaChat } from '@/lib/pms/chatAccess';
import { leerReservas } from '@/store/reservationStore';
import { useEffect, useMemo, useRef, useState } from 'react';
import { MoreHorizontal, Pin, Users } from 'lucide-react';
import type { HabitacionHotel, Huesped, MensajeChat, Reserva } from '@/lib/pms/types';
import { ahoraISO, generarId } from '@/data/pms';
import { leerMensajesChat, guardarMensajesChat, actualizarMensajeChat, leerPreferenciasChat, guardarPreferenciasChat } from '@/store/chatStore';
import type { PreferenciasChat } from '@/store/chatStore';
import { translateChatMessage } from '@/lib/translation/client';
type Filtro = 'todos' | 'no-leidos' | 'favoritos' | 'archivados';
const hora = (iso: string) => new Date(iso).toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' });
const iniciales = (n: string) => n.split(/\s+/).slice(0, 2).map(x => x[0]).join('').toUpperCase();
export default function ChatRecepcion({ huespedes, reservas, habitaciones }: {
  huespedes: Huesped[];
  reservas: Reserva[];
  habitaciones: HabitacionHotel[];
}) {
  const [mensajes, setMensajes] = useState<MensajeChat[]>([]);
  const [seleccionado, setSeleccionado] = useState('');
  const [buscar, setBuscar] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [favoritos, setFavoritos] = useState<string[]>([]);
  const [archivados, setArchivados] = useState<string[]>([]);
  const [fijados, setFijados] = useState<string[]>([]);
  const [chatMenu, setChatMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  const [eliminarChat, setEliminarChat] = useState<string | null>(null);
  const [mostrarTodos, setMostrarTodos] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const [texto, setTexto] = useState('');
  const [menuId, setMenuId] = useState<string | null>(null);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [editandoTexto, setEditandoTexto] = useState('');
  const [eliminarId, setEliminarId] = useState<string | null>(null);
  const [aviso, setAviso] = useState('');
  useEffect(() => {
    if (!chatMenu && !eliminarChat) return;
    const close = (e: KeyboardEvent) => { if (e.key === 'Escape') { setChatMenu(null); setEliminarChat(null); } };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [chatMenu, eliminarChat]);
  useEffect(() => {
    const sync = () => {
      setMensajes(leerMensajesChat([]));
      const prefs = leerPreferenciasChat();
      setFavoritos(prefs.favoritos); setArchivados(prefs.archivados); setFijados(prefs.fijados);
    };
    sync();
    window.addEventListener('vs-chat-actualizado', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('vs-chat-actualizado', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);
  const conversaciones = useMemo(() => huespedes.flatMap(h => {
    const r = reservas.find(r => r.huespedId === h.id && estanciaHabilitaChat(r));
    return r ? [{ h, r, habitacion: habitaciones.find(hab => hab.id === r.habitacionId) }] : [];
  }), [huespedes, reservas, habitaciones, mensajes]);
  const conversacionActual = conversaciones.find(c => c.h.id === seleccionado);
  const actual = conversacionActual?.h;
  const listaBase = conversaciones.filter(c => !buscar.trim() || c.h.nombre.toLowerCase().includes(buscar.trim().toLowerCase())).filter(c => filtro === 'favoritos' ? favoritos.includes(c.h.id) : filtro === 'archivados' ? archivados.includes(c.h.id) : filtro === 'no-leidos' ? mensajes.some(m => m.huespedId === c.h.id && m.autor === 'huesped' && !m.leidoPor?.includes('recepcion') && !m.eliminadoParaTodos) : !archivados.includes(c.h.id));
  const lista = (mostrarTodos || buscar.trim() ? listaBase : listaBase.filter(c => mensajes.some(m => m.huespedId === c.h.id)))
    .slice().sort((a, b) => Number(fijados.includes(b.h.id)) - Number(fijados.includes(a.h.id)));
  function cambiarPreferencia(key: keyof PreferenciasChat, id: string) {
    const prefs = leerPreferenciasChat();
    prefs[key] = prefs[key].includes(id) ? prefs[key].filter(value => value !== id) : [...prefs[key], id];
    guardarPreferenciasChat(prefs); setChatMenu(null);
  }
  function borrarConversacion(id: string) {
    guardarMensajesChat(leerMensajesChat([]).filter(m => m.huespedId !== id));
    const prefs = leerPreferenciasChat();
    for (const key of ['favoritos', 'archivados', 'fijados'] as const) prefs[key] = prefs[key].filter(value => value !== id);
    guardarPreferenciasChat(prefs);
    if (seleccionado === id) { setSeleccionado(''); setTexto(''); }
    setEliminarChat(null);
  }
  const mensajesVisibles = mensajes.filter(m => Boolean(actual) && m.huespedId === actual?.id && !m.eliminadoPara?.includes('recepcion'));
  useEffect(() => {
    const el = chatScrollRef.current;
    if (el)
      el.scrollTop = el.scrollHeight;
  }, [seleccionado, mensajesVisibles.length]);
  async function enviar() {
    if (!actual || !texto.trim() || !estanciaHabilitaChat(leerReservas().find(r => r.id === conversacionActual?.r.id && r.huespedId === actual.id)))
      return;
    const valor = texto.trim();
    const m: MensajeChat = { id: generarId(), autor: 'recepcion', huespedId: actual.id, texto: valor, textoEs: valor, idiomaOriginal: 'es', hora: ahoraISO() };
    try {
      m.textoEn = await translateChatMessage(valor, 'es', 'en');
    }
    catch {
      setAviso('La traducción no está disponible; se conservará únicamente el mensaje original.');
    }
    if (!estanciaHabilitaChat(leerReservas().find(r => r.id === conversacionActual?.r.id && r.huespedId === actual.id))) return;
    const next = [...leerMensajesChat([]), m];
    guardarMensajesChat(next);
    setMensajes(next);
    setTexto('');
  }
  async function editar(id: string) {
    if (!editandoTexto.trim())
      return;
    const valor = editandoTexto.trim();
    let textoEn: string | undefined;
    try {
      textoEn = await translateChatMessage(valor, 'es', 'en');
    }
    catch {
      setAviso('No fue posible actualizar la traducción; se conservará únicamente el original.');
    }
    const next = actualizarMensajeChat(leerMensajesChat([]), id, m => ({ ...m, texto: valor, textoEs: valor, textoEn, idiomaOriginal: 'es', editado: true, editadoEn: ahoraISO() }));
    setMensajes(next);
    setEditandoId(null);
    setEditandoTexto('');
    setMenuId(null);
  }
  function eliminar(id: string,
    todos: boolean) {
    const mensaje = leerMensajesChat([]).find(m => m.id === id);
    if (!mensaje || mensaje.autor === 'recepcion')
      return;
    const next = actualizarMensajeChat(mensajes, id, m => todos ? { ...m, eliminadoParaTodos: true } : { ...m, eliminadoPara: [...(m.eliminadoPara || []), 'recepcion'] });
    setMensajes(next);
    setEliminarId(null);
  }
  return <div
    className="flex h-[calc(100dvh-96px)] md:h-[calc(100dvh-48px)] min-h-0 flex-1 flex-col overflow-hidden bg-[#F8F6F0]"
    style={{ fontFamily: '"Afacad","Segoe UI",Arial,sans-serif' }}>
    <section className="mx-auto my-3 flex min-h-0 w-[calc(100%-24px)] max-w-[1180px] flex-1 flex-col overflow-hidden rounded-2xl border border-[#E5E0D8] bg-white shadow-sm md:my-4 md:flex-row">
      <aside className="flex max-h-[300px] w-full shrink-0 min-h-0 flex-col border-b border-[#E5E0D8] bg-white md:max-h-none md:w-[300px] md:border-b-0 md:border-r">
        <div className="shrink-0 border-b border-[#E5E0D8] p-3">
          <h1 className="text-2xl font-semibold text-[#18345C]">Mensajes</h1>
          <p className="text-sm text-[#71839B]">Chat con huéspedes</p>
          <label className="mt-2 flex items-center gap-2 rounded-xl bg-[#F4F3EF] px-3 py-2">
            <span>⌕</span>
            <input value={buscar} onChange={e => setBuscar(e.target.value)} placeholder="Buscar un chat o iniciar uno nuevo" aria-label="Buscar un chat o iniciar uno nuevo" className="min-w-0 flex-1 bg-transparent text-[12px] outline-none" />
          </label>
          <button
            onClick={() => setMostrarTodos(v => !v)}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-[#18345C] px-3 py-2 text-sm font-semibold text-[#18345C]">
            <Users size={16} aria-hidden="true" />
            {mostrarTodos ? 'Conversaciones recientes' : 'Todos los huéspedes'}
          </button>
          <div className="mt-2 flex items-center gap-1">
            {([['todos', 'Todos'], ['no-leidos', 'No leídos'], ['favoritos', 'Favoritos'], ['archivados', 'Archivados']] as [
              Filtro,
              string
            ][]).map(([id, label]) => <button
              key={id}
              onClick={() => setFiltro(id)}
              className={`shrink-0 whitespace-nowrap rounded-full border px-1.5 py-1 text-xs ${filtro === id ? 'border-[#18345C] bg-[#18345C] text-white' : 'border-[#DDD8CF] bg-white text-[#52677F]'}`}>
              {label}
            </button>)}
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {!lista.length && <p className="px-4 py-4 text-center text-sm text-[#71839B]">{mostrarTodos ? 'No hay huéspedes con estancia activa' : 'No hay conversaciones'}</p>}
          {lista.map(c => <div
            key={c.h.id}
            className="relative"
            onContextMenu={e => { if (!mensajes.some(m => m.huespedId === c.h.id)) return; e.preventDefault(); setChatMenu({ id: c.h.id, x: e.clientX, y: e.clientY }); }}>
            <button
            onClick={() => { setSeleccionado(c.h.id); setMostrarTodos(false); setBuscar(''); }}
            className={`flex w-full items-center gap-3 border-b border-[#F0EDE7] pl-4 pr-11 py-2.5 text-left hover:bg-[#F8F6F0] ${seleccionado === c.h.id ? 'bg-[#EEF4FA]' : ''}`}>
            <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-[#DDEAF7] text-sm font-semibold text-[#18345C]">
              {c.h.foto ? <img src={c.h.foto} alt="" className="h-full w-full object-cover" /> : iniciales(c.h.nombre)}
            </div>
            <div className="min-w-0 flex-1">
              <b className="block truncate text-[15px] text-[#18345C]">
                {c.h.nombre}
                {fijados.includes(c.h.id) && <Pin size={12} aria-label="Chat fijado" className="ml-1 inline-block" />}
              </b>
              <p className="truncate text-xs text-[#8A6819]">{c.habitacion ? `Hab. ${c.habitacion.numero}` : 'Sin asignar'} · {c.r?.codigo || 'Sin reserva'}</p>
            </div>
          </button>
          {mensajes.some(m => m.huespedId === c.h.id) && <button aria-label={`Opciones del chat de ${c.h.nombre}`} onClick={e => { const rect = e.currentTarget.getBoundingClientRect(); setChatMenu({ id: c.h.id, x: rect.right, y: rect.bottom }); }} className="absolute right-1 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full text-[#52677F] hover:bg-[#F4F3EF]"><MoreHorizontal size={18} /></button>}
          </div>)}
        </div>
      </aside>
      <main className="flex min-h-0 min-w-0 flex-1 flex-col">
        {actual && <header className="flex shrink-0 min-h-[72px] items-center justify-between border-b border-[#E5E0D8] px-4">
          <div className="flex min-w-0 items-center gap-2">
            <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-[#DDEAF7] font-semibold text-[#18345C]">
              {actual.foto ? <img src={actual.foto} alt="" className="h-full w-full object-cover" /> : iniciales(actual.nombre)}
            </div>
            <div className="min-w-0">
              <h2 className="font-semibold text-[#18345C]">
                {actual.nombre}
              </h2>
              <div className="mt-1 flex flex-wrap items-center gap-1.5"><span className="rounded-md border border-[#C8D3DF] bg-[#EFF3F7] px-2 py-0.5 text-xs text-[#435A70]">{conversacionActual?.habitacion ? `Hab. ${conversacionActual.habitacion.numero}` : 'Sin asignar'}</span><span className="rounded-md border border-[#E6DCC7] bg-[#F8F4EB] px-2 py-0.5 text-xs text-[#6C5938]">{conversacionActual?.r.codigo}</span></div>
            </div>
          </div>
        </header>}
        <div ref={chatScrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[#F8F6F0] p-4">
          <div className="mx-auto max-w-3xl space-y-2">
            {mensajesVisibles.length ? mensajesVisibles.map(m => {
              const rec = m.autor === 'recepcion';
              const contenido = m.eliminadoParaTodos ? 'Este mensaje fue eliminado' : (m.textoEs || m.texto);
              return <div key={m.id} className={`flex ${rec ? 'justify-end' : 'justify-start'}`}>
                <div className={`group relative max-w-[72%] rounded-2xl px-4 py-2.5 shadow-sm ${m.eliminadoParaTodos ? 'border border-dashed border-[#C9CED5] bg-[#F2F3F4] italic text-[#7A8798]' : rec ? 'rounded-br-sm bg-[#18345C] text-white' : 'rounded-bl-sm border border-[#E5E0D8] bg-white text-[#18345C]'}`}>
                  {editandoId === m.id ? <div className="min-w-[280px]">
                    <textarea
                      value={editandoTexto}
                      onChange={e => setEditandoTexto(e.target.value)}
                      rows={2}
                      autoFocus
                      className="w-full rounded-lg border bg-white p-2 text-[#18345C]" />
                    <div className="mt-2 flex justify-end gap-2">
                      <button onClick={() => setEditandoId(null)} className="rounded-md border px-3 py-1 text-xs">Cancelar</button>
                      <button onClick={() => editar(m.id)} className="rounded-md bg-[#18345C] px-3 py-1 text-xs font-semibold text-white">Guardar</button>
                    </div>
                  </div> : <><p>
                    {contenido}
                  </p>{m.editado && !m.eliminadoParaTodos && <span className="text-[10px] opacity-65"> · editado</span>}<div className="mt-1 text-right text-[11px] opacity-65">
                      {hora(m.hora)}
                      {rec ? '✓✓' : ''}
                    </div></>}
                  {!m.eliminadoParaTodos && <button
                    onClick={() => setMenuId(menuId === m.id ? null : m.id)}
                    className={`absolute -right-2 -top-3 rounded-full border bg-white px-2 py-0.5 text-[#52677F] shadow-sm ${menuId === m.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>⋯</button>}
                  {menuId === m.id && !m.eliminadoParaTodos && <div className="absolute right-0 top-7 z-20 w-40 overflow-hidden rounded-xl border bg-white text-sm text-[#18345C] shadow-xl">
                    <button
                      disabled={!rec}
                      onClick={() => {
                        setEditandoId(m.id);
                        setEditandoTexto(m.textoEs || m.texto);
                        setMenuId(null);
                      }}
                      className="block w-full px-4 py-2.5 text-left hover:bg-[#F8F6F0] disabled:opacity-40">Editar</button>
                    {!rec && <button onClick={() => {
                      setEliminarId(m.id);
                      setMenuId(null);
                    }} className="block w-full px-4 py-2.5 text-left text-red-600 hover:bg-red-50">Eliminar</button>}
                  </div>}
                </div>
              </div>;
            }) : <div className="grid min-h-[140px] place-items-center text-center">
              <div>
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#E9F0F7] text-[#18345C]">
                  <Users size={22} />
                </div>
                <p className="mt-3 font-semibold text-[#18345C]">Sin mensajes</p>
                <p className="text-sm text-[#8290A3]">Los mensajes del huésped aparecerán aquí.</p>
              </div>
            </div>}
          </div>
        </div>
        <footer className="shrink-0 border-t border-[#E5E0D8] bg-white p-2.5">
          <div className="mx-auto flex max-w-3xl items-center gap-2">
            <input
              value={texto}
              onChange={e => setTexto(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter')
                  enviar();
              }}
              disabled={!actual}
              placeholder="Escribe un mensaje"
              className="min-w-0 flex-1 h-11 rounded-full bg-[#F4F3EF] px-4 py-2 outline-none focus:ring-1 focus:ring-[#18345C]" />
            <button onClick={enviar} disabled={!actual || !texto.trim()} aria-label="Enviar mensaje" className="rounded-full bg-[#18345C] p-3 text-white disabled:opacity-40">➤</button>
          </div>
        </footer>
      </main>
    </section>
    {chatMenu && <div className="fixed inset-0 z-[120]" onClick={() => setChatMenu(null)} onContextMenu={e => { e.preventDefault(); setChatMenu(null); }}>
      <div role="menu" aria-label="Opciones de conversación" style={{ left: Math.max(8, Math.min(chatMenu.x, window.innerWidth - 232)), top: Math.max(8, Math.min(chatMenu.y, window.innerHeight - 200)) }} className="absolute w-56 overflow-hidden rounded-xl border border-[#E5E0D8] bg-white py-1 text-sm text-[#18345C] shadow-xl" onClick={e => e.stopPropagation()}>
        <button autoFocus role="menuitem" className="block w-full px-4 py-2 text-left hover:bg-[#F8F6F0]" onClick={() => cambiarPreferencia('archivados', chatMenu.id)}>{archivados.includes(chatMenu.id) ? 'Desarchivar chat' : 'Archivar chat'}</button>
        <button role="menuitem" className="block w-full px-4 py-2 text-left hover:bg-[#F8F6F0]" onClick={() => cambiarPreferencia('favoritos', chatMenu.id)}>{favoritos.includes(chatMenu.id) ? 'Quitar de favoritos' : 'Añadir a favoritos'}</button>
        <button role="menuitem" className="block w-full px-4 py-2 text-left hover:bg-[#F8F6F0]" onClick={() => cambiarPreferencia('fijados', chatMenu.id)}>{fijados.includes(chatMenu.id) ? 'Desfijar chat' : 'Fijar chat'}</button>
        <button role="menuitem" className="block w-full border-t border-[#E5E0D8] px-4 py-2 text-left text-[#922E2E] hover:bg-[#FDEEEE]" onClick={() => { setEliminarChat(chatMenu.id); setChatMenu(null); }}>Eliminar conversación</button>
      </div>
    </div>}
    {eliminarChat && <div className="fixed inset-0 z-[130] grid place-items-center bg-black/35 p-4">
      <section role="alertdialog" aria-modal="true" aria-labelledby="eliminar-chat-titulo" aria-describedby="eliminar-chat-descripcion" className="w-full max-w-[420px] rounded-2xl bg-white p-5 shadow-2xl">
        <h3 id="eliminar-chat-titulo" className="text-xl font-semibold text-[#18345C]">¿Eliminar conversación?</h3>
        <p id="eliminar-chat-descripcion" className="mt-2 text-sm text-[#52677F]">Se eliminarán los mensajes guardados en este navegador. El huésped y su reserva se conservarán.</p>
        <div className="mt-4 flex justify-end gap-2"><button autoFocus onClick={() => setEliminarChat(null)} className="rounded-lg border border-[#E5E0D8] px-4 py-2 text-sm text-[#18345C]">Cancelar</button><button onClick={() => borrarConversacion(eliminarChat)} className="rounded-lg bg-[#B32D2D] px-4 py-2 text-sm font-semibold text-white">Eliminar conversación</button></div>
      </section>
    </div>}
    {eliminarId && <div className="fixed inset-0 z-[130] grid place-items-center bg-black/35 p-4">
      <section className="w-full max-w-[420px] rounded-2xl bg-white p-5 shadow-2xl">
        <h3 className="text-xl font-semibold text-[#18345C]">¿Eliminar este mensaje?</h3>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button onClick={() => eliminar(eliminarId, false)} className="rounded-lg border px-4 py-2 text-sm font-semibold text-[#18345C]">Eliminar para mí</button>
          <button onClick={() => eliminar(eliminarId, true)} className="rounded-lg bg-[#B32D2D] px-4 py-2 text-sm font-semibold text-white">Eliminar para todos</button>
          <button onClick={() => setEliminarId(null)} className="rounded-lg border border-[#18345C] px-4 py-2 text-sm font-semibold text-[#18345C]">Cancelar</button>
        </div>
      </section>
    </div>}
    {aviso && <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-[#18345C] px-5 py-3 text-sm text-white shadow-xl">
      {aviso}
    </div>}
  </div>;
}
