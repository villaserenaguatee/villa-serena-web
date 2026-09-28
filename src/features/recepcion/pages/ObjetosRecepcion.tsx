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
  const [filtro, setFiltro] = useState<'pendientes' | 'devueltos'>('pendientes');
  const [objetoCorreo, setObjetoCorreo] = useState<ObjetoOlvidado | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const visibles = objetos.filter(o => o.origen === 'limpieza').filter(o => filtro === 'devueltos' ? o.estado === 'devuelto' : o.estado !== 'devuelto').filter(o => `${o.descripcion} ${o.habitacionNumero}`.toLowerCase().includes(busqueda.toLowerCase()));
  function datos(o: ObjetoOlvidado) {
    const h = habitaciones.find(x => x.numero === o.habitacionNumero);
    const r = h ? reservas.find(x => x.habitacionId === h.id && (x.estado === 'en-curso' || x.estado === 'confirmada')) : undefined;
    const huesped = r ? huespedes.find(x => x.id === r.huespedId) : undefined;
    return { h, r, huesped };
  }
  return <div className="flex-1 overflow-y-auto bg-[#F8F6F0]">
    <header className="border-b border-[#E5E0D8] bg-white px-4 py-5 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[30px] font-semibold leading-tight text-[#18345C]">Objetos olvidados</h1>
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
      <input
        value={busqueda}
        onChange={e => setBusqueda(e.target.value)}
        placeholder="Buscar objeto o habitación..."
        className="mt-3 w-full rounded-lg border border-[#E5E0D8] px-3.5 py-2.5 text-sm outline-none focus:border-[#18345C]" />
    </header>
    <main className="grid grid-cols-1 gap-3 p-4 sm:p-5 xl:grid-cols-2">
      {visibles.map(o => {
        const { h, r, huesped } = datos(o);
        return <article key={o.id} className="rounded-xl border border-[#E5E0D8] bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="font-semibold text-[#18345C]">
                {o.descripcion}
              </h2>
              <p className="mt-1 text-sm text-[#71839B]">Habitación {o.habitacionNumero}{h ? ` · Piso ${h.piso}` : ''}</p>
            </div>
            <span className="shrink-0 rounded-md border border-[#F3D98B] bg-[#FFFBEF] px-2 py-1 text-[10px] font-bold uppercase text-[#78450A]">
              {o.estado === 'notificado' ? 'Notificado' : 'En resguardo'}
            </span>
          </div>
          <div className="mt-3 grid gap-1 border-t border-[#EEE9E1] pt-3 text-xs text-[#71839B]">
            <p>Estancia: {r ? `${r.fechaEntrada} → ${r.fechaSalida}` : 'Sin estancia relacionada'}</p>
            <p>Encontrado: {fecha(o.fechaHora)}</p>
            {o.observaciones && <p>
              {o.observaciones}
            </p>}
          </div>
          <div className="mt-3 border-t border-[#EEE9E1] pt-3">
            <p className="text-[10px] uppercase tracking-wider text-[#AEBCC1]">Huésped</p>
            <p className="mt-1 font-semibold text-[#18345C]">
              {huesped?.nombre || 'Sin huésped relacionado'}
            </p>
            {huesped?.correo ? <p className="text-sm text-[#71839B]">
              {huesped.correo}
            </p> : <p className="text-sm font-semibold text-[#B36B00]">Sin correo registrado · Contacto pendiente</p>}
          </div>
          {o.estado !== 'devuelto' && <div className="mt-3 flex flex-wrap gap-2">
            {huesped?.correo && <button onClick={() => setObjetoCorreo(o)} className="rounded-lg border border-[#18345C] px-3.5 py-2 text-sm font-semibold text-[#18345C]">
              {o.estado === 'notificado' ? 'Actualizar notificación' : 'Registrar notificación'}
            </button>}
            <button
              onClick={() => onActualizar(o.id, { estado: 'devuelto', devueltoEn: new Date().toISOString() })}
              className="rounded-lg bg-[#18345C] px-3.5 py-2 text-sm font-semibold text-white">Marcar como devuelto</button>
          </div>}
        </article>;
      })}
      {!visibles.length && <div className="col-span-full rounded-xl border border-dashed border-[#D8D1C7] bg-white py-9 text-center text-sm text-[#AEBCC1]">No hay objetos olvidados registrados por Limpieza.</div>}
    </main>
    {objetoCorreo && (() => {
      const { huesped, r } = datos(objetoCorreo);
      if (!huesped?.correo)
        return null;
      return <div className="fixed inset-0 z-50 grid place-items-center bg-black/35 p-4">
        <section className="w-full max-w-xl rounded-2xl bg-white shadow-2xl">
          <header className="flex items-start justify-between border-b p-5">
            <div>
              <p className="text-[10px] uppercase tracking-[.18em] text-[#B38719]">Notificación de contacto</p>
              <h2 className="text-2xl font-semibold text-[#18345C]">Objeto encontrado</h2>
            </div>
            <button onClick={() => setObjetoCorreo(null)} className="text-2xl text-[#71839B]">×</button>
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
            <div className="flex justify-end gap-2">
              <button onClick={() => setObjetoCorreo(null)} className="rounded-lg border border-[#E5E0D8] px-4 py-2.5">Cancelar</button>
              <button
                onClick={() => {
                  onActualizar(objetoCorreo.id, { estado: 'notificado', notificadoEn: new Date().toISOString() });
                  setObjetoCorreo(null);
                }}
                className="rounded-lg bg-[#18345C] px-4 py-2.5 font-semibold text-white">Registrar notificación</button>
            </div>
          </div>
        </section>
      </div>;
    })()}
  </div>;
}
