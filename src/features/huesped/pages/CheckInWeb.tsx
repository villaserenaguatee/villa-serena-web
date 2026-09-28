import { UiText, useUiText } from "@/i18n/UiText";
import { usePublicLanguage } from "@/components/common/PublicLanguageToggle";
import { useState } from "react";
import type { Huesped, Reserva, HabitacionHotel, CheckInWeb as CheckInWebEstado, DocumentoCargado, FormatoDocumento, Acompanante, } from "@/lib/pms/types";
import { formatoFechaHora, nochesEntre, FOTO_STANDARD, FOTO_SUPERIOR, FOTO_DELUXE, FOTO_SUITE, TERMINOS_ESTANCIA, } from "@/data/pms";
import { Chip, Campo, INPUT_CLS, Cabecera, Tarjeta, Aviso, BotonPrimario, BotonSecundario, CodigoQR, correoValido, telefonoValido, CheckIcon, UploadIcon, KeyIcon, AlertIcon, MailIcon, } from "@/features/huesped/pages/huespedUtils";
const PASOS = [
  { id: 1, label: "Tus datos" },
  { id: 2, label: "Documento" },
  { id: 3, label: "Términos" },
  { id: 4, label: "Resumen" },
];
const FORMATOS: Record<string, FormatoDocumento> = {
  jpg: "JPG",
  jpeg: "JPG",
  png: "PNG",
  pdf: "PDF",
};
const PESO_MAXIMO_KB = 5 * 1024;
const PAISES_TELEFONO = [
  ["🇬🇹", "+502", "Guatemala"],
  ["🇸🇻", "+503", "El Salvador"],
  ["🇭🇳", "+504", "Honduras"],
  ["🇧🇿", "+501", "Belice"],
  ["🇨🇷", "+506", "Costa Rica"],
  ["🇵🇦", "+507", "Panamá"],
  ["🇲🇽", "+52", "México"],
  ["🇺🇸", "+1", "Estados Unidos"],
  ["🇨🇦", "+1", "Canadá"],
  ["🇨🇴", "+57", "Colombia"],
  ["🇵🇪", "+51", "Perú"],
  ["🇦🇷", "+54", "Argentina"],
  ["🇨🇱", "+56", "Chile"],
  ["🇪🇨", "+593", "Ecuador"],
  ["🇧🇷", "+55", "Brasil"],
  ["🇪🇸", "+34", "España"],
  ["🇬🇧", "+44", "Reino Unido"],
  ["🇫🇷", "+33", "Francia"],
  ["🇩🇪", "+49", "Alemania"],
  ["🇮🇹", "+39", "Italia"],
  ["🇯🇵", "+81", "Japón"],
];
interface Props {
  huesped: Huesped;
  reserva: Reserva;
  habitacion: HabitacionHotel;
  checkin: CheckInWebEstado;
  estanciaCerrada: boolean;
  onCompletar: (datos: {
    documento: DocumentoCargado;
    documentos: DocumentoCargado[];
    peticiones: string[];
    notaPeticiones: string;
  }) => void;
  onGuardarOcupantes: (datos: {
    adultos: number;
    ninos: number;
    acompanantes: Acompanante[];
  }) => void;
  onIrHabitacion: () => void;
  onContactarRecepcion: () => void;
}
export default function CheckInWebScreen({ huesped, reserva, habitacion, checkin, estanciaCerrada, onCompletar, onGuardarOcupantes, onIrHabitacion, onContactarRecepcion, }: Props) {
  const ui = useUiText();
  const { en } = usePublicLanguage();
  const [paso, setPaso] = useState(1);
  const [nombre, setNombre] = useState(huesped.nombre);
  const [tipoDocumento, setTipoDocumento] = useState<"DPI" | "Pasaporte">(huesped.tipoDocumento);
  const [documento, setDocumento] = useState(huesped.documento);
  const [telefono, setTelefono] = useState(huesped.telefono);
  const [correo, setCorreo] = useState(huesped.correo);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [adultos, setAdultos] = useState(reserva.adultos ?? reserva.personas);
  const [ninos, setNinos] = useState(reserva.ninos ?? 0);
  const [acompanantes, setAcompanantes] = useState<Acompanante[]>(reserva.acompanantes);
  const [nombreAcompanante, setNombreAcompanante] = useState('');
  const [apellidoAcompanante, setApellidoAcompanante] = useState('');
  const [documentoAcompanante, setDocumentoAcompanante] = useState('');
  const [tipoDocumentoAcompanante, setTipoDocumentoAcompanante] = useState<'DPI' | 'Pasaporte'>('DPI');
  const [telefonoAcompanante, setTelefonoAcompanante] = useState('');
  const [prefijoAcompanante, setPrefijoAcompanante] = useState('+502');
  const [paisAbierto, setPaisAbierto] = useState(false);
  const [busquedaPais, setBusquedaPais] = useState('');
  const [mostrarFormularioAcompanante, setMostrarFormularioAcompanante] = useState(false);
  const [erroresAcompanante, setErroresAcompanante] = useState<Record<string, string>>({});
  const fechaUI = (fecha: string) => new Date(`${fecha}T12:00:00`).toLocaleDateString(en ? "en-US" : "es-GT", { day: "numeric", month: "short", year: "numeric" });
  const [archivo, setArchivo] = useState<DocumentoCargado | null>(checkin.documento);
  const [documentoFrente, setDocumentoFrente] = useState<DocumentoCargado | null>(null);
  const [documentoReverso, setDocumentoReverso] = useState<DocumentoCargado | null>(null);
  const [documentoUnico, setDocumentoUnico] = useState<DocumentoCargado | null>(checkin.documento);
  const [errorArchivo, setErrorArchivo] = useState("");
  const [aceptado, setAceptado] = useState(false);
  const completado = checkin.estado === "aprobado";
  const pendiente = checkin.estado === "pendiente";
  function validarDatos(): boolean {
    const e: Record<string, string> = {};
    if (!nombre.trim())
      e.nombre = "El nombre no puede quedar vacío.";
    if (!documento.trim())
      e.documento = "Escribe el número de tu documento.";
    if (!telefonoValido(telefono))
      e.telefono = "Escribe un teléfono de al menos 8 dígitos.";
    if (!correoValido(correo))
      e.correo = "Escribe un correo válido.";
    setErrores(e);
    return Object.keys(e).length === 0;
  }
  function recibirArchivo(archivos: FileList | null,
    lado: "frente" | "reverso" | "unico") {
    const f = archivos?.[0];
    if (!f)
      return;
    const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
    const formato = FORMATOS[ext];
    if (!formato) {
      setErrorArchivo("Solo aceptamos imágenes JPG, PNG o archivos PDF.");
      return;
    }
    const pesoKb = Math.max(1, Math.round(f.size / 1024));
    if (pesoKb > PESO_MAXIMO_KB) {
      setErrorArchivo("El archivo supera los 5 MB. Sube una versión más liviana.");
      return;
    }
    setErrorArchivo("");
    const cargado = { nombre: f.name, formato, pesoKb, previewUrl: URL.createObjectURL(f), lado };
    setArchivo(cargado);
    if (lado === "frente") {
      setDocumentoFrente(cargado);
    }
    else if (lado === "reverso") {
      setDocumentoReverso(cargado);
    }
    else {
      setDocumentoUnico(cargado);
    }
  }
  function validarAcompanante(): boolean {
    const e: Record<string, string> = {};
    if (!nombreAcompanante.trim())
      e.nombre = ui("Escribe el nombre del acompañante.");
    if (!documentoAcompanante.trim())
      e.documento = ui("Escribe el número de documento.");
    if (tipoDocumentoAcompanante === "DPI" && !/^\d{13}$/.test(documentoAcompanante))
      e.documento = ui("El DPI debe tener exactamente 13 dígitos.");
    if (tipoDocumentoAcompanante === "Pasaporte" && !/^[A-Za-z0-9]{1,20}$/.test(documentoAcompanante))
      e.documento = ui("El pasaporte debe tener hasta 20 caracteres alfanuméricos.");
    if (telefonoAcompanante && !/^\d{8}$/.test(telefonoAcompanante))
      e.telefono = ui("El teléfono debe tener exactamente 8 dígitos.");
    setErroresAcompanante(e);
    return Object.keys(e).length === 0;
  }
  function agregarAcompanante() {
    if (acompanantes.length >= Math.max(0, adultos + ninos - 1))
      return;
    if (!validarAcompanante())
      return;
    setAcompanantes(v => [...v,
    {
      nombre: nombreAcompanante.trim(),
      tipoDocumento: tipoDocumentoAcompanante,
      documento: documentoAcompanante,
      telefono: telefonoAcompanante ? `${prefijoAcompanante} ${telefonoAcompanante}` : ""
    }]);
    setNombreAcompanante("");
    setApellidoAcompanante("");
    setDocumentoAcompanante("");
    setTelefonoAcompanante("");
    setErroresAcompanante({});
    setMostrarFormularioAcompanante(false);
  }
  function finalizar() {
    const documentos = tipoDocumento === "DPI" ? [documentoFrente, documentoReverso].filter(Boolean) as DocumentoCargado[] : documentoUnico ? [documentoUnico] : [];
    if (documentos.length === 0 || (tipoDocumento === "DPI" && documentos.length !== 2) || !aceptado)
      return;
    onCompletar({ documento: documentos[0], documentos, peticiones: [], notaPeticiones: "" });
  }
  if (pendiente) {
    return (<div className="flex-1 overflow-y-auto bg-[#F8F6F0]" style={{ fontFamily: '"Afacad", "Segoe UI", Arial, sans-serif' }}>
      <Cabecera titulo="Check-in enviado" subtitulo={`${en ? "Room" : "Habitación"} ${habitacion.numero} · ${reserva.codigo}`} />
      <div className="px-4 sm:px-6 py-8 max-w-3xl">
        <div className="overflow-hidden rounded-2xl border border-[#E5E0D8] bg-white shadow-sm">
          <div className="bg-[#F0FAF4] px-6 py-8 text-center border-b border-[#BBE2C8]">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#198754] bg-white text-[#198754]">
              <CheckIcon size={28} />
            </span>
            <h2 className="mt-4 text-2xl font-semibold text-[#18345C]">
              <UiText text="Recibimos tu check-in" />
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-[15px] text-[#6B7280]">
              <UiText text="Recepción verificará tu documento y te avisaremos por correo cuando tu llave digital esté disponible." />
            </p>
          </div>
          <div className="grid gap-4 p-6 sm:grid-cols-[1fr_auto] sm:items-center">
            <div>
              <span className="inline-flex rounded-full bg-[#FFF6D8] px-3 py-1 text-[12px] font-semibold text-[#78450A]">
                <UiText text="Pendiente de revisión" />
              </span>
              <p className="mt-3 text-[14px] text-[#6B7280]">
                <UiText text="No necesitas enviar nuevamente la información." />
              </p>
            </div>
            <button onClick={() => onIrHabitacion()} className="rounded-lg border border-[#18345C] px-5 py-3 font-semibold text-[#18345C]">
              <UiText text="Ir a Mi habitación" />
            </button>
          </div>
        </div>
      </div>
    </div>);
  }
  if (completado) {
    return (<div className="flex-1 overflow-y-auto bg-[#F8F6F0]" style={{ fontFamily: '"Afacad", "Segoe UI", Arial, sans-serif' }}>
      <Cabecera titulo="Check-in completado" subtitulo={`${en ? "Room" : "Habitación"} ${habitacion.numero} · ${reserva.codigo}`} />

      <div className="px-4 sm:px-6 py-5 space-y-5 max-w-3xl">
        {estanciaCerrada ? (<Aviso tono="alerta">
          <UiText text="               Tu estancia finalizó y la llave digital quedó desactivada tras el check-out.             " />
        </Aviso>) : (<Aviso tono="exito">
          <span className="flex items-start gap-2">
            <CheckIcon />
            <span>
              <UiText text="                   Completaste el check-in el " />
              {formatoFechaHora(checkin.completadoEn ?? "")}
              <UiText text=". Puedes entrar a la                   habitación directamente con tu llave digital.                 " />
            </span>
          </span>
        </Aviso>)}

        <Tarjeta titulo="Tu llave digital">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            <div className={estanciaCerrada ? "opacity-30 grayscale" : ""}>
              <CodigoQR texto={checkin.codigoLlave ?? reserva.codigo} tamano={170} />
            </div>
            <div className="flex-1 min-w-0 text-center sm:text-left">
              <p className="text-[17px] font-semibold text-[#18345C] flex items-center justify-center sm:justify-start gap-2">
                <KeyIcon size={18} />
                <UiText text=" Habitación " />
                {habitacion.numero}
              </p>
              <p className="text-[14px] text-[#6B7280] mt-1">
                <UiText text="                   Muestra este código en el lector de la puerta o usa la apertura por Bluetooth desde la                   sección “Mi habitación”.                 " />
              </p>
              <p className="text-[12px] text-[#AEBCC1] mt-2 break-all">
                {checkin.codigoLlave}
              </p>
              {!estanciaCerrada && (<div className="mt-4">
                <BotonPrimario onClick={onIrHabitacion}>
                  <UiText text="Ir a abrir la puerta" />
                </BotonPrimario>
              </div>)}
            </div>
          </div>
        </Tarjeta>

        <div className="grid gap-5 sm:grid-cols-2">
          <Tarjeta titulo="Documento verificado">
            {checkin.documento ? (<div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-lg bg-[#F0FAF4] border border-[#86EFAC] flex items-center justify-center shrink-0 text-[#166534]">
                <CheckIcon size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-[15px] font-medium text-[#18345C] truncate">
                  {checkin.documento.nombre}
                </p>
                <p className="text-[12px] text-[#AEBCC1]">
                  {checkin.documento.formato}
                  <UiText text=" · " />
                  {checkin.documento.pesoKb}
                  <UiText text=" KB · verificado                     " />
                </p>
              </div>
            </div>) : (<p className="text-[14px] text-[#AEBCC1]">
              <UiText text="Sin documento cargado." />
            </p>)}

            <div className="mt-4 border-t border-[#E5E0D8] pt-4 text-sm font-semibold text-[#166534]">
              <UiText text="✓ Términos y condiciones de la estancia aceptados" />
            </div>
          </Tarjeta>

        </div>
      </div>
    </div>);
  }
  return (<div className="flex-1 overflow-y-auto bg-[#F8F6F0]" style={{ fontFamily: '"Afacad", "Segoe UI", Arial, sans-serif' }}>
    <Cabecera
      titulo="Check-in"
      subtitulo={`${reserva.codigo} · ${en ? "Arrival" : "Llegada"} ${fechaUI(reserva.fechaEntrada)} · ${en ? "Room" : "Habitación"} ${habitacion.numero}`} />

    <div className="checkin-layout px-4 sm:px-6 py-5">
      <div className="checkin-main space-y-5">
        <Aviso tono="info">
          <span className="flex items-start gap-2">
            <MailIcon />
            <span>
              <UiText text="Completa tus datos antes de llegar. Recepción verificará la información y te notificaremos cuando tu llave digital esté disponible." />
            </span>
          </span>
        </Aviso>
        {checkin.estado === 'rechazado' && <Aviso tono="error">
          <b>
            <UiText text="Recepción no pudo activar tu llave." />
          </b>
          <span className="mt-1 block">
            {checkin.motivoRechazo || ui('Corrige la información y vuelve a enviar el check-in.')}
          </span>
        </Aviso>}

        <div className="flex items-center gap-2 flex-wrap">
          {PASOS.map((p,
            i) => {
            const hecho = p.id < paso;
            const activo = p.id === paso;
            return (<div key={p.id} className="flex items-center gap-2">
              <span className={`w-6 h-6 rounded-full text-[12px] font-bold flex items-center justify-center ${activo
                ? "bg-[#18345C] text-white"
                : hecho
                  ? "bg-[#D8B94E] text-[#102747]"
                  : "bg-white text-[#AEBCC1] border border-[#E5E0D8]"}`}>
                {hecho ? "✓" : p.id}
              </span>
              <span className={`text-[13px] ${activo ? "font-semibold text-[#18345C]" : "text-[#AEBCC1]"}`}>
                {ui(p.label)}
              </span>
              {i < PASOS.length - 1 && (<span className="text-[#E5E0D8] px-1">
                <UiText text="—" />
              </span>)}
            </div>);
          })}
        </div>

        {paso === 1 && (<Tarjeta titulo="Verifica tus datos">
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo label="Nombre completo" error={errores.nombre}>
              <input value={nombre} readOnly className={`${INPUT_CLS} bg-[#F8F6F0]`} />
            </Campo>
            <Campo label="Documento" error={errores.documento}>
              <div className="grid grid-cols-[150px_1fr] gap-2">
                <select value={tipoDocumento} disabled className={`${INPUT_CLS} bg-[#F8F6F0]`}>
                  <option value="DPI">
                    <UiText text="DPI" />
                  </option>
                  <option value="Pasaporte">
                    <UiText text="Pasaporte" />
                  </option>
                </select>
                <input
                  value={documento}
                  readOnly
                  className={`${INPUT_CLS} bg-[#F8F6F0]`}
                  placeholder={tipoDocumento === "DPI"
                    ? "2987 65432 0101"
                    : "Número de pasaporte"} />
              </div>
            </Campo>
            <Campo label="Teléfono" error={errores.telefono}>
              <input value={telefono} onChange={(e) => setTelefono(e.target.value.replace(/\D/g, "").slice(0, 8))} maxLength={8} className={INPUT_CLS} />
            </Campo>
            <Campo label="Correo electrónico" error={errores.correo}>
              <input value={correo} onChange={(e) => setCorreo(e.target.value)} className={INPUT_CLS} />
            </Campo>
          </div>
          <button type="button" onClick={onContactarRecepcion} className="mt-3 text-[13px] font-semibold text-[#18345C] hover:underline">
            <UiText text="¿Los datos no son correctos? Contactar a Recepción" />
          </button>

          <div className="hidden">
            <div className="p-4 pb-3">
              <p className="text-[11px] uppercase tracking-widest text-[#AEBCC1]">
                <UiText text="Tu reserva" />
              </p>
              <p className="mt-1 text-lg font-semibold text-[#18345C]">{ui("Habitación")} {habitacion.numero} · {ui(habitacion.tipo)}</p>
            </div>
            <img
              src="https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=700&h=360&fit=crop"
              alt={ui("Habitación reservada")}
              className="mx-4 h-40 w-[calc(100%-2rem)] rounded-lg object-cover" />
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 p-4 pt-3 text-[13px] text-[#6B7280]">
              <span>
                <b className="block text-[#18345C]">
                  <UiText text="Entrada" />
                </b>
                {fechaUI(reserva.fechaEntrada)}
              </span>
              <span>
                <b className="block text-[#18345C]">
                  <UiText text="Salida" />
                </b>
                {fechaUI(reserva.fechaSalida)}
              </span>
              <span>
                <b className="block text-[#18345C]">
                  <UiText text="Huéspedes" />
                </b>
                {reserva.personas}
              </span>
              <span>
                <b className="block text-[#18345C]">
                  <UiText text="Reserva" />
                </b>
                {reserva.codigo}
              </span>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-[#E5E0D8] p-4">
            <h3 className="font-semibold text-[#18345C]">
              <UiText text="Huéspedes que se alojarán en la habitación" />
            </h3>
            <p className="mt-1 text-xs text-[#71839B]">
              <UiText text="La cantidad de huéspedes corresponde a tu reserva y no puede modificarse desde el check-in." />
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-[#E5E0D8] bg-[#F8F6F0] px-4 py-3">
                <span className="block text-[10px] uppercase tracking-widest text-[#AEBCC1]">
                  <UiText text="Adultos" />
                </span>
                <strong className="mt-1 block text-lg text-[#18345C]">
                  {adultos}
                </strong>
              </div>
              <div className="rounded-lg border border-[#E5E0D8] bg-[#F8F6F0] px-4 py-3">
                <span className="block text-[10px] uppercase tracking-widest text-[#AEBCC1]">
                  <UiText text="Niños" />
                </span>
                <strong className="mt-1 block text-lg text-[#18345C]">
                  {ninos}
                </strong>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {acompanantes.map((a,
                i) => (<div key={`${a.nombre}-${i}`} className="flex items-center gap-3 rounded-lg bg-[#F8F6F0] px-3 py-2">
                  <span className="flex-1">
                    <b className="block text-sm text-[#18345C]">
                      {a.nombre}
                    </b>
                    <small className="text-[#71839B]">{a.tipoDocumento || ui('Documento')} •••• {a.documento.slice(-4)}</small>
                  </span>
                  <button type="button" onClick={() => setAcompanantes(v => v.filter((_, j) => j !== i))} className="text-xs font-semibold text-[#991B1B]">
                    {ui("Quitar")}
                  </button>
                </div>))}
            </div>

            {acompanantes.length < Math.max(0, adultos + ninos - 1) && (<button
              type="button"
              onClick={() => setMostrarFormularioAcompanante(true)}
              className="mt-4 w-full rounded-lg border border-[#18345C] bg-white px-4 py-3 text-sm font-semibold text-[#18345C]">
              {ui("+ Agregar huésped")}
            </button>)}
          </div>

          {mostrarFormularioAcompanante && (<div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#071D34]/45 p-4" onMouseDown={() => setMostrarFormularioAcompanante(false)}>
            <section className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl" onMouseDown={e => e.stopPropagation()}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-widest text-[#B08A31]">
                    <UiText text="Acompañante" />
                  </p>
                  <h3 className="mt-1 text-2xl font-semibold text-[#18345C]">
                    <UiText text="Registrar acompañante" />
                  </h3>
                </div>
                <button type="button" onClick={() => setMostrarFormularioAcompanante(false)} className="text-2xl text-[#71839B]">×</button>
              </div>

              <div className="mt-5 grid gap-4">
                <Campo label="Nombre" error={erroresAcompanante.nombre}>
                  <input value={nombreAcompanante} onChange={e => setNombreAcompanante(e.target.value)} className={INPUT_CLS} />
                </Campo>
                <Campo label="Documento" error={erroresAcompanante.documento}>
                  <div className="grid grid-cols-[150px_1fr] gap-2">
                    <select
                      value={tipoDocumentoAcompanante}
                      onChange={e => {
                        setTipoDocumentoAcompanante(e.target.value as 'DPI' | 'Pasaporte');
                        setDocumentoAcompanante('');
                        setErroresAcompanante({});
                      }}
                      className={INPUT_CLS}>
                      <option>DPI</option>
                      <option>Pasaporte</option>
                    </select>
                    <input
                      value={documentoAcompanante}
                      onChange={e => setDocumentoAcompanante(tipoDocumentoAcompanante === 'DPI' ? e.target.value.replace(/\D/g, '').slice(0, 13) : e.target.value.replace(/[^A-Za-z0-9]/g, '').slice(0, 20))}
                      placeholder={tipoDocumentoAcompanante === 'DPI' ? '13 dígitos' : 'Hasta 20 caracteres'}
                      className={INPUT_CLS} />
                  </div>
                </Campo>
                <Campo label="Teléfono (opcional)" error={erroresAcompanante.telefono}>
                  <div className="relative flex gap-2">
                    <button type="button" onClick={() => setPaisAbierto(v => !v)} className={`${INPUT_CLS} !w-36 shrink-0 flex items-center justify-between`}>
                      <span>
                        {PAISES_TELEFONO.find(p => p[1] === prefijoAcompanante)?.[0]}
                        {prefijoAcompanante}
                      </span>
                      <span>⌄</span>
                    </button>
                    <input
                      value={telefonoAcompanante}
                      onChange={e => setTelefonoAcompanante(e.target.value.replace(/\D/g, '').slice(0, 8))}
                      placeholder="0000 0000"
                      className={`${INPUT_CLS} flex-1`} />
                    {paisAbierto && <div className="absolute left-0 top-full z-50 mt-1 w-80 max-w-[85vw] overflow-hidden rounded-lg border bg-white shadow-xl">
                      <div className="border-b p-2">
                        <input autoFocus value={busquedaPais} onChange={e => setBusquedaPais(e.target.value)} placeholder={ui("Buscar país o código")} className={INPUT_CLS} />
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {PAISES_TELEFONO.filter(p => `${p[2]} ${p[1]}`.toLowerCase().includes(busquedaPais.toLowerCase())).map(p => <button
                          type="button"
                          key={`${p[2]}-${p[1]}`}
                          onClick={() => {
                            setPrefijoAcompanante(p[1]);
                            setPaisAbierto(false);
                            setBusquedaPais('');
                          }}
                          className="flex w-full gap-3 px-3 py-2 text-left text-sm hover:bg-[#F8F6F0]">
                          <span>
                            {p[0]}
                          </span>
                          <b>
                            {p[1]}
                          </b>
                          <span>
                            {ui(p[2])}
                          </span>
                        </button>)}
                      </div>
                    </div>}
                  </div>
                </Campo>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setMostrarFormularioAcompanante(false);
                    setErroresAcompanante({});
                    setPaisAbierto(false);
                  }}
                  className="flex-1 rounded-lg border border-[#18345C] px-4 py-3 text-sm font-semibold text-[#18345C]">
                  {ui("Cancelar")}
                </button>
                <button type="button" onClick={agregarAcompanante} className="flex-1 rounded-lg bg-[#18345C] px-4 py-3 text-sm font-semibold text-white">
                  {ui("Agregar acompañante")}
                </button>
              </div>
            </section>
          </div>)}

          <div className="mt-5">
            <BotonPrimario
              ancho
              onClick={() => {
                if (adultos + ninos > habitacion.capacidad) {
                  setErrores(e => ({ ...e, ocupacion: `Máximo ${habitacion.capacidad} huéspedes.` }));
                  return;
                }
                if (acompanantes.length > Math.max(0, adultos + ninos - 1)) {
                  setErrores(e => ({ ...e, ocupacion: 'Hay más acompañantes registrados que personas indicadas en la reserva.' }));
                  return;
                }
                if (validarDatos()) {
                  onGuardarOcupantes({ adultos, ninos, acompanantes });
                  setPaso(2);
                }
              }}>
              <UiText text="                 Continuar               " />
            </BotonPrimario>
            {errores.ocupacion && <p className="mt-2 text-center text-xs text-[#991B1B]">
              {errores.ocupacion}
            </p>}
          </div>
        </Tarjeta>)}

        {paso === 2 && (<Tarjeta titulo="Documento de identidad">
          <p className="text-[14px] text-[#6B7280]">
            {ui("Sube una foto legible de tu documento y asegúrate de que todos los datos sean visibles.")}
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {(tipoDocumento === "DPI" ? [
              { lado: "frente" as const, doc: documentoFrente, titulo: "Frente del DPI" },
              { lado: "reverso" as const, doc: documentoReverso, titulo: "Reversa del DPI" },
            ] : [
              { lado: "unico" as const, doc: documentoUnico, titulo: "Pasaporte" },
            ]).map(({ lado, doc, titulo }) => (<div key={lado} className="rounded-xl border border-[#E5E0D8] bg-[#FCFBF8] p-4">
              <p className="text-sm font-semibold text-[#18345C]">
                {ui(titulo)}
              </p>
              <label className="mt-3 flex min-h-44 flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border-2 border-dashed border-[#E5E0D8] bg-white px-3 py-4 cursor-pointer text-center hover:border-[#18345C]">
                {doc?.previewUrl && doc.formato !== "PDF" ? <img src={doc.previewUrl} alt={ui(titulo)} className="h-36 w-full object-contain rounded-lg" /> : doc?.previewUrl && doc.formato === "PDF" ? <iframe src={doc.previewUrl} title={ui(titulo)} className="h-36 w-full rounded-lg border" /> : <><span className="text-[#18345C]">
                  <UploadIcon size={22} />
                </span><span className="text-[15px] font-medium text-[#18345C]">
                    {ui("Seleccionar archivo")}
                  </span><span className="text-[13px] text-[#AEBCC1]">
                    {ui("Seleccionar imagen o PDF")}
                  </span></>}
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                  className="hidden"
                  onChange={e => recibirArchivo(e.target.files, lado as "frente" | "reverso" | "unico")} />
              </label>
              {doc && <div className="mt-2 flex items-center gap-2">
                <CheckIcon size={16} />
                <span className="min-w-0 flex-1 truncate text-xs text-[#166534]">
                  {doc.nombre}
                </span>
                <button
                  type="button"
                  onClick={() => lado === "frente" ? setDocumentoFrente(null) : lado === "reverso" ? setDocumentoReverso(null) : setDocumentoUnico(null)}
                  className="text-xs font-semibold text-[#991B1B]">
                  {ui("Quitar")}
                </button>
              </div>}
            </div>))}
          </div>
          {errorArchivo && <div className="mt-3">
            <Aviso tono="error">
              <span className="flex items-start gap-2">
                <AlertIcon />
                {ui(errorArchivo)}
              </span>
            </Aviso>
          </div>}
          <div className="flex gap-2 mt-5">
            <BotonSecundario onClick={() => setPaso(1)} ancho>
              <UiText text="Volver" />
            </BotonSecundario>
            <BotonPrimario ancho disabled={tipoDocumento === "DPI" ? !documentoFrente || !documentoReverso : !documentoUnico} onClick={() => setPaso(3)}>
              <UiText text="Continuar" />
            </BotonPrimario>
          </div>
        </Tarjeta>)}

        {paso === 3 && (<Tarjeta titulo="Términos de la estancia">
          <ul className="space-y-2">
            {TERMINOS_ESTANCIA.map((t) => (<li key={t} className="flex items-start gap-2 text-[14px] text-[#6B7280]">
              <span className="text-[#D8B94E] mt-0.5 shrink-0">
                <UiText text="•" />
              </span>
              <span>
                {ui(t)}
              </span>
            </li>))}
          </ul>

          <label className="mt-4 flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={aceptado} onChange={(e) => setAceptado(e.target.checked)} className="mt-1 w-4 h-4 accent-[#18345C]" />

            <span className="text-[14px] text-[#1F2933]">
              <UiText text="He leído y acepto los términos y condiciones de la estancia." />
            </span>
          </label>

          <div className="flex gap-2 mt-5">
            <BotonSecundario onClick={() => setPaso(2)} ancho>
              <UiText text="Volver" />
            </BotonSecundario>
            <BotonPrimario ancho disabled={!aceptado} onClick={() => setPaso(4)}>
              <UiText text="                 Continuar               " />
            </BotonPrimario>
          </div>
        </Tarjeta>)}

        {paso === 4 && (<Tarjeta titulo="Revisa tu check-in">
          <div className="grid gap-3 sm:grid-cols-2">
            <ResumenDato label="Huésped" valor={nombre} />
            <ResumenDato label="Documento" valor={`${tipoDocumento} · ${documento}`} />
            <ResumenDato label="Contacto" valor={`${telefono} · ${correo}`} />
            <div className="rounded-lg border border-[#E5E0D8] bg-[#F8F6F0] p-4 sm:col-span-2">
              <p className="text-[11px] uppercase tracking-widest text-[#AEBCC1]">Documento cargado</p>
              {tipoDocumento === "DPI" ? (<div className="mt-3 grid gap-4 sm:grid-cols-2">
                {[
                  { doc: documentoFrente, titulo: "Frente del DPI" },
                  { doc: documentoReverso, titulo: "Reversa del DPI" },
                ].map(({ doc, titulo }) => doc && (<div key={titulo} className="rounded-lg border border-[#E5E0D8] bg-white p-3">
                  <p className="mb-2 text-xs font-semibold text-[#18345C]">
                    {ui(titulo as string)}
                  </p>
                  {doc.previewUrl && doc.formato !== "PDF" ? <img src={doc.previewUrl} alt={ui(titulo as string)} className="h-40 w-full rounded-md border border-[#E5E0D8] object-contain bg-[#FCFBF8]" /> : <iframe src={doc.previewUrl} title={ui(titulo as string)} className="h-40 w-full rounded-md border border-[#E5E0D8]" />}
                  <p className="mt-2 min-w-0 break-all text-xs font-semibold text-[#18345C]">
                    {doc.nombre}
                  </p>
                </div>))}
              </div>) : (<div className="mt-3 rounded-lg border border-[#E5E0D8] bg-white p-3">
                {documentoUnico?.previewUrl && documentoUnico.formato !== "PDF" ? <img src={documentoUnico.previewUrl} alt="Pasaporte" className="h-40 w-full rounded-md border border-[#E5E0D8] object-contain bg-[#FCFBF8]" /> : documentoUnico?.previewUrl ? <iframe src={documentoUnico.previewUrl} title="Pasaporte" className="h-40 w-full rounded-md border border-[#E5E0D8]" /> : null}
                <p className="mt-2 min-w-0 break-all text-xs font-semibold text-[#18345C]">
                  {documentoUnico?.nombre ?? "Pendiente"}
                </p>
              </div>)}
            </div>
          </div>
          <div className="mt-4">
            <Aviso tono="info">
              <UiText text="Recepción revisará la información antes de activar tu llave digital." />
            </Aviso>
          </div>
          <div className="flex gap-2 mt-5">
            <BotonSecundario onClick={() => setPaso(3)} ancho>Volver</BotonSecundario>
            <BotonPrimario ancho onClick={finalizar}>Enviar check-in para revisión</BotonPrimario>
          </div>
        </Tarjeta>)}
      </div>
      <aside className="checkin-booking">
        <Tarjeta titulo="Tu reserva">
          <img src={fotoHabitacion(habitacion.tipo)} alt={ui("Habitación reservada")} className="checkin-booking-photo" />
          <h3 className="mt-3 text-lg font-semibold text-[#18345C]">
            {ui("Habitación")}
            {habitacion.numero}
          </h3>
          <p className="text-sm text-[#71839B]">
            {ui(habitacion.tipo)}
          </p>
          <div className="checkin-booking-grid">
            <span>
              <b>
                <UiText text="Entrada" />
              </b>
              {fechaUI(reserva.fechaEntrada)}
            </span>
            <span>
              <b>
                <UiText text="Salida" />
              </b>
              {fechaUI(reserva.fechaSalida)}
            </span>
            <span>
              <b>
                <UiText text="Noches" />
              </b>
              {nochesEntre(reserva.fechaEntrada, reserva.fechaSalida)}
            </span>
            <span>
              <b>
                <UiText text="Huéspedes" />
              </b>
              {reserva.personas}
            </span>
          </div>
          <div className="checkin-booking-code">
            <small>
              <UiText text="Reserva" />
            </small>
            <strong>
              {reserva.codigo}
            </strong>
          </div>
        </Tarjeta>
      </aside>
    </div>
  </div>);
}
function fotoHabitacion(tipo: string) {
  if (tipo === "Superior")
    return FOTO_SUPERIOR;
  if (tipo === "Deluxe")
    return FOTO_DELUXE;
  if (tipo === "Suite")
    return FOTO_SUITE;
  return FOTO_STANDARD;
}
function ResumenDato({ label, valor }: {
  label: string;
  valor: string;
}) {
  const ui = useUiText();
  return <div className="rounded-lg border border-[#E5E0D8] bg-[#F8F6F0] p-4">
    <p className="text-[11px] uppercase tracking-widest text-[#AEBCC1]">
      {ui(label)}
    </p>
    <p className="mt-1 text-[14px] font-semibold text-[#18345C] break-words">
      {valor}
    </p>
  </div>;
}
