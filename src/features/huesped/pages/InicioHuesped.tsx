import {useEffect,useState} from 'react';
import {LockKeyhole} from 'lucide-react';
import {LockedGuestButton} from './GuestRestriction';
import {usePublicLanguage} from '@/components/common/PublicLanguageToggle';
import { UiText, useUiText } from "@/i18n/UiText";
import type { Huesped, Reserva, HabitacionHotel, EstadoHabHotel, CheckInWeb, PedidoHuesped, ReservaAmenidad, Domotica, SeccionHuesped, } from "@/lib/pms/types";
import { formatoFecha, formatoHoraISO, WIFI_RED, TELEFONO_RECEPCION } from "@/data/pms";
import type { ResumenCuentaHuesped } from "@/features/huesped/pages/huespedUtils";
import { dinero, Chip, Tarjeta, Aviso, BotonPrimario, CodigoQR, ESTADO_PEDIDO_META, RESERVA_META, formatoPuntos, totalPedido, pedidoActivo, BedIcon, KeyIcon, ClockIcon, CartIcon, ThermoIcon, WifiIcon, StarIcon, CalendarIcon, CheckIcon, SparkIcon, } from "@/features/huesped/pages/huespedUtils";
interface Props {
  accountReady?:boolean;
  conectado?: boolean;
  huesped: Huesped;
  reserva: Reserva;
  habitacion?: HabitacionHotel;
  estadoHabitacion: EstadoHabHotel;
  checkin: CheckInWeb;
  pedidos: PedidoHuesped[];
  reservasAmenidad: ReservaAmenidad[];
  domotica: Domotica;
  cuenta: ResumenCuentaHuesped;
  puntos: number;
  llaveActiva: boolean;
  estanciaCerrada: boolean;
  onIr: (s: SeccionHuesped) => void;
}
export default function InicioHuesped({ accountReady=true, conectado=false, huesped, reserva, habitacion, estadoHabitacion, checkin, pedidos, reservasAmenidad, domotica, cuenta, puntos, llaveActiva, estanciaCerrada, onIr, }: Props) {
  const ui = useUiText();
  const {en}=usePublicLanguage(),pending=en?'Pending assignment':'Pendiente de asignación';
  const activos = pedidos.filter(pedidoActivo);
  const [remoteOrders,setRemoteOrders]=useState<{id:number;estado:string;total:number;creadoEn:string;items:{nombre:string;cantidad:number}[]}[]|null>(null),[ordersError,setOrdersError]=useState(false);
  useEffect(()=>{if(!conectado)return;const abort=new AbortController();setRemoteOrders(null);setOrdersError(false);fetch('/api/app/reservas/'+encodeURIComponent(reserva.codigo)+'/pedidos',{cache:'no-store',signal:abort.signal}).then(async r=>{if(!r.ok)throw Error();return r.json();}).then(setRemoteOrders).catch(()=>{if(!abort.signal.aborted)setOrdersError(true);});return()=>abort.abort();},[conectado,reserva.codigo]);
  const activeOrders=(remoteOrders??[]).filter(o=>!['ENTREGADO','CANCELADO'].includes(o.estado));
  const rm = RESERVA_META[reserva.estado];
  const primerNombre = huesped.nombre.split(" ")[0];
  return (<div data-guest-reference="stay-38cf2a3" className="flex-1 min-w-0 overflow-y-auto bg-[#F8F6F0]" style={{ fontFamily: '"Afacad", "Segoe UI", Arial, sans-serif' }}>
    <div className="px-4 sm:px-5 py-3 bg-white border-b border-[#E5E0D8]">
      <p className="text-[13px] text-[#AEBCC1] uppercase tracking-widest">
        <UiText text="Bienvenida a Villa Serena" />
      </p>
      <h1 className="text-[26px] font-semibold text-[#18345C] leading-tight mt-1">
        <UiText text="Hola, " />
        {primerNombre}
      </h1>
      <div className="flex items-center gap-2 flex-wrap mt-2">
        <Chip cls={rm.chip}>
          {ui(rm.label)}
        </Chip>
        <span className="text-[14px] text-[#6B7280]">
          {ui(estanciaCerrada
            ? "Tu estancia finalizó. Gracias por hospedarte con nosotros."
            : `Habitación ${(habitacion?.numero ?? pending)} · ${(habitacion?.tipo ?? reserva.tipoHabitacion)} · salida el ${formatoFecha(reserva.fechaSalida)}`)}
        </span>
      </div>
    </div>

    <div className="px-4 sm:px-5 py-3.5 space-y-3">

      {!estanciaCerrada && checkin.estado === "disponible" && (<div className="bg-[#FFFBEF] border border-[#F3D98B] rounded-xl px-4 py-3">
        <p className="text-[15px] font-semibold text-[#78450A]">
          {conectado ? (en?'Check-in documents':'Documentos del check-in') : <UiText text="Completa tu check-in" />}
        </p>
        <p className="text-[14px] text-[#78450A] mt-1">
          {conectado ? (['confirmada','en-curso'].includes(reserva.estado) ? (en?'You can upload your documents for Reception to review. This does not complete check-in.':'Puedes enviar tus documentos para que Recepción los revise. Esto no realiza el check-in.') : (en?'Your reservation must be confirmed before you can upload documents.':'Tu reserva debe estar confirmada antes de enviar documentos.')) : <UiText text="Verifica tus datos, acepta las condiciones de privacidad y envía la información a Recepción." />}
        </p>
        <button
          disabled={conectado && !['confirmada','en-curso'].includes(reserva.estado)}
          onClick={() => {if(!conectado || ['confirmada','en-curso'].includes(reserva.estado))onIr("checkin");}}
          className="mt-3 px-4 py-2.5 min-h-[44px] text-[14px] font-semibold bg-[#18345C] text-white rounded-md hover:bg-[#102747] transition-colors">
          {conectado && !['confirmada','en-curso'].includes(reserva.estado) && <LockKeyhole size={16} className="inline mr-2"/>}{conectado ? (en?'Upload documents':'Enviar documentos') : <UiText text="Completar check-in" />}
        </button>
      </div>)}

      {estanciaCerrada && conectado && <Aviso tono="info">{en ? 'Your stay has ended. View the account for recorded payments and available documents.' : 'Tu estancia finalizó. Consulta en la cuenta los pagos registrados y los documentos disponibles.'}</Aviso>}
      {estanciaCerrada && !conectado && (<Aviso tono="exito">
        <UiText text="             Check-out completado. La habitación " />
        {(habitacion?.numero ?? pending)}
        <UiText text=" quedó registrada como desocupada y             pendiente de limpieza. Te enviamos la factura y el comprobante a " />
        {huesped.correo}
        <UiText text=".           " />
      </Aviso>)}

      <div className="grid gap-3 lg:grid-cols-2">

        <Tarjeta
          titulo="Tu estancia"
          extra={<span className="text-[13px] font-semibold text-[#18345C]">
            {reserva.codigo}
          </span>}>
          <div className="flex items-start gap-4">
            {conectado && <img src="/images/demo-standard.jpg" alt={en?'Villa Serena room catalogue photograph':'Fotografía del catálogo de habitaciones de Villa Serena'} className="w-36 h-24 rounded-lg object-cover shrink-0"/>}
            {habitacion && !conectado && <img
              src={(habitacion?.tipo ?? reserva.tipoHabitacion) === "Standard"
                ? "/images/demo-standard.jpg"
                : (habitacion?.tipo ?? reserva.tipoHabitacion) === "Superior"
                  ? "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=600&h=380&fit=crop&auto=format"
                  : (habitacion?.tipo ?? reserva.tipoHabitacion) === "Deluxe"
                    ? "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=600&h=380&fit=crop&auto=format"
                    : "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&h=380&fit=crop&auto=format"}
              alt={`Habitación ${(habitacion?.numero ?? pending)}`}
              className="w-36 h-24 rounded-lg object-cover shrink-0" />}

            <div className="flex-1 min-w-0">
              <p data-testid="guest-stay-room" className="text-[20px] font-semibold text-[#18345C] leading-none">
                <UiText text="Habitación " />
                {(habitacion?.numero ?? pending)}
              </p>
              <p className="text-[14px] text-[#6B7280] mt-1">
                {(habitacion?.tipo ?? reserva.tipoHabitacion)}
                <UiText text=" · " />
                {reserva.personas}
                {" "}
                {ui(reserva.personas === 1 ? "huésped" : "huéspedes")}
                <UiText text=" ·" />
                {cuenta.noches}
                {" "}
                {ui(cuenta.noches === 1 ? "noche" : "noches")}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-3">
            <Dato icono={<CalendarIcon />} label="Entrada" valor={formatoFecha(reserva.fechaEntrada)} />
            <Dato icono={<CalendarIcon />} label="CHECK-OUT" valor={formatoFecha(reserva.fechaSalida)} />
          </div>

          {checkin.peticiones.length > 0 && (<div className="mt-3 pt-3 border-t border-[#E5E0D8]">
            <p className="text-[11px] text-[#AEBCC1] uppercase tracking-widest mb-2">
              <UiText text="Peticiones registradas" />
            </p>
            <div className="flex flex-wrap gap-1.5">
              {checkin.peticiones.map((p) => (<Chip key={p} cls="bg-[#EFF6FF] text-[#1E40AF] border-[#93C5FD]">
                {ui(p)}
              </Chip>))}
            </div>
          </div>)}
        </Tarjeta>

        <Tarjeta titulo="Llave digital">
          {conectado ? <div className="text-center py-3.5"><div className="w-10 h-10 rounded-full bg-[#F8F6F0] flex items-center justify-center mx-auto text-[#AEBCC1]"><KeyIcon size={22}/></div><p className="text-[14px] font-medium text-[#18345C] mt-2">{en?'Digital key unavailable':'Llave digital no disponible'}</p><p className="text-[13px] text-[#AEBCC1] mt-1">{en?'Request your key at Reception.':'Solicita tu llave en Recepción.'}</p><button disabled className="mt-3 px-4 py-2.5 min-h-[44px] text-[14px] font-semibold border border-[#18345C] text-[#18345C] rounded-md opacity-40"><LockKeyhole size={14} className="inline mr-2"/>{en?'Open door':'Abrir la puerta'}</button></div> : llaveActiva && checkin.codigoLlave ? (<div className="flex items-start gap-4 flex-wrap sm:flex-nowrap">
            <CodigoQR texto={checkin.codigoLlave} tamano={140} />
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-semibold text-[#166534] flex items-center gap-1.5">
                <CheckIcon />
                <UiText text=" Llave activa                   " />
              </p>
              <p className="text-[14px] text-[#6B7280] mt-1">
                <UiText text="                     Acerca el teléfono a la cerradura o muestra este código en el lector de la puerta.                   " />
              </p>
              <p className="text-[12px] text-[#AEBCC1] mt-2 break-all">
                {checkin.codigoLlave}
              </p>
              <button
                onClick={() => onIr("habitacion")}
                className="mt-3 px-4 py-2.5 min-h-[44px] text-[14px] font-semibold border border-[#18345C] text-[#18345C] rounded-md hover:bg-[#18345C] hover:text-white transition-colors">
                <UiText text="                     Abrir la puerta                   " />
              </button>
            </div>
          </div>) : (<div className="text-center py-3.5">
            <div className="w-10 h-10 rounded-full bg-[#F8F6F0] flex items-center justify-center mx-auto text-[#AEBCC1]">
              <KeyIcon size={22} />
            </div>
            <p className="text-[14px] font-medium text-[#18345C] mt-2">
              {ui(estanciaCerrada
                ? "Llave desactivada"
                : "Tu llave todavía no está activa")}
            </p>
            <p className="text-[13px] text-[#AEBCC1] mt-1">
              {ui(estanciaCerrada
                ? "Se desactivó automáticamente al procesar el pago del check-out."
                : "Se genera al terminar el check-in web.")}
            </p>
            {!estanciaCerrada && (<div className="mt-3">
              <BotonPrimario onClick={() => onIr("checkin")}>
                <UiText text="Ir al check-in" />
              </BotonPrimario>
            </div>)}
          </div>)}
        </Tarjeta>

        <Tarjeta
          titulo="Tu cuenta"
          extra={<button onClick={() => onIr("cuenta")} className="text-[13px] font-semibold text-[#18345C] hover:underline">
            <UiText text="                 Ver detalle               " />
          </button>}>
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[11px] text-[#AEBCC1] uppercase tracking-widest">
                <UiText text="Saldo por pagar" />
              </p>
              <p className="text-[26px] font-bold leading-none mt-1" style={{ color: cuenta.saldo > 0 ? "#9A3412" : "#166534" }}>
                {accountReady ? dinero(cuenta.saldo) : (en ? 'Loading…' : 'Consultando…')}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-[#AEBCC1] uppercase tracking-widest">
                <UiText text="Total de la estancia" />
              </p>
              <p className="text-[18px] font-semibold text-[#18345C] leading-none mt-1">
                {accountReady ? dinero(cuenta.total) : (en ? 'Loading…' : 'Consultando…')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3">
            <Dato label="Alojamiento" valor={accountReady ? dinero(cuenta.alojamiento) : (en ? 'Loading…' : 'Consultando…')} />
            <Dato label="Consumos adicionales" valor={accountReady ? dinero(cuenta.extras) : (en ? 'Loading…' : 'Consultando…')} />
            <Dato label="Total pagado" valor={accountReady ? dinero(cuenta.pagado) : (en ? 'Loading…' : 'Consultando…')} />
          </div>

          {cuenta.extras === 0 && (<p className="mt-3 text-[13px] text-[#6B7280]">

          </p>)}

          {!conectado && <div className="mt-3 pt-3 border-t border-[#E5E0D8] flex items-center gap-2">
            <span className="text-[#D8B94E]">
              <StarIcon size={15} />
            </span>
            <p className="text-[14px] text-[#6B7280] flex-1">
              <UiText text="                 Tienes " />
              <strong className="text-[#18345C]">
                {formatoPuntos(puntos)}
              </strong>
              <UiText text=" puntos de fidelidad               " />
            </p>
          </div>}
        </Tarjeta>

        <Tarjeta
          titulo="Pedidos en curso"
          extra={<button onClick={() => onIr(conectado ? 'restaurante' : "servicios")} className="text-[13px] font-semibold text-[#18345C] hover:underline">
            <UiText text="                 Pedir algo               " />
          </button>}>
          {conectado ? <div className="space-y-3">{ordersError?<p role="alert" className="text-sm text-red-800">{en?'Could not load orders. Open Menu to try again.':'No se pudieron consultar los pedidos. Abre Menú para reintentar.'}</p>:remoteOrders===null?<p>{en?'Loading orders…':'Consultando pedidos…'}</p>:activeOrders.length===0?<div className="text-center py-3.5"><div className="w-10 h-10 rounded-full bg-[#F8F6F0] flex items-center justify-center mx-auto text-[#AEBCC1]"><CartIcon size={22}/></div><p className="text-[14px] text-[#AEBCC1] mt-3">{en?'You have no orders in progress.':'No tienes pedidos en curso.'}</p></div>:activeOrders.map(o=><button key={o.id} onClick={()=>onIr('restaurante')} className="w-full text-left bg-[#F8F6F0] border border-[#E5E0D8] rounded-lg px-3 py-3 hover:border-[#18345C]"><p className="text-[15px] font-semibold text-[#18345C]">{en?'Order':'Pedido'} #{o.id}</p><p className="text-[14px] text-[#6B7280] mt-1 truncate">{o.items.map(i=>i.cantidad+'× '+i.nombre).join(', ')}</p><p className="text-[12px] text-[#AEBCC1] mt-1">{formatoHoraISO(o.creadoEn)} · {dinero(o.total)}</p></button>)}</div> : activos.length === 0 ? (<div className="text-center py-3.5">
            <div className="w-10 h-10 rounded-full bg-[#F8F6F0] flex items-center justify-center mx-auto text-[#AEBCC1]">
              <CartIcon size={22} />
            </div>
            <p className="text-[14px] text-[#AEBCC1] mt-3">
              <UiText text="                   No tienes pedidos en curso. Pide al restaurante o solicita un servicio cuando lo necesites.                 " />
            </p>
          </div>) : (<div className="space-y-3">
            {activos.map((p) => {
              const em = ESTADO_PEDIDO_META[p.estado];
              return (<button
                key={p.id}
                onClick={() => onIr("servicios")}
                className="w-full text-left bg-[#F8F6F0] border border-[#E5E0D8] rounded-lg px-3 py-3 hover:border-[#18345C] transition-colors">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[15px] font-semibold text-[#18345C]">
                    <UiText text="Pedido #" />
                    {p.numero}
                  </span>
                  <Chip cls={em.chip}>
                    {ui(em.label)}
                  </Chip>
                </div>
                <p className="text-[14px] text-[#6B7280] mt-1 truncate">
                  {p.lineas
                    .map((l) => `${l.cantidad}× ${ui(l.nombre)}`)
                    .join(", ")}
                </p>
                <p className="text-[12px] text-[#AEBCC1] mt-1 flex items-center gap-1">
                  <ClockIcon size={12} />
                  {formatoHoraISO(p.creadoEn)}
                  {totalPedido(p) > 0 && ` · ${dinero(totalPedido(p))}`}
                </p>
              </button>);
            })}
          </div>)}
        </Tarjeta>

        <Tarjeta
          titulo="Tu habitación ahora"
          extra={<button onClick={() => onIr("habitacion")} className="text-[13px] font-semibold text-[#18345C] hover:underline">
            <UiText text="                 Controlar               " />
          </button>}>
          {conectado ? <><div className="grid grid-cols-2 sm:grid-cols-4 gap-3"><Mini icono={<ThermoIcon size={15}/>} valor="—" label="Temperatura"/><Mini icono={<SparkIcon size={15}/>} valor="—" label="Luces encendidas"/><Mini icono={<BedIcon size={15}/>} valor="—" label="Cortinas abiertas"/><Mini icono={<WifiIcon size={15}/>} valor="—" label="Wi-Fi"/></div><p className="mt-3 flex items-center gap-2 text-[13px] text-[#7890B0]"><LockKeyhole size={14}/>{en?'Room controls are unavailable online.':'Controles de habitación no disponibles en línea.'}</p></> : <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Mini icono={<ThermoIcon size={15} />} valor={`${domotica.temperatura}°`} label={domotica.climaEncendido ? "Clima activo" : "Clima apagado"} />
            <Mini icono={<SparkIcon size={15} />} valor={`${domotica.luces.filter((l) => l.encendida).length}/${domotica.luces.length}`} label="Luces encendidas" />
            <Mini icono={<BedIcon size={15} />} valor={`${domotica.cortinas}%`} label="Cortinas abiertas" />
            <Mini icono={<WifiIcon size={15} />} valor={domotica.wifiConectado ? "Sí" : "No"} label={WIFI_RED} />
          </div>}

          {!conectado && domotica.noMolestar && (<div className="mt-3">
            <Aviso tono="alerta">
              <UiText text="Tienes activo el aviso de “No molestar”. Limpieza no entrará a la habitación." />
            </Aviso>
          </div>)}
          {estadoHabitacion === "en-limpieza" && (<div className="mt-3">
            <Aviso tono="info">
              <UiText text="La habitación está en proceso de limpieza." />
            </Aviso>
          </div>)}
        </Tarjeta>

        <Tarjeta
          titulo="Tus actividades reservadas"
          extra={<button onClick={() => onIr("experiencias")} className="text-[13px] font-semibold text-[#18345C] hover:underline">
            <UiText text="Ver experiencias" />
          </button>}>
          {conectado ? <LockedGuestButton label={en?'Book an experience':'Reservar experiencia'} reason={en?'Online activity reservations are not available. Contact Reception.':'Las reservas de actividades no están disponibles en línea. Contacta a Recepción.'}/> : reservasAmenidad.length === 0 ? (<p className="text-[14px] text-[#AEBCC1] py-4 text-center">
            <UiText text="Todavía no tienes actividades reservadas. Tus reservas de spa y restaurante aparecerán aquí." />
          </p>) : (<div className="space-y-2">
            {reservasAmenidad.map((r) => (<div key={r.id} className="flex items-center gap-3 bg-[#F8F6F0] border border-[#E5E0D8] rounded-lg px-3 py-2.5">
              <span className="text-[#18345C]">
                <ClockIcon size={14} />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-medium text-[#18345C] truncate">
                  {ui(r.area)}
                </p>
                <p className="text-[12px] text-[#AEBCC1]">
                  {formatoFecha(r.fecha)}
                  <UiText text=" · " />
                  {r.hora}
                </p>
              </div>
              <span className="text-[13px] text-[#6B7280] shrink-0">
                {Number.isFinite(r.personas) ? r.personas : 1}
                {ui(r.personas === 1 ? "persona" : "personas")}
              </span>
            </div>))}
          </div>)}
        </Tarjeta>

        <Tarjeta titulo="Contactos del hotel">
          <div className="space-y-3">
            <ContactoHotel nombre="Recepción" detalle="Disponible 24 horas" extension="100" />
            <ContactoHotel nombre="Room Service" detalle="6:00 a. m. – 11:00 p. m." extension="120" />
            <ContactoHotel nombre="Emergencias" detalle="" extension="110" urgente />
          </div>
          <p className="mt-3 text-[12px] text-[#71839B]">
            <UiText text="Desde el teléfono de la habitación marca únicamente la extensión." />
          </p>
        </Tarjeta>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <AccesoRapido label={conectado ? "Ver menú" : "Pedir al restaurante"} onClick={() => onIr(conectado ? "restaurante" : "servicios")} icono={<CartIcon size={18} />} />
        <AccesoRapido label="Chat con recepción" onClick={() => onIr("chat")} icono={<ClockIcon size={18} />} />
        <AccesoRapido disabled={conectado || !llaveActiva} label="Abrir la puerta" onClick={() => onIr("habitacion")} icono={<KeyIcon size={18} />} />
        <AccesoRapido label="Pagar y hacer check-out" onClick={() => onIr("cuenta")} icono={<StarIcon size={18} />} />
      </div>
    </div>
  </div>);
}
function ContactoHotel({ nombre, detalle, extension, urgente = false }: {
  nombre: string;
  detalle: string;
  extension: string;
  urgente?: boolean;
}) {
  const ui = useUiText();
  return <div className="flex items-center gap-3 rounded-lg border border-[#E5E0D8] bg-[#F8F6F0] p-3">
    <span className={`grid h-10 w-10 place-items-center rounded-full text-lg ${urgente ? 'bg-[#FEF2F2] text-[#991B1B]' : 'bg-white text-[#18345C]'}`}>☎</span>
    <div className="min-w-0 flex-1">
      <p className="font-semibold text-[#18345C]">
        {ui(nombre)}
      </p>
      {detalle && <p className="text-[12px] text-[#526276]">
        {ui(detalle)}
      </p>}
    </div>
    <div className="text-right">
      <small className="block text-[10px] uppercase tracking-widest text-[#71839B]">
        {ui('Extensión')}
      </small>
      <b className="text-2xl text-[#18345C]">
        {extension}
      </b>
    </div>
  </div>;
}
function Dato({ icono, label, valor, }: {
  icono?: React.ReactNode;
  label: string;
  valor: string;
}) {
  const ui = useUiText();
  return (<div className="bg-[#F8F6F0] border border-[#E5E0D8] rounded-lg px-3 py-2.5">
    <p className="text-[10px] text-[#AEBCC1] uppercase tracking-widest flex items-center gap-1">
      {icono}
      {ui(label)}
    </p>
    <p className="text-[15px] font-semibold text-[#18345C] mt-1">
      {valor}
    </p>
  </div>);
}
function Mini({ icono, valor, label, }: {
  icono: React.ReactNode;
  valor: string;
  label: string;
}) {
  const ui = useUiText();
  return (<div className="bg-[#F8F6F0] border border-[#E5E0D8] rounded-lg px-3 py-2.5">
    <span className="text-[#18345C]">
      {icono}
    </span>
    <p className="text-[18px] font-bold text-[#18345C] leading-none mt-1.5">
      {valor}
    </p>
    <p className="text-[11px] text-[#6B7280] mt-1 truncate">
      {ui(label)}
    </p>
  </div>);
}
function AccesoRapido({ disabled=false,label, icono, onClick, }: {
  disabled?: boolean;
  label: string;
  icono: React.ReactNode;
  onClick: () => void;
}) {
  const ui = useUiText();
  return (<button
    disabled={disabled}
    onClick={()=>{if(!disabled)onClick();}}
    className="bg-white border border-[#E5E0D8] rounded-xl px-4 py-3 text-left hover:border-[#18345C] transition-colors min-h-[44px]">
    <span className="text-[#D8B94E]">
      {disabled ? <LockKeyhole size={18}/> : icono}
    </span>
    <p className="text-[14px] font-medium text-[#18345C] mt-2 leading-tight">
      {ui(label)}
    </p>
  </button>);
}
