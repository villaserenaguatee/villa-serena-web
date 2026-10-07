'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { operacion, OperationError, type IncidenciaAPI } from '@/lib/api/operaciones';
import type { components } from '@/lib/api/schema';
import ReportarIncidencia from '@/components/common/ReportarIncidencia';
export default function IncidenciasConectadas({ soloReportar = false }: { soloReportar?: boolean }) {
  const { user } = useAuth();
  const employee = user?.staff;
  const allowed = employee?.rol === 'MANTENIMIENTO_LIMPIEZA' && ['MANTENIMIENTO', 'AMBAS'].includes(employee.area ?? '');
  const [incidencias, setIncidencias] = useState<IncidenciaAPI[]>([]), [rooms, setRooms] = useState<components['schemas']['HabitacionOperativa'][]>([]);
  const [error, setError] = useState(''), [reload, setReload] = useState(0), [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [reportar, setReportar] = useState(false);
  const [resolver, setResolver] = useState<IncidenciaAPI>(), [solucion, setSolucion] = useState('');
  const [notice, setNotice] = useState('');
  useEffect(() => {
    if (!employee || (!soloReportar && !allowed)) return;
    const controller = new AbortController(); setError(''); setLoading(true);
    // /habitaciones es exclusivo de RECEPCION. No consultar con un rol MYL ni
    // sustituir IDs del API por los del catálogo local.
    (soloReportar ? Promise.resolve([]) : operacion<IncidenciaAPI[]>('incidencias', 'GET', undefined, controller.signal))
      .then(items => { if (!controller.signal.aborted) { setIncidencias(items); setRooms(Array.from(new Map(items.map(i => [i.habitacion.id, i.habitacion])).values())); } })
      .catch(e => { if (!controller.signal.aborted) setError(e.message); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [reload, employee, allowed, soloReportar]);
  async function action(item: IncidenciaAPI, kind: 'tomar' | 'resolver') {
    if (busy) return;
    if (kind === 'resolver' && !solucion.trim()) { setError('La solución es obligatoria.'); return; }
    setBusy(true); setError(''); setNotice('');
    try { await operacion(`incidencias/${item.id}/${kind}`, 'POST', kind === 'resolver' ? { solucion: solucion.trim() } : undefined); setResolver(undefined); setSolucion(''); setReload(n => n + 1); }
    catch (e) {
      if (e instanceof OperationError && e.status === 409) {
        setResolver(undefined); setReload(n => n + 1);
        try { const detail = await operacion<IncidenciaAPI>(`incidencias/${item.id}`); setNotice(`La incidencia cambió. Técnico a cargo: ${detail.tecnicoACargo?.nombre ?? 'sin asignar'}. Se recargó la lista.`); }
        catch { setNotice('La incidencia cambió. Actualiza la lista para consultar quién la tiene.'); }
      } else setError(e instanceof Error ? e.message : 'No se pudo completar la operación.');
    } finally { setBusy(false); }
  }
  if (employee && !soloReportar && !allowed) return <h1 className="p-6">Acceso denegado</h1>;
  return <main className="min-h-screen bg-[#F8F6F0] p-4 sm:p-6 text-[#18345C]">
    <header className="flex flex-wrap justify-between gap-3"><h1 className="text-[32px] font-semibold">Incidencias</h1><div className="flex gap-3"><a href="/panel" className="rounded-md border px-4 py-2">Mi panel</a><button onClick={() => setReload(n => n + 1)} disabled={loading || busy} className="rounded-md border px-4 py-2">Actualizar</button><button disabled={loading || !rooms.length} onClick={() => setReportar(true)} className="rounded-md bg-[#18345C] text-white px-4 py-2">Reportar daño</button></div></header>
    {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-red-800">{error}</p>}{loading && <p role="status" className="mt-4">Consultando incidencias…</p>}
    {notice && <p role="status" className="mt-3 rounded-lg bg-amber-50 p-3">{notice}</p>}
    {!loading && <p className="mt-3 text-sm">El reporte desde esta área requiere el catálogo de habitaciones del API. Por ahora solo están disponibles las habitaciones de las incidencias consultadas; Recepción puede reportar desde su tablero.</p>}
    {!soloReportar && !loading && !error && !incidencias.length && <p className="mt-4">No hay incidencias pendientes.</p>}
    <div className="mt-5 grid gap-4 md:grid-cols-2">{incidencias.filter(i => ['REPORTADA', 'EN_PROCESO'].includes(i.estado)).sort((a, b) => Date.parse(a.reportadaEn) - Date.parse(b.reportadaEn)).map(item => <article key={item.id} className="rounded-xl border border-[#E5E0D8] bg-white p-4 space-y-2">
      <h2 className="text-xl font-semibold">Habitación {item.habitacion.numero} · Piso {item.habitacion.piso}</h2><p>{item.descripcion}</p>
      <p>{item.estado === 'REPORTADA' ? 'Reportada' : 'En proceso'} · {item.habitacionOcupada ? 'Ocupada' : 'Libre'}{item.impideUso ? ' · Impide usar la habitación' : ''}</p>
      {item.fotoUrl && <img referrerPolicy="no-referrer" src={item.fotoUrl} alt="Foto del daño reportado" className="max-h-48 rounded-lg" />}
      <p className="text-sm">Reportó {item.reportadaPor.nombre} · {new Date(item.reportadaEn).toLocaleString('es-GT', { timeZone: 'America/Guatemala' })}</p><p>Técnico: {item.tecnicoACargo?.nombre ?? 'Sin asignar'}</p>
      {item.estado === 'REPORTADA' && <button disabled={busy} onClick={() => void action(item, 'tomar')} className="rounded-md bg-[#18345C] text-white px-4 py-2">Tomar</button>}
      {item.estado === 'EN_PROCESO' && item.tecnicoACargo?.id === employee?.id && <button disabled={busy} onClick={() => { setResolver(item); setSolucion(''); }} className="rounded-md bg-[#18345C] text-white px-4 py-2">Resolver</button>}
    </article>)}</div>
    {reportar && <ReportarIncidencia rooms={rooms} cerrar={() => setReportar(false)} creado={() => setReload(n => n + 1)} />}
    {resolver && <form onSubmit={e => { e.preventDefault(); void action(resolver, 'resolver'); }} role="dialog" aria-label="Resolver incidencia" className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><div className="rounded-xl bg-white p-5 space-y-3 w-full max-w-lg"><h2 className="text-xl font-semibold">Resolver incidencia</h2><label className="block">Solución<textarea required maxLength={2000} value={solucion} onChange={e => setSolucion(e.target.value)} className="block w-full border rounded-md p-2" /></label><button type="button" disabled={busy} onClick={() => setResolver(undefined)} className="border rounded-md px-4 py-2">Cancelar</button><button disabled={busy} className="ml-3 rounded-md bg-[#18345C] text-white px-4 py-2">Guardar solución</button></div></form>}
  </main>;
}
