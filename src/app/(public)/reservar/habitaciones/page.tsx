"use client";
import { UiText, useUiText } from "@/i18n/UiText";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BedDouble, Users, Wifi } from "lucide-react";
import VillaSerenaLogo from "@/components/common/VillaSerenaLogo";
import { usePublicLanguage } from "@/components/common/PublicLanguageToggle";
import GuestSelector from "@/components/common/GuestSelector";
import { money } from "@/data/publicRooms";
import { usePublicCatalog, usePublicQuotes } from "@/lib/usePublicCatalog";
import { publicSearchError } from "@/lib/publicStayValidation";
import { availableRoom, usePublicAvailability, validGuests } from "@/lib/publicAvailability";
export default function Habitaciones() {
  const { rooms: publicRooms, error: catalogError } = usePublicCatalog();
  const ui = useUiText();
  const { en } = usePublicLanguage();
  const router = useRouter(), sp = useSearchParams();
  const llegada = sp.get("llegada") || "", salida = sp.get("salida") || "";
  const initialTotal = Number(sp.get("huespedes") || 2), initialAdults = Number(sp.get("adultos") || Math.max(1, initialTotal)), initialChildren = Number(sp.get("ninos") || 0);
  const [adults, setAdults] = useState(initialAdults),
    [children, setChildren] = useState(initialChildren),
    [type, setType] = useState("Todas"),
    [floor, setFloor] = useState("Todos"),
    [min, setMin] = useState(""),
    [max, setMax] = useState("");
  const [applied, setApplied] = useState({ adults: initialAdults, children: initialChildren, type: "Todas", floor: "Todos", min: "", max: "" });
  const total = applied.adults + applied.children;
  const capacity = Math.max(0, ...publicRooms.map(room => room.capacity));
  const [validationError, setValidationError] = useState("");
  const quoteResult = usePublicQuotes(llegada, salida, applied.adults, applied.children, capacity);
  const inventory = usePublicAvailability({ arrival: llegada, departure: salida, adults: applied.adults, children: applied.children }, capacity);
  const rooms = useMemo(() => {
    if (!validGuests(applied.adults, applied.children))
      return [];
    return publicRooms.flatMap(room => {
      const physical = availableRoom(room, llegada, salida, total, inventory);
      const quote = quoteResult.quotes.find(q => q.tipoHabitacion.id === room.apiTypeId);
      if (!physical || !quote || (applied.type !== "Todas" && room.type !== applied.type) ||
        (applied.floor !== "Todos" && room.floor !== Number(applied.floor)) ||
        (applied.min && room.price < Number(applied.min)) ||
        (applied.max && room.price > Number(applied.max)))
        return [];
      return [{ ...room, capacity: Math.min(room.capacity, physical.capacidad), physicalId: physical.id, total: quote.total, nights: quote.noches }];
    });
  },
    [publicRooms, llegada, salida, total, applied, inventory, quoteResult.quotes]);
  const detailHref = (slug: string,
    physicalId: string) => `/habitaciones/${slug}?${new URLSearchParams({
      origen: "disponibilidad",
      llegada,
      salida,
      adultos: String(applied.adults),
      ninos: String(applied.children),
      huespedes: String(total),
      habitacionId: physicalId
    })}`;
  return (<main className="reserve-public">
    <header className="reserve-nav">
      <button className="icon-back" onClick={() => router.back()} aria-label={ui("Volver")} title={ui("Volver")}>
        <ArrowLeft size={20} />
      </button>
      <VillaSerenaLogo />
    </header>
    <section className="reserve-heading">
      <span>
        {en ? "BOOK YOUR STAY" : "RESERVA TU ESTANCIA"}
      </span>
      <h1>
        {en ? "Available rooms" : "Habitaciones disponibles"}
      </h1>
      <p>
        {llegada || (en ? "Arrival date" : "Fecha de llegada")}
        <UiText text=" → " />
        {salida || (en ? "Departure date" : "Fecha de salida")}
        <UiText text=" · " />
        {applied.adults}
        {en
          ? ` adult${applied.adults === 1 ? "" : "s"}`
          : ` adulto${applied.adults === 1 ? "" : "s"}`}
        {applied.children
          ? en
            ? ` · ${applied.children} child${applied.children === 1 ? "" : "ren"}`
            : ` · ${applied.children} niño${applied.children === 1 ? "" : "s"}`
          : ""}
      </p>
    </section>
    <form
      className="reserve-filters reserve-filters-complete"
      onSubmit={(event) => {
        event.preventDefault();
        const reason = publicSearchError(llegada, salida, adults, children, capacity);
        setValidationError(reason || "");
        if (reason) return;
        setApplied({ adults, children, type, floor, min, max });
      }}>
      <label>
        {en ? "Category" : "Categoría"}
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="Todas">
            {en ? "All" : "Todas"}
          </option>
          <option value="Estándar">
            {ui("Estándar")}
          </option>
          <option value="Deluxe">Deluxe</option>
          <option value="Superior">Superior</option>
          <option value="Suite">Suite</option>
          <option value="Familiar">
            {ui("Familiar")}
          </option>
          <option value="Premium">Premium</option>
        </select>
      </label>
      <label>
        {en ? "Guests" : "Huéspedes"}
        <GuestSelector adults={adults} children={children} onAdults={setAdults} onChildren={setChildren} max={5} />
      </label>
      <label>
        {en ? "Floor" : "Piso"}
        <select value={floor} onChange={(e) => setFloor(e.target.value)}>
          <option value="Todos">
            {en ? "All" : "Todos"}
          </option>
          <option value="1">
            {en ? "Floor 1" : "Piso 1"}
          </option>
          <option value="2">
            {en ? "Floor 2" : "Piso 2"}
          </option>
          <option value="3">
            {en ? "Floor 3" : "Piso 3"}
          </option>
        </select>
      </label>
      <div className="price-range">
        <strong>
          {en ? "Price range" : "Rango de precio"}
        </strong>
        <div>
          <label>
            {en ? "Minimum" : "Mínimo"}
            <input type="number" min="0" value={min} onChange={(e) => setMin(e.target.value)} placeholder="Q 0" />
          </label>
          <label>
            {en ? "Maximum" : "Máximo"}
            <input type="number" min="0" value={max} onChange={(e) => setMax(e.target.value)} placeholder={en ? "No limit" : "Sin límite"} />
          </label>
        </div>
      </div>
      <button className="filter-apply" type="submit">
        {en ? "Apply" : "Aplicar"}
      </button>
      <span className="result-count" aria-live="polite">
        {rooms.length}
        {en ? "options" : "opciones"}
      </span>
    </form>
    {(validationError || quoteResult.error || catalogError) && <p role="alert">{validationError || quoteResult.error || catalogError}</p>}
    <div className="reserve-room-grid">
      {rooms.map((room) => (<article className="reserve-room" key={room.slug}>
        <Link href={detailHref(room.slug, room.physicalId)}>
          <img src={room.image} alt={ui(room.name)} />
        </Link>
        <div className="reserve-room-body">
          <span className="available-chip">
            {en ? "AVAILABLE" : "DISPONIBLE"}
          </span>
          <Link className="room-title-link" href={detailHref(room.slug, room.physicalId)}>
            <h2>
              {ui(room.name)}
            </h2>
          </Link>
          <p>
            <Users size={14} />
            {en ? "Maximum" : "Máximo"}
            {room.capacity}
            {" "}
            {en ? "guests" : "huéspedes"}
          </p>
          <p>
            <BedDouble size={14} />
            {ui(room.beds)}
          </p>
          <p>
            <Wifi size={14} />
            {en ? "Wi-Fi included" : "Wi-Fi incluido"}
          </p>
          <footer>
            <b>
              {money(room.total)}
              <small>
                {en ? ` / ${room.nights} night(s)` : ` / ${room.nights} noche(s)`}
              </small>
            </b>
            <Link className="reserve-view-room" href={detailHref(room.slug, room.physicalId)}>
              {en ? "View room" : "Ver habitación"}
            </Link>
          </footer>
        </div>
      </article>))}
    </div>
    {!inventory && <p role="status">
      {en ? "Loading availability..." : "Cargando disponibilidad..."}
    </p>}
    {inventory?.error && <p role="alert">{en ? "Availability could not be checked. Try again." : "No se pudo consultar la disponibilidad. Intenta nuevamente."}</p>}
    {inventory && !inventory.error && rooms.length === 0 && (<div className="catalog-empty">
      {en
        ? "No rooms are available for these dates and filters. Change your search criteria."
        : "No hay habitaciones disponibles para estas fechas y filtros. Cambia los criterios de búsqueda."}
    </div>)}
  </main>);
}
