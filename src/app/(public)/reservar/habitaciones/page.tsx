"use client";
import { UiText, useUiText } from "@/i18n/UiText";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BedDouble, Users, Wifi } from "lucide-react";
import VillaSerenaLogo from "@/components/common/VillaSerenaLogo";
import { usePublicLanguage } from "@/components/common/PublicLanguageToggle";

import { money } from "@/data/publicRooms";
import { usePublicCatalog, usePublicQuotes } from "@/lib/usePublicCatalog";
import { publicSearchError } from "@/lib/publicStayValidation";
import { availableRoom, usePublicAvailability, validGuests } from "@/lib/publicAvailability";
export default function Habitaciones() {
  const { rooms: publicRooms, connected, error: catalogError } = usePublicCatalog();
  const ui = useUiText();
  const { en } = usePublicLanguage();
  const router = useRouter(), sp = useSearchParams();
  const llegada = sp.get("llegada") || "", salida = sp.get("salida") || "";
  const initialTotal = Number(sp.get("huespedes") || 2), initialChildren = Number(sp.get("ninos") || 0), initialAdults = Number(sp.get("adultos") || Math.max(1, initialTotal - initialChildren));
  const adults=initialAdults, children=initialChildren;
  const [type, setType] = useState("Todas"),
    [min, setMin] = useState(""),
    [max, setMax] = useState("");
  const [applied, setApplied] = useState({ type: "Todas", min: "", max: "" });
  const total = adults + children;
  const capacity = Math.max(0, ...publicRooms.map(room => room.capacity));
  const [validationError, setValidationError] = useState("");
  const quoteResult = usePublicQuotes(llegada, salida, adults, children, capacity);
  const inventory = usePublicAvailability({ arrival: llegada, departure: salida, adults: adults, children: children }, capacity, !connected);
  const rooms = useMemo(() => {
    if (!validGuests(adults, children) || publicSearchError(llegada, salida, adults, children, capacity))
      return [];
    return publicRooms.flatMap(room => {
      const physical = availableRoom(room, llegada, salida, total, inventory);
      const quote = quoteResult.quotes.find(q => q.ofertaSlug === room.slug);
      if ((!connected && (!physical || !quote)) || (connected && llegada && salida && !quote) || (applied.type !== "Todas" && (room.type) !== applied.type) ||
        (applied.min && room.price < Number(applied.min)) ||
        (applied.max && room.price > Number(applied.max)))
        return [];
      return [{ ...room, capacity: physical ? Math.min(room.capacity, physical.capacidad) : room.capacity, physicalId: physical?.id ?? '', total: quote?.total ?? room.price, nights: quote?.noches ?? 1 }];
    });
  },
    [publicRooms, connected, llegada, salida, total, applied, inventory, quoteResult.quotes]);
  const detailHref = (slug: string,
    physicalId: string) => `/habitaciones/${slug}?${new URLSearchParams({
      origen: "disponibilidad",
      llegada,
      salida,
      adultos: String(adults),
      ninos: String(children),
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
        {adults}
        {en
          ? ` adult${adults === 1 ? "" : "s"}`
          : ` adulto${adults === 1 ? "" : "s"}`}
        {children
          ? en
            ? ` · ${children} child${children === 1 ? "" : "ren"}`
            : ` · ${children} niño${children === 1 ? "" : "s"}`
          : ""}
      </p>
    </section>
    <form
      className="reserve-filters reserve-filters-complete public-without-floor availability-fixed-guests"
      onSubmit={(event) => {
        event.preventDefault();
        const reason = publicSearchError(llegada, salida, adults, children, capacity);
        setValidationError(reason || "");
        if (reason) return;
        setApplied({ type, min, max });
      }}>
      <label>
        {en ? "Category" : "Categoría"}
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="Todas">
            {en ? "All" : "Todas"}
          </option>
          {Array.from(new Set(publicRooms.map(room=>room.type))).map(category=><option key={category} value={category}>{ui(category)}</option>)}
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
        {" "}{en ? (rooms.length === 1 ? "option" : "options") : (rooms.length === 1 ? "opción" : "opciones")}
      </span>
    </form>
    {(!llegada || !salida) && <p><Link href="/#buscar">{en ? "Select dates and guests on Home" : "Selecciona fechas y huéspedes en Inicio"}</Link></p>}
    {(validationError || (llegada && salida && quoteResult.error) || catalogError) && <p role="alert">{validationError || catalogError || quoteResult.error}</p>}
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
          {room.beds && <p><BedDouble size={14} />{ui(room.beds)}</p>}
          {connected && <small>{room.inventoryNote}</small>}
          {room.illustrativePhotos && <small>{en ? 'Illustrative images' : 'Imágenes ilustrativas'}</small>}
          {!connected && <p>
            <Wifi size={14} />
            {en ? "Wi-Fi included" : "Wi-Fi incluido"}
          </p>}
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
    {(connected ? quoteResult.loading : !inventory) && <p role="status">
      {en ? "Loading availability..." : "Cargando disponibilidad..."}
    </p>}
    {inventory?.error && <p role="alert">{en ? "Availability could not be checked. Try again." : "No se pudo consultar la disponibilidad. Intenta nuevamente."}</p>}
    {(connected ? !quoteResult.loading && !quoteResult.error : inventory && !inventory.error) && rooms.length === 0 && (<div className="catalog-empty">
      {en
        ? "No rooms are available for these dates and filters. Change your search criteria."
        : "No hay habitaciones disponibles para estas fechas y filtros. Cambia los criterios de búsqueda."}
    </div>)}
  </main>);
}
