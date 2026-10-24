import GuatemalaPhoneInput from '@/components/common/GuatemalaPhoneInput';
import styles from './NuevaReservaModal.module.css';
import { historicalPassportIssuer } from '@/lib/api/guestCompatibility';
import { validDocument, validNationalPhone } from '@/lib/guestValidation';
import ReceptionCloseButton from './ReceptionCloseButton';
import { useEffect, useRef, useState } from 'react';
import { ReceptionRequestError, receptionFieldErrors, searchGuests, getReceptionAvailability, getAvailableRoomReferences, getRooms } from '@/lib/api/reception';
import { Minus, Plus, Users } from 'lucide-react';
import type { Huesped, HabitacionHotel, Reserva, TipoHabitacion, TipoDocumento, } from '@/lib/pms/types';
import { nochesEntre, fechaHoyISO, fechaRelativaISO, RESERVAS_INICIALES } from '@/data/pms';
import { dinero, Campo, INPUT_CLS, habitacionesDisponibles } from '@/features/recepcion/pages/recUtils';
import { publicRoomForHotelType } from '@/data/publicRooms';
import { fotoHabitacion } from '@/store/roomStore';
const TIPOS: TipoHabitacion[] = ['Standard', 'Superior', 'Deluxe', 'Suite Deluxe', 'Suite'];
interface NuevoHuespedForm {
  nombre: string;
  apellidos: string;
  tipoDocumento: TipoDocumento;
  documento: string;
  paisEmisorPasaporte: string;
  telefono: string;
  prefijo: string;
  correo: string;
  horaLlegada: string;
}
interface Props {
  conectado?: boolean;
  huespedes: Huesped[];
  habitaciones: HabitacionHotel[];
  reservas: Reserva[];
  preset?: {
    entrada?: string;
    salida?: string;
    tipo?: TipoHabitacion;
    tipoHabitacionId?: number;
    habitacionId?: string;
    adultos?: number;
    ninos?: number;
  };
  onCerrar: () => void;
  onVerReserva: (id: string) => void;
  onCrearHuesped: (h: Omit<Huesped, 'id' | 'creadoEn'>) => Huesped | Promise<Huesped>;
  onCrearReserva: (datos: {
    huespedId: string;
    tipoHabitacion: TipoHabitacion;
    tipoHabitacionId?: number;
    solicitudId?: string;
    fechaEntrada: string;
    fechaSalida: string;
    personas: number;
    adultos?: number;
    ninos?: number;
    habitacionId: string | null;
    descuento?: number;
  }) => Promise<Reserva>;
}
export default function NuevaReservaModal({ conectado = false, huespedes: localGuests, habitaciones, reservas, preset, onCerrar, onVerReserva, onCrearHuesped, onCrearReserva, }: Props) {
  const [modoNuevoHuesped, setModoNuevoHuesped] = useState(localGuests.length === 0);
  const [huespedId, setHuespedId] = useState('');
  const [buscarHuesped, setBuscarHuesped] = useState('');
  const [remoteGuests, setRemoteGuests] = useState<Huesped[]>([]);
  const huespedes = conectado ? remoteGuests : localGuests;
  const [guestSearchError, setGuestSearchError] = useState('');
  useEffect(() => {
    if (!conectado || modoNuevoHuesped || huespedId) return;
    const controller = new AbortController(); setRemoteGuests([]); setGuestSearchError('');
    if (buscarHuesped.trim().length < 2) return () => controller.abort();
    const timer = setTimeout(() => { searchGuests(buscarHuesped.trim(), controller.signal).then(list => {
      if (!controller.signal.aborted) setRemoteGuests(list.map(g => ({ id: String(g.id), nombre: g.nombreCompleto, correo: g.correo, telefono: g.telefono, nacionalidad: g.nacionalidad ?? '', tipoDocumento: g.tipoDocumento === 'DPI' ? 'DPI' : 'Pasaporte', documento: g.numeroDocumento, paisEmisorPasaporte: historicalPassportIssuer(g), creadoEn: '' })));
    }).catch(e => { if (!controller.signal.aborted) setGuestSearchError(e.message); }); }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [conectado, modoNuevoHuesped, buscarHuesped, huespedId]);
  const [campoBusqueda, setCampoBusqueda] = useState<'nombre' | 'documento'>('nombre');
  const [piso, setPiso] = useState('Todos');
  const [usarHoraLlegada, setUsarHoraLlegada] = useState(false);
  const [revisando, setRevisando] = useState(false);
  const [reservaCreada, setReservaCreada] = useState<Reserva | null>(null);
  const saving = useRef(false);
  const solicitud = useRef<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [resultadoDesconocido, setResultadoDesconocido] = useState(false);
  const [nh, setNh] = useState<NuevoHuespedForm>({
    nombre: '',
    apellidos: '',
    tipoDocumento: 'DPI',
    documento: '',
  paisEmisorPasaporte: '',
telefono: '',
    prefijo: '+502',
    correo: '',
    horaLlegada: '15:00',
  });
  const [entrada, setEntrada] = useState(preset?.entrada ?? fechaHoyISO());
  const [salida, setSalida] = useState(preset?.salida ?? fechaRelativaISO(2));
  const [adultos, setAdultos] = useState(String(preset?.adultos ?? 2));
  const [ninos, setNinos] = useState(String(preset?.ninos ?? 0));
  const [huespedesAbierto, setHuespedesAbierto] = useState(false);
  const [tipo, setTipo] = useState<TipoHabitacion>(preset?.tipo ?? 'Standard');
  const [catalogo, setCatalogo] = useState<{id:number;nombre:string}[]>([]);
  const [remoteTypeId, setRemoteTypeId] = useState<number | undefined>();
  const [catalogoError, setCatalogoError] = useState('');
  useEffect(() => {
    if (!conectado) return;
    const controller = new AbortController();
    getRooms(new URLSearchParams(), controller.signal).then(rooms => {
      const types = [...new Map(rooms.map(r => [r.tipoHabitacion.id, r.tipoHabitacion])).values()];
      setCatalogo(types);
      setRemoteTypeId((types.find(t => t.id === preset?.tipoHabitacionId) ?? types.find(t => t.nombre === preset?.tipo) ?? types[0])?.id);
      setTipo(current => types.some(t => t.nombre === current) ? current : (types[0]?.nombre ?? '') as TipoHabitacion);
    }).catch(e => { if (!controller.signal.aborted) setCatalogoError(e.message); });
    return () => controller.abort();
  }, [conectado, preset?.tipo, preset?.tipoHabitacionId]);
  const tipoId = remoteTypeId;
  const tipos = conectado ? catalogo.map(t => t.nombre as TipoHabitacion) : TIPOS;
  const [habitacionId, setHabitacionId] = useState<string>(preset?.habitacionId ?? '');
  const [errores, setErrores] = useState<Record<string, string>>({});
  const nPersonas = Math.max(1, (Number(adultos) || 0) + (Number(ninos) || 0));
  const rangoValido = entrada < salida;
  const noches = rangoValido ? nochesEntre(entrada, salida) : 0;
  const [cambiarHabitacion, setCambiarHabitacion] = useState(false);
  const seleccionPrevia = Boolean(preset?.habitacionId) && !cambiarHabitacion;
  const [revisionDisponibilidad, setRevisionDisponibilidad] = useState(0);
  const [disponibles, setDisponibles] = useState<HabitacionHotel[]>([]);
  const [consultando, setConsultando] = useState(true);
  const [disponibilidadError, setDisponibilidadError] = useState('');
  const [cupo, setCupo] = useState(0);
  useEffect(() => {
    if (!conectado) {
      const rooms = habitacionesDisponibles(entrada, salida, habitaciones, reservas, { personas: nPersonas, tipo });
      setDisponibles(rooms); setCupo(rooms.length); setConsultando(false); setDisponibilidadError('');
      return;
    }
    const controller = new AbortController();
    setCupo(0); setConsultando(true); setDisponibilidadError('');
    getReceptionAvailability(entrada, salida, nPersonas, controller.signal).then(async options => {
      const option = options.find(o => conectado ? o.tipoHabitacion.id === tipoId : o.tipoHabitacion.nombre === tipo);
      if (!option) return [];
      if (!controller.signal.aborted) setCupo(option.habitacionesDisponibles);
      const refs = await getAvailableRoomReferences(option.tipoHabitacion.id, entrada, salida, controller.signal);
      // Conserva el bloqueo de reservas antiguas de este navegador sin recrearlas en el BFF.
      const legacy = conectado ? [] : reservas.filter(r => !/^VS-[A-Z0-9]{6}$/.test(r.codigo) && !RESERVAS_INICIALES.some(seed => seed.id === r.id) &&
        r.tipoHabitacion === tipo && !['cancelada', 'finalizada'].includes(r.estado) && r.fechaEntrada < salida && r.fechaSalida > entrada);
      const source: HabitacionHotel[] = conectado ? refs.map(r => ({ id: String(r.id), numero: r.numero, piso: r.piso, tipo, capacidad: option.capacidad, precioNoche: option.total / option.noches, estado: 'disponible' })) : habitaciones;
      const rooms = source.filter(h => h.tipo === tipo && h.capacidad >= nPersonas && refs.some(r => r.numero === h.numero) && !legacy.some(r => r.habitacionId === h.id));
      let peak = 0;
      for (let day = entrada; day < salida; day = new Date(Date.parse(day) + 86400000).toISOString().slice(0, 10))
        peak = Math.max(peak, legacy.filter(r => r.fechaEntrada <= day && r.fechaSalida > day).length);
      if (option.habitacionesDisponibles <= peak) return [];
      return rooms.map(h => ({ ...h, precioNoche: option.total / option.noches }));
    }).then(rooms => { if (!controller.signal.aborted) setDisponibles(rooms); })
      .catch(e => { if (!controller.signal.aborted) setDisponibilidadError(e instanceof Error ? e.message : 'No se pudo consultar la disponibilidad.'); })
      .finally(() => { if (!controller.signal.aborted) setConsultando(false); });
    return () => controller.abort();
  }, [entrada, salida, nPersonas, tipo, tipoId, habitaciones, reservas, conectado, revisionDisponibilidad]);
  const habElegida = (reservaCreada && !conectado ? habitaciones : disponibles).find(h => h.id === habitacionId) ?? null;
  const huespedesFiltrados = huespedes.filter(h => {
    const q = buscarHuesped.toLowerCase().trim();
    if (!q)
      return false;
    const valor = campoBusqueda === 'nombre' ? h.nombre : h.documento;
    return valor.toLowerCase().includes(q);
  });
  const disponiblesPiso = disponibles.filter(h => piso === 'Todos' || String(h.piso) === piso);
  async function guardar() {
    if (saving.current || reservaCreada || resultadoDesconocido) return;
    const e: Record<string, string> = {};
    if (consultando || disponibilidadError || catalogoError || (conectado ? cupo <= 0 || !tipoId : !disponibles.length)) e.habitacion = disponibilidadError || catalogoError || 'Comprueba la disponibilidad antes de guardar.';
    if (!rangoValido || entrada < fechaHoyISO() || noches > 30 || entrada > fechaRelativaISO(365))
      e.fechas = 'Revisa las fechas: desde hoy, máximo 30 noches y entrada dentro de un año.';
    let idHuesped = huespedId;
    if (modoNuevoHuesped) {
      if (!nh.nombre.trim())
        e.nombre = 'Nombre obligatorio.';
      if (!nh.documento.trim())
        e.documento = 'Documento obligatorio.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nh.correo.trim())) e.correo = 'Correo válido obligatorio.';
      if (!nh.telefono.trim())
        e.telefono = 'Teléfono obligatorio.';
    }
    else if (!huespedId) {
      e.huesped = 'Selecciona un huésped.';
    }
    if (habitacionId && !disponibles.some(h => h.id === habitacionId)) {
      e.habitacion = 'Esa habitación ya no está disponible para el rango.';
    }
    if (preset?.habitacionId && !habitacionId) e.habitacion = 'Selecciona una habitación para continuar.';
    if (modoNuevoHuesped && !validDocument(nh.tipoDocumento, nh.documento)) e.documento = nh.tipoDocumento === 'DPI' ? 'El DPI debe contener exactamente 13 dígitos.' : 'Introduce solo letras y números, hasta el límite de almacenamiento de 30 caracteres.';
    if (modoNuevoHuesped && !validNationalPhone(nh.prefijo, nh.telefono)) e.telefono = 'Ingrese los 8 dígitos del teléfono, sin repetir +502.';
    setErrores(e);
    if (Object.keys(e).length > 0) {
      if (e.habitacion) { setCambiarHabitacion(true); setRevisando(false); }
      return;
    }
    saving.current = true;
    solicitud.current ??= crypto.randomUUID();
    setGuardando(true);
    // Recheck before any guest/reservation write; a failed read has no uncertain mutation outcome.
    try {
      if (conectado) {
        const options = await getReceptionAvailability(entrada, salida, nPersonas);
        const option = options.find(o => o.tipoHabitacion.id === tipoId);
        const refs = option ? await getAvailableRoomReferences(option.tipoHabitacion.id, entrada, salida) : [];
        if (!option || option.habitacionesDisponibles <= 0 || (habitacionId && !refs.some(r => String(r.id) === habitacionId))) throw new Error('La habitación o categoría ya no está disponible. Selecciona otra habitación; tus datos se conservaron.');
      } else if (habitacionId && !habitacionesDisponibles(entrada, salida, habitaciones, reservas, { personas: nPersonas, tipo }).some(h => h.id === habitacionId)) {
        throw new Error('La habitación ya no está disponible. Selecciona otra habitación; tus datos se conservaron.');
      }
    } catch (error) {
      setErrores({ habitacion: error instanceof Error ? error.message : 'No se pudo comprobar la disponibilidad. Inténtalo de nuevo.' });
      setCambiarHabitacion(true); setRevisando(false); setRevisionDisponibilidad(n => n + 1);
      saving.current = false; setGuardando(false);
      return;
    }
    try {
    if (modoNuevoHuesped) {
      const creado = await onCrearHuesped({
        nombre: `${nh.nombre.trim()} ${nh.apellidos.trim()}`.trim(),
        tipoDocumento: nh.tipoDocumento,
        documento: nh.documento.trim(),
        paisEmisorPasaporte: nh.tipoDocumento === 'Pasaporte' ? nh.paisEmisorPasaporte : undefined,
        telefono: `${nh.prefijo} ${nh.telefono.trim()}`,
        correo: nh.correo.trim(),
        nacionalidad: '',

      });
      idHuesped = creado.id;
    }
    const creada = await onCrearReserva({
      huespedId: idHuesped,
      tipoHabitacion: tipo,
      tipoHabitacionId: conectado ? tipoId : undefined,
      solicitudId: solicitud.current,
      fechaEntrada: entrada,
      fechaSalida: salida,
      personas: nPersonas,
      adultos: Number(adultos),
      ninos: Number(ninos),
      habitacionId: habitacionId || null,
      descuento: 0,
    });
    setReservaCreada(creada);
    setRevisando(false);
    } catch (error) {
      const uncertain = !(error instanceof ReceptionRequestError) || error.status >= 500;
      setResultadoDesconocido(uncertain);
      if (error instanceof ReceptionRequestError && error.status === 409) {
        solicitud.current = null;
        setCambiarHabitacion(true); setRevisando(false); setRevisionDisponibilidad(n => n + 1);
      }
      const fields=receptionFieldErrors(error);if(Object.keys(fields).length)setRevisando(false);
      setErrores({ ...fields, reserva: uncertain
        ? 'No se pudo comprobar el resultado. Consulta las reservas por el huésped antes de crear otra; la solicitud no se repetirá automáticamente.'
        : error.message });
    } finally { saving.current = false; setGuardando(false); }
  }
  return (<div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center sm:p-4">
    {guestSearchError && <p role="alert" className="relative z-50 bg-white p-3 text-red-800">{guestSearchError}</p>}
    <div className="absolute inset-0 bg-black/40" onClick={onCerrar} />

    <div data-vs-ui="compact" data-vs-dialog="compact" data-vs-size="large" role="dialog" aria-modal="true" aria-label="Nueva reserva" className={`${styles.form} reception-compact relative z-10 bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-[780px] max-h-[90vh] overflow-y-auto`}>
      <div className={`${revisando?'hidden':'flex'} items-center justify-between px-5 py-3.5 border-b border-[#E5E0D8] sticky top-0 bg-white z-10`}>
        <h2 className="text-[20px] font-bold text-[#18345C]">Nueva reserva</h2>
        <ReceptionCloseButton onClick={onCerrar} />
      </div>

      <div className={`${revisando?'hidden':''} px-5 py-3 space-y-3`}>
        {modoNuevoHuesped && nh.correo && huespedes.some(h => h.correo.trim().toLowerCase() === nh.correo.trim().toLowerCase()) && <p role="status">Ese correo ya existe. Se usará el perfil registrado sin modificarlo.</p>}
        {!revisando && Object.entries(errores).map(([key, message]) => <p key={key} role="alert" className="text-sm text-[#991B1B]">{message}</p>)}
        {consultando && <p role="status">Consultando disponibilidad…</p>}
        {disponibilidadError && <p role="alert" className="text-sm text-[#991B1B]">{disponibilidadError}</p>}

        <div>
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] text-[#71839B] uppercase tracking-widest">Huésped</p>
            {modoNuevoHuesped && <button onClick={() => {
              setModoNuevoHuesped(v => !v);
              setErrores({});
            }} className="text-[12px] font-semibold text-[#18345C] hover:underline">
              Elegir uno existente
            </button>}
          </div>

          {!modoNuevoHuesped ? (<div className="space-y-2">
            <div className="grid sm:grid-cols-[124px_minmax(0,1fr)] gap-2">
              <div className="flex items-end">
                <select aria-label="Criterio de búsqueda de huésped" value={campoBusqueda} onChange={e => {setCampoBusqueda(e.target.value as 'nombre' | 'documento');setBuscarHuesped('');setRemoteGuests([]);setGuestSearchError('');}} className={`${INPUT_CLS} !h-10 !py-2 !px-3`}>
                  <option value="nombre">Nombre</option>
                  <option value="documento">Documento</option>
                </select>
              </div>
              <Campo label="Buscar huésped" error={errores.huesped}>
                <div className="flex flex-wrap items-center gap-2">
                  <input type="text" inputMode={campoBusqueda==='documento'?'numeric':'text'} maxLength={campoBusqueda==='documento'?30:150} value={buscarHuesped} onChange={e => setBuscarHuesped((campoBusqueda==='documento'?e.target.value.replace(/[^0-9]/g,''):e.target.value.replace(/[^\p{L}\p{M} '’-]/gu,'')).slice(0,campoBusqueda==='documento'?30:150))} placeholder={campoBusqueda==='nombre'?'Buscar por nombre...':'Buscar por documento...'} className={`${INPUT_CLS} !h-10 !py-2 min-w-[180px] flex-1`} />
                  <button onClick={() => {
                    setModoNuevoHuesped(v => !v);
                    setErrores({});
                  }} className="ml-auto whitespace-nowrap text-[12px] font-semibold text-[#18345C] hover:underline max-[400px]:basis-full max-[400px]:text-right">
                    Registrar nuevo huésped
                  </button>
                </div>
              </Campo>
            </div>
            {buscarHuesped.trim() && !huespedId && <div className="max-h-44 overflow-y-auto border border-[#E5E0D8] rounded-lg divide-y">
              {huespedesFiltrados.map(h => <button
                type="button"
                key={h.id}
                onClick={() => {
                  setHuespedId(h.id);
                  setBuscarHuesped('');
                }}
                className={`w-full text-left px-3 py-2 ${huespedId === h.id ? 'bg-[#EEF4FB] ring-1 ring-inset ring-[#18345C] text-[#102747]' : 'bg-white'}`}>
                <b>
                  {h.nombre}
                </b>
                <span className="block text-xs text-[#6B7280]">{h.correo} · {h.telefono} · {h.tipoDocumento} •••• {h.documento.slice(-4)}</span>
              </button>)}
            </div>}
            {huespedId && (() => {
              const h = huespedes.find(x => x.id === huespedId);
              return h ? <div className="border border-[#18345C] bg-[#EEF4FB] rounded-lg px-3 py-2">
                <b>
                  {h.nombre}
                </b>
                <span className="block text-xs text-[#6B7280]">{h.correo} · {h.telefono} · {h.tipoDocumento} •••• {h.documento.slice(-4)}</span>
                <button type="button" onClick={() => setHuespedId('')} className="text-xs font-semibold text-[#18345C] underline mt-1">Cambiar huésped</button>
              </div> : null;
            })()}
          </div>) : (<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border border-[#E5E0D8] rounded-xl p-4">
            <Campo label="Nombre" error={errores.nombre}>
              <input aria-label="Nombre" type="text" value={nh.nombre} onChange={e => setNh(f => ({ ...f, nombre: e.target.value }))} className={`${INPUT_CLS} !h-10 !py-2`} />
            </Campo>
            <Campo label="Apellidos">
              <input aria-label="Apellidos" type="text" value={nh.apellidos} onChange={e => setNh(f => ({ ...f, apellidos: e.target.value }))} className={INPUT_CLS} />
            </Campo>
            <Campo label="Tipo de documento">
              <select value={nh.tipoDocumento} onChange={e => setNh(f => ({ ...f, tipoDocumento: e.target.value as TipoDocumento }))} className={INPUT_CLS}>
                <option value="DPI">DPI</option>

              </select>
            </Campo>
          <Campo label="Número de documento" error={errores.documento}>
              <input
                aria-label="Número de documento"
                type="text"
                value={nh.documento}
                onChange={e => setNh(f => ({ ...f, documento: e.target.value }))}
                maxLength={64}
                inputMode={nh.tipoDocumento === 'DPI' ? 'numeric' : 'text'}
                className={INPUT_CLS} />
            </Campo>
            <Campo label="Correo electrónico" error={errores.correo}>
              <input aria-label="Correo electrónico" type="email" value={nh.correo} onChange={e => setNh(f => ({ ...f, correo: e.target.value }))} className={INPUT_CLS} />
            </Campo>
            <Campo label="Teléfono"><GuatemalaPhoneInput label="Teléfono" value={nh.telefono} onChange={telefono=>setNh(f=>({...f,telefono}))} error={errores.telefono}/></Campo>
            <div className="rounded-xl border border-[#EEE7DA] p-4">
              <label className="flex items-center justify-between gap-3 cursor-pointer">
                <span>
                  <b className="block text-[#18345C]">Hora estimada de llegada</b>
                </span>
                <button
                  type="button"
                  aria-pressed={usarHoraLlegada}
                  onClick={() => setUsarHoraLlegada(v => !v)}
                  className={`relative shrink-0 w-12 h-7 rounded-full transition ${usarHoraLlegada ? 'bg-[#D8B94E]' : 'bg-[#D7DDE4]'}`}>
                  <span className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-all ${usarHoraLlegada ? 'left-6' : 'left-1'}`} />
                </button>
              </label>
              {usarHoraLlegada && <input type="time" value={nh.horaLlegada} onChange={e => setNh(f => ({ ...f, horaLlegada: e.target.value }))} className={`${INPUT_CLS} mt-3`} />}
            </div>
          </div>)}
        </div>

        {seleccionPrevia && habElegida && (() => {
          const visual = publicRoomForHotelType(habElegida.tipo);
          return <section className="overflow-hidden rounded-xl border border-[#E5E0D8] bg-[#F8F6F0] sm:flex">
            <img src={visual.image} alt={`Habitación ${habElegida?.numero ?? 'sin asignar'}`} className="h-40 w-full object-cover sm:w-52" />
            <div className="flex-1 p-4">
              <p className="text-xs font-semibold uppercase tracking-[.16em] text-[#B38719]">Habitación seleccionada · Piso {habElegida.piso}</p>
              <h3 className="mt-1 text-lg font-semibold text-[#18345C]">Habitación {habElegida.numero} · {visual.name}</h3>
              <p className="mt-1.5 text-sm text-[#52677F]">{habElegida.tipo} · {visual.beds} · hasta {habElegida.capacidad} huéspedes · {visual.size} m²</p>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {visual.features.slice(0, 4).map(f => <span key={f} className="rounded-full border bg-white px-2.5 py-1 text-xs text-[#52677F]">
                  {f}
                </span>)}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2.5 text-sm">
                <span>
                  <small className="block text-[#71839B]">Estancia</small>
                  <b>{entrada} → {salida}</b>
                </span>
                <span>
                  <small className="block text-[#71839B]">Ocupación</small>
                  <b>{adultos} adultos · {ninos} niños</b>
                </span>
                <span>
                  <small className="block text-[#71839B]">Tarifa</small>
                  <b>{dinero(habElegida.precioNoche)} por noche</b>
                </span>
                <span>
                  <small className="block text-[#71839B]">Total</small>
                  <b>
                    {dinero(habElegida.precioNoche * noches)}
                  </b>
                </span>
              </div>
            </div>
          </section>;
        })()}

        {!seleccionPrevia && <>
          <div className="grid grid-cols-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_140px] gap-3">
            <Campo label="Entrada">
              <input aria-label="Entrada" type="date" value={entrada} onChange={e => setEntrada(e.target.value)} className={INPUT_CLS} />
            </Campo>
            <Campo label="Salida">
              <input aria-label="Salida" type="date" value={salida} min={entrada} onChange={e => setSalida(e.target.value)} className={INPUT_CLS} />
            </Campo>
            <div className="col-span-2 sm:col-span-1">
              <Campo label="Cantidad de huéspedes">
                <div className="relative">
                  <button type="button" onClick={() => setHuespedesAbierto(v => !v)} className={`${INPUT_CLS} flex items-center gap-2 text-left`}>
                    <Users size={18} />
                    <span>{nPersonas} huésped{nPersonas === 1 ? '' : 'es'}</span>
                  </button>
                  {huespedesAbierto && <div className="absolute left-0 top-[calc(100%+8px)] z-50 w-[310px] bg-white rounded-xl shadow-2xl border border-[#EEE7DA] p-4 text-[#102747]">
                    {([['Adultos', adultos, setAdultos, 1], ['Niños', ninos, setNinos, 0]] as const).map(([etiqueta, valor, setter, min]) => <div key={etiqueta} className="flex items-center justify-between py-3">
                      <span className="text-[17px]">
                        {etiqueta}
                      </span>
                      <div className="flex items-center gap-4">
                        <button
                          type="button"
                          onClick={() => setter(String(Math.max(min, Number(valor) - 1)))}
                          className="w-10 h-10 rounded-full border border-[#D8B94E] grid place-items-center">
                          <Minus size={18} />
                        </button>
                        <b>
                          {valor}
                        </b>
                        <button
                          type="button"
                          disabled={nPersonas >= 5}
                          onClick={() => nPersonas < 5 && setter(String(Number(valor) + 1))}
                          className="w-10 h-10 rounded-full border border-[#D8B94E] grid place-items-center disabled:opacity-30">
                          <Plus size={18} />
                        </button>
                      </div>
                    </div>)}
                    <p className="text-xs text-[#7B8796] mb-3">Máximo 5 huéspedes en total.</p>
                    <button
                      type="button"
                      onClick={() => setHuespedesAbierto(false)}
                      className="ml-auto block rounded-lg bg-[#D8B94E] px-4 py-2.5 text-sm font-semibold text-[#102747]">Confirmar</button>
                  </div>}
                </div>
              </Campo>
            </div>
            <Campo label="Categoría">
              <select value={conectado ? String(tipoId ?? '') : tipo} onChange={e => {
                if (conectado) {const selected = catalogo.find(t => t.id === Number(e.target.value));setRemoteTypeId(selected?.id);setTipo((selected?.nombre ?? '') as TipoHabitacion);}
                else setTipo(e.target.value as TipoHabitacion);
                setHabitacionId('');
              }} className={INPUT_CLS}>
                {conectado ? catalogo.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>) : tipos.map(t => <option key={t} value={t}>
                  {t}
                </option>)}
              </select>
            </Campo>
            <Campo label="Piso">
              <select value={piso} onChange={e => {
                setPiso(e.target.value);
                setHabitacionId('');
              }} className={INPUT_CLS}>
                <option>Todos</option>
                <option value="1">Piso 1</option>
                <option value="2">Piso 2</option>
                <option value="3">Piso 3</option>
              </select>
            </Campo>
          </div>
          {errores.fechas && <p className="text-xs text-[#991B1B]">
            {errores.fechas}
          </p>}


          <div>
            <p className="text-xs font-semibold text-[#18345C] uppercase tracking-wider mb-2">
              Habitaciones disponibles {rangoValido && `· ${noches} noche${noches !== 1 ? 's' : ''}`}
            </p>
            {!rangoValido ? (<p className="text-[13px] text-[#71839B]">Indica un rango de fechas válido.</p>) : disponiblesPiso.length === 0 ? (<p className="text-[13px] text-[#991B1B] bg-[#FEF2F2] border border-[#FCA5A5] rounded-lg px-3 py-2">
              No hay habitaciones {tipo} para {nPersonas} persona(s) en esas fechas.
            </p>) : (<div className="space-y-2 max-h-[30vh] overflow-y-auto">
              {disponiblesPiso.map(h => (<button
                key={h.id}
                type="button"
                aria-pressed={habitacionId === h.id}
                onClick={() => setHabitacionId(id => (id === h.id && !preset?.habitacionId ? '' : h.id))}
                className={`w-full text-left flex items-center gap-3 border rounded-lg px-4 py-3 transition-colors ${habitacionId === h.id ? 'border-[#18345C] bg-[#F8F6F0]' : 'border-[#E5E0D8] hover:border-[#18345C]'}`}>
                {(() => {
                  const v = publicRoomForHotelType(h.tipo);
                  return <img src={v.image} alt={`Habitación ${h.numero}`} className="w-20 h-16 rounded-lg object-cover shrink-0" />;
                })()}
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-bold text-[#18345C] leading-none">Habitación {h.numero}</p>
                  <p className="text-[12px] text-[#71839B] mt-0.5">
                    {h.tipo} · Piso {h.piso} · hasta {h.capacidad} personas
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[15px] font-bold text-[#18345C]">
                    {dinero(h.precioNoche)}
                  </p>
                  <p className="text-[11px] text-[#71839B]">por noche</p>
                </div>
              </button>))}
            </div>)}
            {errores.habitacion && <p className="text-xs text-[#991B1B] mt-1">
              {errores.habitacion}
            </p>}
            <p className="text-[12px] text-[#6B7280] mt-2">
              {habElegida
                ? ''
                : 'Puedes crear la reserva sin habitación y asignarla más tarde.'}
            </p>
          </div>
        </>}
      </div>

      {reservaCreada && (<div className="absolute inset-0 z-40 overflow-y-auto bg-white p-6">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#EAF7EE] text-3xl text-[#188247]">✓</span>
            <h2 className="mt-4 text-3xl font-semibold text-[#18345C]">Reserva confirmada</h2>
            <p className="mt-1 text-[#71839B]">Reserva guardada.</p>
          </div>
          <div className="mt-7 grid gap-5 md:grid-cols-[.9fr_1.1fr]">
            <img
              src={publicRoomForHotelType(tipo).image}
              alt={`Habitación ${habElegida?.numero ?? 'sin asignar'}`}
              className="h-full min-h-64 w-full rounded-xl object-cover" />
            <section className="rounded-xl border border-[#E5E0D8] p-5">
              <p className="text-xs uppercase tracking-widest text-[#B38719]">Detalle de la reservación</p>
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <ResumenFinal label="Código" valor={reservaCreada.codigo} />
                <ResumenFinal label="Habitación" valor={habElegida ? `${habElegida.numero} · ${habElegida.tipo}` : 'Sin asignar'} />
                <ResumenFinal label="Huésped" valor={huespedes.find(h => h.id === reservaCreada.huespedId)?.nombre || `${nh.nombre} ${nh.apellidos}`.trim()} />
                <ResumenFinal label="Entrada" valor={entrada} />
                <ResumenFinal label="Salida" valor={salida} />
                <ResumenFinal label="Ocupación" valor={`${adultos} adultos · ${ninos} niños`} />
                <ResumenFinal label={conectado ? 'Total de la reserva' : 'Total estimado demo'} valor={dinero((reservaCreada.precioNoche ?? 0) * noches)} />
                <ResumenFinal label="Pago" valor="En el check-out" />
              </div>
            </section>
          </div>

          <div className="mt-6 flex flex-wrap justify-end gap-2">
            <button onClick={onCerrar} className="min-h-11 rounded-lg border border-[#18345C] px-4 py-2.5 text-sm font-semibold text-[#18345C]">Hacer otra reserva</button>
            <button onClick={() => onVerReserva(reservaCreada.id)} className="min-h-11 rounded-lg bg-[#18345C] px-4 py-2.5 text-sm font-semibold text-white">Ver reserva / realizar check-in</button>
          </div>
        </div>
      </div>)}

      {!revisando && <div data-vs-actions="compact" className={styles.actions}>
        <button onClick={onCerrar} className="h-11 shrink-0 px-4 py-2.5 text-sm border border-[#E5E0D8] bg-white text-[#18345C] rounded-md hover:bg-[#F8F6F0] transition-colors">
          Cancelar
        </button>
        <button
          onClick={() => setRevisando(true)}
          className="h-11 shrink-0 px-4 py-2.5 text-sm font-semibold bg-[#18345C] text-white rounded-md hover:bg-[#102747] transition-colors">
          Revisar datos
        </button>
      </div>}
      {revisando && <div className={styles.review}>
        <div className="flex justify-between items-start border-b pb-3">
          <div>
            <p className="text-[10px] tracking-[.18em] text-[#B38719] uppercase">Reserva · Revisión</p>
            <h2 className="text-2xl font-semibold text-[#18345C]">Revisa los datos</h2>
            {Object.values(errores).map(message => <p key={message} role="alert" className="text-sm text-red-800">{message}</p>)}
          </div>
          <ReceptionCloseButton onClick={() => setRevisando(false)} />
        </div>
        {(() => {
          const hg = modoNuevoHuesped ? null : huespedes.find(h => h.id === huespedId);
          const room = habElegida ? {
            image: fotoHabitacion(habElegida.numero),
            name: habElegida.tipo,
            beds: habElegida.tipo.includes('Suite') ? '1 cama king + sofá cama' : habElegida.tipo === 'Deluxe' ? '1 cama king o 2 camas' : '1 cama queen'
          } : null;
          return <><section className="py-3">
            <h3 className="font-semibold text-[#18345C] mb-2">Información del huésped</h3>
            <div className="grid sm:grid-cols-2 gap-x-5 gap-y-2 text-sm">
              <div>
                <small className="text-[#71839B]">Nombre</small>
                <b className="block">
                  {modoNuevoHuesped ? `${nh.nombre} ${nh.apellidos}`.trim() : (hg?.nombre || '—')}
                </b>
              </div>
              <div>
                <small className="text-[#71839B]">Documento</small>
                <b className="block">
                  {modoNuevoHuesped ? `${nh.tipoDocumento} · ${nh.documento}` : (hg ? `${hg.tipoDocumento} · ${hg.documento}` : '—')}
                </b>
              </div>
              <div>
                <small className="text-[#71839B]">Teléfono</small>
                <b className="block">
                  {modoNuevoHuesped ? `${nh.prefijo} ${nh.telefono}` : (hg?.telefono || '—')}
                </b>
              </div>
              <div>
                <small className="text-[#71839B]">Correo</small>
                <b className="block">
                  {modoNuevoHuesped ? nh.correo : (hg?.correo || '—')}
                </b>
              </div>

            </div>
          </section><section className="border-t border-[#E5E0D8] py-3"><h3 className="mb-2 font-semibold text-[#18345C]">Detalles de la reserva</h3><div className="mb-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2"><ResumenFinal label="Estancia" valor={`${entrada} → ${salida}`}/><ResumenFinal label="Huéspedes" valor={`${adultos} adultos · ${ninos} niños`}/></div>{habElegida && room ? <section className="border rounded-xl overflow-hidden flex bg-[#F8F6F0]">
            <img src={room.image} alt={`Habitación ${habElegida?.numero ?? 'sin asignar'}`} className="w-24 sm:w-36 h-24 shrink-0 object-cover" />
            <div className="min-w-0 p-3">
              <small className="text-[#71839B]">Habitación seleccionada</small>
              <h3 className="text-lg font-semibold text-[#18345C]">Habitación {habElegida.numero}</h3>
              <p className="text-sm">{room.name} · Piso {habElegida.piso}</p>
              <p className="text-sm">{room.beds} · hasta {habElegida.capacidad} huéspedes</p>
              <b className="block mt-2 text-[#18345C]">{dinero(habElegida.precioNoche)} / noche · {noches} noches · Total {dinero(habElegida.precioNoche * noches)}</b>
            </div>
          </section> : <div className="border rounded-xl p-4 bg-[#F8F6F0]">
            <b>{habitacionId || preset?.habitacionId ? 'Comprueba la habitación seleccionada' : 'Sin habitación asignada'}</b>
            <p className="text-sm text-[#6B7280]">{habitacionId || preset?.habitacionId ? 'No se puede confirmar hasta comprobar su disponibilidad. Regresa a editar para seleccionar una habitación.' : 'La reserva puede crearse ahora y asignar la habitación más tarde.'}</p>
          </div>}</section><div data-vs-actions="compact" className={styles.reviewActions}>
              <button onClick={() => setRevisando(false)} className="px-4 py-2 border rounded-md text-sm">Editar</button>
              <button onClick={guardar} disabled={guardando || resultadoDesconocido || consultando} className="px-4 py-2 bg-[#18345C] text-white rounded-md text-sm font-semibold disabled:opacity-50">{guardando ? 'Guardando…' : 'Confirmar reserva'}</button>
            </div></>;
        })()}
      </div>}
    </div>
  </div>);
}
function ResumenFinal({ label, valor }: {
  label: string;
  valor: string;
}) {
  return <div>
    <small className="block text-[#71839B]">
      {label}
    </small>
    <b className="text-[#18345C]">
      {valor}
    </b>
  </div>;
}
