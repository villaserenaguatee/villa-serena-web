import { RefreshCw } from 'lucide-react';
import styles from './ObjetosRecepcion.module.css';
import ReceptionCloseButton from './ReceptionCloseButton';
import { useState } from 'react';
import type { HabitacionHotel, Huesped, ObjetoOlvidado, Reserva } from '@/lib/pms/types';
interface Props {
  objetos: ObjetoOlvidado[];
  habitaciones: HabitacionHotel[];
  reservas: Reserva[];
  huespedes: Huesped[];
  onActualizar: (id: string, cambios: Partial<ObjetoOlvidado>) => void;
}
const fecha = (valor: string) => /^\d{4}-\d{2}-\d{2}T/.test(valor) ? new Date(valor).toLocaleString('es-GT', { dateStyle: 'medium', timeStyle: 'short' }) : valor;
export default function ObjetosRecepcion({ objetos, habitaciones, reservas, huespedes, onActualizar }: Props) {
  const [devolucion, setDevolucion] = useState<ObjetoOlvidado | null>(null);
  const [receptorConfirmado, setReceptorConfirmado] = useState(false);
  const [relaciones, setRelaciones] = useState<Record<string,string>>({});
  const [reservaCandidata, setReservaCandidata] = useState<Record<string,string>>({});
  const [filtro, setFiltro] = useState<'pendientes' | 'devueltos'>('pendientes');
  const [objetoCorreo, setObjetoCorreo] = useState<ObjetoOlvidado | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [piso, setPiso] = useState('');
  const [habitacion, setHabitacion] = useState('');
  const pisos = [...new Set(habitaciones.map(h => h.piso))].sort((a, b) => a - b);
  const habitacionesDelPiso = habitaciones.filter(h => !piso || String(h.piso) === piso)
    .slice().sort((a, b) => a.numero.localeCompare(b.numero, undefined, { numeric: true }));
  const visibles = objetos.filter(o => o.origen === 'limpieza')
    .filter(o => filtro === 'devueltos' ? o.estado === 'devuelto' : o.estado !== 'devuelto')
    .filter(o => o.descripcion.toLowerCase().includes(busqueda.trim().toLowerCase()))
    .filter(o => !piso || habitaciones.some(h => h.numero === o.habitacionNumero && String(h.piso) === piso))
    .filter(o => !habitacion || o.habitacionNumero === habitacion);
  function datos(o: ObjetoOlvidado) {
    const h = habitaciones.find(x => x.numero === o.habitacionNumero);
    const r = reservas.find(x => x.id === relaciones[o.id]);
    const huesped = r ? huespedes.find(x => x.id === r.huespedId) : undefined;
    return { h, r, huesped };
  }
  return <div className="flex-1 overflow-y-auto bg-[#F8F6F0]">
    <header data-vs-page-header="recepcion" className="border-b border-[#E5E0D8] bg-white px-4 py-5 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 data-vs-page-title="recepcion" className="text-[30px] font-semibold leading-tight text-[#18345C]">Objetos olvidados</h1>
          <p className="mt-1 text-sm text-[#AEBCC1]">{objetos.filter(o => o.origen === 'limpieza' && o.estado !== 'devuelto').length} por entregar</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFiltro('pendientes')}
            className={`rounded-lg border px-3.5 py-2 text-sm font-semibold ${filtro === 'pendientes' ? 'border-[#18345C] bg-[#18345C] text-white' : 'border-[#E5E0D8] bg-white text-[#52677F]'}`}>Por entregar</button>
          <button
            onClick={() => setFiltro('devueltos')}
            className={`rounded-lg border px-3.5 py-2 text-sm font-semibold ${filtro === 'devueltos' ? 'border-[#18345C] bg-[#18345C] text-white' : 'border-[#E5E0D8] bg-white text-[#52677F]'}`}>Devueltos</button>
        </div>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px_200px]">
      <label className="flex flex-col gap-1 text-sm text-[#18345C]">Nombre
      <input
        value={busqueda}
        onChange={e => setBusqueda(e.target.value)}
        placeholder="Buscar objeto…"
        aria-label="Buscar objeto"
        className="h-10 w-full rounded-lg border border-[#E5E0D8] px-3 text-sm outline-none focus:border-[#18345C]" />
      </label>
      <label className="flex flex-col gap-1 text-sm text-[#18345C]">Piso
      <select aria-label="Piso" value={piso} onChange={e => { setPiso(e.target.value); setHabitacion(''); }} className="h-10 w-full rounded-lg border border-[#E5E0D8] bg-white px-3 text-sm text-[#18345C] outline-none focus:border-[#18345C]">
        <option value="">Todos</option>
        {pisos.map(p => <option key={p} value={p}>Piso {p}</option>)}
      </select>
      </label>
      <label className="flex flex-col gap-1 text-sm text-[#18345C]">Habitación
      <select aria-label="Habitación" value={habitacion} onChange={e => setHabitacion(e.target.value)} className="h-10 w-full rounded-lg border border-[#E5E0D8] bg-white px-3 text-sm text-[#18345C] outline-none focus:border-[#18345C]">
        <option value="">Todas</option>
        {habitacionesDelPiso.map(h => <option key={h.id} value={h.numero}>Hab. {h.numero}</option>)}
      </select>
      </label>
      </div>
    </header>
    <div className="px-4 pt-3"><button aria-label="Limpiar filtros" title="Limpiar filtros" onClick={()=>{setBusqueda('');setPiso('');setHabitacion('');}} className="rounded-lg border border-[#E5E0D8] bg-white p-2.5 text-[#18345C]"><RefreshCw size={17}/></button></div>
    <main className={`${styles.list} grid grid-cols-1 gap-3 p-4 sm:p-5`}>
      {visibles.map(o => {
        const { h, r, huesped } = datos(o);
        return <article data-vs-card="recepcion" key={o.id} className={`${styles.card} flex min-w-0 rounded-xl border border-[#E5E0D8] bg-white p-3`}>
          <div className={`${styles.photo} shrink-0 overflow-hidden rounded-lg bg-[#F8F6F0]`}>{o.foto ? <img src={o.foto} alt={o.descripcion} className="h-full w-full object-cover"/> : <div className="flex h-full items-center justify-center text-center text-xs text-[#71839B]">Sin fotografía</div>}</div><div className={`${styles.content} flex-1 break-words`}>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <h2 className="font-semibold text-[#18345C]">
                {o.descripcion}
              </h2>
              <p className="mt-1 text-sm text-[#71839B]">Habitación {o.habitacionNumero}{h ? ` · Piso ${h.piso}` : ''}</p>
            </div>
            <span className="shrink-0 rounded-md border border-[#F3D98B] bg-[#FFFBEF] px-2 py-1 text-[10px] font-bold uppercase text-[#78450A]">
              {o.estado === 'devuelto' ? 'DEVUELTO' : 'EN RESGUARDO'}
            </span>
          </div>
          <div className={`${styles.metadata} text-xs text-[#71839B]`}>
            <p>Estancia: {r ? `${r.fechaEntrada} → ${r.fechaSalida}` : 'Sin estancia relacionada'}</p>
            <p>Encontrado: {fecha(o.fechaHora)}</p>
            {o.observaciones && <p>
              {o.observaciones}
            </p>}
          </div>
          <div className={styles.guest}>
            <p className="text-[10px] uppercase tracking-wider text-[#AEBCC1]">Huésped</p>
            <p className="mt-1 font-semibold text-[#18345C]">
              {huesped?.nombre || 'Sin huésped relacionado'}
            </p>
            {huesped?.correo ? <p className="text-sm text-[#71839B]">
              {huesped.correo}
            </p> : <p className="text-sm font-semibold text-[#B36B00]">Sin correo registrado · Contacto pendiente</p>}
          </div>
          <div className={styles.actions}>
          {!huesped && o.estado !== 'devuelto' && <div><select aria-label="Seleccionar estancia para el objeto" value={reservaCandidata[o.id] ?? ''} onChange={e=>setReservaCandidata(v=>({...v,[o.id]:e.target.value}))} className="min-w-0 max-w-full rounded-lg border border-[#E5E0D8] bg-white p-2 text-sm"><option value="" disabled hidden>Seleccionar</option>{reservas.map(r=><option key={r.id} value={r.id}>{r.codigo} · {huespedes.find(h=>h.id===r.huespedId)?.nombre ?? r.codigo}</option>)}</select><button disabled={!reservaCandidata[o.id]} onClick={()=>setRelaciones(v=>({...v,[o.id]:reservaCandidata[o.id]}))} className="rounded-lg border px-3 py-2 text-sm disabled:opacity-40">Confirmar huésped</button></div>}
          {o.estado !== 'devuelto' && <div className="mt-3 flex flex-wrap gap-2">
            {huesped?.correo && <button onClick={() => setObjetoCorreo(o)} className="rounded-lg border border-[#18345C] px-3.5 py-2 text-sm font-semibold text-[#18345C]">
              {o.estado === 'notificado' ? 'Actualizar notificación' : 'Registrar notificación'}
            </button>}
            <button
              onClick={() => {setDevolucion(o);setReceptorConfirmado(false);}}
              className="rounded-lg bg-[#18345C] px-3.5 py-2 text-sm font-semibold text-white">Marcar como devuelto</button>
          </div>}
          </div>
        </div></article>;
      })}
      {!visibles.length && <div className="col-span-full rounded-xl border border-dashed border-[#D8D1C7] bg-white py-9 text-center text-sm text-[#AEBCC1]">No hay objetos olvidados registrados por Limpieza.</div>}
    </main>
    {devolucion && <div className="fixed inset-0 z-50 grid place-items-center bg-black/35 p-4"><section role="dialog" aria-modal="true" aria-label="Confirmar devolución" className="w-full max-w-md rounded-2xl bg-white p-5"><h2 className="text-xl font-semibold text-[#18345C]">Confirmar devolución</h2><p className="mt-3 break-words">¿Confirmas la devolución de {devolucion.descripcion}?</p><label className="mt-3 flex items-start gap-2 text-sm"><input type="checkbox" checked={receptorConfirmado} onChange={e=>setReceptorConfirmado(e.target.checked)}/>He verificado la identidad de la persona que recibe el objeto.</label><div className="mt-4 flex flex-wrap justify-end gap-3"><button className="rounded-lg border px-4 py-2" onClick={()=>setDevolucion(null)}>Cancelar</button><button disabled={!receptorConfirmado} className="rounded-lg bg-[#18345C] px-4 py-2 text-white disabled:opacity-40" onClick={()=>{onActualizar(devolucion.id,{estado:'devuelto',devueltoEn:new Date().toISOString()});setDevolucion(null);setFiltro('devueltos');}}>Marcar como devuelto</button></div></section></div>}
    {objetoCorreo && (() => {
      const { huesped, r } = datos(objetoCorreo);
      if (!huesped?.correo)
        return null;
      return <div className="fixed inset-0 z-50 grid place-items-center bg-black/35 p-4">
        <section className="w-full max-w-xl rounded-2xl bg-white shadow-2xl">
          <header className="flex items-start justify-between border-b p-5">
            <div>
              <p className="text-[10px] uppercase tracking-[.18em] text-[#B38719]">Vista previa local · sin envío de correo</p>
              <h2 className="text-2xl font-semibold text-[#18345C]">Objeto encontrado</h2>
            </div>
            <ReceptionCloseButton onClick={() => setObjetoCorreo(null)} />
          </header>
          <div className="space-y-3 p-5 text-sm">
            <div className="rounded-xl bg-[#F8F6F0] p-4">
              <p>
                <b>Para:</b>
                {huesped.correo}
              </p>
              <p className="mt-1"><b>Asunto:</b> Objeto encontrado en Villa Serena Hotel</p>
            </div>
            <div className="rounded-xl border border-[#E5E0D8] p-4 leading-6 text-[#354A63]">
              <p>Estimado/a {huesped.nombre}:</p>
              <p className="mt-2">Durante la revisión de la habitación {objetoCorreo.habitacionNumero}, nuestro equipo de Limpieza encontró <b>
                {objetoCorreo.descripcion}
              </b> el {fecha(objetoCorreo.fechaHora)}.</p>
              {r && <p className="mt-2">Estancia: ingreso {r.fechaEntrada} · salida {r.fechaSalida}.</p>}
              <p className="mt-2">El objeto fue reportado por Limpieza y permanece resguardado en Villa Serena.</p>
              {objetoCorreo.observaciones && <p className="mt-2">Observaciones: {objetoCorreo.observaciones}</p>}
              <p className="mt-2">El artículo se encuentra resguardado en Recepción. Puede comunicarse con nosotros o pasar a recogerlo presentando un documento de identificación.</p>
              <p className="mt-2">Atentamente,<br />Villa Serena Hotel · Recepción</p>
            </div>
            <div data-vs-actions="compact" className="flex justify-end gap-2">
              <button onClick={() => setObjetoCorreo(null)} className="rounded-lg border border-[#E5E0D8] px-4 py-2.5">Cancelar</button>
              <button
                onClick={() => {
                  onActualizar(objetoCorreo.id, { estado: 'notificado', notificadoEn: new Date().toISOString() });
                  setObjetoCorreo(null);
                }}
                className="rounded-lg bg-[#18345C] px-4 py-2.5 font-semibold text-white">Registrar simulación</button>
            </div>
          </div>
        </section>
      </div>;
    })()}
  </div>;
}
