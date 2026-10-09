"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import VillaSerenaLogo from '@/components/common/VillaSerenaLogo';
import GuestCodeLogin from './GuestCodeLogin';
import type { components } from '@/lib/api/schema';
type Detail = components['schemas']['ReservaAppDetalle'];
type Room = components['schemas']['TipoHabitacionPublico'];
const labels: Record<string, string> = { CONFIRMADA: 'Confirmada', PENDIENTE_PAGO: 'Pendiente de pago', EN_ESTADIA: 'En estadía', CANCELADA: 'Cancelada', FINALIZADA: 'Finalizada', APROBADO: 'Aprobado', PENDIENTE: 'Pendiente', FALLIDO: 'Fallido' };
// Copias de las mismas fotografías del catálogo demo, sin depender de la red externa.
const cachedPhotos: Record<string, string> = {
  'photo-1618773928121-c32242e63f39': 'demo-standard.jpg',
  'photo-1564501049412-61c2a3083791': 'demo-superior.jpg',
  'photo-1582719478250-c89cae4dc85b': 'demo-deluxe.jpg',
  'photo-1596394516093-501ba68a0ba6': 'demo-suite-deluxe.jpg',
  'photo-1611892440504-42a792e24d32': 'demo-suite.jpg',
};
function photoSource(original: string) {
  const match = Object.keys(cachedPhotos).find(id => original.startsWith(`https://images.unsplash.com/${id}?`));
  return match ? `/images/${cachedPhotos[match]}` : original;
}
async function request<T>(path: string, input?: object, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`/api/app/${path}`, { cache: 'no-store', signal, ...(input ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) } : {}) });
  if (!response.ok) { const body = await response.json().catch(() => null); throw Object.assign(new Error(body?.mensaje ?? 'No se pudo consultar la reserva. Intenta nuevamente.'), { status: response.status }); }
  return response.status === 204 ? undefined as T : response.json();
}
export default function GuestReservationAccess({ code = '', portalAccess = false }: { code?: string; portalAccess?: boolean }) {
  const [total, setTotal] = useState<number | null>(null);
  const [authorizedSession, setAuthorizedSession] = useState(false);
  const [detail, setDetail] = useState<Detail | null>(null), [room, setRoom] = useState<Room | null>(null);
  const [payment, setPayment] = useState<string>('');
  const [needsAccess, setNeedsAccess] = useState(false), [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [photoFailed, setPhotoFailed] = useState(false);
  async function load(signal?: AbortSignal) {
    setBusy(true); setError(''); setDetail(null); setRoom(null); setPayment(''); setTotal(null); setAuthorizedSession(false); setPhotoFailed(false); setNeedsAccess(false);
    try {
        let own: Detail;
        const context = !portalAccess && await fetch(`/api/reserva-contexto?codigo=${encodeURIComponent(code)}`, { cache: 'no-store', signal });
        if (context && context.ok) {
          const created: components['schemas']['ReservaWebCreada'] = await context.json();
          own = { codigo: created.codigo, entrada: created.entrada, salida: created.salida, estado: created.estado, tipoHabitacion: created.tipoHabitacion, numeroHuespedes: created.numeroHuespedes, horaCheckOut: '12:00', habitacion: null };
          setTotal(created.total);
        } else {
          own = await request<Detail>(`reservas/${encodeURIComponent(code)}`, undefined, signal);
          setAuthorizedSession(true);
          if (portalAccess) { window.location.replace(`/portal?codigo=${encodeURIComponent(code)}`); return; }
        }
        if (own.codigo !== code) throw new Error('No se pudo validar la reserva seleccionada.');
        setDetail(own);
        const response = await fetch(`/api/publico/tipos-habitacion/${own.tipoHabitacion.id}`, { cache: 'no-store', signal });
        if (response.ok) setRoom(await response.json());
        const status = await fetch(`/api/publico/reservas/${encodeURIComponent(own.codigo)}/estado`, { cache: 'no-store', signal });
        if (status.ok) { const value = await status.json(); if (value.codigo === own.codigo) { setPayment(labels[value.estadoPago] ?? 'Sin iniciar'); setDetail({ ...own, estado: value.estadoReserva }); } }
      setNeedsAccess(false);
    } catch (e) { if (!signal?.aborted) { if ((e as { status?: number }).status === 401) setNeedsAccess(true); else setError((e as Error).message); } }
    finally { if (!signal?.aborted) setBusy(false); }
  }
  useEffect(() => { const controller = new AbortController(); void load(controller.signal); return () => controller.abort(); }, [code, portalAccess]);
  const selected = detail?.codigo === code ? detail : null;
  if (needsAccess) return <GuestCodeLogin code={code} />;
  return <main className="guest-reservation-page"><VillaSerenaLogo />
    <section className={`guest-reservation-card${selected ? ' guest-reservation-detail' : ''}`}>
      <h1>Tu reserva</h1>
      {busy && <p role="status">Consultando…</p>}
      {error && <p role="alert">{error}</p>}

      {selected && <>
        <div className="guest-reservation-heading"><span className="guest-reservation-state">{labels[selected.estado] ?? selected.estado}</span><strong>{selected.codigo}</strong></div>
        <div className="guest-reservation-room">
          {room?.fotos[0] && !photoFailed && <img className="guest-reservation-photo" src={photoSource(room.fotos[0])} alt={selected.tipoHabitacion.nombre} onError={() => setPhotoFailed(true)} />}
          {photoFailed && <p>La fotografía no está disponible en este momento.</p>}
          <div><h2>{selected.tipoHabitacion.nombre}</h2>{room && <p>{room.descripcion} · {selected.numeroHuespedes} {selected.numeroHuespedes === 1 ? 'huésped' : 'huéspedes'}</p>}</div>
        </div>
        <dl className="guest-reservation-dates">
          {Object.entries({ Llegada: selected.entrada, Salida: selected.salida, Adultos: '—', Niños: '—', Noches: (Date.parse(selected.salida) - Date.parse(selected.entrada)) / 86400000 }).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
        </dl>
        {(payment || total !== null) && <div className="guest-reservation-payment">{total !== null && <><span>Total</span><strong>{new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' }).format(total)}</strong></>}{payment && <><span>Pago</span><strong>{payment}</strong></>}</div>}
      </>}
      {authorizedSession && !needsAccess && selected && <button className="guest-reservation-link" onClick={async () => { try { await request('cerrar-sesion', {}); setDetail(null); setNeedsAccess(true); } catch (e) { setError((e as Error).message); } }}>Cerrar sesión</button>}
      <Link className="guest-reservation-link" href="/">Volver al inicio</Link>
    </section>
    {selected && <section className="guest-reservation-manage"><h2>Gestiona tu estancia</h2><p>Accede al portal del huésped para hacer tu check-in, solicitar servicios y consultar tu cuenta</p><Link className="reserve-primary" href={`/portal?codigo=${encodeURIComponent(selected.codigo)}`}>Acceder al portal del huésped</Link></section>}
  </main>;
}
