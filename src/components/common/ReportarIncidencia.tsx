'use client';
import { useState } from 'react';
import { operacion } from '@/lib/api/operaciones';
import { validarFoto } from '@/lib/incidenciaValidation';
import type { components } from '@/lib/api/schema';
type Room = components['schemas']['HabitacionOperativa'];
export default function ReportarIncidencia({ rooms, selected, cerrar, creado }: { rooms: Room[]; selected?: number; cerrar: () => void; creado: () => void }) {
  const [room, setRoom] = useState(String(selected ?? '')), [descripcion, setDescripcion] = useState(''), [impideUso, setImpideUso] = useState(false);
  const [foto, setFoto] = useState<File>(), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  async function reportar(event: React.FormEvent) {
    event.preventDefault(); if (busy) return;
    if (!room || !descripcion.trim()) { setError('Selecciona habitación y describe el daño.'); return; }
    if (foto && validarFoto(foto)) { setError(validarFoto(foto)); return; }
    setBusy(true); setError('');
    try {
      let fotoClave: string | undefined;
      if (foto) {
        const form = new FormData(); form.set('archivo', foto); form.set('uso', 'INCIDENCIA');
        fotoClave = (await operacion<components['schemas']['ImagenSubida']>('archivos/imagenes', 'POST', form)).clave;
      }
      await operacion('incidencias', 'POST', { habitacionId: Number(room), descripcion: descripcion.trim(), impideUso, ...(fotoClave ? { fotoClave } : {}) });
      creado(); cerrar();
    } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo reportar el daño.'); }
    finally { setBusy(false); }
  }
  const control = 'block w-full rounded-md border border-[#E5E0D8] p-2 mt-1';
  return <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40"><form onSubmit={reportar} role="dialog" aria-modal="true" aria-label="Reportar daño" className="max-h-[90vh] overflow-y-auto w-full max-w-lg rounded-xl bg-white p-5 space-y-4 text-[#18345C]">
    <h2 className="text-2xl font-semibold">Reportar daño</h2>
    <label className="block">Habitación<select required value={room} onChange={e => setRoom(e.target.value)} className={control}><option value="">Selecciona una habitación</option>{rooms.map(r => <option key={r.id} value={r.id}>{r.numero} · Piso {r.piso}</option>)}</select></label>
    <label className="block">Descripción<textarea required maxLength={2000} value={descripcion} onChange={e => setDescripcion(e.target.value)} className={control} /></label>
    <label className="flex gap-2"><input type="checkbox" checked={impideUso} onChange={e => setImpideUso(e.target.checked)} />¿Impide usar la habitación?</label>
    <label className="block">Foto opcional (JPG o PNG, hasta 5 MB)<input type="file" accept="image/jpeg,image/png" className={control} onChange={e => { const file = e.target.files?.[0]; setFoto(file); setError(file ? validarFoto(file) : ''); }} /></label>
    {error && <p role="alert" className="text-red-800">{error}</p>}
    <div className="flex gap-3"><button type="button" disabled={busy} onClick={cerrar} className="rounded-md border px-4 py-2">Cancelar</button><button disabled={busy || !!(foto && validarFoto(foto))} className="rounded-md bg-[#18345C] text-white px-4 py-2">{busy ? 'Enviando…' : 'Reportar daño'}</button></div>
  </form></div>;
}
