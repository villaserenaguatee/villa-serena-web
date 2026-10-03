import { UiText, useUiText } from "@/i18n/UiText";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import type { OfertaHabitacion, HabitacionHotel, Reserva, Huesped, ReservaHuesped, TipoHabitacion, DatosContacto, } from "@/lib/pms/types";
import { tarjetaPrincipal } from '@/store/paymentStore';
import { fechaHoyISO, fechaRelativaISO, formatoFecha, nochesEntre, } from "@/data/pms";
import { usePublicLanguage } from "@/components/common/PublicLanguageToggle";
import { dinero, Chip, Campo, INPUT_CLS, Cabecera, Tarjeta, Aviso, BotonPrimario, BotonSecundario, habitacionesDisponibles, correoValido, telefonoValido, formatoTarjeta, CalendarIcon, UserIcon, SearchIcon, CheckIcon, MailIcon, CardIcon, BedIcon, } from "@/features/huesped/pages/huespedUtils";
type Paso = "buscar" | "datos" | "revisar" | "pago" | "listo";
const PASOS: {
  id: Paso;
  label: string;
}[] = [
    { id: "buscar", label: "Fechas y habitación" },
    { id: "datos", label: "Datos del huésped" },
    { id: "revisar", label: "Revisar datos" },
    { id: "pago", label: "Pago" },
    { id: "listo", label: "Confirmación" },
  ];
interface Props {
  ofertas: OfertaHabitacion[];
  habitaciones: HabitacionHotel[];
  reservas: Reserva[];
  huesped: Huesped;
  reservaWeb: ReservaHuesped | null;
  onNuevaBusqueda: () => void;
  onVolver?: () => void;
  onVerReservacion?: () => void;
}
export default function ReservarEstancia({ ofertas, habitaciones, reservas, huesped, reservaWeb, onNuevaBusqueda, onVolver, onVerReservacion, }: Props) {
  const ui = useUiText();
  const tBooking = useTranslations("publicBooking");
  const { en } = usePublicLanguage();
  const [paso, setPaso] = useState<Paso>(reservaWeb ? "listo" : "buscar");
  const [entrada, setEntrada] = useState(fechaRelativaISO(7));
  const [salida, setSalida] = useState(fechaRelativaISO(10));
  const [adultos, setAdultos] = useState(1);
  const [ninos, setNinos] = useState(0);
  const personas = adultos + ninos;
  const [selectorHuespedesAbierto, setSelectorHuespedesAbierto] = useState(false);
  const [paraOtraPersona, setParaOtraPersona] = useState(false);
  const [buscado, setBuscado] = useState(false);
  const [errorBusqueda, setErrorBusqueda] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("todas");
  const [pisoFiltro, setPisoFiltro] = useState("todos");
  const [precioMin, setPrecioMin] = useState("");
  const [precioMax, setPrecioMax] = useState("");
  const [tipoElegido, setTipoElegido] = useState<TipoHabitacion | null>(null);
  const [contacto, setContacto] = useState<DatosContacto>({
    nombre: "",
    correo: "",
    telefono: "",
    documento: "",
  });
  const [apellidos, setApellidos] = useState("");
  const [tipoDocumento, setTipoDocumento] = useState("DPI");
  const [codigoPais, setCodigoPais] = useState("+502");
  const [nacionalidad, setNacionalidad] = useState("");
  const [horaLlegada, setHoraLlegada] = useState("15:00");
  const [sinHoraLlegada, setSinHoraLlegada] = useState(false);
  const [erroresDatos, setErroresDatos] = useState<Record<string, string>>({});
  const [tarjeta, setTarjeta] = useState("");
  const [titular, setTitular] = useState("");
  const [vence, setVence] = useState("");
  const [cvv, setCvv] = useState("");
  const [erroresPago, setErroresPago] = useState<Record<string, string>>({});
  const [errorPago, setErrorPago] = useState("");
  const [usarTarjetaGuardada, setUsarTarjetaGuardada] = useState(() => !!tarjetaPrincipal(huesped.id));
  const [aceptaCondiciones, setAceptaCondiciones] = useState(false);
  const guardada = tarjetaPrincipal(huesped.id);
  const noches = nochesEntre(entrada, salida);
  const disponiblesPorTipo = useMemo(() => {
    const libres = habitacionesDisponibles(entrada, salida, habitaciones, reservas, { personas });
    const mapa = new Map<TipoHabitacion, number>();
    for (const h of libres)
      mapa.set(h.tipo, (mapa.get(h.tipo) ?? 0) + 1);
    return mapa;
  },
    [entrada, salida, personas, habitaciones, reservas]);
  const ofertasDisponibles = ofertas.filter((o) => o.capacidad >= personas && (disponiblesPorTipo.get(o.tipo) ?? 0) > 0);
  const ofertasFiltradas = ofertasDisponibles.filter(o => {
    const coincideCategoria = categoriaFiltro === "todas" || o.tipo === categoriaFiltro;
    const coincidePiso = pisoFiltro === "todos" || habitaciones.some(h => h.tipo === o.tipo && h.piso === Number(pisoFiltro));
    const coincideMinimo = !precioMin || o.precioNoche >= Number(precioMin);
    const coincideMaximo = !precioMax || o.precioNoche <= Number(precioMax);
    return coincideCategoria && coincidePiso && coincideMinimo && coincideMaximo;
  });
  const oferta = tipoElegido
    ? ofertas.find((o) => o.tipo === tipoElegido)!
    : null;
  const total = oferta ? oferta.precioNoche * noches : 0;
  function buscar() {
    if (entrada < fechaHoyISO()) {
      setErrorBusqueda("La fecha de entrada no puede ser anterior a hoy.");
      return;
    }
    if (salida <= entrada) {
      setErrorBusqueda("La fecha de salida debe ser posterior a la de entrada.");
      return;
    }
    setErrorBusqueda("");
    setTipoElegido(null);
    setSelectorHuespedesAbierto(false);
    setBuscado(true);
  }
  function irADatos(tipo: TipoHabitacion) {
    setTipoElegido(tipo);
    if (paraOtraPersona) {
      setContacto({ nombre: "", correo: "", telefono: "", documento: "" });
      setApellidos("");
      setTipoDocumento("");
      setNacionalidad("");
    }
    else {
      const partes = huesped.nombre.trim().split(/\s+/);
      setContacto({ nombre: partes.shift() || huesped.nombre, correo: huesped.correo, telefono: huesped.telefono.replace(/^\+?502\s*/, ""), documento: huesped.documento });
      setApellidos(partes.join(" "));
      setTipoDocumento(huesped.tipoDocumento);
      setNacionalidad(huesped.nacionalidad);
    }
    setPaso("datos");
  }
  function validarDatos(): boolean {
    const e: Record<string, string> = {};
    if (!contacto.nombre.trim())
      e.nombre = "Escribe tu nombre completo.";
    if (!apellidos.trim())
      e.apellidos = "Escribe los apellidos.";
    if (!correoValido(contacto.correo))
      e.correo = "Escribe un correo válido para asociarlo a la reservación.";
    if (!telefonoValido(contacto.telefono))
      e.telefono = "Escribe un teléfono de al menos 8 dígitos.";
    if (!contacto.documento.trim())
      e.documento = "Necesitamos tu documento de identidad.";
    if (!tipoDocumento)
      e.tipoDocumento = "Selecciona el tipo de documento.";
    if (!nacionalidad.trim())
      e.nacionalidad = "Escribe la nacionalidad.";
    setErroresDatos(e);
    return Object.keys(e).length === 0;
  }
  function validarPago(): boolean {
    const e: Record<string, string> = {};
    if (!usarTarjetaGuardada && tarjeta.replace(/\D/g, "").length !== 16)
      e.tarjeta = "Escribe los 16 dígitos de la tarjeta.";
    if (!usarTarjetaGuardada && !titular.trim())
      e.titular = "Escribe el nombre tal como aparece en la tarjeta.";
    if (!usarTarjetaGuardada) {
      const coincidencia = /^(\d{2})\/(\d{2})$/.exec(vence);
      if (!coincidencia) {
        e.vence = "Usa el formato MM/AA.";
      }
      else {
        const mes = Number(coincidencia[1]);
        const anio = 2000 + Number(coincidencia[2]);
        const hoy = new Date();
        const vencida = anio < hoy.getFullYear() || (anio === hoy.getFullYear() && mes < hoy.getMonth() + 1);
        if (mes < 1 || mes > 12)
          e.vence = "Escribe un mes válido entre 01 y 12.";
        else if (vencida)
          e.vence = "La tarjeta está vencida. Revisa la fecha.";
      }
    }
    if (!usarTarjetaGuardada && !/^\d{3,4}$/.test(cvv))
      e.cvv = "El código de seguridad tiene 3 o 4 dígitos.";
    if (!aceptaCondiciones)
      e.condiciones = "Debes aceptar los términos y condiciones de la estancia.";
    setErroresPago(e);
    return Object.keys(e).length === 0;
  }
  function pagar() {
    setErrorPago("");
    if (!validarPago() || !tipoElegido)
      return;
    // No persistir la reserva ni avanzar sin aprobación real del proveedor.
    setErrorPago(tBooking("paymentUnavailable"));
  }
  function empezarDeNuevo() {
    onNuevaBusqueda();
    setPaso("buscar");
    setBuscado(false);
    setTipoElegido(null);
    setTarjeta("");
    setTitular("");
    setVence("");
    setCvv("");
    setErroresPago({});
    setErrorPago("");
    setUsarTarjetaGuardada(!!tarjetaPrincipal(huesped.id));
    setAceptaCondiciones(false);
  }
  return (<div className="flex-1 overflow-y-auto bg-[#F8F6F0]" style={{ fontFamily: '"Afacad", "Segoe UI", Arial, sans-serif' }}>
    {onVolver && <div className="bg-white px-4 pt-4 sm:px-6">
      <button onClick={onVolver} className="font-semibold text-[#18345C]">← Volver a Gestionar estancia</button>
    </div>}
    <Cabecera titulo="Reservar otra habitación" subtitulo="Consulta disponibilidad real y confirma tu habitación en línea" />

    <div className="px-4 sm:px-6 pt-5">
      <div className="flex items-center gap-2 flex-wrap">
        {PASOS.map((p,
          i) => {
          const indice = PASOS.findIndex((x) => x.id === paso);
          const hecho = i < indice;
          const activo = p.id === paso;
          return (<div key={p.id} className="flex items-center gap-2">
            <span className={`w-6 h-6 rounded-full text-[12px] font-bold flex items-center justify-center ${activo
              ? "bg-[#18345C] text-white"
              : hecho
                ? "bg-[#D8B94E] text-[#102747]"
                : "bg-white text-[#AEBCC1] border border-[#E5E0D8]"}`}>
              {hecho ? "✓" : i + 1}
            </span>
            <span className={`text-[13px] ${activo ? "font-semibold text-[#18345C]" : "text-[#AEBCC1]"}`}>
              {ui(p.id === "datos" && paraOtraPersona ? "Datos del huésped" : p.label)}
            </span>
            {i < PASOS.length - 1 && (<span className="text-[#E5E0D8] px-1">
              <UiText text="—" />
            </span>)}
          </div>);
        })}
      </div>
    </div>

    <div className="px-4 sm:px-6 py-5 space-y-5">

      {paso === "buscar" && (<>
        <Tarjeta titulo="¿Para quién es esta habitación?">
          <div className="grid max-w-xl grid-cols-2 gap-3">
            <button
              onClick={() => {
                setParaOtraPersona(false);
                setBuscado(false);
              }}
              className={`rounded-lg border px-5 py-4 font-semibold ${!paraOtraPersona ? 'border-[#18345C] bg-[#18345C] text-white' : 'border-[#DCD7CD] bg-white text-[#18345C]'}`}>Para mí</button>
            <button
              onClick={() => {
                setParaOtraPersona(true);
                setBuscado(false);
              }}
              className={`rounded-lg border px-5 py-4 font-semibold ${paraOtraPersona ? 'border-[#18345C] bg-[#18345C] text-white' : 'border-[#DCD7CD] bg-white text-[#18345C]'}`}>Para otra persona</button>
          </div>
        </Tarjeta>
        <Tarjeta titulo={paraOtraPersona ? "¿Cuándo deseas hospedar a estas personas?" : "¿Cuándo quieres hospedarte?"}>
          <div className="grid gap-3 sm:grid-cols-4">
            <Campo label="Entrada">
              <input type="date" value={entrada} min={fechaHoyISO()} onChange={(e) => setEntrada(e.target.value)} className={INPUT_CLS} />
            </Campo>
            <Campo label="Salida">
              <input type="date" value={salida} min={entrada} onChange={(e) => setSalida(e.target.value)} className={INPUT_CLS} />
            </Campo>
            <Campo label="Huéspedes">
              <button onClick={() => setSelectorHuespedesAbierto(!selectorHuespedesAbierto)} className={`${INPUT_CLS} text-left`}>{adultos} {adultos === 1 ? 'adulto' : 'adultos'} · {ninos} {ninos === 1 ? 'niño' : 'niños'}</button>
            </Campo>
            <div className="flex items-end">
              <button
                onClick={buscar}
                className="w-full px-4 py-2.5 min-h-[44px] text-[15px] font-semibold bg-[#18345C] text-white rounded-md hover:bg-[#102747] transition-colors flex items-center justify-center gap-2">
                <SearchIcon size={15} />
                <UiText text=" Buscar                   " />
              </button>
            </div>
          </div>

          {selectorHuespedesAbierto && <div className="mt-3 max-w-sm rounded-xl border border-[#E5E0D8] bg-white p-5 shadow-xl">
            <ContadorHuesped label="Adultos" valor={adultos} minimo={1} onChange={setAdultos} />
            <div className="my-4 border-t" />
            <ContadorHuesped label="Niños" valor={ninos} minimo={0} onChange={setNinos} />
            <button onClick={() => setSelectorHuespedesAbierto(false)} className="mt-5 w-full rounded-lg bg-[#D8B94E] py-3 font-semibold text-[#102747]">Confirmar</button>
          </div>}

          {errorBusqueda && (<div className="mt-3">
            <Aviso tono="error">
              {errorBusqueda}
            </Aviso>
          </div>)}

          {!errorBusqueda && noches > 0 && (<p className="text-[13px] text-[#6B7280] mt-3">
            {noches}
            {ui(noches === 1 ? "noche" : "noches")}
            <UiText text=" · del " />
            {formatoFecha(entrada)}
            <UiText text=" al " />
            {formatoFecha(salida)}
          </p>)}
        </Tarjeta>

        {buscado && (<>
          <section className="rounded-xl border border-[#E5E0D8] bg-white p-5">
            <div className="grid items-end gap-4 md:grid-cols-[1fr_1fr_1.5fr_auto_auto]">
              <Campo label="Categoría">
                <select value={categoriaFiltro} onChange={e => setCategoriaFiltro(e.target.value)} className={INPUT_CLS}>
                  <option value="todas">Todas</option>
                  {ofertas.map(o => <option key={o.tipo} value={o.tipo}>
                    {o.tipo}
                  </option>)}
                </select>
              </Campo>
              <Campo label="Piso">
                <select value={pisoFiltro} onChange={e => setPisoFiltro(e.target.value)} className={INPUT_CLS}>
                  <option value="todos">Todos</option>
                  {Array.from(new Set(habitaciones.map(h => h.piso))).sort().map(p => <option key={p} value={p}>Piso {p}</option>)}
                </select>
              </Campo>
              <div>
                <p className="mb-1.5 text-[12px] font-semibold text-[#18345C]">Rango de precio</p>
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" min="0" value={precioMin} onChange={e => setPrecioMin(e.target.value)} placeholder="Mínimo" className={INPUT_CLS} />
                  <input type="number" min="0" value={precioMax} onChange={e => setPrecioMax(e.target.value)} placeholder="Máximo" className={INPUT_CLS} />
                </div>
              </div>
              <button
                onClick={() => {
                  setCategoriaFiltro("todas");
                  setPisoFiltro("todos");
                  setPrecioMin("");
                  setPrecioMax("");
                }}
                className="min-h-[44px] rounded-md border border-[#18345C] px-4 font-semibold text-[#18345C]">Limpiar</button>
              <b className="pb-3 text-sm text-[#71839B]">
                {ofertasFiltradas.length}
                {ofertasFiltradas.length === 1 ? 'opción' : 'opciones'}
              </b>
            </div>
          </section>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-[20px] font-semibold text-[#18345C]">
              <UiText text="Habitaciones disponibles" />
            </h2>
            <Chip cls="bg-[#F0FAF4] text-[#166534] border-[#86EFAC]">
              {ofertasFiltradas.length}
              {" "}
              {ofertasFiltradas.length === 1 ? "tipo" : "tipos"}
            </Chip>
          </div>

          {ofertasFiltradas.length === 0 ? (<Aviso tono="alerta">
            No hay habitaciones que coincidan con estos filtros. Prueba con otra categoría, piso o rango de precio.
          </Aviso>) : (<div className="grid gap-4 lg:grid-cols-2">
            {ofertasFiltradas.map((o) => (<TarjetaOferta key={o.tipo} oferta={o} noches={noches} restantes={disponiblesPorTipo.get(o.tipo) ?? 0} onElegir={() => irADatos(o.tipo)} />))}
          </div>)}

          <p className="text-[12px] text-[#AEBCC1]">
            <UiText text="                   La disponibilidad se consulta contra las reservas vigentes del hotel, por lo que solo se                   muestran habitaciones realmente libres en esas fechas.                 " />
          </p>
        </>)}
      </>)}

      {paso === "datos" && oferta && (<div className="grid gap-5 lg:grid-cols-[300px_1fr]">
        <div className="space-y-5 lg:order-2">
          <Tarjeta titulo="Datos del huésped">
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo label="Nombres" error={erroresDatos.nombre}>
                <input value={contacto.nombre} onChange={(e) => setContacto({ ...contacto, nombre: e.target.value })} className={INPUT_CLS} placeholder="Nombres" />
              </Campo>
              <Campo label="Apellidos" error={erroresDatos.apellidos}>
                <input value={apellidos} onChange={e => setApellidos(e.target.value)} className={INPUT_CLS} placeholder="Apellidos" />
              </Campo>
              <Campo label="Tipo de documento" error={erroresDatos.tipoDocumento}>
                <select value={tipoDocumento} onChange={e => setTipoDocumento(e.target.value)} className={INPUT_CLS}>
                  <option value="">Seleccionar</option>
                  <option>DPI</option>
                  <option>Pasaporte</option>
                </select>
              </Campo>
              <Campo label="Número de documento" error={erroresDatos.documento}>
                <input
                  value={contacto.documento}
                  onChange={(e) => setContacto({ ...contacto, documento: e.target.value.replace(tipoDocumento === 'DPI' ? /\D/g : /[^A-Za-z0-9]/g, '').slice(0, tipoDocumento === 'DPI' ? 13 : 20) })}
                  maxLength={tipoDocumento === 'DPI' ? 13 : 20}
                  className={INPUT_CLS}
                  placeholder={ui("Número de documento")} />
              </Campo>
              <Campo label="Correo electrónico" error={erroresDatos.correo}>
                <input
                  type="email"
                  value={contacto.correo}
                  onChange={(e) => setContacto({ ...contacto, correo: e.target.value })}
                  className={INPUT_CLS}
                  placeholder={ui("nombre@correo.com")} />
              </Campo>
              <Campo label="Teléfono" error={erroresDatos.telefono}>
                <div className="grid grid-cols-[120px_1fr] gap-2">
                  <select value={codigoPais} onChange={e => setCodigoPais(e.target.value)} className={INPUT_CLS}>
                    <option value="+502">+502</option>
                    <option value="+52">+52</option>
                    <option value="+503">+503</option>
                    <option value="+504">+504</option>
                    <option value="+506">+506</option>
                    <option value="+1">+1</option>
                  </select>
                  <input
                    value={contacto.telefono}
                    onChange={(e) => setContacto({ ...contacto, telefono: e.target.value.replace(/\D/g, "").slice(0, codigoPais === "+1" || codigoPais === "+52" ? 10 : 8) })}
                    maxLength={codigoPais === "+1" || codigoPais === "+52" ? 10 : 8}
                    inputMode="numeric"
                    className={INPUT_CLS} />
                </div>
              </Campo>
              <Campo label="Nacionalidad" error={erroresDatos.nacionalidad}>
                <input value={nacionalidad} onChange={e => setNacionalidad(e.target.value)} className={INPUT_CLS} placeholder="Nacionalidad" />
              </Campo>
              <Campo label="Hora estimada de llegada">
                <input
                  type="time"
                  value={horaLlegada}
                  disabled={sinHoraLlegada}
                  onChange={e => setHoraLlegada(e.target.value)}
                  className={`${INPUT_CLS} disabled:bg-[#F1F3F5]`} />
                <label className="mt-2 flex items-center gap-2 text-xs font-normal text-[#60738B]"><input type="checkbox" checked={sinHoraLlegada} onChange={e => setSinHoraLlegada(e.target.checked)} className="accent-[#18345C]" />Aún no conozco la hora de llegada</label>
              </Campo>
            </div>

            <div className="mt-4">
              <Aviso tono="info">
                <span className="flex items-start gap-2">
                  <MailIcon />
                  <span>
                    {!paraOtraPersona ? "Usaremos los datos guardados en tu perfil para esta reservación. Puedes corregirlos antes de continuar." : "La reservación quedará asociada al correo del huésped para identificarla y gestionarla desde el portal."}
                  </span>
                </span>
              </Aviso>
            </div>

            {errorPago && <p role="alert" className="mt-2 text-sm text-[#991B1B]">{errorPago}</p>}
            <div className="flex gap-2 mt-5">
              <BotonSecundario onClick={() => setPaso("buscar")} ancho>
                <UiText text="Volver" />
              </BotonSecundario>
              <BotonPrimario ancho onClick={() => {
                if (validarDatos())
                  setPaso("revisar");
              }}>
                Revisar datos
              </BotonPrimario>
            </div>
          </Tarjeta>
        </div>

        <div className="lg:order-1">
          <ResumenReserva oferta={oferta} entrada={entrada} salida={salida} noches={noches} personas={personas} total={total} />
        </div>
      </div>)}

      {paso === "revisar" && oferta && (<div className="grid gap-5 lg:grid-cols-[300px_1fr]">
        <div>
          <ResumenReserva oferta={oferta} entrada={entrada} salida={salida} noches={noches} personas={personas} total={total} />
        </div>
        <Tarjeta titulo="Revisa los datos">
          {paraOtraPersona && <p className="mb-5 text-sm text-[#60738B]">Reserva realizada por: <b className="text-[#18345C]">
            {huesped.nombre}
          </b></p>}
          <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
            <DatoRevision label="Huésped" valor={`${contacto.nombre} ${apellidos}`.trim()} />
            <DatoRevision label={tipoDocumento || "Documento"} valor={`${tipoDocumento} · •••• ${contacto.documento.slice(-4)}`} />
            <DatoRevision label="Correo" valor={contacto.correo} />
            <DatoRevision label="Teléfono" valor={`${codigoPais} ${contacto.telefono}`} />
            <DatoRevision label="Nacionalidad" valor={nacionalidad} />
            <DatoRevision label="Hora estimada de llegada" valor={sinHoraLlegada ? "Por confirmar" : horaLlegada} />
            <DatoRevision label="Habitación" valor={oferta.tipo} />
            <DatoRevision
              label="Estancia"
              valor={`${formatoFecha(entrada)} — ${formatoFecha(salida)} · ${personas} ${personas === 1 ? 'huésped' : 'huéspedes'}`} />
          </div>
          <div className="mt-5">
            <Aviso tono="info">
              <span className="flex items-start gap-2">
                <MailIcon />
                <span>Al confirmar la reserva, {`${contacto.nombre.split(/\s+/)[0]} ${apellidos.split(/\s+/)[0] || ''}`.trim()} recibirá por correo la confirmación, el código de reserva y un enlace seguro para activar su acceso al portal.</span>
              </span>
            </Aviso>
          </div>
          <div className="mt-5 flex gap-3">
            <BotonSecundario onClick={() => setPaso("datos")} ancho>Editar</BotonSecundario>
            <BotonPrimario onClick={() => setPaso("pago")} ancho>Realizar pago</BotonPrimario>
          </div>
        </Tarjeta>
      </div>)}

      {paso === "pago" && oferta && (<div className="grid gap-5 lg:grid-cols-[300px_1fr]">
        <div>
          <ResumenReserva oferta={oferta} entrada={entrada} salida={salida} noches={noches} personas={personas} total={total} />
        </div>
        <div className="space-y-5">
          <Tarjeta titulo="Selecciona el método de pago">
            <p className="mb-4 text-sm text-[#71839B]">Elige cómo deseas pagar tu reserva.</p>
            <div className="flex items-center rounded-lg border border-[#18345C] bg-[#F3F7FC] p-4 font-semibold text-[#18345C]">
              Tarjeta de crédito o débito
            </div>

            <div className="mt-5">
              <div className="mx-auto flex aspect-[1.586/1] w-full max-w-[380px] flex-col justify-between rounded-[22px] bg-gradient-to-br from-[#102F56] to-[#28537E] p-5 text-white shadow-lg">
                <div className="flex items-start justify-between">
                  <b className="text-lg">Villa Serena</b>
                  <span className="font-semibold">
                    {guardada?.marca ?? "Tarjeta"}
                  </span>
                </div>
                <p className="text-lg tracking-[.24em] sm:text-xl">
                  {guardada ? `•••• •••• •••• ${guardada.ultimos4}` : "•••• •••• •••• ••••"}
                </p>
                <div className="flex justify-between gap-4 text-sm">
                  <span>
                    {guardada?.titular ?? "Sin tarjeta guardada"}
                  </span>
                  <span>
                    {guardada?.vencimiento ?? "—"}
                  </span>
                </div>
              </div>
              <div className="mt-4 space-y-3 rounded-xl border border-[#E5E0D8] p-4">
                <label className="flex cursor-pointer gap-3">
                  <input type="radio" name="tarjeta-reserva" disabled={!guardada} checked={usarTarjetaGuardada && !!guardada} onChange={() => setUsarTarjetaGuardada(true)} className="accent-[#18345C]" />
                  <span>
                    <b className="block text-[#18345C]">Usar tarjeta guardada</b>
                    <small className="text-[#52677F]">
                      {guardada ? `${guardada.marca} · •••• ${guardada.ultimos4}` : "Sin tarjeta guardada"}
                    </small>
                  </span>
                </label>
                <label className="flex cursor-pointer items-center gap-3"><input
                  type="radio"
                  name="tarjeta-reserva"
                  checked={!usarTarjetaGuardada}
                  onChange={() => setUsarTarjetaGuardada(false)}
                  className="accent-[#18345C]" />Agregar otra tarjeta</label>
              </div>
            </div>

            {!usarTarjetaGuardada && <section className="mt-5 rounded-xl border border-[#E5E0D8] p-5">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-[#18345C]">Formulario de tarjeta</h3>
                  <p className="text-xs text-[#71839B]">El pago con tarjeta no está disponible en este momento.</p>
                </div>
                <b className="text-[#18345C]">●● &nbsp; VISA</b>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Campo label="Número de tarjeta" error={erroresPago.tarjeta}>
                    <input
                      value={tarjeta}
                      onChange={(e) => {
                        setTarjeta(formatoTarjeta(e.target.value));
                        setErroresPago(actual => ({ ...actual, tarjeta: "" }));
                      }}
                      className={INPUT_CLS}
                      placeholder="0000 0000 0000 0000"
                      inputMode="numeric"
                      autoComplete="cc-number"
                      maxLength={19} />
                  </Campo>
                </div>
                <div className="sm:col-span-2">
                  <Campo label="Titular de la tarjeta" error={erroresPago.titular}>
                    <input
                      value={titular}
                      onChange={(e) => {
                        setTitular(e.target.value);
                        setErroresPago(actual => ({ ...actual, titular: "" }));
                      }}
                      className={INPUT_CLS}
                      placeholder={ui("Nombre impreso en la tarjeta")} />
                  </Campo>
                </div>
                <Campo label="Vencimiento" error={erroresPago.vence}>
                  <input
                    value={vence}
                    onChange={(e) => {
                      const d = e.target.value.replace(/\D/g, "").slice(0, 4);
                      setVence(d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d);
                      setErroresPago(actual => ({ ...actual, vence: "" }));
                    }}
                    className={INPUT_CLS}
                    placeholder="MM/AA"
                    inputMode="numeric"
                    autoComplete="cc-exp"
                    maxLength={5} />
                </Campo>
                <Campo label="Código de seguridad" error={erroresPago.cvv}>
                  <input
                    value={cvv}
                    onChange={(e) => {
                      setCvv(e.target.value.replace(/\D/g, "").slice(0, 4));
                      setErroresPago(actual => ({ ...actual, cvv: "" }));
                    }}
                    className={INPUT_CLS}
                    placeholder="CVV"
                    inputMode="numeric"
                    autoComplete="cc-csc"
                    maxLength={4} />
                </Campo>
              </div>
            </section>}

            <div className="mt-4">
              <Aviso tono="info">
                <span className="flex items-start gap-2">
                  <CardIcon />
                  <span>
                    <UiText text="El pago con tarjeta no está disponible en este momento." />
                  </span>
                </span>
              </Aviso>
            </div>

            <label className="mt-5 flex cursor-pointer items-start gap-3 text-sm text-[#314860]">
              <input type="checkbox" checked={aceptaCondiciones} onChange={e => setAceptaCondiciones(e.target.checked)} className="mt-1 accent-[#18345C]" />
              <span>He leído y acepto las <u>condiciones de reserva y cancelación</u>, así como la <u>política de privacidad</u>.</span>
            </label>
            {erroresPago.condiciones && <p className="mt-2 text-xs text-[#991B1B]">
              {erroresPago.condiciones}
            </p>}

            <div className="flex gap-2 mt-5">
              <BotonSecundario onClick={() => setPaso("revisar")} ancho>
                <UiText text="Volver" />
              </BotonSecundario>
              <BotonPrimario ancho onClick={pagar}>
                <UiText text="Pagar" />
              </BotonPrimario>
            </div>
          </Tarjeta>
        </div>

      </div>)}

      {paso === "listo" && reservaWeb && (() => {
        const esParaOtraPersona = paraOtraPersona || reservaWeb.contacto.correo.toLowerCase() !== huesped.correo.toLowerCase();
        return (<div className="mx-auto max-w-5xl pb-10">
          <div className="overflow-hidden rounded-2xl border border-[#E5E0D8] bg-white shadow-sm">
            <div className="px-6 pb-5 pt-7 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#EAF7EE] text-[#188247]">
                <CheckIcon size={22} />
              </div>
              <p className="mt-3 text-[30px] font-semibold text-[#18345C]">
                <UiText text="¡Reserva confirmada!" />
              </p>
              <p className="mt-1 text-[15px] text-[#52677F]">
                Reserva registrada y asociada a {" "}
                {reservaWeb.contacto.correo}
              </p>
            </div>

            <div className="grid gap-4 px-6 pb-6 lg:grid-cols-2">
              <section className="rounded-xl border border-[#DCE3EA] p-5">
                <h3 className="text-xl font-semibold text-[#18345C]">Detalle de la reservación</h3>
                <div className="mt-3 flex items-center justify-between border-b border-[#E5E0D8] pb-3">
                  <span className="text-sm text-[#71839B]">Código de reserva</span>
                  <strong className="text-2xl text-[#18345C]">
                    {reservaWeb.codigo}
                  </strong>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-x-5 gap-y-3 text-sm">
                  <DatoConfirmacion label="Habitación" valor={reservaWeb.tipo} />
                  <DatoConfirmacion label="Huésped" valor={reservaWeb.contacto.nombre} />
                  <DatoConfirmacion label="Entrada" valor={formatoFecha(reservaWeb.fechaEntrada)} />
                  <DatoConfirmacion label="Salida" valor={formatoFecha(reservaWeb.fechaSalida)} />
                  <DatoConfirmacion label="Ocupación" valor={`${reservaWeb.personas} ${reservaWeb.personas === 1 ? 'huésped' : 'huéspedes'}`} />
                  <DatoConfirmacion label={/^\d{4}$/.test(reservaWeb.ultimos4) ? "Total pagado" : "Total de la reserva"} valor={dinero(reservaWeb.total)} />
                  <div className="col-span-2">
                    <DatoConfirmacion
                      label="Método de pago"
                      valor={/^\d{4}$/.test(reservaWeb.ultimos4) ? `Tarjeta de crédito •••• ${reservaWeb.ultimos4}` : "Pago sin confirmar"} />
                  </div>
                </div>
              </section>

              <section className="flex flex-col rounded-xl border border-[#9BC5F2] bg-[#F1F7FE] p-5">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-[#DDEEFF] text-[#18345C]">
                    <UserIcon />
                  </span>
                  <h3 className="text-xl font-semibold text-[#18345C]">
                    {esParaOtraPersona ? 'Acceso del huésped' : 'Reserva vinculada a tu cuenta'}
                  </h3>
                </div>
                <p className="mt-5 text-[#52677F]">
                  {esParaOtraPersona ? `La reserva quedó registrada para ${reservaWeb.contacto.correo}. Comparte el código de reserva con el huésped para que pueda identificarla.` : `La reservación ya está disponible en tu cuenta y quedó asociada a ${reservaWeb.contacto.correo}.`}
                </p>
                <div className="mt-auto pt-8 text-center font-semibold text-[#188247]">
                  <span className="mr-2 inline-grid h-6 w-6 place-items-center rounded-full bg-[#188247] text-white">
                    <CheckIcon size={13} />
                  </span>
                  {esParaOtraPersona ? 'Reserva registrada' : 'Reserva disponible'}
                </div>
              </section>

              <div className="lg:col-span-2">
                <Aviso tono="info">
                  <span className="flex items-center gap-3">
                    <CalendarIcon />
                    <span>Podrás completar el check-in desde el portal cuando esté habilitado.</span>
                  </span>
                </Aviso>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:col-span-2">
                <BotonSecundario onClick={empezarDeNuevo} ancho>Hacer otra reserva</BotonSecundario>
                <BotonPrimario onClick={onVerReservacion ?? onVolver ?? (() => { })} ancho>Ver reservación</BotonPrimario>
              </div>
            </div>
          </div>
        </div>);
      })()}
    </div>
  </div>);
}
function DatoConfirmacion({ label, valor }: {
  label: string;
  valor: string;
}) {
  return <div>
    <p className="text-xs uppercase tracking-wide text-[#93A3B3]">
      {label}
    </p>
    <p className="mt-0.5 font-semibold text-[#18345C]">
      {valor}
    </p>
  </div>;
}
function TarjetaOferta({ oferta, noches, restantes, onElegir, }: {
  oferta: OfertaHabitacion;
  noches: number;
  restantes: number;
  onElegir: () => void;
}) {
  const ui = useUiText();
  const [foto, setFoto] = useState(0);
  const { en } = usePublicLanguage();
  return (<div className="bg-white border border-[#E5E0D8] rounded-xl overflow-hidden flex flex-col">
    <div className="relative">
      <img src={oferta.fotos[foto]} alt={`Habitación ${oferta.tipo}`} className="w-full h-48 object-cover bg-[#F8F6F0]" />

      {oferta.fotos.length > 1 && (<div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
        {oferta.fotos.map((_,
          i) => (<button
            key={i}
            onClick={() => setFoto(i)}
            aria-label={`Ver foto ${i + 1}`}
            className="w-2 h-2 rounded-full transition-colors"
            style={{
              backgroundColor: i === foto ? "#FFFFFF" : "rgba(255,255,255,0.5)",
            }} />))}
      </div>)}
      {restantes <= 2 && (<span className="absolute top-2 right-2 text-[11px] font-semibold px-2 py-1 rounded-md bg-[#FEF2F2] text-[#991B1B] border border-[#FCA5A5]">
        {restantes === 1
          ? "¡Última disponible!"
          : `Solo quedan ${restantes}`}
      </span>)}
    </div>

    <div className="px-4 py-4 flex-1 flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[20px] font-semibold text-[#18345C] leading-tight">
            {oferta.tipo}
          </p>
          <p className="text-[13px] text-[#AEBCC1] mt-0.5">
            {oferta.metros}
            <UiText text=" m² · hasta " />
            {oferta.capacidad}
            {" "}
            {ui(oferta.capacidad === 1 ? "persona" : "personas")}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[22px] font-bold text-[#18345C] leading-none">
            {dinero(oferta.precioNoche)}
          </p>
          <p className="text-[11px] text-[#AEBCC1] mt-0.5">
            <UiText text="por noche" />
          </p>
        </div>
      </div>

      <p className="text-[14px] text-[#6B7280] mt-2">
        {en ? oferta.descripcion.en : oferta.descripcion.es}
      </p>

      <div className="flex flex-wrap gap-1.5 mt-3">
        {oferta.amenidades.map((a) => {
          const label = en ? a.en : a.es;
          return (<Chip key={a.es} cls="bg-[#F8F6F0] text-[#6B7280] border-[#E5E0D8]">
            {label}
          </Chip>);
        })}
      </div>

      <div className="mt-auto pt-4 flex items-center gap-3">
        <div className="flex-1">
          <p className="text-[12px] text-[#AEBCC1]">
            {restantes}
            {" "}
            {ui(restantes === 1 ? "habitación libre" : "habitaciones libres")}
          </p>
          {noches > 0 && (<p className="text-[14px] font-semibold text-[#18345C]">
            {dinero(oferta.precioNoche * noches)}
            <UiText text=" por " />
            {noches}
            {ui(noches === 1 ? "noche" : "noches")}
          </p>)}
        </div>
        <button
          onClick={onElegir}
          className="px-4 py-2.5 min-h-[44px] text-[14px] font-semibold bg-[#18345C] text-white rounded-md hover:bg-[#102747] transition-colors shrink-0">
          <UiText text="             Reservar           " />
        </button>
      </div>
    </div>
  </div>);
}
function ResumenReserva({ oferta, entrada, salida, noches, personas, total, }: {
  oferta: OfertaHabitacion;
  entrada: string;
  salida: string;
  noches: number;
  personas: number;
  total: number;
}) {
  const ui = useUiText();
  return (<div className="lg:col-span-1">
    <div className="bg-white border border-[#E5E0D8] rounded-xl overflow-hidden lg:sticky lg:top-0">
      <div className="flex items-center justify-center border-b border-[#E5E0D8] bg-white px-4 py-3">
        <img src="/villa-serena-logo.png" alt="Villa Serena Hotel" className="h-14 w-auto object-contain" />
      </div>
      <img src={oferta.fotos[0]} alt={oferta.tipo} className="w-full h-36 object-cover bg-[#F8F6F0]" />
      <div className="px-4 py-4 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-[#18345C]">
            <BedIcon size={16} />
          </span>
          <p className="text-[17px] font-semibold text-[#18345C]">
            {oferta.tipo}
          </p>
        </div>

        <div className="text-[14px] text-[#6B7280] space-y-1.5">
          <p className="flex items-center gap-2">
            <CalendarIcon />
            {formatoFecha(entrada)}
            <UiText text=" → " />
            {formatoFecha(salida)}
          </p>
          <p className="flex items-center gap-2">
            <UserIcon />
            {personas}
            {ui(personas === 1 ? "huésped" : "huéspedes")}
          </p>
        </div>

        <div className="border-t border-[#E5E0D8] pt-3 space-y-1.5">
          <div className="flex justify-between text-[14px] text-[#6B7280]">
            <span>
              {dinero(oferta.precioNoche)}
              <UiText text=" × " />
              {noches}
              {ui(noches === 1 ? "noche" : "noches")}
            </span>
            <span>
              {dinero(total)}
            </span>
          </div>
          <div className="flex justify-between text-[14px] text-[#6B7280]">
            <span>
              <UiText text="Impuestos incluidos" />
            </span>
            <span>
              <UiText text="—" />
            </span>
          </div>
          <div className="flex justify-between items-baseline border-t border-[#E5E0D8] pt-2 mt-2">
            <span className="text-[15px] font-semibold text-[#18345C]">
              <UiText text="Total" />
            </span>
            <span className="text-[22px] font-bold text-[#18345C]">
              {dinero(total)}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>);
}
function Fila({ label, valor }: {
  label: string;
  valor: string;
}) {
  const ui = useUiText();
  return (<div className="bg-[#F8F6F0] border border-[#E5E0D8] rounded-lg px-3 py-2.5">
    <p className="text-[10px] text-[#AEBCC1] uppercase tracking-widest">
      {ui(label)}
    </p>
    <p className="text-[15px] font-semibold text-[#18345C] mt-0.5">
      {valor}
    </p>
  </div>);
}
function ContadorHuesped({ label, valor, minimo, onChange }: {
  label: string;
  valor: number;
  minimo: number;
  onChange: (valor: number) => void;
}) {
  return <div className="flex items-center justify-between">
    <b className="text-[#18345C]">
      {label}
    </b>
    <div className="flex items-center gap-4">
      <button
        type="button"
        disabled={valor <= minimo}
        onClick={() => onChange(Math.max(minimo, valor - 1))}
        className="grid h-9 w-9 place-items-center rounded-full border border-[#D8B94E] text-xl text-[#18345C] disabled:opacity-35">−</button>
      <strong className="w-5 text-center text-[#18345C]">
        {valor}
      </strong>
      <button
        type="button"
        onClick={() => onChange(valor + 1)}
        className="grid h-9 w-9 place-items-center rounded-full border border-[#D8B94E] text-xl text-[#18345C]">+</button>
    </div>
  </div>;
}
function DatoRevision({ label, valor }: {
  label: string;
  valor: string;
}) {
  return <div className="border-b border-[#E5E0D8] pb-3">
    <small className="block text-xs uppercase tracking-[.12em] text-[#91A0B0]">
      {label}
    </small>
    <b className="mt-1 block text-[#18345C]">
      {valor}
    </b>
  </div>;
}
