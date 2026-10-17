import { leerReservas } from "@/store/reservationStore";
import { usePublicLanguage } from "@/components/common/PublicLanguageToggle";
import { useMemo, useState } from "react";
import type { Reserva, ReservaAmenidad, TurnoAmenidad, } from "@/lib/pms/types";
import { Cabecera } from "@/features/huesped/pages/huespedUtils";
import { useUiText } from "@/i18n/UiText";
type Categoria = "Todos" | "Restaurante" | "Spa" | "Piscina" | "Experiencias" | "Transporte";
type Opcion = {
  id: string;
  categoria: Exclude<Categoria, "Todos">;
  nombre: string;
  descripcion: string;
  duracion?: string;
  personas?: string;
  precio: string;
  area?: "Spa" | "Restaurante Mirador" | "Piscina";
};
const CATS: Categoria[] = [
  "Todos",
  "Restaurante",
  "Spa",
  "Piscina",
  "Experiencias",
  "Transporte",
];
const FOTO_BANNER = "https://images.unsplash.com/photo-1595236629937-aadaf7c1d99d?auto=format&fit=crop&fm=jpg&q=88&w=1800";
const PRESENTACION: Record<Categoria, {
  foto: string;
  frase: string;
}> = {
  Todos: {
    foto: FOTO_BANNER,
    frase: "Haz de tu estancia una experiencia a tu medida.",
  },
  Restaurante: {
    foto: FOTO_BANNER,
    frase: "Reserva tu mesa y disfruta momentos especiales alrededor de buena comida.",
  },
  Spa: {
    foto: FOTO_BANNER,
    frase: "Regálate un momento de descanso, bienestar y relajación.",
  },
  Piscina: {
    foto: FOTO_BANNER,
    frase: "Disfruta el agua, el descanso y tu propio espacio junto a la piscina.",
  },
  Experiencias: {
    foto: FOTO_BANNER,
    frase: "Descubre detalles y experiencias creadas para recordar Villa Serena.",
  },
  Transporte: {
    foto: FOTO_BANNER,
    frase: "Muévete con comodidad con traslados coordinados durante tu estancia.",
  },
};
const OPCIONES: Opcion[] = [
  {
    id: "mesa",
    categoria: "Restaurante",
    nombre: "Reserva de Mesa",
    descripcion: "Reserva una mesa en el restaurante de Villa Serena durante tu estancia.",
    precio: "Sin costo",
    area: "Restaurante Mirador",
  },
  {
    id: "cena-romantica",
    categoria: "Restaurante",
    nombre: "Cena Romántica",
    descripcion: "Mesa privada decorada, arreglo floral, entrada para compartir, dos platos fuertes a elección, postre especial para compartir, dos bebidas sin alcohol, detalle de cortesía de Villa Serena y fotografía de recuerdo.",
    personas: "Para 2 personas · Q650 por pareja",
    precio: "Q650",
    area: "Restaurante Mirador",
  },
  {
    id: "spa-relajante",
    categoria: "Spa",
    nombre: "Masaje Relajante",
    descripcion: "Masaje corporal enfocado en liberar tensión y proporcionar descanso.",
    duracion: "60 min",
    precio: "Q425",
    area: "Spa",
  },
  {
    id: "spa-espalda",
    categoria: "Spa",
    nombre: "Masaje de Espalda y Cuello",
    descripcion: "Sesión localizada en espalda, hombros y cuello.",
    duracion: "30 min",
    precio: "Q250",
    area: "Spa",
  },
  {
    id: "spa-piedras",
    categoria: "Spa",
    nombre: "Masaje con Piedras Calientes",
    descripcion: "Masaje corporal acompañado de piedras calientes.",
    duracion: "60 min",
    precio: "Q475",
    area: "Spa",
  },
  {
    id: "spa-reflex",
    categoria: "Spa",
    nombre: "Reflexología",
    descripcion: "Sesión enfocada en puntos específicos de los pies.",
    duracion: "30 min",
    precio: "Q225",
    area: "Spa",
  },
  {
    id: "spa-facial",
    categoria: "Spa",
    nombre: "Facial Relajante",
    descripcion: "Sesión facial de limpieza, hidratación y cuidado de la piel.",
    duracion: "45 min",
    precio: "Q325",
    area: "Spa",
  },
  {
    id: "spa-exfol",
    categoria: "Spa",
    nombre: "Exfoliación Corporal",
    descripcion: "Tratamiento corporal de exfoliación y cuidado.",
    duracion: "45 min",
    precio: "Q350",
    area: "Spa",
  },
  {
    id: "spa-dos",
    categoria: "Spa",
    nombre: "Masaje para Dos",
    descripcion: "Experiencia de masaje para dos personas durante la misma sesión.",
    duracion: "60 min",
    personas: "2 personas",
    precio: "Q800",
    area: "Spa",
  },
  {
    id: "spa-exp",
    categoria: "Spa",
    nombre: "Experiencia de Relajación",
    descripcion: "Sesión prolongada que combina diferentes técnicas de relajación.",
    duracion: "90 min",
    precio: "Q550",
    area: "Spa",
  },
  {
    id: "piscina-area",
    categoria: "Piscina",
    nombre: "Reserva de Área de Piscina",
    descripcion: "Reserva un espacio con acceso a piscina, toalla y área de descanso.",
    precio: "Incluido",
    area: "Piscina",
  },
  {
    id: "camastro",
    categoria: "Piscina",
    nombre: "Camastro",
    descripcion: "Reserva un camastro individual dentro del área de piscina.",
    precio: "Incluido",
    area: "Piscina",
  },
  {
    id: "privada",
    categoria: "Piscina",
    nombre: "Área Privada de Piscina",
    descripcion: "Área reservada con toallas, agua y servicio a la zona.",
    duracion: "2 horas",
    personas: "Hasta 4 personas",
    precio: "Q250",
    area: "Piscina",
  },
  {
    id: "desayuno-especial",
    categoria: "Experiencias",
    nombre: "Desayuno Especial",
    descripcion: "Desayuno para dos con café o jugo, frutas y detalle de mesa.",
    personas: "2 personas",
    precio: "Q275",
  },
  {
    id: "picnic",
    categoria: "Experiencias",
    nombre: "Picnic Villa Serena",
    descripcion: "Canasta de alimentos, bebidas sin alcohol, frutas, postre y preparación del espacio.",
    precio: "Desde Q350",
  },
  {
    id: "cafe",
    categoria: "Experiencias",
    nombre: "Tarde de Café Guatemalteco",
    descripcion: "Selección de café guatemalteco, degustación y pequeños postres.",
    duracion: "60 min",
    precio: "Desde Q125",
  },
  {
    id: "te",
    categoria: "Experiencias",
    nombre: "Té de la Tarde",
    descripcion: "Té o infusión con mini sándwiches, repostería y frutas.",
    duracion: "60 min",
    precio: "Desde Q150",
  },
  {
    id: "gastro",
    categoria: "Experiencias",
    nombre: "Experiencia Gastronómica Guatemalteca",
    descripcion: "Entrada, plato guatemalteco, postre y bebida tradicional.",
    precio: "Desde Q225",
  },
  {
    id: "cena-privada",
    categoria: "Experiencias",
    nombre: "Cena Privada Villa Serena",
    descripcion: "Cena en espacio reservado con entrada, plato fuerte, postre y decoración.",
    precio: "Desde Q750",
  },
  {
    id: "aeropuerto",
    categoria: "Transporte",
    nombre: "Traslado al Aeropuerto",
    descripcion: "Transporte coordinado desde Villa Serena hacia el aeropuerto.",
    precio: "Tarifa del hotel",
  },
  {
    id: "recogida",
    categoria: "Transporte",
    nombre: "Recogida en el Aeropuerto",
    descripcion: "Servicio coordinado para recoger al huésped y trasladarlo a Villa Serena.",
    precio: "Tarifa del hotel",
  },
];
export function puedeCrearExperiencia(reservaId: string, huespedId: string) {
  return leerReservas().some(r => r.id === reservaId && r.huespedId === huespedId && r.estado === "en-curso");
}
export function crearExperienciaLocal(id: string, reservaId: string, huespedId: string,
  opcion: Pick<Opcion, "nombre" | "precio">, fecha: string, hora: string, personas: number) {
  return {
    id, reservaId, huespedId, nombre: opcion.nombre,
    fecha: fecha || "Por coordinar", hora: hora || "Por coordinar",
    personas, precio: opcion.precio, estado: "Pendiente",
  };
}
export default function ReservasExperiencias({ reserva, huespedId, turnos, reservas, onReservar, onCancelar, onCargoConfirmado, }: {
  reserva: Reserva;
  huespedId: string;
  turnos: TurnoAmenidad[];
  reservas: ReservaAmenidad[];
  onReservar: (id: string, personas: number, detalle?: string) => void;
  onCancelar: (id: string) => void;
  onCargoConfirmado?: (id: string, nombre: string, monto: number) => void;
}) {
  const ui = useUiText();
  const { en } = usePublicLanguage();
  const disponible = reserva.estado === "en-curso" && puedeCrearExperiencia(reserva.id, huespedId);
  const [rechazada, setRechazada] = useState(false);
  const [cat, setCat] = useState<Categoria>("Todos");
  const [activo, setActivo] = useState<Opcion | null>(null);
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [personas, setPersonas] = useState(1);
  const [nota, setNota] = useState("");
  const [mis, setMis] = useState(!disponible);
  const [locales, setLocales] = useState<ReturnType<typeof crearExperienciaLocal>[]>([]);
  const lista = OPCIONES.filter((x) => cat === "Todos" || x.categoria === cat);
  const turnosArea = useMemo(() => activo?.area
    ? turnos.filter((t) => t.area === activo.area)
    : [], [turnos, activo]);
  const horas = turnosArea
    .filter((t) => !fecha || t.fecha === fecha)
    .filter((t) => t.aforo - t.ocupados > 0);
  function abrir(o: Opcion) {
    if (!puedeCrearExperiencia(reserva.id, huespedId)) { setRechazada(true); return; }
    setRechazada(false);
    setActivo(o);
    setFecha("");
    setHora("");
    setPersonas(o.id === "spa-dos" ||
      o.id === "cena-romantica"
      ? 2
      : 1);
    setNota("");
  }
  function confirmar() {
    if (!puedeCrearExperiencia(reserva.id, huespedId)) { setActivo(null); setRechazada(true); return; }
    if (!activo)
      return;
    const id = `exp-${Date.now()}`;
    const turno = horas.find((t) => t.id === hora);
    if (turno) {
      onReservar(turno.id, personas, activo.nombre +
        (nota ? ` · ${nota}` : ""));
    }
    else {
      setLocales((v) => [
        crearExperienciaLocal(id, reserva.id, huespedId, activo, fecha, hora, personas),
        ...v,
      ]);
    }
    const monto = /^Q\s?(\d+(?:\.\d+)?)$/.exec(activo.precio);
    if (monto &&
      Number(monto[1]) > 0) {
      onCargoConfirmado?.(`experiencia-${id}`, activo.nombre, Number(monto[1]));
    }
    setActivo(null);
    setMis(true);
  }
  return (<div className="flex-1 overflow-y-auto bg-[#F8F6F0]">

    <Cabecera titulo="Reservas y experiencias" subtitulo="Agenda restaurante, spa, piscina, experiencias y transporte durante tu estancia." />

    <div className="space-y-5 p-4 sm:p-6">
      {(!disponible || rechazada) && <div role="status" className="rounded-xl border border-[#D8B94E] bg-[#FFF9E5] p-4 text-[#18345C]">
        <p className="font-semibold">{reserva.estado === "finalizada" ? (en ? "Your stay has ended" : "Tu estancia ha finalizado") : reserva.estado === "cancelada" ? (en ? "Your reservation is cancelled" : "Tu reserva está cancelada") : (en ? "Bookings require an active stay" : "Las reservas requieren una estancia activa")}</p>
        <p className="mt-1 text-sm">{reserva.codigo} · {en ? "You can view your booking history. New bookings are unavailable for this stay." : "Puedes consultar Mis reservas y el historial. No se pueden crear nuevas reservas para esta estancia."}</p>
      </div>}

      <section className="relative min-h-[190px] overflow-hidden rounded-xl border border-[#E5E0D8] bg-[#18345C] shadow-sm">

        <img src={PRESENTACION[cat].foto} alt={ui(cat)} className="absolute inset-0 h-full w-full object-cover" />

        <div className="absolute inset-0 bg-gradient-to-r from-[#102747]/95 via-[#102747]/55 to-[#102747]/10" />

        <div className="relative z-10 flex min-h-[190px] flex-col justify-center p-6 text-white sm:p-8">

          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#F1D57A]">
            {ui("Reservas y experiencias")}
          </p>

          <h2 className="mt-2 text-3xl font-semibold">
            {ui(cat === "Todos"
              ? "Elige una experiencia"
              : cat)}
          </h2>

          <p className="mt-2 max-w-2xl text-base text-white/95">
            {ui(PRESENTACION[cat].frase)}
          </p>

          {cat === "Restaurante" && (<div className="mt-5 grid max-w-4xl grid-cols-1 gap-3 text-xs sm:grid-cols-3">

            <Horario titulo="Desayuno" lv="6:30–10:30 a. m." sd="7:00–11:00 a. m." />

            <Horario titulo="Almuerzo" lv="12:00–3:00 p. m." sd="12:00–4:00 p. m." />

            <Horario titulo="Cena" lv="6:00–10:00 p. m." sd="6:00–10:00 p. m." />

          </div>)}

        </div>
      </section>

      <button
        onClick={() => setMis(!mis)}
        className="w-full rounded-xl border border-[#D8B94E] bg-white px-5 py-3 text-left font-semibold text-[#18345C] shadow-sm sm:w-auto">
        {ui("Mis reservas")}

        <span className="ml-2 rounded-full bg-[#FFF7DD] px-2 py-1 text-xs">
          {reservas.length + locales.length}
        </span>
      </button>

      {mis && (<section className="rounded-xl border border-[#E5E0D8] bg-white p-4">

        <h2 className="text-lg font-semibold text-[#18345C]">
          {ui("Mis reservas")}
        </h2>

        <div className="mt-3 space-y-3">

          {reservas.length +
            locales.length ===
            0 && (<p className="text-sm text-[#71839B]">
              {ui("Todavía no tienes reservas.")}
            </p>)}

          {locales.map((r) => (<div key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#E9E5DC] p-3">
            <div>
              <b className="text-[#18345C]">
                {ui(r.nombre)}
              </b>

              <p className="text-sm text-[#71839B]">
                {r.fecha} · {r.hora} ·{" "}
                {r.personas} persona(s)
              </p>
            </div>

            <span className="rounded-full bg-[#FFF7DD] px-3 py-1 text-xs font-semibold text-[#8A6200]">
              {ui(r.estado)}
            </span>
          </div>))}

          {reservas.map((r) => (<div key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#E9E5DC] p-3">
            <div>
              <b className="text-[#18345C]">
                {ui(r.detalle || r.area)}
              </b>

              <p className="text-sm text-[#71839B]">
                {r.fecha} · {r.hora} ·{" "}
                {r.personas} persona(s)
              </p>
            </div>

            <div className="flex items-center gap-2">

              <span className="rounded-full bg-[#F0FAF4] px-3 py-1 text-xs font-semibold text-[#166534]">
                {ui("Confirmada")}
              </span>

              <button disabled={!disponible} onClick={() => { if (puedeCrearExperiencia(reserva.id, huespedId)) onCancelar(r.id); }} className="text-xs font-semibold text-[#A33A3A]">
                {ui("Cancelar")}
              </button>

            </div>
          </div>))}

        </div>
      </section>)}

      <div className="flex flex-wrap gap-2">

        {CATS.map((c) => (<button
          key={c}
          onClick={() => setCat(c)}
          className={`rounded-full border px-4 py-2 text-sm font-semibold ${cat === c
            ? "border-[#18345C] bg-[#18345C] text-white"
            : "border-[#D7DCE2] bg-white text-[#18345C]"}`}>
          {ui(c)}
        </button>))}

      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">

        {lista.map((o) => (<article key={o.id} className="flex flex-col rounded-xl border border-[#E5E0D8] bg-white p-4 shadow-sm">

          <span className="text-xs font-semibold uppercase tracking-wide text-[#9A7A22]">
            {ui(o.categoria)}
          </span>

          <h3 className="mt-2 text-xl font-semibold text-[#18345C]">
            {ui(o.nombre)}
          </h3>

          <p className="mt-1.5 text-sm leading-5 text-[#66758A]">
            {ui(o.descripcion)}
          </p>

          <div className="mt-3 flex flex-wrap gap-2 text-xs text-[#52677F]">

            {o.duracion && (<span className="rounded-full bg-[#F8F6F0] px-2 py-1">
              {o.duracion}
            </span>)}

            {o.personas && (<span className="rounded-full bg-[#F8F6F0] px-2 py-1">
              {ui(o.personas)}
            </span>)}

          </div>

          <div className="mt-auto flex items-center justify-between gap-3 pt-4">

            <b className="text-[#18345C]">
              {ui(o.precio)}
            </b>

            <button disabled={!disponible} onClick={() => abrir(o)} className="rounded-lg bg-[#18345C] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
              {ui(o.categoria ===
                "Transporte"
                ? "Reservar traslado"
                : "Reservar")}
            </button>

          </div>

        </article>))}

      </div>

    </div>

    {activo && disponible && (<div
      className="fixed inset-0 z-[80] grid place-items-center bg-[#071D34]/55 p-4"
      onMouseDown={(e) => e.target === e.currentTarget &&
        setActivo(null)}>

      <section className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl">

        <div className="flex justify-between gap-3">

          <div>

            <p className="text-xs font-semibold uppercase tracking-wide text-[#9A7A22]">
              {ui(activo.categoria)}
            </p>

            <h2 className="text-2xl font-semibold text-[#18345C]">
              {ui(activo.nombre)}
            </h2>

          </div>

          <button onClick={() => setActivo(null)} className="text-2xl text-[#71839B]">
            ×
          </button>

        </div>

        <p className="mt-2 text-sm text-[#66758A]">
          {ui(activo.id ===
            "cena-romantica"
            ? "Una experiencia especial para dos."
            : activo.descripcion)}
        </p>

        {activo.id ===
          "cena-romantica" && (<div className="mt-4 rounded-xl bg-[#F8F6F0] p-4 text-sm text-[#354A63]">

            <b className="text-[#18345C]">
              {ui("Incluye")}
            </b>

            <ul className="mt-2 grid gap-1">
              <li>✓ Mesa privada decorada</li>
              <li>✓ Arreglo floral</li>
              <li>✓ Entrada para compartir</li>
              <li>✓ 2 platos fuertes a elección</li>
              <li>✓ Postre para compartir</li>
              <li>✓ 2 bebidas sin alcohol</li>
              <li>✓ Detalle de cortesía</li>
              <li>✓ Fotografía de recuerdo</li>
            </ul>

            <p className="mt-3 font-semibold text-[#18345C]">
              Para 2 personas · Total: Q650
            </p>

          </div>)}

        <div className="mt-5 grid gap-4 sm:grid-cols-2">

          <label className="text-sm font-semibold text-[#18345C]">
            {ui("Fecha")}

            <input
              type="date"
              min={new Date()
                .toISOString()
                .slice(0, 10)}
              value={fecha}
              onChange={(e) => {
                setFecha(e.target.value);
                setHora("");
              }}
              className="mt-1 w-full rounded-lg border border-[#D7DCE2] p-3 font-normal" />
          </label>

          {activo.area &&
            horas.length > 0 ? (<label className="text-sm font-semibold text-[#18345C]">

              {ui("Horario disponible")}

              <select value={hora} onChange={(e) => setHora(e.target.value)} className="mt-1 w-full rounded-lg border border-[#D7DCE2] p-3 font-normal">

                <option value="">
                  {ui("Seleccionar horario")}
                </option>

                {horas.map((t) => (<option key={t.id} value={t.id}>
                  {t.hora} ·{" "}
                  {t.aforo -
                    t.ocupados}{" "}
                  cupos
                </option>))}

              </select>

            </label>) : (<label className="text-sm font-semibold text-[#18345C]">

              {ui("Horario")}

              <input type="time" value={hora} onChange={(e) => setHora(e.target.value)} className="mt-1 w-full rounded-lg border border-[#D7DCE2] p-3 font-normal" />

            </label>)}

          <label className="text-sm font-semibold text-[#18345C]">

            {ui("Personas")}

            <input
              type="number"
              min="1"
              max="6"
              value={personas}
              onChange={(e) => setPersonas(Math.max(1, Number(e.target.value) || 1))}
              className="mt-1 w-full rounded-lg border border-[#D7DCE2] p-3 font-normal" />

          </label>

          <label className="text-sm font-semibold text-[#18345C] sm:col-span-2">

            {ui("Indicaciones adicionales")}

            <textarea
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              placeholder={ui("Escribe alguna indicación...")}
              className="mt-1 min-h-20 w-full rounded-lg border border-[#D7DCE2] p-3 font-normal" />

          </label>

        </div>

        <div className="mt-5 flex items-center justify-between border-t pt-4">

          <b className="text-[#18345C]">
            {ui(activo.precio)}
          </b>

          <button disabled={!disponible} onClick={confirmar} className="rounded-lg bg-[#18345C] px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
            {ui("Confirmar reserva")}
          </button>

        </div>

      </section>

    </div>)}

  </div>);
}
function Horario({ titulo, lv, sd, }: {
  titulo: string;
  lv: string;
  sd: string;
}) {
  return (<div className="rounded-xl border border-[#E5E0D8] bg-white px-4 py-3 shadow-sm">

    <b className="block text-[#B38719]">
      {titulo}
    </b>

    <span className="mt-1 block text-[#18345C]">
      <strong>Lunes a viernes:</strong>
      {" "}
      {lv}
    </span>

    <span className="mt-1 block text-[#18345C]">
      <strong>Sábado y domingo:</strong>
      {" "}
      {sd}
    </span>

  </div>);
}
