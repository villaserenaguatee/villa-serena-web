import { useEffect, useMemo, useRef, useState } from 'react';
import { Users } from 'lucide-react';
import type { Huesped, MensajeChat, Reserva } from '@/lib/pms/types';
import { ahoraISO, generarId, HUESPED_PORTAL_ID } from '@/data/pms';
import { leerMensajesChat, guardarMensajesChat, actualizarMensajeChat } from '@/store/chatStore';
import { translateChatMessage } from '@/lib/translation/client';
type Filtro = 'todos' | 'no-leidos' | 'favoritos' | 'archivados';
const hora = (iso: string) => new Date(iso).toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' });
const iniciales = (n: string) => n.split(/\s+/).slice(0, 2).map(x => x[0]).join('').toUpperCase();
export default function ChatRecepcion({ huespedes, reservas }: {
  huespedes: Huesped[];
  reservas: Reserva[];
}) {
  const [mensajes, setMensajes] = useState<MensajeChat[]>([]);
  const [seleccionado, setSeleccionado] = useState(huespedes[0]?.id || '');
  const [buscar, setBuscar] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [favoritos, setFavoritos] = useState<string[]>([]);
  const [archivados, setArchivados] = useState<string[]>([]);
  const [mostrarTodos, setMostrarTodos] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const [texto, setTexto] = useState('');
  const [menuId, setMenuId] = useState<string | null>(null);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [editandoTexto, setEditandoTexto] = useState('');
  const [eliminarId, setEliminarId] = useState<string | null>(null);
  const [aviso, setAviso] = useState('');
  useEffect(() => {
    const sync = () => setMensajes(leerMensajesChat([]));
    window.addEventListener('vs-chat-actualizado', sync);
    return () => window.removeEventListener('vs-chat-actualizado', sync);
  }, []);
  const actual = huespedes.find(h => h.id === seleccionado) || huespedes[0];
  const conversaciones = useMemo(() => {
    const candidatos = huespedes
      .filter((h) => {
        const reserva = reservas.find((r) => r.huespedId === h.id);
        return reserva?.codigo !== 'RES-1202';
      })
      .map((h) => {
        const r = reservas.find((x) => x.huespedId === h.id &&
          (x.estado === 'en-curso' || x.estado === 'confirmada')) ||
          reservas.find((x) => x.huespedId === h.id);
        return { h, r };
      });
    const unicos = new Map<string, (typeof candidatos)[number]>();
    for (const c of candidatos) {
      const k = c.h.nombre.trim().toLocaleLowerCase('es');
      const previo = unicos.get(k);
      const puntaje = (x: (typeof candidatos)[number]) => (x.r?.estado === 'en-curso' ? 4 : x.r?.estado === 'confirmada' ? 3 : x.r ? 2 : 0) + (x.r?.habitacionId ? 1 : 0);
      if (!previo || puntaje(c) > puntaje(previo))
        unicos.set(k, c);
    }
    return [...unicos.values()];
  },
    [huespedes, reservas]);
  const listaBase = conversaciones.filter(c => !buscar.trim() || c.h.nombre.toLowerCase().includes(buscar.toLowerCase())).filter(c => filtro === 'favoritos' ? favoritos.includes(c.h.id) : filtro === 'archivados' ? archivados.includes(c.h.id) : filtro === 'no-leidos' ? mensajes.some(m => m.huespedId === c.h.id && m.autor === 'huesped' && !m.leidoPor?.includes('recepcion') && !m.eliminadoParaTodos) : !archivados.includes(c.h.id));
  const lista = mostrarTodos || buscar.trim() ? listaBase : listaBase.slice(0, 3);
  const mensajesVisibles = mensajes.filter(m => (m.huespedId === actual?.id || (!m.huespedId && actual?.id === HUESPED_PORTAL_ID)) && !m.eliminadoPara?.includes('recepcion'));
  useEffect(() => {
    const el = chatScrollRef.current;
    if (el)
      el.scrollTop = el.scrollHeight;
  }, [seleccionado, mensajesVisibles.length]);
  async function enviar() {
    if (!actual || !texto.trim())
      return;
    const valor = texto.trim();
    const m: MensajeChat = { id: generarId(), autor: 'recepcion', huespedId: actual.id, texto: valor, textoEs: valor, idiomaOriginal: 'es', hora: ahoraISO() };
    try {
      m.textoEn = await translateChatMessage(valor, 'es', 'en');
    }
    catch {
      setAviso('La traducción no está disponible; se conservará únicamente el mensaje original.');
    }
    const next = [...mensajes, m];
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
    const next = actualizarMensajeChat(mensajes, id, m => ({ ...m, texto: valor, textoEs: valor, textoEn, idiomaOriginal: 'es', editado: true, editadoEn: ahoraISO() }));
    setMensajes(next);
    setEditandoId(null);
    setEditandoTexto('');
    setMenuId(null);
  }
  function eliminar(id: string,
    todos: boolean) {
      const next = actualizarMensajeChat(mensajes, id, m => todos ? { ...m, eliminadoParaTodos: true } : { ...m, eliminadoPara: [...(m.eliminadoPara || []), 'recepcion'] });
    setMensajes(next);
    setEliminarId(null);
  }
  if (!actual)
    return <div className="flex-1 grid place-items-center bg-[#F8F6F0] text-[#71839B]">No hay huéspedes disponibles.</div>;
  return <div
    className="flex h-[calc(100vh-32px)] min-h-0 flex-1 flex-col overflow-hidden bg-[#F8F6F0]"
    style={{ fontFamily: '"Afacad","Segoe UI",Arial,sans-serif' }}>
    <section className="mx-auto mb-4 mt-8 flex min-h-0 w-[calc(100%-24px)] max-w-[1180px] flex-1 flex-col overflow-hidden rounded-2xl border border-[#E5E0D8] bg-white shadow-sm md:mb-6 md:mt-10 md:flex-row">
      <aside className="flex max-h-[300px] w-full shrink-0 min-h-0 flex-col border-b border-[#E5E0D8] bg-white md:max-h-none md:w-[300px] md:border-b-0 md:border-r">
        <div className="shrink-0 border-b border-[#E5E0D8] p-4">
          <h1 className="text-2xl font-semibold text-[#18345C]">Mensajes</h1>
          <p className="text-sm text-[#71839B]">Chat con huéspedes</p>
          <label className="mt-3 flex items-center gap-2 rounded-xl bg-[#F4F3EF] px-3 py-2.5">
            <span>⌕</span>
            <input value={buscar} onChange={e => setBuscar(e.target.value)} placeholder="Buscar chat" className="min-w-0 flex-1 bg-transparent outline-none" />
          </label>
          <button
            onClick={() => setMostrarTodos(v => !v)}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-[#18345C] px-3 py-2 text-sm font-semibold text-[#18345C]">
            <Users size={16} aria-hidden="true" />
            {mostrarTodos ? 'Conversaciones recientes' : 'Todos los huéspedes'}
          </button>
          <div className="mt-3 flex gap-2 overflow-x-auto">
            {([['todos', 'Todos'], ['no-leidos', 'No leídos'], ['favoritos', 'Favoritos'], ['archivados', 'Archivados']] as [
              Filtro,
              string
            ][]).map(([id, label]) => <button
              key={id}
              onClick={() => setFiltro(id)}
              className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-sm ${filtro === id ? 'border-[#18345C] bg-[#18345C] text-white' : 'border-[#DDD8CF] text-[#52677F]'}`}>
              {label}
            </button>)}
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {lista.map(c => <button
            key={c.h.id}
            onClick={() => setSeleccionado(c.h.id)}
            className={`flex w-full items-center gap-3 border-b border-[#F0EDE7] px-4 py-2.5 text-left hover:bg-[#F8F6F0] ${seleccionado === c.h.id ? 'bg-[#EEF4FA]' : ''}`}>
            <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-[#DDEAF7] text-sm font-semibold text-[#18345C]">
              {c.h.foto ? <img src={c.h.foto} alt="" className="h-full w-full object-cover" /> : iniciales(c.h.nombre)}
            </div>
            <div className="min-w-0 flex-1">
              <b className="block truncate text-[15px] text-[#18345C]">
                {c.h.nombre}
              </b>
              <p className="truncate text-xs text-[#8A6819]">Hab. {c.r?.habitacionId?.replace('hh-', '') || 'Sin asignar'} · {c.r?.codigo || 'Sin reserva'}</p>
            </div>
          </button>)}
        </div>
      </aside>
      <main className="flex min-h-[420px] min-w-0 flex-1 flex-col md:min-h-0">
        <header className="flex shrink-0 min-h-[66px] items-center justify-between border-b border-[#E5E0D8] px-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-[#DDEAF7] font-semibold text-[#18345C]">
              {actual.foto ? <img src={actual.foto} alt="" className="h-full w-full object-cover" /> : iniciales(actual.nombre)}
            </div>
            <div className="min-w-0">
              <h2 className="font-semibold text-[#18345C]">
                {actual.nombre}
              </h2>
              <p className="text-xs text-[#718096]">Habitación {actual && (reservas.find(r => r.huespedId === actual.id)?.habitacionId?.replace('hh-', '') || 'Sin asignar')}</p>
              <p className="text-xs text-[#188247]">En línea</p>
            </div>
          </div>
        </header>
        <div ref={chatScrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[#F8F6F0] p-4">
          <div className="mx-auto max-w-3xl space-y-3">
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
                    <button onClick={() => {
                      setEliminarId(m.id);
                      setMenuId(null);
                    }} className="block w-full px-4 py-2.5 text-left text-red-600 hover:bg-red-50">Eliminar</button>
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
              placeholder="Escribe un mensaje"
              className="min-w-0 flex-1 rounded-full bg-[#F4F3EF] px-4 py-3 outline-none focus:ring-1 focus:ring-[#18345C]" />
            <button onClick={enviar} disabled={!texto.trim()} className="rounded-full bg-[#18345C] p-3 text-white disabled:opacity-40">➤</button>
          </div>
        </footer>
      </main>
    </section>
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
