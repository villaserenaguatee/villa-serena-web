'use client';
import { useRef, useState } from 'react';
import LostObjectImageField from './LostObjectImageField';
import { operacion } from '@/lib/api/operaciones';
import { validarFoto } from '@/lib/incidenciaValidation';
import type { components } from '@/lib/api/schema';
type Room = components['schemas']['HabitacionOperativa'];
export default function ReportarIncidencia({ rooms, selected, cerrar, creado }: { rooms: Room[]; selected?: number; cerrar: () => void; creado: () => void }) {
  const [room, setRoom] = useState(String(selected ?? '')), [descripcion, setDescripcion] = useState(''), [impideUso, setImpideUso] = useState(false);
  const [floor,setFloor]=useState('');
  const [foto, setFoto] = useState<File>(), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const requestKey=useRef<string|undefined>(undefined);
  const uploadedPhoto=useRef<{file:File;key:string}|undefined>(undefined);
  async function reportar(event: React.FormEvent) {
    event.preventDefault(); if (busy || photoError) return;
    if (!room || !descripcion.trim()) { setError('Selecciona habitación y describe el daño.'); return; }
    if (foto && validarFoto(foto)) { setError(validarFoto(foto)); return; }
    setBusy(true); setError('');
    try {
      let fotoClave: string | undefined = uploadedPhoto.current?.file===foto?uploadedPhoto.current?.key:undefined;
      if (foto && !fotoClave) {
        const form = new FormData(); form.set('archivo', foto); form.set('uso', 'INCIDENCIA');
        fotoClave = (await operacion<components['schemas']['ImagenSubida']>('archivos/imagenes', 'POST', form)).clave;uploadedPhoto.current={file:foto,key:fotoClave};
      }
      await operacion('incidencias', 'POST', { habitacionId: Number(room), descripcion: descripcion.trim(), impideUso, ...(fotoClave ? { fotoClave } : {}) },undefined,requestKey.current??=crypto.randomUUID());
      creado(); cerrar();
    } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo reportar el daño.'); }
    finally { setBusy(false); }
  }
  const control = 'block w-full rounded-md border border-[#E5E0D8] p-2 mt-1';
  return <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40"><form data-vs-ui="compact" data-vs-dialog="compact" data-vs-size="standard" onSubmit={reportar} role="dialog" aria-modal="true" aria-label="Reportar daño" className="max-h-[90vh] overflow-y-auto w-full max-w-lg rounded-xl bg-white p-5 space-y-4 text-[#18345C]">
    <h2 className="text-2xl font-semibold">Reportar daño</h2>
    <div className="grid gap-3 sm:grid-cols-2"><label className="block">Piso<select value={floor} onChange={e=>{setFloor(e.target.value);setRoom('');}} className={control}><option value="">Todos los pisos</option>{Array.from(new Set(rooms.map(r=>r.piso))).sort((a,b)=>a-b).map(p=><option key={p} value={p}>Piso {p}</option>)}</select></label>
    <label className="block">Habitación<select required value={room} onChange={e => setRoom(e.target.value)} className={control}><option value="">Selecciona una habitación</option>{rooms.filter(r=>!floor||String(r.piso)===floor).map(r => <option key={r.id} value={r.id}>{r.numero} · Piso {r.piso}</option>)}</select></label></div>
    <label className="block">Descripción<textarea required maxLength={2000} value={descripcion} onChange={e => setDescripcion(e.target.value)} className={control} /></label>
    <label className="flex gap-2"><input type="checkbox" checked={impideUso} onChange={e => setImpideUso(e.target.checked)} />¿Impide usar la habitación?</label>
    <LostObjectImageField label="Imagen (opcional)" value={foto} disabled={busy} onError={message=>{setPhotoError(message);setError(message);}} onChange={file=>{setFoto(file);uploadedPhoto.current=undefined;}}/>
    {error && <p role="alert" className="text-red-800">{error}</p>}
    <div data-vs-actions="compact" className="flex gap-3"><button type="button" disabled={busy} onClick={cerrar} className="rounded-md border px-4 py-2">Cancelar</button><button disabled={busy || !!photoError || !!(foto && validarFoto(foto))} className="rounded-md bg-[#18345C] text-white px-4 py-2">{busy ? 'Enviando…' : 'Reportar daño'}</button></div>
  </form></div>;
}
