import { UiText, useUiText } from "@/i18n/UiText";
import { usePublicLanguage } from "@/components/common/PublicLanguageToggle";
import { useEffect, useState } from "react";
import type { Huesped, Reserva, HabitacionHotel, EstadoHabHotel, CargoHuesped, CategoriaCargo, DatosFiscales, PagoHuespedApp, MetodoPagoHuesped, } from "@/lib/pms/types";
import { tarjetaPrincipal } from '@/store/paymentStore';
import { leerPromociones } from '@/store/promotionStore';
import { formatoFecha, formatoFechaHora } from "@/data/pms";
import { fechaHotel, HOTEL } from "@/lib/hotel";
import type { ResumenCuentaHuesped } from "@/features/huesped/pages/huespedUtils";
import { dinero, Chip, Campo, INPUT_CLS, Cabecera, Tarjeta, Kpi, Aviso, Modal, BotonFiltro, BotonPrimario, BotonSecundario, CATEGORIAS_CARGO, METODO_PAGO_LABEL, puntosDeMonto, montoDePuntos, formatoPuntos, correoValido, formatoTarjeta, ultimos4, CardIcon, ReceiptIcon, StarIcon, CheckIcon, ClockIcon, MailIcon, BedIcon, } from "@/features/huesped/pages/huespedUtils";
interface Props {
  huesped: Huesped;
  reserva: Reserva;
  habitacion: HabitacionHotel;
  estadoHabitacion: EstadoHabHotel;
  cargos: CargoHuesped[];
  cuenta: ResumenCuentaHuesped;
  pagos: PagoHuespedApp[];
  fiscales: DatosFiscales;
  facturaEmitida: string | null;
  puntos: number;
  estanciaCerrada: boolean;
  onGuardarFiscales: (datos: DatosFiscales) => void;
  onPagar: (metodo: MetodoPagoHuesped, extra: {
    ultimos4?: string;
    puntosUsados?: number;
    descuentoPuntos?: number;
    descuentoCodigo?: number;
    codigoPromocional?: string;
    montoTarjeta?: number;
  }) => void;
  onCheckOut: () => void;
}
export default function CuentaHuesped({ huesped, reserva, habitacion, estadoHabitacion, cargos, cuenta, pagos, fiscales, facturaEmitida, puntos, estanciaCerrada, onGuardarFiscales, onPagar, onCheckOut, }: Props) {
  const ui = useUiText();
  const { en } = usePublicLanguage();
  const [filtro, setFiltro] = useState<CategoriaCargo | "todas">("todas");
  const [pagando, setPagando] = useState(false);
  const [confirmarSalida, setConfirmarSalida] = useState(false);
  const [verComprobante, setVerComprobante] = useState(false);
  const [verDetalleCuenta, setVerDetalleCuenta] = useState(false);
  const [estrellas, setEstrellas] = useState(0);
  const [experiencia, setExperiencia] = useState("");
  const [mejoras, setMejoras] = useState("");
  const [autorizaPublicar, setAutorizaPublicar] = useState(false);
  const [opinionEnviada, setOpinionEnviada] = useState(false);
  const [opinionOmitida, setOpinionOmitida] = useState(false);
  const [resenaAbierta, setResenaAbierta] = useState(false);
  const [opinionCreadaEn, setOpinionCreadaEn] = useState<string | null>(null);
  const opinionKey = `vs-resena-estancia-${reserva.codigo}`;
  useEffect(() => {
    if (!estanciaCerrada)
      return;
    try {
      const raw = localStorage.getItem(opinionKey);
      if (!raw)
        return;
      const guardada = JSON.parse(raw);
      setEstrellas(Number(guardada.estrellas) || 0);
      setExperiencia(String(guardada.experiencia || ""));
      setMejoras(String(guardada.mejoras || ""));
      setAutorizaPublicar(Boolean(guardada.autorizaPublicar));
      setOpinionCreadaEn(guardada.creadaEn || null);
      setOpinionEnviada(true);
    }
    catch { }
  },
    [estanciaCerrada, opinionKey]);
  function guardarOpinion() {
    const creadaEn = opinionCreadaEn || new Date().toISOString();
    const review = {
      id: `resena-${reserva.codigo}`,
      estanciaId: reserva.codigo,
      nombre: huesped.nombre,
      estrellas,
      experiencia: experiencia.trim(),
      mejoras: mejoras.trim(),
      autorizaPublicar,
      creadaEn,
      actualizadaEn: new Date().toISOString(),
      verificada: true,
    };
    try {
      localStorage.setItem(opinionKey, JSON.stringify(review));
      const key = "vs-resenas-publicas";
      const prev = JSON.parse(localStorage.getItem(key) || "[]");
      const next = [review, ...prev.filter((r: any) => r.estanciaId !== reserva.codigo)];
      localStorage.setItem(key, JSON.stringify(next));
      window.dispatchEvent(new Event("vs-resenas-updated"));
    }
    catch { }
    setOpinionCreadaEn(creadaEn);
    setOpinionEnviada(true);
  }
  const puedeEditarOpinion = !reserva.checkOutEn || Date.now() - new Date(reserva.checkOutEn).getTime() <= 24 * 60 * 60 * 1000;
  const [form, setForm] = useState<DatosFiscales>(fiscales.nombre
    ? fiscales
    : { ...fiscales, nombre: huesped.nombre, correo: huesped.correo });
  const [erroresFiscales, setErroresFiscales] = useState<Record<string, string>>({});
  const visibles = cargos.filter((c) => filtro === "todas" || c.categoria === filtro);
  const categoriasUsadas = CATEGORIAS_CARGO.filter((c) => cargos.some((x) => x.categoria === c));
  function guardarFiscales() {
    const e: Record<string, string> = {};
    if (!form.nombre.trim())
      e.nombre = "Escribe el nombre o razón social.";
    if (!form.nit.trim())
      e.nit = "Ingresa el NIT o selecciona C/F.";
    if (!correoValido(form.correo))
      e.correo = "Ingresa un correo válido para los datos de facturación.";
    setErroresFiscales(e);
    if (Object.keys(e).length > 0)
      return;
    onGuardarFiscales(form);
  }
  if (estanciaCerrada) {
    const totalRestaurante = cargos.filter(c => c.categoria === "Restaurante" || c.categoria === "Room service").reduce((s, c) => s + c.cantidad * c.precioUnitario, 0);
    const totalSpa = cargos.filter(c => c.categoria === "Spa y experiencias").reduce((s, c) => s + c.cantidad * c.precioUnitario, 0);
    const otros = Math.max(0, cuenta.extras - totalRestaurante - totalSpa);
    return <>
      <div className="flex-1 overflow-y-auto bg-[#F8F6F0] p-4 sm:p-7" style={{ fontFamily: '"Afacad", "Segoe UI", Arial, sans-serif' }}>
        <div className="mx-auto max-w-6xl">
          <div className="mb-5">
            <h1 className="text-3xl font-semibold text-[#102747]">
              {en ? "Check-out completed" : "Check-out completado"}
            </h1>
            <p className="mt-1 text-[#71839B]">{reserva.codigo} · Habitación {habitacion.numero}</p>
          </div>
          <div className="mb-5 flex items-center gap-3 rounded-xl border border-[#C8E8D2] bg-[#EFFAF3] p-4 text-[#166534]">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-[#278B52] text-white">
              <CheckIcon size={18} />
            </span>
            <p>Tu estancia finalizó correctamente el {formatoFechaHora(reserva.checkOutEn ?? new Date().toISOString())}.</p>
          </div>
          <div className="grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
            <section className="rounded-xl border border-[#E5E0D8] bg-white p-5">
              <h2 className="border-b pb-3 text-xl font-semibold text-[#102747]">
                {en ? "Final summary" : "Resumen final"}
              </h2>
              <div className="mt-3 space-y-2 text-sm">
                <Linea label={`Alojamiento · ${cuenta.noches} noches × ${dinero(cuenta.precioNoche)}`} valor={dinero(cuenta.alojamiento)} />
                <Linea label="Restaurante" valor={dinero(totalRestaurante)} />
                <Linea label="Spa" valor={dinero(totalSpa)} />
                <Linea label="Otros servicios" valor={dinero(otros)} />
                <Linea label="Descuentos" valor={dinero(cuenta.descuento)} />
                <div className="mt-3 border-t pt-3">
                  <Linea label="Total" valor={dinero(cuenta.total)} />
                  <Linea label="Pagado" valor={dinero(cuenta.pagado)} color="#166534" />
                  <div className="mt-2 flex items-center justify-between rounded-lg bg-[#EFFAF3] px-3 py-2">
                    <b className="text-[#166534]">Saldo</b>
                    <b className="text-xl text-[#166534]">
                      {dinero(cuenta.saldo)}
                    </b>
                  </div>
                </div>
              </div>
            </section>
            <section className="rounded-xl border border-[#E5E0D8] bg-white p-5 text-center">
              <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#EFFAF3] text-[#188149]">
                <CheckIcon size={30} />
              </span>
              <h2 className="mt-3 text-2xl font-semibold leading-tight text-[#102747]">
                {en ? <>Thank you for staying at<br />Villa Serena.</> : <>Gracias por hospedarte en<br />Villa Serena.</>}
              </h2>
              <p className="mt-2 text-sm text-[#52677F]">
                {en ? "Your digital key was deactivated and the stay is now closed." : "Tu llave digital fue desactivada y la estancia quedó cerrada."}
              </p>
              <div className="mt-5 space-y-2">
                <button onClick={() => setVerComprobante(true)} className="w-full rounded-lg bg-[#B59A52] py-3 font-semibold text-white">▧ &nbsp; {en ? "View invoice" : "Ver factura"}</button>
                <button onClick={() => setVerDetalleCuenta(true)} className="w-full rounded-lg bg-[#B59A52] py-3 font-semibold text-white">⇩ &nbsp; {en ? "Download receipt" : "Descargar comprobante"}</button>
                <button
                  onClick={() => window.alert(en ? `Invoice and receipt will be sent to ${form.correo || huesped.correo}.` : `La factura y el comprobante se enviarán a ${form.correo || huesped.correo}.`)}
                  className="w-full rounded-lg border border-[#18345C] py-3 font-semibold text-[#18345C]">✉ &nbsp; {en ? "Send again by email" : "Enviar nuevamente por correo"}</button>
              </div>
            </section>
          </div>
          <button
            type="button"
            onClick={() => {
              setOpinionOmitida(false);
              setResenaAbierta(true);
            }}
            className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-[#B59A52] px-5 py-3 font-semibold text-white shadow-xl transition hover:-translate-y-0.5 hover:shadow-2xl"
            aria-label={en ? "Share your experience" : "Compartir tu experiencia"}>
            <span className="text-xl leading-none">★</span>
            <span>
              {opinionEnviada ? (en ? "View your review" : "Ver tu reseña") : (en ? "Share your experience" : "Compartir tu experiencia")}
            </span>
          </button>
          <section className="mt-5 grid gap-5 rounded-xl border border-[#E5E0D8] bg-white p-5 sm:grid-cols-[180px_1fr]">
            <div className="flex items-center justify-center border-b pb-4 sm:border-b-0 sm:border-r sm:pb-0 sm:pr-5">
              <img src="/villa-serena-logo.png" alt="Villa Serena Hotel" className="max-h-24 max-w-[150px] object-contain" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#102747]">
                {en ? "Stay invoice and receipt" : "Factura y comprobante de estancia"}
              </h2>
              <div className="mt-3 grid gap-x-8 gap-y-1 text-sm text-[#52677F] sm:grid-cols-2">
                <p>
                  <b>Cliente:</b>
                  {huesped.nombre}
                </p>
                <p>
                  <b>Reserva:</b>
                  {reserva.codigo}
                </p>
                <p>
                  <b>NIT:</b>
                  {form.nit || 'C/F'}
                </p>
                <p>
                  <b>Habitación:</b>
                  {habitacion.numero}
                </p>
                <p>
                  <b>Correo:</b>
                  {form.correo || huesped.correo}
                </p>
                <p>
                  <b>Puntos acumulados:</b>
                  {formatoPuntos(puntos)}
                </p>
              </div>
              <p className="mt-4 border-t pt-3 text-xs text-[#71839B]">Los datos finales de esta estancia permanecerán disponibles durante las 24 horas posteriores al check-out. Después de ese plazo, la cuenta quedará inactiva para iniciar sesión.</p>
            </div>
          </section>

        </div>
      </div>{verComprobante && <ModalComprobante
        huesped={huesped}
        reserva={reserva}
        habitacion={habitacion}
        cuenta={cuenta}
        cargos={cargos}
        pagos={pagos}
        fiscales={fiscales.nit ? fiscales : form}
        factura={facturaEmitida}
        onCerrar={() => setVerComprobante(false)} />} {verDetalleCuenta && <ModalDetalleCuenta
          huesped={huesped}
          reserva={reserva}
          habitacion={habitacion}
          cuenta={cuenta}
          cargos={cargos}
          onCerrar={() => setVerDetalleCuenta(false)} />}</>;
  }
  return (<div className="flex-1 overflow-y-auto bg-[#F8F6F0]" style={{ fontFamily: '"Afacad", "Segoe UI", Arial, sans-serif' }}>
    <Cabecera titulo="Cuenta y check-out" subtitulo={`${reserva.codigo} · habitación ${habitacion.numero} · salida ${formatoFecha(reserva.fechaSalida)}`}>
      {facturaEmitida && (<button
        onClick={() => setVerComprobante(true)}
        className="px-4 py-2.5 min-h-[44px] text-[14px] font-semibold border border-[#18345C] text-[#18345C] rounded-md hover:bg-[#18345C] hover:text-white transition-colors flex items-center gap-2">
        <ReceiptIcon size={15} />
        <UiText text=" Ver factura           " />
      </button>)}
    </Cabecera>

    <div className="px-4 sm:px-6 py-5 space-y-5">

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <ResumenCuenta icono={<BedIcon size={27} />} valor={dinero(cuenta.alojamiento + cuenta.extras - cuenta.descuento)} label="Total de la estancia" />
        <ResumenCuenta icono={<CardIcon size={27} />} valor={dinero(cuenta.pagado)} label="Pagado" color="#166534" />
        <ResumenCuenta icono={<CheckIcon size={26} />} valor={dinero(cuenta.saldo)} label="Saldo por pagar" color={cuenta.saldo > 0 ? "#9A3412" : "#166534"} />
        <ResumenCuenta icono={<StarIcon size={28} />} valor={formatoPuntos(puntos)} label="Puntos de fidelidad" color="#8A6500" />
      </div>

      {estanciaCerrada && (<Aviso tono="exito">
        <span className="flex items-start gap-2">
          <CheckIcon />
          <span>
            <UiText text="                 Check-out completado el " />
            {formatoFechaHora(reserva.checkOutEn ?? "")}
            <UiText text=". La habitación" />
            {habitacion.numero}
            <UiText text=" pasó a “desocupada, pendiente de limpieza” y tu llave digital quedó                 desactivada.               " />
          </span>
        </span>
      </Aviso>)}

      <div className="grid gap-5 lg:grid-cols-3">

        <div className="lg:col-span-2 space-y-5">
          <Tarjeta titulo="Detalle de consumos">
            <div className="flex gap-2 flex-wrap mb-4">
              <BotonFiltro activo={filtro === "todas"} onClick={() => setFiltro("todas")}>
                <UiText text="Todo" />
              </BotonFiltro>
              {categoriasUsadas.map((c) => (<BotonFiltro key={c} activo={filtro === c} onClick={() => setFiltro(c)}>
                {ui(c)}
              </BotonFiltro>))}
            </div>

            {(filtro === "todas" || filtro === "Estancia") && (<div className="flex items-start gap-3 py-3 border-b border-[#E5E0D8]">
              <div className="w-9 h-9 rounded-lg bg-[#F8F6F0] flex items-center justify-center shrink-0 text-[#18345C]">
                <BedIcon size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-medium text-[#18345C]">
                  {ui(`Alojamiento · habitación ${habitacion.numero}`)}
                </p>
                <p className="text-[13px] text-[#AEBCC1]">
                  {cuenta.noches}
                  {ui(cuenta.noches === 1 ? "noche" : "noches")}
                  <UiText text=" × " />
                  {dinero(cuenta.precioNoche)}
                  <UiText text=" ·" />
                  {formatoFecha(reserva.fechaEntrada)}
                  <UiText text=" → " />
                  {formatoFecha(reserva.fechaSalida)}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[16px] font-semibold text-[#18345C]">
                  {dinero(cuenta.alojamiento)}
                </p>
                <p className="text-[12px] font-semibold text-[#166534]">
                  <UiText text="Pagado al reservar" />
                </p>
              </div>
            </div>)}

            {visibles.length === 0 &&
              filtro !== "todas" &&
              filtro !== "Estancia" ? (<p className="text-[14px] text-[#AEBCC1] py-4 text-center">
                <UiText text="                   No hay consumos en esta categoría.                 " />
              </p>) : (visibles.map((c) => (<div key={c.id} className="flex items-start gap-3 py-3 border-b border-[#E5E0D8] last:border-0">
                <div className="w-9 h-9 rounded-lg bg-[#F8F6F0] flex items-center justify-center shrink-0 text-[#18345C]">
                  <ReceiptIcon size={15} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-medium text-[#18345C]">
                    {ui(c.concepto)}
                  </p>
                  <p className="text-[13px] text-[#AEBCC1] flex items-center gap-1.5 flex-wrap">
                    <Chip cls="bg-[#F8F6F0] text-[#6B7280] border-[#E5E0D8]">
                      {ui(c.categoria)}
                    </Chip>
                    <span className="flex items-center gap-1">
                      <ClockIcon size={11} />
                      {formatoFechaHora(c.fecha)}
                    </span>
                    {c.cantidad > 1 && (<span>
                      <UiText text="· " />
                      {c.cantidad}
                      <UiText text=" × " />
                      {dinero(c.precioUnitario)}
                    </span>)}
                  </p>
                </div>
                <p className="text-[16px] font-semibold text-[#18345C] shrink-0">
                  {dinero(c.cantidad * c.precioUnitario)}
                </p>
              </div>)))}

            <div className="mt-4 pt-4 border-t border-[#E5E0D8] space-y-1.5">
              <Linea label="Alojamiento (pagado al reservar)" valor={dinero(cuenta.alojamiento)} color="#166534" />
              <Linea label="Consumos y servicios" valor={dinero(cuenta.extras)} />
              {cuenta.descuento > 0 && (<Linea label="Descuento aplicado" valor={`− ${dinero(cuenta.descuento)}`} color="#166534" />)}
              <Linea label="Pago realizado al reservar" valor={`− ${dinero(cuenta.anticipo)}`} color="#166534" />
              {cuenta.abonado > 0 && (<Linea label="Pagos desde la app" valor={`− ${dinero(cuenta.abonado)}`} color="#166534" />)}
              <div className="flex justify-between items-baseline pt-2 mt-2 border-t border-[#E5E0D8]">
                <span className="text-[17px] font-semibold text-[#18345C]">
                  <UiText text="Saldo por pagar" />
                </span>
                <span className="text-[26px] font-bold" style={{ color: cuenta.saldo > 0 ? "#9A3412" : "#166534" }}>
                  {dinero(cuenta.saldo)}
                </span>
              </div>
            </div>
          </Tarjeta>

          <Tarjeta titulo="Datos para la factura electrónica">
            <p className="mb-4 text-sm text-[#6B7280]">
              <UiText text="Estos datos se usarán únicamente para emitir y enviar tu factura." />
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo label="Nombre o razón social" error={erroresFiscales.nombre}>
                <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className={INPUT_CLS} />
              </Campo>
              <Campo label="NIT" error={erroresFiscales.nit}>
                <div className="flex gap-2">
                  <input value={form.nit} onChange={(e) => setForm({ ...form, nit: e.target.value })} className={INPUT_CLS} placeholder="5487963-2" />

                  <button
                    onClick={() => setForm({
                      ...form,
                      nit: "CF",
                    })}
                    className="px-3 py-2.5 min-h-[44px] text-[13px] font-semibold border border-[#E5E0D8] text-[#6B7280] rounded-md hover:bg-[#F8F6F0] shrink-0">
                    <UiText text="C/F" />
                  </button>
                </div>
              </Campo>
              <Campo label="Correo para la factura" error={erroresFiscales.correo}>
                <input value={form.correo} onChange={(e) => setForm({ ...form, correo: e.target.value })} className={INPUT_CLS} />
              </Campo>
            </div>

            <div className="mt-4 flex items-center gap-3 flex-wrap">
              <BotonSecundario onClick={guardarFiscales}>
                <UiText text="Guardar datos fiscales" />
              </BotonSecundario>
              {fiscales.nit && (<span className="text-[13px] text-[#166534] flex items-center gap-1.5">
                <CheckIcon size={13} />
                <UiText text=" Datos guardados                   " />
              </span>)}
            </div>
          </Tarjeta>

          {(pagos.length > 0 || reserva.pagos.length > 0) && (<Tarjeta titulo="Pagos registrados">
            <div className="space-y-2">
              {reserva.pagos.map((p) => (<div key={p.id} className="flex items-center gap-3 bg-[#F8F6F0] border border-[#E5E0D8] rounded-lg px-3 py-2.5">
                <span className="text-[#166534]">
                  <CheckIcon size={15} />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-medium text-[#18345C]">
                    <UiText text="Alojamiento pagado al reservar" />
                  </p>
                  <p className="text-[12px] text-[#AEBCC1]">
                    {formatoFecha(p.fecha)}
                    <UiText text=" · " />
                    {p.metodo}
                    <UiText text=" · " />
                    {p.comprobante}
                  </p>
                </div>
                <p className="text-[15px] font-semibold text-[#18345C] shrink-0">
                  {dinero(p.monto)}
                </p>
              </div>))}

              {pagos.map((p) => (<div key={p.id} className="flex items-center gap-3 bg-[#F0FAF4] border border-[#86EFAC] rounded-lg px-3 py-2.5">
                <span className="text-[#166534]">
                  <CheckIcon size={15} />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-medium text-[#166534]">
                    {ui(METODO_PAGO_LABEL[p.metodo])}
                    {p.ultimos4 ? ` •••• ${p.ultimos4}` : ""}
                  </p>
                  <p className="text-[12px] text-[#166534]">
                    {formatoFechaHora(p.fecha)}
                    <UiText text=" · " />
                    {p.comprobante}
                    {p.puntosUsados
                      ? ` · ${formatoPuntos(p.puntosUsados)} ${ui("puntos")}`
                      : ""}
                  </p>
                </div>
                <p className="text-[15px] font-semibold text-[#166534] shrink-0">
                  {dinero(p.monto)}
                </p>
              </div>))}
            </div>
          </Tarjeta>)}
        </div>

        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-0 space-y-5">
            <Tarjeta titulo="Pagar y salir">
              <div className="bg-[#F8F6F0] border border-[#E5E0D8] rounded-lg px-4 py-3 text-center">
                <p className="text-[11px] text-[#AEBCC1] uppercase tracking-widest">
                  <UiText text="Saldo por pagar" />
                </p>
                <p className="text-[32px] font-bold leading-none mt-1" style={{ color: cuenta.saldo > 0 ? "#9A3412" : "#166534" }}>
                  {dinero(cuenta.saldo)}
                </p>
              </div>

              {cuenta.saldo > 0 ? (<div className="mt-4">
                <BotonPrimario ancho onClick={() => setPagando(true)}>
                  <UiText text="Pagar saldo" />
                </BotonPrimario>
                <p className="text-[12px] text-[#AEBCC1] mt-2 text-center">
                  <UiText text="                       Pago seguro con tarjeta o puntos de fidelidad.                     " />
                </p>
              </div>) : estanciaCerrada ? (<div className="mt-4 text-center">
                <p className="text-[15px] font-semibold text-[#166534] flex items-center justify-center gap-1.5">
                  <CheckIcon />
                  <UiText text=" Estancia cerrada                     " />
                </p>
                <p className="text-[13px] text-[#6B7280] mt-1">
                  <UiText text="                       Gracias por hospedarte en Villa Serena.                     " />
                </p>
              </div>) : (<div className="mt-4">
                <Aviso tono="exito">
                  <UiText text="Tu cuenta está en cero. Ya puedes hacer el check-out." />
                </Aviso>
                <div className="mt-3">
                  <BotonPrimario ancho onClick={() => setConfirmarSalida(true)}>
                    <UiText text="                         Hacer check-out                       " />
                  </BotonPrimario>
                </div>
              </div>)}

              <div className="mt-4 pt-4 border-t border-[#E5E0D8] text-[13px] text-[#6B7280] space-y-1.5">
                <p className="flex items-start gap-2">
                  <span className="text-[#D8B94E] shrink-0 mt-0.5">
                    <StarIcon size={13} />
                  </span>
                  <UiText text="                     Tienes " />
                  {formatoPuntos(puntos)}
                  <UiText text=" puntos (" />
                  {dinero(montoDePuntos(puntos))}
                  <UiText text=" en descuentos).                   " />
                </p>
                <p className="pl-5 text-[12px] text-[#AEBCC1]">

                </p>
                <p className="flex items-start gap-2">
                  <span className="text-[#18345C] shrink-0 mt-0.5">
                    <MailIcon size={13} />
                  </span>
                  <UiText text="                     La factura y el comprobante llegan a " />
                  {form.correo || huesped.correo}
                  <UiText text=".                   " />
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-[#18345C] shrink-0 mt-0.5">
                    <BedIcon size={13} />
                  </span>
                  <UiText text="                     Estado actual de la habitación:" />
                  {" "}
                  {estadoHabitacion === "en-limpieza"
                    ? "desocupada, pendiente de limpieza"
                    : "ocupada"}
                  <UiText text=".                   " />
                </p>
              </div>
            </Tarjeta>
          </div>
        </div>
      </div>
    </div>

    {pagando && (<ModalPago
      saldo={cuenta.saldo}
      puntos={puntos}
      onCerrar={() => setPagando(false)}
      onPagar={(metodo, extra) => {
        onPagar(metodo, extra);
        setPagando(false);
      }} />)}

    {confirmarSalida && (<Modal titulo="Confirmar check-out" onCerrar={() => setConfirmarSalida(false)} ancho="sm:max-w-2xl">
      <div className="flex items-center gap-5">
        <span className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-[#F5F1E8] text-[#18345C]">
          <BedIcon size={36} />
        </span>
        <p className="text-xl font-semibold leading-snug text-[#18345C]">Al confirmar, finalizarás tu estancia en la habitación {habitacion.numero}.</p>
      </div>
      {new Date() < new Date(`${reserva.fechaSalida}T00:00:00`) && <div className="mt-5 flex gap-4 rounded-xl border border-[#E9B949] bg-[#FFF9E8] p-5">
        <span className="text-3xl text-[#C47A00]">⚠</span>
        <div>
          <b className="text-lg text-[#9A5C00]">
            {en ? "Early departure" : "Salida anticipada"}
          </b>
          <p className="mt-1 text-[15px] leading-relaxed text-[#43536A]">
            {en ? `Your departure is scheduled for ${formatoFecha(reserva.fechaSalida)}. Accommodation charges will remain according to your booking conditions.` : <>Tu salida está programada para el {formatoFecha(reserva.fechaSalida)}. Los cargos del alojamiento se mantendrán según las condiciones de tu reserva.</>}
          </p>
        </div>
      </div>}
      <ul className="mt-5 space-y-3 text-[15px] text-[#334963]">
        {["Tu llave digital se desactivará.",
          "El Wi‑Fi y los controles de la habitación quedarán desactivados.",
          "Ya no podrás solicitar servicios asociados a esta estancia.",
          "Tu factura y comprobante quedarán disponibles en el portal.",
          "Esta acción no puede deshacerse desde el portal."].map(texto => <li key={texto} className="flex items-start gap-3">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#B79A50] text-white">
              <CheckIcon size={15} />
            </span>
            <span className="pt-0.5">
              {texto}
            </span>
          </li>)}
      </ul>
      <div className="mt-5 flex items-start gap-3 border-t border-[#E5E0D8] pt-4 text-[14px] text-[#52677F]">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#F5F1E8] font-serif text-lg font-bold text-[#18345C]">i</span>
        <p>
          {en ? <>Room access, controls and stay services are disabled immediately after check-out.<br />Your account remains available for 24 hours only to review the completed stay and manage your review.</> : <>El acceso a la habitación, sus controles y los servicios de la estancia se desactiva inmediatamente al hacer check-out.<br />Tu cuenta permanecerá disponible solo durante 24 horas para consultar la estancia finalizada y gestionar tu reseña.</>}
        </p>
      </div>

      <div className="flex gap-2 mt-5">
        <BotonSecundario onClick={() => setConfirmarSalida(false)} ancho>
          <UiText text="Volver" />
        </BotonSecundario>
        <BotonPrimario ancho onClick={() => {
          onCheckOut();
          setConfirmarSalida(false);
        }}>
          <UiText text="               Confirmar check-out             " />
        </BotonPrimario>
      </div>
    </Modal>)}

    {estanciaCerrada && resenaAbierta && !opinionOmitida && (<OpinionCheckout
      estrellas={estrellas}
      setEstrellas={setEstrellas}
      experiencia={experiencia}
      setExperiencia={setExperiencia}
      mejoras={mejoras}
      setMejoras={setMejoras}
      autorizaPublicar={autorizaPublicar}
      setAutorizaPublicar={setAutorizaPublicar}
      opinionEnviada={opinionEnviada}
      setOpinionEnviada={setOpinionEnviada}
      opinionOmitida={opinionOmitida}
      setOpinionOmitida={setOpinionOmitida}
      onGuardar={guardarOpinion}
      puedeEditar={puedeEditarOpinion} />)}

    {verComprobante && (<ModalComprobante
      huesped={huesped}
      reserva={reserva}
      habitacion={habitacion}
      cuenta={cuenta}
      cargos={cargos}
      pagos={pagos}
      fiscales={fiscales.nit ? fiscales : form}
      factura={facturaEmitida}
      onCerrar={() => setVerComprobante(false)} />)}
  </div>);
}
function ResumenCuenta({ icono, valor, label, color = "#18345C" }: {
  icono: React.ReactNode;
  valor: string;
  label: string;
  color?: string;
}) {
  return <div className="flex min-h-[92px] items-center gap-4 rounded-xl border border-[#E5E0D8] bg-white px-5 py-4">
    <span className="text-[#B38B2E]">
      {icono}
    </span>
    <div>
      <b className="block text-2xl leading-none" style={{ color }}>
        {valor}
      </b>
      <span className="mt-2 block text-sm text-[#6B7280]">
        <UiText text={label} />
      </span>
    </div>
  </div>;
}
function OpinionCheckout({ estrellas, setEstrellas, experiencia, setExperiencia, mejoras, setMejoras, autorizaPublicar, setAutorizaPublicar, opinionEnviada, setOpinionEnviada, opinionOmitida, setOpinionOmitida, onGuardar, puedeEditar, }: {
  estrellas: number;
  setEstrellas: (valor: number) => void;
  experiencia: string;
  setExperiencia: (valor: string) => void;
  mejoras: string;
  setMejoras: (valor: string) => void;
  autorizaPublicar: boolean;
  setAutorizaPublicar: (valor: boolean) => void;
  opinionEnviada: boolean;
  setOpinionEnviada: (valor: boolean) => void;
  opinionOmitida: boolean;
  setOpinionOmitida: (valor: boolean) => void;
  onGuardar: () => void;
  puedeEditar: boolean;
}) {
  const { en } = usePublicLanguage();
  const copy = en ? {
    title: "How was your stay?",
    intro: "Your review helps us improve.",
    aria: "Stay rating",
    experience: "Tell us about your experience",
    optional: "(optional)",
    experiencePlaceholder: "Write your review...",
    improve: "What could we improve?",
    improvePlaceholder: "Tell us what we could improve...",
    publish: "I authorize my review to appear on Villa Serena's public website.",
    publishDetail: "Only my name, rating and review will be shown; never my room, email or other stay details.",
    later: "Not now",
    send: "Submit review",
    needStars: "Select 1 to 5 stars to submit your review.",
    editWindow: "You can edit it during the 24 hours after check-out.",
    mine: "My review",
    thanks: "Thank you for sharing your experience",
    yourReview: "Your review:",
    noComment: "No additional comment.",
    suggestion: "Improvement suggestion:",
    authorized: "Authorized for publication with your name, rating and review.",
    edit: "Edit"
  } : {
    title: "¿Cómo fue tu estancia?",
    intro: "Tu opinión nos ayuda a mejorar.",
    aria: "Calificación de la estancia",
    experience: "Cuéntanos sobre tu experiencia",
    optional: "(opcional)",
    experiencePlaceholder: "Escribe tu opinión...",
    improve: "¿Qué podríamos mejorar?",
    improvePlaceholder: "Cuéntanos qué podríamos mejorar...",
    publish: "Autorizo que mi opinión aparezca en la página pública de Villa Serena.",
    publishDetail: "Solo se mostrarán mi nombre, calificación y opinión; nunca mi habitación, correo ni otros datos de la estancia.",
    later: "Ahora no",
    send: "Enviar opinión",
    needStars: "Selecciona de 1 a 5 estrellas para enviar tu opinión.",
    editWindow: "Podrás editarla durante las 24 horas posteriores al check-out.",
    mine: "Mi opinión",
    thanks: "Gracias por compartir tu experiencia",
    yourReview: "Tu opinión:",
    noComment: "Sin comentario adicional.",
    suggestion: "Sugerencia de mejora:",
    authorized: "Autorizada para publicación con tu nombre, calificación y opinión.",
    edit: "Editar"
  };
  if (opinionOmitida)
    return null;
  if (opinionEnviada)
    return (<div className="fixed inset-0 z-[160] grid place-items-center bg-[#071D34]/55 p-4">
      <section className="w-full max-w-lg rounded-2xl border border-[#E5E0D8] bg-white p-7 text-center shadow-2xl">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#EFFAF3] text-[#188149]">✓</div>
        <p className="mt-4 text-xs font-semibold uppercase tracking-[.16em] text-[#B59A52]">
          {copy.mine}
        </p>
        <h2 className="mt-1 text-2xl font-semibold text-[#102747]">
          {copy.thanks}
        </h2>
        <div className="mt-3 text-3xl tracking-wider" aria-label={`${estrellas} de 5`}>
          {[1, 2, 3, 4, 5].map(valor => <span key={valor} className={valor <= estrellas ? 'text-[#D5A327]' : 'text-[#D8D5CE]'}>★</span>)}
        </div>
        <div className="mt-5 space-y-3 rounded-lg bg-[#F8F6F0] p-4 text-left text-[#52677F]">
          <p>
            <b className="text-[#102747]">
              {copy.yourReview}
            </b>
            {experiencia.trim() || copy.noComment}
          </p>
          {mejoras.trim() && <p>
            <b className="text-[#102747]">
              {copy.suggestion}
            </b>
            {mejoras}
          </p>}
          {autorizaPublicar && <p className="text-sm text-[#166534]">
            {copy.authorized}
          </p>}
        </div>
        <p className="mt-3 text-xs text-[#71839B]">
          {copy.editWindow}
        </p>
        {puedeEditar ? <button
          type="button"
          onClick={() => setOpinionEnviada(false)}
          className="mt-5 rounded-lg border border-[#173A66] px-6 py-2.5 font-semibold text-[#173A66]">
          {copy.edit}
        </button> : <p className="mt-4 text-sm font-semibold text-[#71839B]">
          {en ? "The 24-hour editing period has ended." : "El período de edición de 24 horas finalizó."}
        </p>}
      </section>
    </div>);
  return (<div className="fixed inset-0 z-[160] grid place-items-center bg-[#071D34]/55 p-4">
    <section className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-[#E5E0D8] bg-white p-5 shadow-2xl sm:p-7">
      <button
        type="button"
        aria-label={en ? "Close review" : "Cerrar reseña"}
        onClick={() => setOpinionOmitida(true)}
        className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full border border-[#E5E0D8] text-xl text-[#52677F] hover:bg-[#F8F6F0]">×</button>
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[.18em] text-[#B59A52]">Villa Serena</p>
          <h2 className="mt-2 text-2xl font-semibold text-[#102747]">
            {copy.title}
          </h2>
          <p className="mt-1 text-[#71839B]">
            {copy.intro}
          </p>
          <div className="mt-4 flex justify-center gap-2" role="radiogroup" aria-label={copy.aria}>
            {[1, 2, 3, 4, 5].map(valor => <button
              key={valor}
              type="button"
              role="radio"
              aria-checked={estrellas === valor}
              aria-label={`${valor} ${valor === 1 ? (en ? "star" : "estrella") : (en ? "stars" : "estrellas")}`}
              onClick={() => setEstrellas(valor)}
              className={`text-4xl leading-none transition hover:scale-110 ${valor <= estrellas ? 'text-[#D5A327]' : 'text-[#D8D5CE]'}`}>★</button>)}
          </div>
        </div>
        <label className="mt-6 block text-sm font-semibold text-[#102747]">
          {copy.experience}
          <span className="font-normal text-[#71839B]">
            {copy.optional}
          </span>
          <textarea
            value={experiencia}
            onChange={e => setExperiencia(e.target.value)}
            rows={3}
            placeholder={copy.experiencePlaceholder}
            className="mt-2 w-full resize-none rounded-lg border border-[#DCD7CD] px-4 py-3 font-normal outline-none focus:border-[#B59A52]" />
        </label>
        <label className="mt-4 block text-sm font-semibold text-[#102747]">
          {copy.improve}
          <span className="font-normal text-[#71839B]">
            {copy.optional}
          </span>
          <textarea
            value={mejoras}
            onChange={e => setMejoras(e.target.value)}
            rows={3}
            placeholder={copy.improvePlaceholder}
            className="mt-2 w-full resize-none rounded-lg border border-[#DCD7CD] px-4 py-3 font-normal outline-none focus:border-[#B59A52]" />
        </label>
        <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-lg bg-[#F8F6F0] p-3 text-sm text-[#314860]">
          <input type="checkbox" checked={autorizaPublicar} onChange={e => setAutorizaPublicar(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#173A66]" />
          <span>
            <b>
              {copy.publish}
            </b>
            <br />
            {copy.publishDetail}
          </span>
        </label>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button type="button" onClick={() => setOpinionOmitida(true)} className="rounded-lg border border-[#B59A52] px-5 py-3 font-semibold text-[#7A6327]">
            {copy.later}
          </button>
          <button
            type="button"
            disabled={estrellas === 0}
            onClick={onGuardar}
            className="rounded-lg bg-[#173A66] px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:bg-[#C9CED5]">
            {copy.send}
          </button>
        </div>
        {estrellas === 0 && <p className="mt-2 text-center text-xs text-[#71839B]">
          {copy.needStars}
        </p>}
        <p className="mt-4 text-center text-xs text-[#71839B]">
          {copy.editWindow}
        </p>
      </div>
    </section>
  </div>);
}
function Linea({ label, valor, color = "#6B7280", }: {
  label: string;
  valor: string;
  color?: string;
}) {
  const ui = useUiText();
  return (<div className="flex justify-between text-[14px]">
    <span className="text-[#6B7280]">
      {ui(label)}
    </span>
    <span style={{ color }}>
      {valor}
    </span>
  </div>);
}
function ModalPago({ saldo, puntos, onCerrar, onPagar, }: {
  saldo: number;
  puntos: number;
  onCerrar: () => void;
  onPagar: (metodo: MetodoPagoHuesped, extra: {
    ultimos4?: string;
    puntosUsados?: number;
    descuentoPuntos?: number;
    descuentoCodigo?: number;
    codigoPromocional?: string;
    montoTarjeta?: number;
  }) => void;
}) {
  const ui = useUiText();
  const [metodo, setMetodo] = useState<MetodoPagoHuesped>("tarjeta");
  const [tarjeta, setTarjeta] = useState("");
  const [titular, setTitular] = useState("");
  const [vence, setVence] = useState("");
  const [cvv, setCvv] = useState("");
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [procesando, setProcesando] = useState(false);
  const [codigoPromocional, setCodigoPromocional] = useState("");
  const [codigoAplicado, setCodigoAplicado] = useState<string | null>(null);
  const [mensajeCodigo, setMensajeCodigo] = useState("");
  const [usarPuntos, setUsarPuntos] = useState(false);
  const [usarGuardada, setUsarGuardada] = useState(true);
  const guardada = tarjetaPrincipal();
  const puntosNecesarios = puntosDeMonto(saldo);
  const puntosSuficientes = puntos >= puntosNecesarios;
  const promocionAplicada = codigoAplicado ? leerPromociones().find(p => p.codigo.toUpperCase() === codigoAplicado.toUpperCase() && p.activa && p.desde <= fechaHotel() && p.hasta >= fechaHotel()) : undefined;
  const descuentoCodigo = promocionAplicada ? Math.round(saldo * (promocionAplicada.descuentoPct / 100) * 100) / 100 : 0;
  const maximoCanjePuntos = Math.max(0, (saldo - descuentoCodigo) * 0.25);
  const descuentoPuntos = usarPuntos ? Math.min(montoDePuntos(puntos), maximoCanjePuntos) : 0;
  const puntosAplicados = puntosDeMonto(descuentoPuntos);
  const montoTarjeta = Math.max(0, Math.round((saldo - descuentoCodigo - descuentoPuntos) * 100) / 100);
  function pagar() {
    if (metodo === "recepcion") {
      onPagar("recepcion", {});
      onCerrar();
      return;
    }
    if (metodo === "puntos") {
      if (!puntosSuficientes)
        return;
      onPagar("puntos", {});
      return;
    }
    if (usarGuardada) {
      setProcesando(true);
      window.setTimeout(() => {
        onPagar(metodo, {
          ultimos4: tarjetaPrincipal()?.ultimos4 ?? "",
          puntosUsados: puntosAplicados,
          descuentoPuntos,
          descuentoCodigo,
          codigoPromocional: codigoAplicado ?? undefined,
          montoTarjeta
        });
        setProcesando(false);
      },
        900);
      return;
    }
    const e: Record<string, string> = {};
    if (tarjeta.replace(/\D/g, "").length !== 16)
      e.tarjeta = "Escribe los 16 dígitos de la tarjeta.";
    if (!titular.trim())
      e.titular = "Escribe el nombre del titular.";
    if (!/^\d{2}\/\d{2}$/.test(vence))
      e.vence = "Usa el formato MM/AA.";
    if (!/^\d{3,4}$/.test(cvv))
      e.cvv = "El código son 3 o 4 dígitos.";
    setErrores(e);
    if (Object.keys(e).length > 0)
      return;
    setProcesando(true);
    window.setTimeout(() => {
      onPagar(metodo,
        {
          ultimos4: ultimos4(tarjeta),
          puntosUsados: puntosAplicados,
          descuentoPuntos,
          descuentoCodigo,
          codigoPromocional: codigoAplicado ?? undefined,
          montoTarjeta,
        });
      setProcesando(false);
    },
      900);
  }
  return (<Modal titulo="Pagar saldo pendiente" subtitulo={`Saldo a pagar: ${dinero(saldo)}`} onCerrar={onCerrar} ancho="sm:max-w-xl">
    <div className="space-y-4">
      <div className="grid gap-2">
        {(["tarjeta", "debito", "recepcion"] as MetodoPagoHuesped[]).map((m) => (<button
          key={m}
          onClick={() => setMetodo(m)}
          className={`px-3 py-3 min-h-[44px] text-[13px] font-semibold rounded-md border transition-colors ${metodo === m
            ? "bg-[#18345C] text-white border-[#18345C]"
            : "bg-white text-[#6B7280] border-[#E5E0D8] hover:bg-[#F8F6F0]"}`}>
          {m === "tarjeta" ? (guardada ? `Usar tarjeta guardada · ${guardada.marca} •••• ${guardada.ultimos4}` : "Agregar nueva tarjeta") : m === "debito" ? "Agregar nueva tarjeta de débito" : "Pagar en recepción"}
        </button>))}
      </div>

      {metodo === "recepcion" ? (<div className="rounded-lg border border-[#E5E0D8] bg-[#FFF9E8] px-4 py-4 text-sm text-[#52677F]">
        <b className="block text-[#18345C]">Pago pendiente en Recepción</b>
        <p className="mt-1">El saldo no se marcará como pagado. Recepción debe registrar el pago para habilitar “Finalizar check-out”.</p>
      </div>) : metodo === "puntos" ? (<div className="bg-[#F8F6F0] border border-[#E5E0D8] rounded-lg px-4 py-4">
        <p className="text-[15px] font-semibold text-[#18345C] flex items-center gap-2">
          <StarIcon size={16} />
          <UiText text=" Pago con puntos de fidelidad             " />
        </p>
        <div className="mt-3 space-y-1.5 text-[14px]">
          <div className="flex justify-between">
            <span className="text-[#6B7280]">
              <UiText text="Puntos disponibles" />
            </span>
            <span className="text-[#18345C] font-medium">
              {formatoPuntos(puntos)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#6B7280]">
              <UiText text="Puntos necesarios" />
            </span>
            <span className="text-[#18345C] font-medium">
              {formatoPuntos(puntosNecesarios)}
            </span>
          </div>
          <div className="flex justify-between border-t border-[#E5E0D8] pt-1.5">
            <span className="text-[#6B7280]">
              <UiText text="Te quedarían" />
            </span>
            <span className="font-semibold" style={{ color: puntosSuficientes ? "#166534" : "#991B1B" }}>
              {formatoPuntos(Math.max(0, puntos - puntosNecesarios))}
            </span>
          </div>
        </div>

        {!puntosSuficientes && (<div className="mt-3">
          <Aviso tono="error">
            <UiText text="                   No tienes puntos suficientes para cubrir el saldo. Elige crédito o débito.                 " />
          </Aviso>
        </div>)}
      </div>) : (<div className="space-y-4">
        <div className="mx-auto flex aspect-[1.586/1] w-full max-w-[380px] flex-col justify-between rounded-[22px] bg-gradient-to-br from-[#102747] to-[#2B5A87] p-5 text-white shadow-xl">
          <div className="flex items-center justify-between">
            <b className="text-lg">Villa Serena</b>
            <div className="flex items-center gap-3">
              <b className="italic">VISA</b>
              <span className="flex -space-x-2">
                <i className="h-6 w-6 rounded-full bg-[#EB001B]" />
                <i className="h-6 w-6 rounded-full bg-[#F79E1B]" />
              </span>
            </div>
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
        <div className="rounded-xl border border-[#E5E0D8] bg-white p-4">
          <label className="flex cursor-pointer items-center gap-3 py-2">
            <input type="radio" checked={usarGuardada} onChange={() => setUsarGuardada(true)} className="h-4 w-4 accent-[#18345C]" />
            <span>
              <b className="block text-[#18345C]">Usar tarjeta guardada</b>
              <small className="text-[#6B7280]">
                {guardada ? `${guardada.marca} · •••• ${guardada.ultimos4}` : "Sin tarjeta guardada"}
              </small>
            </span>
          </label>
          <label className="mt-2 flex cursor-pointer items-center gap-3 border-t pt-4">
            <input type="radio" checked={!usarGuardada} onChange={() => setUsarGuardada(false)} className="h-4 w-4 accent-[#18345C]" />
            <b className="text-[#18345C]">Agregar otra tarjeta</b>
          </label>
        </div>
        {!usarGuardada && <div className="overflow-hidden rounded-xl border border-[#D7DCE2] bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E0D8] px-5 py-4">
            <div>
              <p className="font-semibold text-[#18345C]">
                <UiText text="Datos de la tarjeta" />
              </p>
              <p className="mt-1 text-sm text-[#6B7280]">
                <UiText text="El pago se procesará al confirmar." />
              </p>
            </div>
            <div className="flex items-center gap-4 font-bold">
              <span className="text-[#1434CB]">VISA</span>
              <span className="flex -space-x-2">
                <i className="h-6 w-6 rounded-full bg-[#EB001B]" />
                <i className="h-6 w-6 rounded-full bg-[#F79E1B]" />
              </span>
            </div>
          </div>
          <div className="grid gap-6 p-5 lg:grid-cols-[1fr_340px]">
            <div className="space-y-4">
              <Campo label="Número de tarjeta" error={errores.tarjeta}>
                <input
                  value={tarjeta}
                  onChange={(e) => setTarjeta(formatoTarjeta(e.target.value))}
                  className={INPUT_CLS}
                  placeholder="0000 0000 0000 0000"
                  inputMode="numeric" />
              </Campo>
              <Campo label="Titular" error={errores.titular}>
                <input value={titular} onChange={(e) => setTitular(e.target.value)} className={INPUT_CLS} />
              </Campo>
              <div className="grid grid-cols-2 gap-4">
                <Campo label="Vencimiento" error={errores.vence}>
                  <input
                    value={vence}
                    onChange={(e) => {
                      const d = e.target.value.replace(/\D/g, "").slice(0, 4);
                      setVence(d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d);
                    }}
                    className={INPUT_CLS}
                    placeholder="MM/AA"
                    inputMode="numeric" />
                </Campo>
                <Campo label="CVV" error={errores.cvv}>
                  <input value={cvv} onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))} className={INPUT_CLS} inputMode="numeric" />
                </Campo>
              </div>

              <Aviso tono="info">
                <span className="flex items-start gap-2">
                  <CardIcon />
                  <span>
                    <UiText text="Los datos viajan cifrados a la pasarela de pago; el hotel no los almacena." />
                  </span>
                </span>
              </Aviso>
            </div>
            <div className="flex flex-col items-center justify-center">
              <div className="flex aspect-[1.586/1] w-full max-w-[380px] flex-col justify-between rounded-2xl bg-[#18345C] p-5 text-white shadow-xl">
                <div className="flex items-start justify-between">
                  <p className="font-serif text-xl font-bold tracking-wide">VILLA SERENA</p>
                  <span className="text-xs tracking-[0.28em] text-[#D8B94E]">HOTEL</span>
                </div>
                <div className="h-9 w-12 rounded-lg bg-[#D8B94E]" />
                <p className="text-base tracking-[0.22em] sm:text-lg">
                  {tarjeta || "•••• •••• •••• ••••"}
                </p>
                <div className="flex justify-between gap-4 text-xs">
                  <div>
                    <p className="text-[9px] uppercase tracking-widest text-[#AEBCC1]">Titular</p>
                    <p className="mt-1 truncate uppercase">
                      {titular || "NOMBRE DEL TITULAR"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-widest text-[#AEBCC1]">Válida hasta</p>
                    <p className="mt-1">
                      {vence || "MM/AA"}
                    </p>
                  </div>
                </div>
              </div>
              <p className="mt-4 flex items-center gap-2 text-sm text-[#6B7280]">
                <CardIcon size={15} />
                <UiText text="Transacción protegida" />
              </p>
            </div>
          </div>
        </div>}
      </div>)}

      <div className="grid gap-4 rounded-xl border border-[#E5E0D8] bg-[#F8F6F0] p-4 lg:grid-cols-2">
        <div>
          <label className="text-sm font-semibold text-[#18345C]">
            <UiText text="Código promocional" />
          </label>
          <div className="mt-2 flex gap-2">
            <input
              value={codigoPromocional}
              onChange={(e) => {
                setCodigoPromocional(e.target.value.toUpperCase());
                setMensajeCodigo("");
              }}
              placeholder="Escribe tu código"
              className={INPUT_CLS} />
            <button
              type="button"
              onClick={() => {
                const hoy = fechaHotel();
                const promo = leerPromociones().find(p => p.codigo.toUpperCase() === codigoPromocional.trim().toUpperCase() && p.activa && p.desde <= hoy && p.hasta >= hoy);
                if (promo) {
                  setCodigoAplicado(promo.codigo);
                  setMensajeCodigo(`Código aplicado: ${promo.descuentoPct}% de descuento.`);
                }
                else {
                  setCodigoAplicado(null);
                  setMensajeCodigo("Código no válido o inactivo.");
                }
              }}
              className="rounded-md border border-[#18345C] px-4 font-semibold text-[#18345C]">
              <UiText text="Aplicar" />
            </button>
          </div>
          {mensajeCodigo && <p className={`mt-2 text-xs ${codigoAplicado ? "text-[#166534]" : "text-[#991B1B]"}`}>
            {ui(mensajeCodigo)}
          </p>}
        </div>
        <label className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 ${usarPuntos ? "border-[#D8B94E] bg-[#FFF9E5]" : "border-[#E5E0D8] bg-white"}`}>
          <input
            type="checkbox"
            checked={usarPuntos}
            disabled={puntos === 0}
            onChange={(e) => setUsarPuntos(e.target.checked)}
            className="mt-1 h-4 w-4 accent-[#18345C]" />
          <span>
            <b className="text-sm text-[#18345C]">
              <UiText text="Usar mis puntos" />
            </b>
            <span className="mt-1 block text-xs text-[#6B7280]">{formatoPuntos(puntos)} {ui("puntos disponibles")} · {dinero(montoDePuntos(puntos))}</span>
            {usarPuntos && <span className="mt-1 block text-xs font-semibold text-[#166534]">{formatoPuntos(puntosAplicados)} {ui("puntos aplicados")} · − {dinero(descuentoPuntos)}</span>}
          </span>
        </label>
      </div>

      <div className="rounded-xl border border-[#E5E0D8] bg-white p-4 text-sm">
        <div className="flex justify-between py-1 text-[#6B7280]">
          <span>
            <UiText text="Saldo de la cuenta" />
          </span>
          <span>
            {dinero(saldo)}
          </span>
        </div>
        {descuentoCodigo > 0 && <div className="flex justify-between py-1 text-[#166534]">
          <span>
            <UiText text="Código promocional" />
            {codigoAplicado ?? "—"}
          </span>
          <span>− {dinero(descuentoCodigo)}</span>
        </div>}
        {descuentoPuntos > 0 && <div className="flex justify-between py-1 text-[#166534]">
          <span>
            <UiText text="Descuento con puntos" />
          </span>
          <span>− {dinero(descuentoPuntos)}</span>
        </div>}
        <div className="mt-2 flex justify-between border-t border-[#E5E0D8] pt-3 text-base font-semibold text-[#18345C]">
          <span>
            <UiText text={metodo === "recepcion" ? "Saldo que quedará pendiente" : "Total a pagar con tarjeta"} />
          </span>
          <span>
            {dinero(montoTarjeta)}
          </span>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-1">
        <BotonSecundario onClick={onCerrar} ancho>
          <UiText text="Cancelar" />
        </BotonSecundario>
        <BotonPrimario disabled={procesando || (metodo === "puntos" && !puntosSuficientes)} onClick={pagar}>
          {ui(procesando ? "Procesando…" : metodo === "recepcion" ? "Registrar pago pendiente" : `Pagar ${dinero(montoTarjeta)}`)}
        </BotonPrimario>
      </div>
    </div>
  </Modal>);
}
function ModalComprobante({ huesped, reserva, habitacion, cuenta, cargos, pagos, fiscales, factura, onCerrar, }: {
  huesped: Huesped;
  reserva: Reserva;
  habitacion: HabitacionHotel;
  cuenta: ResumenCuentaHuesped;
  cargos: CargoHuesped[];
  pagos: PagoHuespedApp[];
  fiscales: DatosFiscales;
  factura: string | null;
  onCerrar: () => void;
}) {
  const restaurante = cargos.filter(c => c.categoria === 'Restaurante' || c.categoria === 'Room service').reduce((s, c) => s + c.cantidad * c.precioUnitario, 0);
  const spa = cargos.filter(c => c.categoria === 'Spa y experiencias').reduce((s, c) => s + c.cantidad * c.precioUnitario, 0);
  const otros = Math.max(0, cuenta.extras - restaurante - spa);
  const facturaNumero = factura || `VS-FE-${reserva.codigo.replace('VS-', '')}`;
  const verificacion = `${reserva.codigo.replace(/[^A-Z0-9]/g, '').slice(-6)}-${habitacion.numero}-2026`;
  const descargar = () => window.print();
  return (<Modal titulo="Factura preliminar" subtitulo="Documento preliminar · no es factura fiscal" onCerrar={onCerrar} ancho="sm:max-w-4xl">
    <div className="space-y-5 text-[#102747]">
      <section className="rounded-xl border border-[#DED8CC] bg-white p-5 sm:p-7">
        <div className="grid gap-5 border-b border-[#D8B94E] pb-5 sm:grid-cols-[170px_1fr_1fr]">
          <div className="flex items-center justify-center border-b pb-4 sm:border-b-0 sm:border-r sm:pb-0 sm:pr-5">
            <img src="/villa-serena-logo.png" alt="Villa Serena Hotel" className="max-h-28 max-w-[150px] object-contain" />
          </div>
          <div className="text-sm leading-relaxed">
            <h3 className="text-lg font-semibold">Villa Serena Hotel</h3>
            <p>Huehuetenango, Guatemala</p>
            <p>NIT: {HOTEL.nit}</p>
            <p>Correo: villaserenagt@gmail.com</p>
          </div>
          <div className="text-sm leading-relaxed sm:text-right">
            <h3 className="font-serif text-xl font-bold">FACTURA PRELIMINAR</h3>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#71839B]">Documento preliminar · no es factura fiscal</p>
            <p className="mt-1">
              <b>Referencia:</b>
              {facturaNumero}
            </p>
            <p>
              <b>Reserva:</b>
              {reserva.codigo}
            </p>
            <p>
              <b>Habitación:</b>
              {habitacion.numero}
            </p>
            <p>
              <b>Fecha de consulta:</b>
              {formatoFechaHora(reserva.checkOutEn ?? new Date().toISOString())}
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div className="text-sm leading-relaxed">
            <h3 className="font-serif text-lg font-bold">Datos del cliente</h3>
            <p>
              <b>Cliente:</b>
              {fiscales.nombre || huesped.nombre}
            </p>
            <p>
              <b>NIT:</b>
              {fiscales.nit || 'C/F'}
            </p>
            <p>
              <b>Correo:</b>
              {fiscales.correo || huesped.correo}
            </p>
          </div>
          <div className="rounded-lg bg-[#EAF6EC] px-6 py-3 text-center text-[#237A42]">
            <b className="flex items-center gap-2">
              <CheckIcon size={20} /> PAGADO</b>
            <small>Gracias por ser parte<br />de Villa Serena.</small>
          </div>
        </div>
        <div className="mt-5 overflow-hidden rounded-lg border border-[#E5E0D8]">
          <div className="grid grid-cols-[1.7fr_.6fr_.7fr_.7fr] bg-[#F3F1EB] px-3 py-2 text-xs font-semibold">
            <span>Concepto</span>
            <span>Cantidad</span>
            <span>Precio unitario</span>
            <span className="text-right">Subtotal</span>
          </div>
          {[[`Alojamiento · Habitación ${habitacion.tipo} ${habitacion.numero}`, `${cuenta.noches} noches`, dinero(cuenta.precioNoche), dinero(cuenta.alojamiento)],
          ['Restaurante', '—', '—', dinero(restaurante)],
          ['Spa', '—', '—', dinero(spa)],
          ['Otros servicios', '—', '—', dinero(otros)]].map(row => <div key={row[0]} className="grid grid-cols-[1.7fr_.6fr_.7fr_.7fr] border-t px-3 py-2 text-xs sm:text-sm">
            <span>
              {row[0]}
            </span>
            <span>
              {row[1]}
            </span>
            <span>
              {row[2]}
            </span>
            <span className="text-right">
              {row[3]}
            </span>
          </div>)}
        </div>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div className="flex flex-col justify-end">
            <p className="font-serif text-xl italic">Gracias por hospedarte<br />en Villa Serena.</p>
            <i className="mt-4 h-px w-28 bg-[#D8B94E]" />
            <p className="mt-3 text-[10px] font-semibold uppercase tracking-[.28em]">Estancias que dejan<br />buenas historias</p>
          </div>
          <div className="space-y-1 text-sm">
            <Linea label="Subtotal" valor={dinero(cuenta.total + cuenta.descuento)} />
            <Linea label="Descuentos" valor={`− ${dinero(cuenta.descuento)}`} />
            <div className="flex justify-between bg-[#F3F1EB] px-2 py-1 font-bold">
              <span>Total</span>
              <span>
                {dinero(cuenta.total)}
              </span>
            </div>
            <Linea label="Pagado" valor={dinero(cuenta.pagado)} color="#166534" />
            <div className="flex justify-between bg-[#EAF6EC] px-2 py-1 font-bold text-[#166534]">
              <span>Saldo</span>
              <span>
                {dinero(cuenta.saldo)}
              </span>
            </div>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap justify-between gap-2 border-b border-[#D8B94E] pb-4 text-xs text-[#52677F]">
          <span>Código de verificación: {verificacion}</span>
          <span>Huehuetenango, Guatemala · {formatoFecha(reserva.checkOutEn ?? new Date().toISOString())}</span>
        </div>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <button onClick={descargar} className="rounded-lg bg-[#B59A52] px-7 py-3 font-semibold text-white">⇩ &nbsp; Descargar PDF</button>
          <button onClick={onCerrar} className="rounded-lg border border-[#18345C] px-7 py-3 font-semibold text-[#18345C]">Cerrar</button>
        </div>
      </section>
    </div>
  </Modal>);
}
function ModalDetalleCuenta({ huesped, reserva, habitacion, cuenta, cargos, onCerrar }: {
  huesped: Huesped;
  reserva: Reserva;
  habitacion: HabitacionHotel;
  cuenta: ResumenCuentaHuesped;
  cargos: CargoHuesped[];
  onCerrar: () => void;
}) {
  const descargar = () => window.print();
  const noches = Array.from({ length: cuenta.noches },
    (_,
      i) => {
        const fecha = new Date(`${reserva.fechaEntrada}T12:00:00`);
      fecha.setDate(fecha.getDate() + i);
      return {
        fecha: fecha.toISOString(),
        descripcion: `Habitación ${habitacion.tipo} ${habitacion.numero} · Noche ${i + 1} de ${cuenta.noches}`,
        importe: cuenta.precioNoche
      };
    });
  const categorias = ['Restaurante', 'Spa y experiencias', 'Servicios'] as const;
  return <Modal titulo="Detalle de cuenta" subtitulo="Documento informativo · No es una factura" onCerrar={onCerrar} ancho="sm:max-w-5xl">
    <div className="space-y-4 text-[#102747]">
      <div className="flex items-center gap-5">
        <img src="/villa-serena-logo.png" alt="Villa Serena Hotel" className="h-20 w-40 object-contain" />
        <div>
          <h2 className="font-serif text-3xl font-bold">DETALLE DE CUENTA</h2>
          <p className="text-sm text-[#71839B]">Documento informativo · No es una factura</p>
        </div>
      </div>
      <div className="grid gap-3 rounded-lg border border-[#E5E0D8] bg-[#FAF9F6] p-4 sm:grid-cols-4">
        {[['Reserva', reserva.codigo],
        ['Habitación', habitacion.numero],
        ['Huésped', huesped.nombre],
        ['Estancia', `${formatoFecha(reserva.fechaEntrada)} → ${formatoFecha(reserva.fechaSalida)}`]].map(([l, v]) => <div key={l} className="sm:border-r sm:last:border-0">
          <small className="text-[#71839B]">
            {l}
          </small>
          <b className="block">
            {v}
          </b>
        </div>)}
      </div>
      <div className="overflow-x-auto rounded-lg border border-[#E5E0D8]">
        <div className="min-w-[720px]">
          <div className="grid grid-cols-[.75fr_.8fr_1.8fr_.7fr_.7fr] bg-[#102747] px-4 py-2 text-sm font-semibold text-white">
            <span>Fecha</span>
            <span>Categoría</span>
            <span>Descripción</span>
            <span>Estado</span>
            <span className="text-right">Importe</span>
          </div>
          {noches.map(n => <div key={n.descripcion} className="grid grid-cols-[.75fr_.8fr_1.8fr_.7fr_.7fr] border-t px-4 py-2 text-sm">
            <span>
              {formatoFecha(n.fecha)}
            </span>
            <span>Alojamiento</span>
            <span>
              {n.descripcion}
            </span>
            <span>Pagado</span>
            <span className="text-right">
              {dinero(n.importe)}
            </span>
          </div>)}
          {cargos.map(c => <div key={c.id} className="grid grid-cols-[.75fr_.8fr_1.8fr_.7fr_.7fr] border-t px-4 py-2 text-sm">
            <span>
              {formatoFecha(c.fecha)}
            </span>
            <span>
              {c.categoria}
            </span>
            <span>
              {c.concepto}
            </span>
            <span>Pagado</span>
            <span className="text-right">
              {dinero(c.cantidad * c.precioUnitario)}
            </span>
          </div>)}
          {categorias.filter(cat => !cargos.some(c => c.categoria === cat)).map(cat => <div key={cat} className="grid grid-cols-[.75fr_.8fr_1.8fr_.7fr_.7fr] border-t px-4 py-2 text-sm text-[#71839B]">
            <span>—</span>
            <span>
              {cat === 'Spa y experiencias' ? 'Spa' : cat}
            </span>
            <span>Sin consumos registrados</span>
            <span>—</span>
            <span className="text-right">Q 0</span>
          </div>)}
        </div>
      </div>
      <div className="ml-auto max-w-md rounded-lg border border-[#E5E0D8] p-4 text-sm">
        <Linea label="Cargos" valor={dinero(cuenta.total + cuenta.descuento)} />
        <Linea label="Descuentos" valor={dinero(cuenta.descuento)} />
        <Linea label="Pagos realizados" valor={`− ${dinero(cuenta.pagado)}`} />
        <div className="mt-2 flex justify-between border-t pt-2 text-base font-bold">
          <span>Saldo por pagar</span>
          <span className="text-[#166534]">
            {dinero(cuenta.saldo)}
          </span>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4 border-t pt-4">
        <p className="max-w-2xl text-xs text-[#71839B]">Este documento presenta el desglose de cargos y pagos de la estancia. No sustituye la factura electrónica.</p>
        <div className="flex gap-3">
          <button onClick={descargar} className="rounded-lg border border-[#18345C] px-6 py-3 font-semibold text-[#18345C]">⇩ &nbsp; Descargar PDF</button>
          <button onClick={onCerrar} className="rounded-lg bg-[#18345C] px-7 py-3 font-semibold text-white">Cerrar</button>
        </div>
      </div>
    </div>
  </Modal>;
}
