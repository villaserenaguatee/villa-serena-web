import { useMemo, useState } from 'react';
import { Minus, Plus, Users } from 'lucide-react';
import type { Huesped, HabitacionHotel, Reserva, TipoHabitacion, TipoDocumento, } from '@/lib/pms/types';
import { nochesEntre, fechaHoyISO, fechaRelativaISO } from '@/data/pms';
import { leerPromociones } from '@/store/promotionStore';
import type { Promocion } from '@/lib/pms/types';
import { dinero, Campo, INPUT_CLS, CloseIcon, BedIcon, habitacionesDisponibles, } from '@/features/recepcion/pages/recUtils';
import { publicRooms, publicRoomForHotelType, money } from '@/data/publicRooms';
import { fotoHabitacion } from '@/store/roomStore';
const TIPOS: TipoHabitacion[] = ['Standard', 'Superior', 'Deluxe', 'Suite Deluxe', 'Suite'];
interface NuevoHuespedForm {
  nombre: string;
  apellidos: string;
  tipoDocumento: TipoDocumento;
  documento: string;
  telefono: string;
  prefijo: string;
  correo: string;
  horaLlegada: string;
  nacionalidad: string;
}
interface Props {
  huespedes: Huesped[];
  habitaciones: HabitacionHotel[];
  reservas: Reserva[];
  preset?: {
    entrada?: string;
    salida?: string;
    tipo?: TipoHabitacion;
    habitacionId?: string;
    adultos?: number;
    ninos?: number;
  };
  onCerrar: () => void;
  onVerReserva: (id: string) => void;
  onCrearHuesped: (h: Omit<Huesped, 'id' | 'creadoEn'>) => Huesped;
  onCrearReserva: (datos: {
    huespedId: string;
    tipoHabitacion: TipoHabitacion;
    fechaEntrada: string;
    fechaSalida: string;
    personas: number;
    adultos?: number;
    ninos?: number;
    habitacionId: string | null;
    descuento?: number;
    metodoPago?: 'efectivo' | 'tarjeta';
  }) => Reserva;
}
export default function NuevaReservaModal({ huespedes, habitaciones, reservas, preset, onCerrar, onVerReserva, onCrearHuesped, onCrearReserva, }: Props) {
  const [modoNuevoHuesped, setModoNuevoHuesped] = useState(huespedes.length === 0);
  const [huespedId, setHuespedId] = useState('');
  const [buscarHuesped, setBuscarHuesped] = useState('');
  const [campoBusqueda, setCampoBusqueda] = useState<'nombre' | 'correo' | 'telefono'>('nombre');
  const [piso, setPiso] = useState('Todos');
  const [usarHoraLlegada, setUsarHoraLlegada] = useState(false);
  const [revisando, setRevisando] = useState(false);
  const [pagoAbierto, setPagoAbierto] = useState(false);
  const [metodoPago, setMetodoPago] = useState<'efectivo' | 'tarjeta'>('tarjeta');
  const [huespedReservaId, setHuespedReservaId] = useState('');
  const [reservaCreada, setReservaCreada] = useState<Reserva | null>(null);
  const [nh, setNh] = useState<NuevoHuespedForm>({
    nombre: '',
    apellidos: '',
    tipoDocumento: 'DPI',
    documento: '',
    telefono: '',
    prefijo: '+502',
    correo: '',
    horaLlegada: '15:00',
    nacionalidad: 'Guatemala',
  });
  const [entrada, setEntrada] = useState(preset?.entrada ?? fechaHoyISO());
  const [salida, setSalida] = useState(preset?.salida ?? fechaRelativaISO(2));
  const [adultos, setAdultos] = useState(String(preset?.adultos ?? 2));
  const [ninos, setNinos] = useState(String(preset?.ninos ?? 0));
  const [huespedesAbierto, setHuespedesAbierto] = useState(false);
  const [tipo, setTipo] = useState<TipoHabitacion>(preset?.tipo ?? 'Standard');
  const [habitacionId, setHabitacionId] = useState<string>(preset?.habitacionId ?? '');
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [codigoPromo, setCodigoPromo] = useState('');
  const [promoAplicada, setPromoAplicada] = useState<Promocion | null>(null);
  const [promoMsg, setPromoMsg] = useState('');
  const nPersonas = Math.max(1, (Number(adultos) || 0) + (Number(ninos) || 0));
  const rangoValido = entrada < salida;
  const noches = rangoValido ? nochesEntre(entrada, salida) : 0;
  const seleccionPrevia = Boolean(preset?.habitacionId);
  const disponibles = useMemo(() => rangoValido
    ? habitacionesDisponibles(entrada, salida, habitaciones, reservas, {
      personas: nPersonas,
      tipo,
    })
    : [],
    [rangoValido, entrada, salida, habitaciones, reservas, nPersonas, tipo]);
  const habElegida = disponibles.find(h => h.id === habitacionId) ?? null;
  const huespedesFiltrados = huespedes.filter(h => {
    const q = buscarHuesped.toLowerCase().trim();
    if (!q)
      return false;
    const valor = campoBusqueda === 'nombre' ? h.nombre : campoBusqueda === 'correo' ? h.correo : h.telefono;
    return valor.toLowerCase().includes(q);
  });
  const disponiblesPiso = disponibles.filter(h => piso === 'Todos' || String(h.piso) === piso);
  function guardar() {
    const e: Record<string, string> = {};
    if (!rangoValido)
      e.fechas = 'La salida debe ser posterior a la entrada.';
    let idHuesped = huespedId;
    if (modoNuevoHuesped) {
      if (!nh.nombre.trim())
        e.nombre = 'Nombre obligatorio.';
      if (!nh.documento.trim())
        e.documento = 'Documento obligatorio.';
      if (!nh.telefono.trim())
        e.telefono = 'Teléfono obligatorio.';
    }
    else if (!huespedId) {
      e.huesped = 'Selecciona un huésped.';
    }
    if (habitacionId && !disponibles.some(h => h.id === habitacionId)) {
      e.habitacion = 'Esa habitación ya no está disponible para el rango.';
    }
    setErrores(e);
    if (Object.keys(e).length > 0)
      return;
    if (modoNuevoHuesped) {
      const creado = onCrearHuesped({
        nombre: `${nh.nombre.trim()} ${nh.apellidos.trim()}`.trim(),
        tipoDocumento: nh.tipoDocumento,
        documento: nh.documento.trim(),
        telefono: `${nh.prefijo} ${nh.telefono.trim()}`,
        correo: nh.correo.trim(),
        nacionalidad: nh.nacionalidad,
      });
      idHuesped = creado.id;
    }
    setHuespedReservaId(idHuesped);
    setPagoAbierto(true);
  }
  function confirmarPago() {
    if (!huespedReservaId)
      return;
    const creada = onCrearReserva({
      huespedId: huespedReservaId,
      tipoHabitacion: tipo,
      fechaEntrada: entrada,
      fechaSalida: salida,
      personas: nPersonas,
      adultos: Number(adultos),
      ninos: Number(ninos),
      habitacionId: habitacionId || null,
      descuento: promoAplicada && habElegida ? Math.round(habElegida.precioNoche * noches * promoAplicada.descuentoPct) / 100 : 0,
      metodoPago,
    });
    setPagoAbierto(false);
    setReservaCreada(creada);
  }
  return (<div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center sm:p-4">
    <div className="absolute inset-0 bg-black/40" onClick={onCerrar} />

    <div className="relative z-10 bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-4xl max-h-[94vh] overflow-y-auto">
      <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[#E5E0D8] sticky top-0 bg-white z-10">
        <h2 className="text-[22px] font-semibold text-[#18345C]">Nueva reserva</h2>
        <button onClick={onCerrar} className="text-[#AEBCC1] hover:text-[#1F2933] p-1">
          <CloseIcon />
        </button>
      </div>

      <div className="px-5 sm:px-6 py-5 space-y-5">

        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] text-[#AEBCC1] uppercase tracking-widest">Huésped</p>
            <button onClick={() => {
              setModoNuevoHuesped(v => !v);
              setErrores({});
            }} className="text-[12px] font-semibold text-[#18345C] hover:underline">
              {modoNuevoHuesped ? 'Elegir uno existente' : 'Registrar nuevo huésped'}
            </button>
          </div>

          {!modoNuevoHuesped ? (<div className="space-y-2">
            <div className="grid sm:grid-cols-[180px_1fr] gap-2">
              <select value={campoBusqueda} onChange={e => setCampoBusqueda(e.target.value as 'nombre' | 'correo' | 'telefono')} className={INPUT_CLS}>
                <option value="nombre">Nombre</option>
                <option value="correo">Correo</option>
                <option value="telefono">Teléfono</option>
              </select>
              <Campo label="Buscar huésped" error={errores.huesped}>
                <input value={buscarHuesped} onChange={e => setBuscarHuesped(e.target.value)} placeholder={`Buscar por ${campoBusqueda}…`} className={INPUT_CLS} />
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
              <input type="text" value={nh.nombre} onChange={e => setNh(f => ({ ...f, nombre: e.target.value }))} className={`${INPUT_CLS} !h-10 !py-2`} />
            </Campo>
            <Campo label="Apellidos">
              <input type="text" value={nh.apellidos} onChange={e => setNh(f => ({ ...f, apellidos: e.target.value }))} className={INPUT_CLS} />
            </Campo>
            <Campo label="Tipo de documento">
              <select value={nh.tipoDocumento} onChange={e => setNh(f => ({ ...f, tipoDocumento: e.target.value as TipoDocumento }))} className={INPUT_CLS}>
                <option value="DPI">DPI</option>
                <option value="Pasaporte">Pasaporte</option>
              </select>
            </Campo>
            <Campo label="Número de documento" error={errores.documento}>
              <input
                type="text"
                value={nh.documento}
                onChange={e => setNh(f => ({ ...f, documento: e.target.value.replace(/[^A-Za-z0-9]/g, "").slice(0, f.tipoDocumento === 'DPI' ? 13 : 20) }))}
                maxLength={nh.tipoDocumento === 'DPI' ? 13 : 20}
                inputMode={nh.tipoDocumento === 'DPI' ? 'numeric' : 'text'}
                className={INPUT_CLS} />
            </Campo>
            <Campo label="Correo electrónico">
              <input type="email" value={nh.correo} onChange={e => setNh(f => ({ ...f, correo: e.target.value }))} className={INPUT_CLS} />
            </Campo>
            <Campo label="Teléfono" error={errores.telefono}>
              <div className="flex gap-3">
                <select value={nh.prefijo} onChange={e => setNh(f => ({ ...f, prefijo: e.target.value }))} className={`${INPUT_CLS} !w-24`}>
                  <option value="+502">+502</option>
                  <option value="+503">+503</option>
                  <option value="+504">+504</option>
                  <option value="+501">+501</option>
                  <option value="+506">+506</option>
                  <option value="+507">+507</option>
                  <option value="+52">+52</option>
                  <option value="+1">+1</option>
                  <option value="+57">+57</option>
                  <option value="+34">+34</option>
                  <option value="+51">+51</option>
                  <option value="+54">+54</option>
                  <option value="+56">+56</option>
                  <option value="+593">+593</option>
                  <option value="+55">+55</option>
                  <option value="+44">+44</option>
                  <option value="+33">+33</option>
                  <option value="+49">+49</option>
                  <option value="+39">+39</option>
                </select>
                <input
                  type="text"
                  value={nh.telefono}
                  onChange={e => setNh(f => {
                    const max = ["+1", "+52", "+34", "+44"].includes(f.prefijo) ? 10 : 8;
                    return { ...f, telefono: e.target.value.replace(/\D/g, "").slice(0, max) };
                  })}
                  maxLength={["+1", "+52", "+34", "+44"].includes(nh.prefijo) ? 10 : 8}
                  inputMode="numeric"
                  className={`${INPUT_CLS} flex-1`} />
              </div>
            </Campo>
            <Campo label="Nacionalidad">
              <input value={nh.nacionalidad} onChange={e => setNh(f => ({ ...f, nacionalidad: e.target.value }))} className={INPUT_CLS} />
            </Campo>
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
            <img src={visual.image} alt={`Habitación ${habElegida.numero}`} className="h-48 w-full object-cover sm:w-64" />
            <div className="flex-1 p-5">
              <p className="text-xs font-semibold uppercase tracking-[.16em] text-[#B38719]">Habitación seleccionada · Piso {habElegida.piso}</p>
              <h3 className="mt-1 text-xl font-semibold text-[#18345C]">Habitación {habElegida.numero} · {visual.name}</h3>
              <p className="mt-2 text-sm text-[#52677F]">{habElegida.tipo} · {visual.beds} · hasta {habElegida.capacidad} huéspedes · {visual.size} m²</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {visual.features.slice(0, 4).map(f => <span key={f} className="rounded-full border bg-white px-2.5 py-1 text-xs text-[#52677F]">
                  {f}
                </span>)}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <span>
                  <small className="block text-[#AEBCC1]">Estancia</small>
                  <b>{entrada} → {salida}</b>
                </span>
                <span>
                  <small className="block text-[#AEBCC1]">Ocupación</small>
                  <b>{adultos} adultos · {ninos} niños</b>
                </span>
                <span>
                  <small className="block text-[#AEBCC1]">Tarifa</small>
                  <b>{dinero(habElegida.precioNoche)} por noche</b>
                </span>
                <span>
                  <small className="block text-[#AEBCC1]">Total</small>
                  <b>
                    {dinero(habElegida.precioNoche * noches)}
                  </b>
                </span>
              </div>
            </div>
          </section>;
        })()}

        {!seleccionPrevia && <>
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
            <Campo label="Entrada">
              <input type="date" value={entrada} onChange={e => setEntrada(e.target.value)} className={INPUT_CLS} />
            </Campo>
            <Campo label="Salida">
              <input type="date" value={salida} min={entrada} onChange={e => setSalida(e.target.value)} className={INPUT_CLS} />
            </Campo>
            <div className="sm:col-span-2">
              <Campo label="Huéspedes">
                <div className="relative">
                  <button type="button" onClick={() => setHuespedesAbierto(v => !v)} className={`${INPUT_CLS} flex items-center gap-2 text-left`}>
                    <Users size={18} />
                    <span>{nPersonas} huésped{nPersonas === 1 ? '' : 'es'}</span>
                  </button>
                  {huespedesAbierto && <div className="absolute left-0 top-[calc(100%+8px)] z-50 w-[310px] bg-white rounded-xl shadow-2xl border border-[#EEE7DA] p-4 text-[#102747]">
                    {[['Adultos', adultos, setAdultos, 1], ['Niños', ninos, setNinos, 0]].map(([etiqueta, valor, setter, min]: any) => <div key={etiqueta} className="flex items-center justify-between py-3">
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
              <select value={tipo} onChange={e => {
                setTipo(e.target.value as TipoHabitacion);
                setHabitacionId('');
              }} className={INPUT_CLS}>
                {TIPOS.map(t => <option key={t} value={t}>
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

          <div className="rounded-xl border border-[#E5E0D8] p-4 bg-[#FCFBF8]">
            <p className="text-sm font-semibold text-[#18345C]">Código promocional</p>
            <div className="flex gap-2 mt-2">
              <input
                value={codigoPromo}
                onChange={e => {
                  setCodigoPromo(e.target.value.toUpperCase());
                  setPromoAplicada(null);
                  setPromoMsg('');
                }}
                placeholder="Código"
                className={`${INPUT_CLS} flex-1`} />
              <button
                type="button"
                onClick={() => {
                  const hoy = fechaHoyISO();
                  const p = leerPromociones().find(x => x.codigo.toUpperCase() === codigoPromo.trim().toUpperCase());
                  if (!p) {
                    setPromoMsg('Código no válido.');
                    setPromoAplicada(null);
                  }
                  else if (!p.activa || hoy < p.desde || hoy > p.hasta) {
                    setPromoMsg('Esta promoción no está vigente.');
                    setPromoAplicada(null);
                  }
                  else {
                    setPromoAplicada(p);
                    setPromoMsg(`${p.nombre}: ${p.descuentoPct}% de descuento aplicado.`);
                  }
                }}
                className="px-4 py-2 rounded-lg bg-[#18345C] text-white font-semibold">Aplicar</button>
            </div>
            {promoMsg && <p className={`text-xs mt-2 ${promoAplicada ? 'text-green-700' : 'text-red-700'}`}>
              {promoMsg}
            </p>}
          </div>

          <div>
            <p className="text-[10px] text-[#AEBCC1] uppercase tracking-widest mb-2">
              Habitaciones disponibles {rangoValido && `· ${noches} noche${noches !== 1 ? 's' : ''}`}
            </p>
            {!rangoValido ? (<p className="text-[13px] text-[#AEBCC1]">Indica un rango de fechas válido.</p>) : disponiblesPiso.length === 0 ? (<p className="text-[13px] text-[#991B1B] bg-[#FEF2F2] border border-[#FCA5A5] rounded-lg px-3 py-2">
              No hay habitaciones {tipo} para {nPersonas} persona(s) en esas fechas.
            </p>) : (<div className="space-y-2 max-h-[30vh] overflow-y-auto">
              {disponiblesPiso.map(h => (<button
                key={h.id}
                type="button"
                onClick={() => setHabitacionId(id => (id === h.id ? '' : h.id))}
                className={`w-full text-left flex items-center gap-3 border rounded-lg px-4 py-3 transition-colors ${habitacionId === h.id ? 'border-[#18345C] bg-[#F8F6F0]' : 'border-[#E5E0D8] hover:border-[#18345C]'}`}>
                {(() => {
                  const v = publicRoomForHotelType(h.tipo);
                  return <img src={v.image} alt={`Habitación ${h.numero}`} className="w-20 h-16 rounded-lg object-cover shrink-0" />;
                })()}
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-bold text-[#18345C] leading-none">Habitación {h.numero}</p>
                  <p className="text-[12px] text-[#AEBCC1] mt-0.5">
                    {h.tipo} · Piso {h.piso} · hasta {h.capacidad} personas
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[15px] font-bold text-[#18345C]">
                    {dinero(h.precioNoche)}
                  </p>
                  <p className="text-[11px] text-[#AEBCC1]">por noche</p>
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

      {pagoAbierto && habElegida && (<div className="absolute inset-0 z-30 overflow-y-auto bg-white p-6">
        <div className="mx-auto max-w-2xl">
          <p className="text-[10px] uppercase tracking-[.18em] text-[#B38719]">Reserva · Pago</p>
          <h2 className="text-3xl font-semibold text-[#18345C]">Selecciona el método de pago</h2>
          <p className="mt-1 text-[#71839B]">El pago se registrará directamente en recepción.</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {([['efectivo', 'Efectivo', 'Registrar el pago recibido en caja.'], ['tarjeta', 'Tarjeta', 'Cobro realizado mediante la terminal de recepción.']] as const).map(([id, titulo, texto]) => <button
              key={id}
              onClick={() => setMetodoPago(id)}
              className={`rounded-xl border p-5 text-left ${metodoPago === id ? 'border-[#18345C] bg-[#EEF4FB] ring-2 ring-[#18345C]/15' : 'border-[#E5E0D8]'}`}>
              <b className="text-lg text-[#18345C]">
                {titulo}
              </b>
              <p className="mt-1 text-sm text-[#71839B]">
                {texto}
              </p>
            </button>)}
          </div>
          <div className="mt-6 rounded-xl bg-[#F8F6F0] p-5">
            <div className="flex justify-between text-sm">
              <span>Habitación {habElegida.numero} · {noches} noches</span>
              <b>
                {dinero(habElegida.precioNoche * noches)}
              </b>
            </div>
            <div className="mt-3 flex justify-between border-t pt-3 text-xl font-bold text-[#18345C]">
              <span>Total</span>
              <span>
                {dinero(habElegida.precioNoche * noches)}
              </span>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <button onClick={() => setPagoAbierto(false)} className="rounded-lg border py-3 font-semibold text-[#52677F]">Volver</button>
            <button onClick={confirmarPago} className="rounded-lg bg-[#18345C] py-3 font-semibold text-white">
              {metodoPago === 'tarjeta' ? 'Registrar cobro y confirmar' : 'Registrar efectivo y confirmar'}
            </button>
          </div>
        </div>
      </div>)}

      {reservaCreada && habElegida && (<div className="absolute inset-0 z-40 overflow-y-auto bg-white p-6">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#EAF7EE] text-3xl text-[#188247]">✓</span>
            <h2 className="mt-4 text-3xl font-semibold text-[#18345C]">Reserva confirmada</h2>
            <p className="mt-1 text-[#71839B]">El pago y la reservación fueron registrados correctamente.</p>
          </div>
          <div className="mt-7 grid gap-5 md:grid-cols-[.9fr_1.1fr]">
            <img
              src={publicRoomForHotelType(habElegida.tipo).image}
              alt={`Habitación ${habElegida.numero}`}
              className="h-full min-h-64 w-full rounded-xl object-cover" />
            <section className="rounded-xl border border-[#E5E0D8] p-5">
              <p className="text-xs uppercase tracking-widest text-[#B38719]">Detalle de la reservación</p>
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <ResumenFinal label="Código" valor={reservaCreada.codigo} />
                <ResumenFinal label="Habitación" valor={`${habElegida.numero} · ${habElegida.tipo}`} />
                <ResumenFinal label="Huésped" valor={huespedes.find(h => h.id === reservaCreada.huespedId)?.nombre || `${nh.nombre} ${nh.apellidos}`.trim()} />
                <ResumenFinal label="Entrada" valor={entrada} />
                <ResumenFinal label="Salida" valor={salida} />
                <ResumenFinal label="Ocupación" valor={`${adultos} adultos · ${ninos} niños`} />
                <ResumenFinal label="Total pagado" valor={dinero(reservaCreada.pagos[0]?.monto || 0)} />
                <ResumenFinal label="Método" valor={metodoPago === 'tarjeta' ? 'Tarjeta · terminal' : 'Efectivo'} />
              </div>
            </section>
          </div>
          <div className="mt-5 rounded-xl border border-[#9BC5F2] bg-[#F1F7FE] p-4 text-sm text-[#52677F]">El huésped recibirá por correo la confirmación y el enlace para activar su cuenta. Veinticuatro horas antes de su llegada recibirá el acceso para completar el check-in web.</div>
          <div className="mt-6 flex flex-wrap justify-end gap-2">
            <button onClick={onCerrar} className="min-h-11 rounded-lg border border-[#18345C] px-4 py-2.5 text-sm font-semibold text-[#18345C]">Hacer otra reserva</button>
            <button onClick={() => onVerReserva(reservaCreada.id)} className="min-h-11 rounded-lg bg-[#18345C] px-4 py-2.5 text-sm font-semibold text-white">Ver reserva / realizar check-in</button>
          </div>
        </div>
      </div>)}

      {!revisando && <div className="px-5 sm:px-6 pb-6 flex gap-3">
        <button onClick={onCerrar} className="flex-1 py-3 text-sm border border-[#E5E0D8] text-[#6B7280] rounded-md hover:bg-[#F8F6F0] transition-colors">
          Cancelar
        </button>
        <button
          onClick={() => setRevisando(true)}
          className="flex-1 py-3 text-sm font-semibold bg-[#18345C] text-white rounded-md hover:bg-[#102747] transition-colors">
          Revisar datos
        </button>
      </div>}
      {revisando && <div className="absolute inset-0 z-20 bg-white overflow-y-auto p-5 sm:p-6">
        <div className="flex justify-between items-start border-b pb-3">
          <div>
            <p className="text-[10px] tracking-[.18em] text-[#B38719] uppercase">Reserva · Revisión</p>
            <h2 className="text-2xl font-semibold text-[#18345C]">Revisa los datos</h2>
          </div>
          <button onClick={() => setRevisando(false)} className="text-2xl" aria-label="Cerrar revisión">×</button>
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
                <small className="text-[#AEBCC1]">Nombre</small>
                <b className="block">
                  {modoNuevoHuesped ? `${nh.nombre} ${nh.apellidos}`.trim() : (hg?.nombre || '—')}
                </b>
              </div>
              <div>
                <small className="text-[#AEBCC1]">Documento</small>
                <b className="block">
                  {modoNuevoHuesped ? `${nh.tipoDocumento} · ${nh.documento}` : (hg ? `${hg.tipoDocumento} · ${hg.documento}` : '—')}
                </b>
              </div>
              <div>
                <small className="text-[#AEBCC1]">Teléfono</small>
                <b className="block">
                  {modoNuevoHuesped ? `${nh.prefijo} ${nh.telefono}` : (hg?.telefono || '—')}
                </b>
              </div>
              <div>
                <small className="text-[#AEBCC1]">Correo</small>
                <b className="block">
                  {modoNuevoHuesped ? nh.correo : (hg?.correo || '—')}
                </b>
              </div>
              <div>
                <small className="text-[#AEBCC1]">Nacionalidad</small>
                <b className="block">
                  {modoNuevoHuesped ? nh.nacionalidad : (hg?.nacionalidad || '—')}
                </b>
              </div>
              <div>
                <small className="text-[#AEBCC1]">Estancia</small>
                <b className="block">{entrada} → {salida} · {adultos} adultos · {ninos} niños</b>
              </div>
            </div>
          </section>{habElegida && room ? <section className="border rounded-xl overflow-hidden flex bg-[#F8F6F0]">
            <img src={room.image} alt={`Habitación ${habElegida.numero}`} className="w-36 h-24 object-cover" />
            <div className="p-3">
              <small className="text-[#AEBCC1]">Habitación seleccionada</small>
              <h3 className="text-lg font-semibold text-[#18345C]">Habitación {habElegida.numero}</h3>
              <p className="text-sm">{room.name} · Piso {habElegida.piso}</p>
              <p className="text-sm">{room.beds} · hasta {habElegida.capacidad} huéspedes</p>
              <b className="block mt-2 text-[#18345C]">{dinero(habElegida.precioNoche)} / noche · {noches} noches · Subtotal {dinero(habElegida.precioNoche * noches)}{promoAplicada ? ` · ${promoAplicada.codigo} (-${promoAplicada.descuentoPct}%) · Total ${dinero(habElegida.precioNoche * noches * (1 - promoAplicada.descuentoPct / 100))}` : ` · Total ${dinero(habElegida.precioNoche * noches)}`}</b>
            </div>
          </section> : <div className="border rounded-xl p-4 bg-[#F8F6F0]">
            <b>Sin habitación asignada</b>
            <p className="text-sm text-[#6B7280]">La reserva puede crearse ahora y asignar la habitación más tarde.</p>
          </div>}<div className="flex justify-end gap-3 mt-3">
              <button onClick={() => setRevisando(false)} className="px-4 py-2 border rounded-md text-sm">Editar</button>
              <button onClick={guardar} className="px-4 py-2 bg-[#18345C] text-white rounded-md text-sm font-semibold">Confirmar reserva</button>
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
    <small className="block text-[#AEBCC1]">
      {label}
    </small>
    <b className="text-[#18345C]">
      {valor}
    </b>
  </div>;
}
