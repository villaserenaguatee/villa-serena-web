"use client";
import { useEffect, useState, type FormEvent } from 'react';
import { getPublicCatalog } from '@/lib/api/public';
import { fechaHotel } from '@/lib/hotel';
import { publicSearchError } from '@/lib/publicStayValidation';
import type { RoomTypeDto } from '@/lib/bff/contracts/public';
import type { ChannelInput, ChannelResult } from '@/lib/bff/contracts/channel';

const empty: ChannelInput = { canal: 'BOOKING', reserva: { identificadorExterno: '', tipoHabitacionId: 1, entrada: '', salida: '', numeroHuespedes: 1, montoTotal: 1,
  huesped: { nombreCompleto: '', correo: '', telefono: '', nacionalidad: '', tipoDocumento: 'DPI', numeroDocumento: '' } } };
const control = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900';
const button = 'rounded-lg bg-[#18345C] px-4 py-2 text-white disabled:opacity-50';
export default function ChannelSimulator() {
  const [input, setInput] = useState<ChannelInput>(empty), [catalog, setCatalog] = useState<RoomTypeDto[]>([]);
  const [last, setLast] = useState<ChannelInput | null>(null), [result, setResult] = useState<ChannelResult | null>(null);
  const [error, setError] = useState(''), [busy, setBusy] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    getPublicCatalog(controller.signal).then(setCatalog).catch(e => { if (!controller.signal.aborted) setError(e.message); });
    return () => controller.abort();
  }, []);
  function reservation<K extends keyof ChannelInput['reserva']>(key: K, value: ChannelInput['reserva'][K]) {
    setInput(previous => ({ ...previous, reserva: { ...previous.reserva, [key]: value } }));
  }
  function guest(key: keyof ChannelInput['reserva']['huesped'], value: string) {
    setInput(previous => ({ ...previous, reserva: { ...previous.reserva, huesped: { ...previous.reserva.huesped, [key]: value } } }));
  }
  function randomize() {
    if (!catalog.length) return;
    const type = catalog[Math.floor(Math.random() * catalog.length)], id = crypto.randomUUID();
    const date = new Date(`${fechaHotel()}T12:00:00Z`);
    date.setUTCDate(date.getUTCDate() + 60 + Math.floor(Math.random() * 180));
    const entrada = date.toISOString().slice(0, 10);
    date.setUTCDate(date.getUTCDate() + 2);
    setInput({ canal: Math.random() < .5 ? 'BOOKING' : 'EXPEDIA', reserva: { identificadorExterno: `DEMO-${id}`, tipoHabitacionId: type.id,
      entrada, salida: date.toISOString().slice(0, 10), numeroHuespedes: Math.min(2, type.capacidad), montoTotal: type.precioBaseNoche * 2,
      huesped: { nombreCompleto: 'Huésped de prueba', correo: `demo-${id.slice(0, 8)}@example.com`, telefono: '+502 5555 0100', nacionalidad: 'Guatemala', tipoDocumento: 'PASAPORTE', numeroDocumento: `DEMO${id.slice(0, 8)}` } } });
    setResult(null); setError('');
  }
  async function send(value: ChannelInput) {
    if (busy) return;
    setBusy(true); setError(''); setResult(null);
    try {
      const response = await fetch('/api/admin/canal-simulado/reservas', { method: 'POST', cache: 'no-store', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(value) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.mensaje ?? 'No se pudo enviar la reserva.');
      if (response.headers.get('X-Villa-Serena-Mode') !== 'demo') throw new Error('La conexión real está pendiente de validación.');
      setResult(body); setLast(structuredClone(value));
    } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo enviar la reserva.'); }
    finally { setBusy(false); }
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const type = catalog.find(t => t.id === input.reserva.tipoHabitacionId);
    const reason = type ? publicSearchError(input.reserva.entrada, input.reserva.salida, input.reserva.numeroHuespedes, 0, type.capacidad) : 'Selecciona un tipo de habitación disponible.';
    if (reason) { setError(reason); return; }
    void send(input);
  }
  const accepted = result && [200, 201].includes(result.codigoHttp) && 'estado' in result.respuesta;
  return <section className="mx-auto min-w-0 max-w-4xl space-y-6 break-words text-[#18345C]">
    <div><h1 className="text-2xl font-semibold">Canal simulado</h1><p className="mt-2">Datos de prueba. No se contacta a ningún canal real ni se envían correos.</p></div>
    <form onSubmit={submit} className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-2">
      <label>Canal<select className={control} value={input.canal} onChange={e => setInput(v => ({ ...v, canal: e.target.value as ChannelInput['canal'] }))}><option value="BOOKING">Booking</option><option value="EXPEDIA">Expedia</option></select></label>
      <label>Tipo de habitación<select className={control} disabled={!catalog.length} value={input.reserva.tipoHabitacionId} onChange={e => reservation('tipoHabitacionId', Number(e.target.value))}>{catalog.map(t => <option key={t.id} value={t.id}>{t.nombre} · hasta {t.capacidad} huéspedes</option>)}</select></label>
      <label>Entrada<input required type="date" className={control} value={input.reserva.entrada} onChange={e => reservation('entrada', e.target.value)} /></label>
      <label>Salida<input required type="date" className={control} value={input.reserva.salida} onChange={e => reservation('salida', e.target.value)} /></label>
      <label>Cantidad de huéspedes<input required type="number" min="1" step="1" className={control} value={input.reserva.numeroHuespedes} onChange={e => reservation('numeroHuespedes', Number(e.target.value))} /></label>
      <label>Monto total (Q)<input required type="number" min="0.01" step="0.01" className={control} value={input.reserva.montoTotal} onChange={e => reservation('montoTotal', Number(e.target.value))} /></label>
      <label className="sm:col-span-2">Identificador externo<input required maxLength={60} className={control} value={input.reserva.identificadorExterno} onChange={e => reservation('identificadorExterno', e.target.value)} /></label>
      {(['nombreCompleto', 'correo', 'telefono', 'nacionalidad', 'numeroDocumento'] as const).map((key, i) => <label key={key}>{['Nombre completo', 'Correo', 'Teléfono', 'Nacionalidad', 'Número de documento'][i]}<input required type={key === 'correo' ? 'email' : key === 'telefono' ? 'tel' : 'text'} maxLength={key === 'nombreCompleto' || key === 'correo' ? 150 : key === 'nacionalidad' ? 60 : 30} className={control} value={input.reserva.huesped[key]} onChange={e => guest(key, e.target.value)} /></label>)}
      <label>Tipo de documento<select className={control} value={input.reserva.huesped.tipoDocumento} onChange={e => guest('tipoDocumento', e.target.value)}><option value="DPI">DPI</option><option value="PASAPORTE">Pasaporte</option></select></label>
      <div className="flex flex-wrap gap-3 sm:col-span-2"><button type="button" className={button} disabled={busy || !catalog.length} onClick={randomize}>Llenar al azar</button><button type="submit" className={button} disabled={busy || !catalog.length}>{busy ? 'Enviando…' : 'Enviar reserva de prueba'}</button><button type="button" className={button} disabled={busy || !last} onClick={() => last && void send(last)}>Repetir último envío</button></div>
    </form>
    {error && <p role="alert" className="rounded-lg bg-red-50 p-4 text-red-800">{error}</p>}
    {result && <div role="status" className="rounded-xl border border-slate-200 bg-white p-5"><h2 className="text-xl font-semibold">{accepted ? 'Solicitud aceptada' : 'Solicitud rechazada'} · HTTP {result.codigoHttp} del canal</h2>{'estado' in result.respuesta ? <><p>Código: <strong>{result.respuesta.codigo}</strong></p><p>Reserva de prueba: {result.respuesta.estado} · {result.respuesta.canal}</p><p>Identificador externo: {result.respuesta.identificadorExterno}</p><p>{result.codigoHttp === 200 ? 'Se devolvió la misma reserva, sin crear otra.' : 'Se creó una reserva de prueba.'}</p></> : <p>{result.respuesta.mensaje}</p>}</div>}
  </section>;
}
