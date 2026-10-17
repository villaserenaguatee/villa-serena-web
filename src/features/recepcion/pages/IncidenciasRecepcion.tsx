import { useEffect, useRef, useState } from 'react';
import { getRooms } from '@/lib/api/reception';
import type { RoomState } from '@/lib/bff/contracts/reception';
import { validarFoto } from '@/lib/incidenciaValidation';
import ReceptionCloseButton from './ReceptionCloseButton';

async function enviar(ruta: string, body: FormData | object) {
  const response = await fetch(ruta, { method: 'POST', credentials: 'same-origin',
    ...(body instanceof FormData ? { body } : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }) });
  const value = await response.json().catch(() => null);
  if (!response.ok) throw new Error(value?.mensaje ?? 'No se pudo completar el registro. Intenta nuevamente.');
  return value;
}

export default function IncidenciasRecepcion() {
  const [rooms, setRooms] = useState<RoomState[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [piso, setPiso] = useState('');
  const [room, setRoom] = useState('');
  const [description, setDescription] = useState('');
  const [blocking, setBlocking] = useState(false);
  const [photo, setPhoto] = useState<File>();
  const [photoKey, setPhotoKey] = useState<string>();
  const [preview, setPreview] = useState('');
  const photoInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!photo || validarFoto(photo)) { setPreview(''); return; }
    const url = URL.createObjectURL(photo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  useEffect(() => {
    let active = true;
    getRooms().then(value => { if (active) setRooms(value); })
      .catch(e => { if (active) setError(e instanceof Error ? e.message : 'No se pudieron consultar las habitaciones.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  async function registrar(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (!rooms.some(r => String(r.id) === room) || !description.trim()) { setError('Selecciona una habitación y describe el daño.'); return; }
    if (photo && validarFoto(photo)) { setError(validarFoto(photo)); return; }
    setBusy(true); setError(''); setSuccess('');
    try {
      let clave = photoKey;
      if (photo && !clave) {
        const form = new FormData(); form.set('archivo', photo); form.set('uso', 'INCIDENCIA');
        const uploaded = await enviar('/api/archivos/imagenes', form);
        if (typeof uploaded?.clave !== 'string' || !uploaded.clave) throw new Error('No se pudo obtener la fotografía subida.');
        clave = uploaded.clave; setPhotoKey(clave);
      }
      const result = await enviar('/api/incidencias', { habitacionId: Number(room), descripcion: description.trim(), impideUso: blocking, ...(clave ? { fotoClave: clave } : {}) });
      if (!Number.isInteger(result?.id) || result?.estado !== 'REPORTADA' || result?.habitacionId !== Number(room)) throw new Error('No se pudo comprobar el registro. Consulta con Mantenimiento antes de repetirlo.');
      setSuccess(`Incidencia ${result.id} reportada para la habitación ${rooms.find(r => String(r.id) === room)?.numero}.`);
      setOpen(false); setDescription(''); setBlocking(false); setPhoto(undefined); setPhotoKey(undefined); setRoom(''); setPiso('');
    } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo registrar la incidencia.'); }
    finally { setBusy(false); }
  }
  const input = 'mt-1 w-full rounded-lg border border-[#E5E0D8] bg-white px-3 py-2 text-sm text-[#18345C]';
  return <div className="flex-1 overflow-y-auto bg-[#F8F6F0] p-4 sm:p-6">
    <header className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-3xl font-semibold text-[#18345C]">Incidencias</h1><button disabled={loading || !rooms.length} onClick={() => { setOpen(true); setError(''); setSuccess(''); }} className="rounded-lg bg-[#18345C] px-4 py-2 text-white disabled:opacity-40">+ Nueva incidencia</button></header>
    {loading && <p className="mt-4 text-sm">Consultando habitaciones…</p>}
    {!open && error && <p role="alert" className="mt-4 text-sm text-[#922E2E]">{error}</p>}
    {success && <p role="status" className="mt-4 rounded-lg border border-[#B7DCC2] bg-[#EDF7EF] p-3 text-sm text-[#21603A]">{success}</p>}
    {open && <div className="fixed inset-0 z-50 grid place-items-center bg-[#071D34]/45 p-4"><form onSubmit={registrar} role="dialog" aria-modal="true" aria-label="Reportar incidencia" className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-4 shadow-xl">
      <header className="mb-3 flex items-center justify-between"><h2 className="text-xl font-semibold text-[#18345C]">Reportar incidencia</h2><ReceptionCloseButton disabled={busy} onClick={() => setOpen(false)} /></header>
      <fieldset disabled={busy} className="space-y-3">
        <div className="grid grid-cols-2 gap-3"><label className="text-sm">Piso<select required className={input} value={piso} onChange={e => { setPiso(e.target.value); setRoom(''); }}><option value="">Seleccionar</option>{[...new Set(rooms.map(r => r.piso))].sort((a,b) => a-b).map(p => <option key={p} value={p}>Piso {p}</option>)}</select></label>
        <label className="text-sm">Habitación<select required disabled={!piso || busy} className={input} value={room} onChange={e => setRoom(e.target.value)}><option value="">Seleccionar</option>{rooms.filter(r => String(r.piso) === piso).map(r => <option key={r.id} value={r.id}>Hab. {r.numero}</option>)}</select></label></div>
        <label className="block text-sm">Descripción del daño<textarea required maxLength={2000} rows={3} value={description} onChange={e => setDescription(e.target.value)} className={input} /></label>
        <div className="text-sm">
          <span id="incidencia-imagen-label">Imagen (opcional)</span>
          <input ref={photoInput} aria-labelledby="incidencia-imagen-label" type="file" accept="image/jpeg,image/png" className="hidden" onChange={e => { const file = e.target.files?.[0]; setPhoto(file); setPhotoKey(undefined); setError(file ? validarFoto(file) : ''); e.target.value = ''; }} />
          <div className="mt-1 rounded-lg border border-[#E5E0D8] bg-[#FBFAF6] p-2">
            {preview ? <><img src={preview} alt="Vista previa de la incidencia" className="h-36 w-full rounded-md object-contain" /><div className="mt-2 flex justify-center gap-3"><button type="button" onClick={() => photoInput.current?.click()} className="rounded-md border border-[#E5E0D8] bg-white px-3 py-1.5 text-[#18345C]">Cambiar imagen</button><button type="button" onClick={() => { setPhoto(undefined); setPhotoKey(undefined); setError(''); }} className="rounded-md px-3 py-1.5 text-[#18345C]">Quitar imagen</button></div></>
              : <button type="button" onClick={() => photoInput.current?.click()} className="flex min-h-24 w-full items-center justify-center rounded-md text-[#18345C]">Seleccionar imagen</button>}
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={blocking} onChange={e => setBlocking(e.target.checked)} />Impide utilizar la habitación</label>
      </fieldset>
      {error && <p role="alert" className="mt-3 text-sm text-[#922E2E]">{error}</p>}
      <footer className="mt-4 flex justify-end gap-2"><button type="button" disabled={busy} onClick={() => setOpen(false)} className="rounded-lg border border-[#E5E0D8] px-4 py-2 text-sm text-[#18345C]">Cancelar</button><button disabled={busy} className="rounded-lg bg-[#18345C] px-4 py-2 text-sm text-white disabled:opacity-40">{busy ? 'Registrando…' : 'Registrar incidencia'}</button></footer>
    </form></div>}
  </div>;
}
