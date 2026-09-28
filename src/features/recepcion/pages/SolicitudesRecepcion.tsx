import { useEffect, useMemo, useState } from 'react';
import type { SolicitudHuesped, Huesped, Reserva, EstadoSolicitudHuesped, PrioridadSolicitud, AreaSolicitud, } from '@/lib/pms/types';
import { formatoFechaHora } from '@/data/pms';
import { guardarReservas, leerReservas } from '@/store/reservationStore';
import { Chip, SOLICITUD_META, PRIORIDAD_META, Campo, INPUT_CLS, PlusIcon, CloseIcon, } from '@/features/recepcion/pages/recUtils';
const PRIORIDADES: PrioridadSolicitud[] = ['alta', 'media', 'baja'];
const TIPOS_SOLICITUD: {
  nombre: string;
  area: AreaSolicitud;
  descripcion: string;
}[] = [
    { nombre: 'Transporte al aeropuerto', area: 'Recepción', descripcion: 'Reservar transporte al aeropuerto.' },
    { nombre: 'Transporte desde el aeropuerto', area: 'Recepción', descripcion: 'Reservar transporte desde el aeropuerto.' },
    { nombre: 'Taxi', area: 'Recepción', descripcion: 'Solicitar taxi según destino.' },
    { nombre: 'Reserva de transporte', area: 'Recepción', descripcion: 'Reservar servicio de transporte.' },
    { nombre: 'Cambio o consulta de reserva', area: 'Recepción', descripcion: 'Solicita apoyo con su reserva.' },
    { nombre: 'Otra gestión', area: 'Recepción', descripcion: '' },
  ];
const SIGUIENTE: Record<EstadoSolicitudHuesped, EstadoSolicitudHuesped | null> = {
  'pendiente': 'en-proceso',
  'en-proceso': 'atendida',
  'atendida': null,
};
interface Props {
  solicitudes: SolicitudHuesped[];
  huespedes: Huesped[];
  reservas: Reserva[];
  habitaciones: {
    id: string;
    numero: string;
    piso: number;
  }[];
  onRegistrar: (s: Omit<SolicitudHuesped, 'id' | 'fecha' | 'estado'>) => void;
  onCambiarEstado: (id: string, estado: EstadoSolicitudHuesped) => void;
}
export default function SolicitudesRecepcion({ solicitudes, huespedes, reservas, habitaciones, onRegistrar, onCambiarEstado, }: Props) {
  const [creando, setCreando] = useState(false);
  const [huespedId, setHuespedId] = useState('');
  const [buscarHuesped, setBuscarHuesped] = useState('');
  const [habitacion, setHabitacion] = useState('');
  const [descripcion, setDescripcion] = useState(TIPOS_SOLICITUD[0].descripcion);
  const [tipoSolicitud, setTipoSolicitud] = useState(TIPOS_SOLICITUD[0].nombre);
  const [area, setArea] = useState<AreaSolicitud>('Recepción');
  const [prioridad, setPrioridad] = useState<PrioridadSolicitud>('media');
  const [err, setErr] = useState('');
  const [solicitudExtension, setSolicitudExtension] = useState<any>(null);
  const [detalleExtension, setDetalleExtension] = useState(false);
  const [estadoPortal, setEstadoPortal] = useState<Record<string, EstadoSolicitudHuesped>>({});
  const [correcciones, setCorrecciones] = useState<any[]>([]);
  const [transportes, setTransportes] = useState<any[]>([]);
  const [tarifasTransporte, setTarifasTransporte] = useState<Record<string, string>>({});
  useEffect(() => {
    const cargar = () => {
      try {
        setSolicitudExtension(JSON.parse(localStorage.getItem('vs-solicitud-extension') || 'null'));
        setCorrecciones(JSON.parse(localStorage.getItem('vs-correcciones-huesped') || '[]'));
        setTransportes(JSON.parse(localStorage.getItem('vs-solicitudes-transporte') || '[]'));
      }
      catch { }
    };
    cargar();
    const id = window.setInterval(cargar, 1500);
    return () => window.clearInterval(id);
  },
    []);
  function confirmarTarifaTransporte(id: string) {
    const tarifa = Number(tarifasTransporte[id]);
    if (!Number.isFinite(tarifa) || tarifa <= 0)
      return;
    const actualizados = transportes.map(t => t.id === id ? { ...t, tarifa, estadoTarifa: 'confirmada', confirmadaEn: new Date().toISOString() } : t);
    setTransportes(actualizados);
    localStorage.setItem('vs-solicitudes-transporte', JSON.stringify(actualizados));
  }
  function aceptarCancelacionExtension() {
    if (!solicitudExtension)
      return;
    const actualizada = { ...solicitudExtension, estado: 'cancelacion-aceptada', atendidaEn: new Date().toISOString() };
    localStorage.setItem('vs-solicitud-extension', JSON.stringify(actualizada));
    setSolicitudExtension(actualizada);
  }
  const conflictoExtension = useMemo(() => {
    if (!solicitudExtension?.nuevaSalida || !solicitudExtension?.salidaActual)
      return false;
    const hab = habitaciones.find(h => h.numero === String(solicitudExtension.habitacion));
    if (!hab)
      return false;
    return reservas.some(r => r.codigo !== solicitudExtension.id && r.habitacionId === hab.id && r.estado !== 'cancelada' && r.fechaEntrada < solicitudExtension.nuevaSalida && r.fechaSalida > solicitudExtension.salidaActual);
  },
    [solicitudExtension, habitaciones, reservas]);
  function resolverExtension(aprobada: boolean) {
    if (!solicitudExtension)
      return;
    if (aprobada && conflictoExtension)
      return;
    if (aprobada) {
      const actuales = leerReservas();
      const actualizados = actuales.map(r => r.codigo === solicitudExtension.id ? { ...r, fechaSalida: solicitudExtension.nuevaSalida } : r);
      guardarReservas(actualizados);
    }
    const actualizada = { ...solicitudExtension, estado: aprobada ? 'extension-aprobada' : 'extension-rechazada', atendidaEn: new Date().toISOString() };
    localStorage.setItem('vs-solicitud-extension', JSON.stringify(actualizada));
    setSolicitudExtension(actualizada);
    setDetalleExtension(false);
  }
  const huespedDe = useMemo(() => {
    const m = new Map<string, Huesped>();
    huespedes.forEach(h => m.set(h.id, h));
    return m;
  }, [huespedes]);
  const pisos = useMemo(() => [...new Set(habitaciones.map(h => h.piso))].sort((a, b) => a - b), [habitaciones]);
  const [piso, setPiso] = useState('');
  const habitacionesDelPiso = useMemo(() => habitaciones.filter(h => String(h.piso) === piso), [habitaciones, piso]);
  function seleccionarHabitacion(numero: string) {
    setHabitacion(numero);
    const hab = habitaciones.find(h => h.numero === numero);
    const reserva = hab ? reservas.find(r => r.habitacionId === hab.id && (r.estado === 'en-curso' || r.estado === 'confirmada')) : undefined;
    const huesped = reserva ? huespedes.find(h => h.id === reserva.huespedId) : undefined;
    setHuespedId(huesped?.id ?? '');
    setBuscarHuesped(huesped?.nombre ?? '');
    setErr('');
  }
  function registrar() {
    if (!huespedId)
      return setErr('Selecciona un huésped.');
    if (!habitacion.trim())
      return setErr('Indica la habitación.');
    if (!descripcion.trim())
      return setErr('Describe la solicitud.');
    onRegistrar({
      huespedId,
      habitacionNumero: habitacion.trim(),
      descripcion: descripcion.trim(),
      area,
      prioridad,
    });
    setHuespedId('');
    setBuscarHuesped('');
    setHabitacion('');
    setPiso('');
    setDescripcion(TIPOS_SOLICITUD[0].descripcion);
    setTipoSolicitud(TIPOS_SOLICITUD[0].nombre);
    setArea('Recepción');
    setPrioridad('media');
    setErr('');
    setCreando(false);
  }
  const visibles = solicitudes
    .filter(s => s.area === 'Recepción')
    .slice()
    .sort((a, b) => b.fecha.localeCompare(a.fecha));
  const gestionesPortal = reservas.flatMap(r => (r.actividadPortal ?? []).filter(a => a.categoria === 'Recepción' && a.tipo === 'pedido' && a.estado !== 'Cancelado').map(a => ({ actividad: a, reserva: r, huesped: huespedDe.get(r.huespedId) }))).sort((a, b) => b.actividad.fechaHora.localeCompare(a.actividad.fechaHora));
  const extensionPendiente = solicitudExtension?.estado === 'extension-pendiente' || solicitudExtension?.estado === 'cancelacion-pendiente';
  const pendientes = visibles.filter(s => s.estado !== 'atendida').length + gestionesPortal.filter(g => (estadoPortal[g.actividad.id] ?? 'pendiente') !== 'atendida').length + correcciones.filter(c => c.estado === 'pendiente').length + transportes.filter(t => t.estadoTarifa === 'pendiente').length + (extensionPendiente ? 1 : 0);
  const totalGestiones = visibles.length + gestionesPortal.length + correcciones.length + transportes.length + (extensionPendiente ? 1 : 0);
  return (<div className="flex-1 overflow-y-auto bg-[#F8F6F0]" style={{ fontFamily: '"Afacad", "Segoe UI", Arial, sans-serif' }}>
    <div className="px-4 sm:px-6 py-5 bg-white border-b border-[#E5E0D8]">
      <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
        <div>
          <h1 className="text-[32px] font-semibold text-[#18345C] leading-tight">Gestiones de Recepción</h1>
          <p className="text-[15px] text-[#AEBCC1] mt-1">{pendientes} sin atender · {totalGestiones} asignadas a Recepción</p>
        </div>
        <button
          onClick={() => setCreando(true)}
          className="flex items-center gap-2 px-4 py-2.5 text-[15px] font-semibold bg-[#18345C] text-white rounded-md hover:bg-[#102747] transition-colors">
          <PlusIcon />
          Nueva solicitud
        </button>
      </div>

    </div>

    <div className="px-4 sm:px-6 py-5 space-y-3">
      {transportes.map(t => <section key={t.id} className="rounded-xl border border-[#BFD4EA] bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-semibold text-[#18345C]">
                {t.servicio}
              </h2>
              <Chip cls={t.estadoTarifa === 'confirmada' ? 'bg-[#F0FAF4] text-[#166534] border-[#86EFAC]' : 'bg-[#FFF7DD] text-[#8A6200] border-[#E7D49B]'}>
                {t.estadoTarifa === 'confirmada' ? 'Tarifa confirmada' : 'Tarifa pendiente de confirmación'}
              </Chip>
            </div>
            <p className="mt-1 text-sm text-[#52677F]">Habitación {t.habitacion}</p>
            {t.detalle && <p className="mt-2 text-sm text-[#1F2933]">
              {t.detalle}
            </p>}
            <p className="mt-2 text-xs text-[#AEBCC1]">Área responsable: Recepción · La tarifa depende del recorrido, destino o servicio. Room Service no recibe solicitudes de transporte.</p>
            {t.estadoTarifa === 'confirmada' && <><p className="mt-3 text-lg font-semibold text-[#18345C]">Tarifa confirmada: Q {Number(t.tarifa).toLocaleString()}</p><p className="mt-1 text-sm text-[#52677F]">
              {t.aceptacionHuesped === 'aceptada' ? 'Aceptada por el huésped · cargar a la cuenta de la habitación.' : 'Pendiente de aceptación del huésped · todavía no cargar.'}
            </p></>}
          </div>
          {t.estadoTarifa === 'pendiente' && <div className="w-full max-w-xs rounded-lg bg-[#F8F6F0] p-3">
            <Campo label="Tarifa a confirmar (Q)">
              <input
                type="number"
                min="1"
                step="1"
                value={tarifasTransporte[t.id] ?? ''}
                onChange={e => setTarifasTransporte(v => ({ ...v, [t.id]: e.target.value }))}
                className={`${INPUT_CLS} border-[#EEE9E1] shadow-none`} />
            </Campo>
            <button
              onClick={() => confirmarTarifaTransporte(t.id)}
              disabled={!Number(tarifasTransporte[t.id])}
              className="mt-2 w-full rounded-md bg-[#18345C] px-3 py-2 text-sm font-semibold text-white disabled:opacity-40">Confirmar tarifa</button>
          </div>}
        </div>
      </section>)}
      {correcciones.map(c => <section key={c.id} className="rounded-xl border border-[#E7D49B] bg-white p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-[#18345C]">Corrección de datos del huésped</h2>
              <Chip cls={c.estado === 'pendiente' ? 'bg-[#FFF7DD] text-[#8A6200] border-[#E7D49B]' : 'bg-[#F0FAF4] text-[#166534] border-[#86EFAC]'}>
                {c.estado === 'pendiente' ? 'Pendiente' : 'Atendida'}
              </Chip>
            </div>
            <p className="mt-2 font-semibold">
              {c.huesped}
            </p>
            <p className="mt-1 text-sm text-[#52677F]">
              <b>Dato:</b>
              {c.dato}
            </p>
            <p className="text-sm text-[#52677F]">
              <b>Actual:</b>
              {c.actual}
            </p>
            <p className="text-sm text-[#52677F]">
              <b>Solicita:</b>
              {c.nuevo}
            </p>
            {c.motivo && <p className="mt-2 text-sm">
              <b>Motivo:</b>
              {c.motivo}
            </p>}
          </div>
          {c.estado === 'pendiente' && <button
            onClick={() => {
              const next = correcciones.map(x => x.id === c.id ? { ...x, estado: 'atendida' } : x);
              setCorrecciones(next);
              localStorage.setItem('vs-correcciones-huesped', JSON.stringify(next));
            }}
            className="rounded-lg bg-[#18345C] px-4 py-2 text-sm font-semibold text-white">Marcar atendida</button>}
        </div>
      </section>)}
      {solicitudExtension?.estado === 'cancelacion-pendiente' && <section className="rounded-xl border border-[#F2B8B8] bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold text-[#18345C]">Cancelación de extensión de estancia</h2>
              <Chip cls="bg-[#FEF2F2] text-[#991B1B] border-[#FCA5A5]">Pendiente</Chip>
            </div>
            <p className="mt-2 font-semibold text-[#18345C]">{solicitudExtension.huesped} · Hab. {solicitudExtension.habitacion}</p>
            <p className="mt-1 text-sm text-[#52677F]">Solicitó extender hasta {solicitudExtension.nuevaSalida}.</p>
            <p className="mt-3 rounded-lg bg-[#F8F6F0] p-3 text-sm">
              <b>Motivo de cancelación:</b>
              {solicitudExtension.motivo}
            </p>
          </div>
          <button onClick={aceptarCancelacionExtension} className="rounded-lg bg-[#18345C] px-5 py-3 font-semibold text-white">Aceptar cancelación</button>
        </div>
      </section>}
      {solicitudExtension?.estado === 'extension-pendiente' && <button
        type="button"
        onClick={() => setDetalleExtension(true)}
        className="w-full rounded-xl border border-[#E7D49B] bg-white p-4 text-left shadow-sm transition hover:border-[#C89B2B] hover:shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-[#18345C]">Solicitud de extensión</h2>
            <p className="mt-1 text-sm text-[#52677F]">{solicitudExtension.huesped} · Hab. {solicitudExtension.habitacion} · {solicitudExtension.noches} noches · Q {Number(solicitudExtension.estimacion).toLocaleString()}</p>
            <p className="mt-1 text-xs font-medium text-[#8A6819]">Abrir para revisar y responder</p>
          </div>
          <Chip cls="bg-[#FFF7DD] text-[#8A6200] border-[#E7D49B]">Pendiente de aprobación</Chip>
        </div>
      </button>}
      {gestionesPortal.map(g => {
        const estado: EstadoSolicitudHuesped = estadoPortal[g.actividad.id] ?? 'pendiente';
        const siguiente = SIGUIENTE[estado];
        return <div key={g.actividad.id} className="rounded-xl border border-[#BFD4EA] bg-white p-4">
          <div className="flex items-start gap-3">
            <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-[#D8B94E]" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-[#18345C]">{g.huesped?.nombre ?? 'Huésped'} · Hab. {reservasHabNumero(g.reserva, reservas)}</p>
                <Chip cls={SOLICITUD_META[estado].chip}>
                  {SOLICITUD_META[estado].label}
                </Chip>
                <Chip cls="bg-[#EFF6FF] text-[#1E40AF] border-[#93C5FD]">Desde el portal</Chip>
              </div>
              <p className="mt-1.5 text-sm">
                {g.actividad.detalle}
              </p>
              <p className="mt-1 text-xs text-[#AEBCC1]">Enviada {formatoFechaHora(g.actividad.fechaHora)} · Reserva {g.reserva.codigo}</p>
            </div>
            {siguiente && <button
              onClick={() => setEstadoPortal(v => ({ ...v, [g.actividad.id]: siguiente }))}
              className="shrink-0 rounded-md border border-[#18345C] px-3 py-2 text-xs font-semibold text-[#18345C]">
              {siguiente === 'en-proceso' ? 'Marcar en proceso' : 'Marcar atendida'}
            </button>}
          </div>
        </div>;
      })}
      {visibles.length === 0 && gestionesPortal.length === 0 && correcciones.length === 0 && transportes.length === 0 && !extensionPendiente ? (<div className="bg-white border border-[#E5E0D8] rounded-xl p-6 text-center">
        <p className="text-[15px] text-[#AEBCC1]">No hay gestiones pendientes para Recepción.</p>
      </div>) : (visibles.map(s => {
        const h = huespedDe.get(s.huespedId);
        const pm = PRIORIDAD_META[s.prioridad];
        const sm = SOLICITUD_META[s.estado];
        const siguiente = SIGUIENTE[s.estado];
        return (<div key={s.id} className="bg-white border border-[#E5E0D8] rounded-xl p-4">
          <div className="flex items-start gap-3">
            <span className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: pm.dot }} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-[15px] font-semibold text-[#18345C]">
                  {h?.nombre ?? 'Huésped'} · Hab. {s.habitacionNumero}
                </p>
                <Chip cls={pm.chip}>
                  {pm.label}
                </Chip>
                <Chip cls={sm.chip}>
                  {sm.label}
                </Chip>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md border border-[#CBD5E1] text-[#475569] bg-[#F1F5F9] uppercase tracking-wide">
                  {s.area}
                </span>
              </div>
              <p className="text-[14px] text-[#1F2933] mt-1.5">
                {s.descripcion}
              </p>
              <p className="text-[12px] text-[#AEBCC1] mt-1">
                Registrada {formatoFechaHora(s.fecha)} · enviada a {s.area}
              </p>
            </div>
            {siguiente && (<button
              onClick={() => onCambiarEstado(s.id, siguiente)}
              className="shrink-0 text-[13px] font-semibold px-3 py-2 border border-[#18345C] text-[#18345C] rounded-md hover:bg-[#18345C] hover:text-white transition-colors">
              {siguiente === 'en-proceso' ? 'Marcar en proceso' : 'Marcar atendida'}
            </button>)}
          </div>
        </div>);
      }))}
    </div>

    {detalleExtension && solicitudExtension?.estado === 'extension-pendiente' && (<div className="fixed inset-0 z-50 grid place-items-center bg-black/35 p-4">
      <section className="w-full max-w-[560px] rounded-2xl bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-[#EEE9E1] px-5 py-4">
          <div>
            <h2 className="text-xl font-semibold text-[#18345C]">Solicitud de extensión</h2>
            <p className="text-sm text-[#71839B]">Revisa disponibilidad, fechas e importe.</p>
          </div>
          <button onClick={() => setDetalleExtension(false)} className="text-[#93A3B3]">
            <CloseIcon />
          </button>
        </header>
        <div className="grid gap-3 p-5 sm:grid-cols-2 text-sm">
          <div>
            <span className="text-[#93A3B3]">Huésped</span>
            <b className="block text-[#18345C]">
              {solicitudExtension.huesped}
            </b>
          </div>
          <div>
            <span className="text-[#93A3B3]">Habitación</span>
            <b className="block text-[#18345C]">
              {solicitudExtension.habitacion}
            </b>
          </div>
          <div>
            <span className="text-[#93A3B3]">Salida actual</span>
            <b className="block text-[#18345C]">
              {solicitudExtension.salidaActual}
            </b>
          </div>
          <div>
            <span className="text-[#93A3B3]">Nueva salida solicitada</span>
            <b className="block text-[#18345C]">
              {solicitudExtension.nuevaSalida}
            </b>
          </div>
          <div>
            <span className="text-[#93A3B3]">Noches adicionales</span>
            <b className="block text-[#18345C]">
              {solicitudExtension.noches}
            </b>
          </div>
          <div>
            <span className="text-[#93A3B3]">Importe estimado</span>
            <b className="block text-[#18345C]">Q {Number(solicitudExtension.estimacion).toLocaleString()}</b>
          </div>
          <div className={`sm:col-span-2 rounded-lg border px-3 py-2 ${conflictoExtension ? 'border-[#F2B8B5] bg-[#FFF5F5] text-[#991B1B]' : 'border-[#B9DFC8] bg-[#F3FBF6] text-[#166534]'}`}>
            {conflictoExtension ? 'No hay disponibilidad: existe otra reserva que se cruza con las fechas solicitadas.' : 'Disponibilidad verificada: la habitación no presenta cruces para la extensión.'}
          </div>
        </div>
        <footer className="flex justify-end gap-2 border-t border-[#EEE9E1] px-5 py-4">
          <button onClick={() => resolverExtension(false)} className="rounded-lg border border-[#D9D3CA] px-4 py-2 text-sm font-semibold text-[#52677F]">Rechazar</button>
          <button
            disabled={conflictoExtension}
            onClick={() => resolverExtension(true)}
            className="rounded-lg bg-[#18345C] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">Aprobar extensión</button>
        </footer>
      </section>
    </div>)}

    {creando && (<div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-black/40" onClick={() => setCreando(false)} />
      <div className="relative z-10 bg-[#FFFEFC] rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-lg max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E0D8] sticky top-0 bg-white">
          <h2 className="text-[22px] font-semibold text-[#18345C]">Nueva solicitud</h2>
          <button onClick={() => setCreando(false)} className="text-[#AEBCC1] hover:text-[#1F2933] p-1">
            <CloseIcon />
          </button>
        </div>

        <div className="px-5 py-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Campo label="Piso">
              <select
                value={piso}
                onChange={e => {
                  setPiso(e.target.value);
                  setHabitacion('');
                  setHuespedId('');
                  setBuscarHuesped('');
                }}
                className={`${INPUT_CLS} border-[#EEE9E1] shadow-none`}>
                <option value="">Seleccionar piso</option>
                {pisos.map(n => <option key={n} value={n}>Piso {n}</option>)}
              </select>
            </Campo>
            <Campo label="Habitación">
              <select
                disabled={!piso}
                value={habitacion}
                onChange={e => seleccionarHabitacion(e.target.value)}
                className={`${INPUT_CLS} border-[#EEE9E1] shadow-none disabled:bg-[#F8F6F0]`}>
                <option value="">Seleccionar habitación</option>
                {habitacionesDelPiso.map(h => <option key={h.id} value={h.numero}>Habitación {h.numero}</option>)}
              </select>
            </Campo>
          </div>
          <Campo label="Huésped">
            <input value={buscarHuesped} readOnly className={`${INPUT_CLS} border-[#EEE9E1] bg-[#FAF9F6] shadow-none`} />
          </Campo>
          <Campo label="Tipo de solicitud">
            <select
              value={tipoSolicitud}
              onChange={e => {
                const tipo = TIPOS_SOLICITUD.find(t => t.nombre === e.target.value)!;
                setTipoSolicitud(tipo.nombre);
                setArea(tipo.area);
                setDescripcion(tipo.descripcion);
              }}
              className={`${INPUT_CLS} border-[#EEE9E1] shadow-none`}>
              {TIPOS_SOLICITUD.map(t => <option key={t.nombre}>
                {t.nombre}
              </option>)}
            </select>
          </Campo>
          <Campo label={tipoSolicitud === 'Otra gestión' ? 'Otra solicitud' : 'Descripción de la solicitud'}>
            <textarea
              rows={2}
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              className={INPUT_CLS + ' resize-none border-[#EEE9E1] shadow-none'} />
          </Campo>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Campo label="Área responsable">
              <select value={area} onChange={e => setArea(e.target.value as AreaSolicitud)} className={`${INPUT_CLS} border-[#EEE9E1] shadow-none`}>
                <option value="Recepción">Recepción</option>
                <option value="Limpieza">Limpieza</option>
                <option value="Room Service">Room Service</option>
                <option value="Mantenimiento">Mantenimiento</option>
              </select>
            </Campo>
            <Campo label="Prioridad">
              <select value={prioridad} onChange={e => setPrioridad(e.target.value as PrioridadSolicitud)} className={`${INPUT_CLS} border-[#EEE9E1] shadow-none`}>
                {PRIORIDADES.map(p => <option key={p} value={p}>
                  {PRIORIDAD_META[p].label}
                </option>)}
              </select>
            </Campo>
          </div>
          {err && <p className="text-xs text-[#991B1B]">
            {err}
          </p>}
        </div>

        <div className="px-5 pb-6 flex gap-3">
          <button
            onClick={() => setCreando(false)}
            className="flex-1 py-3 text-sm border border-[#E5E0D8] text-[#6B7280] rounded-md hover:bg-[#F8F6F0] transition-colors">
            Cancelar
          </button>
          <button onClick={registrar} className="flex-1 py-3 text-sm font-semibold bg-[#18345C] text-white rounded-md hover:bg-[#102747] transition-colors">
            Registrar y enviar
          </button>
        </div>
      </div>
    </div>)}
  </div>);
}
function reservasHabNumero(reserva: Reserva, _reservas: Reserva[]): string {
  if (!reserva.habitacionId)
    return '';
  const m = reserva.habitacionId.match(/hh-(.+)/);
  return m ? m[1] : '';
}
function BtnArea({ activo, onClick, children, }: {
  activo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (<button
    onClick={onClick}
    className={`text-[13px] font-medium px-3 py-1.5 rounded-md border transition-colors ${activo ? 'bg-[#18345C] text-white border-[#18345C]' : 'bg-white text-[#6B7280] border-[#E5E0D8] hover:bg-[#F8F6F0]'}`}>
    {children}
  </button>);
}
