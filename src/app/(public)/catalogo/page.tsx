"use client";
import { UiText, useUiText } from "@/i18n/UiText";
import Link from "next/link";
import {useSearchParams} from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowLeft, BedDouble, Users } from "lucide-react";
import VillaSerenaLogo from "@/components/common/VillaSerenaLogo";
import PublicLanguageToggle, { usePublicLanguage, } from "@/components/common/PublicLanguageToggle";
import GuestSelector from "@/components/common/GuestSelector";
import { money } from "@/data/publicRooms";
import { usePublicCatalog, usePublicQuotes } from "@/lib/usePublicCatalog";
import { publicSearchError } from "@/lib/publicStayValidation";
export default function Catalogo() {
  const { rooms: publicRooms, connected, loading, error } = usePublicCatalog();
  const ui = useUiText();
  const sp=useSearchParams();
  const arrival = sp.get("llegada") ?? sp.get("entrada") ?? "";
  const departure = sp.get("salida") ?? "";
  const hasDates = Boolean(arrival || departure);
  const initialAdults = Number(sp.get("adultos") ?? sp.get("huespedes") ?? 1);
  const initialChildren = Number(sp.get("ninos") ?? 0);
  const { en } = usePublicLanguage();
  const [draftCat, setDraftCat] = useState("Todas"),
    [adults, setAdults] = useState(initialAdults),
    [children, setChildren] = useState(initialChildren),
    [draftMin, setDraftMin] = useState("0"),
    [draftMax, setDraftMax] = useState("99999");
  const [filters, setFilters] = useState({
    cat: "Todas",
    guests: initialAdults + initialChildren,
    adults: initialAdults,
    children: initialChildren,
    min: 0,
    max: 99999,
  });
  const quotes = usePublicQuotes(arrival, departure, filters.adults, filters.children);
  const dateError = hasDates ? publicSearchError(arrival, departure, filters.adults, filters.children) : null;
  const detailHref = (slug: string) => `/habitaciones/${slug}${hasDates ? `?${new URLSearchParams({origen:"disponibilidad",llegada:arrival,salida:departure,adultos:String(filters.adults),ninos:String(filters.children)})}` : ""}`;
  const availabilityText = (slug: string, bookable?: boolean) => {
    if (bookable !== true || !hasDates) return null;
    if (dateError) return en ? "Check your dates and guest count" : "Revisa las fechas y la cantidad de huéspedes";
    if (quotes.loading) return en ? "Checking availability…" : "Consultando disponibilidad…";
    if (quotes.error) return en ? "Could not connect to check availability" : "No se pudo conectar para consultar disponibilidad";
    return quotes.quotes.some(q => q.ofertaSlug === slug)
      ? (en ? "Available for your dates" : "Disponible para tus fechas")
      : (en ? "No availability for your dates" : "Sin cupo para tus fechas");
  };
  const categories = [
    "Todas",
    ...Array.from(new Set(publicRooms.map((r) => r.type))),
  ];
  const filtered = useMemo(() => publicRooms.filter((r) => (filters.cat === "Todas" || (r.type) === filters.cat) &&
    r.capacity >= filters.guests &&
    r.price >= filters.min &&
    r.price <= filters.max),
    [filters, publicRooms]);
  const apply = () => setFilters({
    cat: draftCat,
    guests: adults + children,
    adults,
    children,
    min: Number(draftMin) || 0,
    max: Number(draftMax) || 99999,
  });
  return (<main className="catalog-page catalog-full">
    <header className="catalog-nav">
      <Link href="/" className="catalog-back icon-back" aria-label={en ? "Back" : "Volver"}>
        <ArrowLeft size={20} />
      </Link>
      <VillaSerenaLogo />
    </header>
    <section className="catalog-head">
      <span className="section-kicker">
        {en ? "ROOMS & SUITES" : "HABITACIONES Y SUITES"}
      </span>
      <h1>
        {en
          ? "All rooms"
          : "Todas las habitaciones"}
      </h1>
      <p>
        {en
          ? "Explore our rooms and choose the ideal option for your stay."
          : "Explora nuestras habitaciones y elige la opción ideal para tu estancia."}
      </p>
    </section>
    <section className="catalog-filters refined catalog-without-floor">
      <label>
        {en ? "Category" : "Categoría"}
        <select value={draftCat} onChange={(e) => setDraftCat(e.target.value)}>
          {categories.map((t) => (<option key={t} value={t}>
            {en && t === "Todas" ? "All" : t}
          </option>))}
        </select>
      </label>
      <label>
        {en ? "Guests" : "Huéspedes"}
        <GuestSelector adults={adults} children={children} onAdults={setAdults} onChildren={setChildren} max={5} />
      </label>
      <div className="price-range">
        <strong>
          {en ? "Price range" : "Rango de precio"}
        </strong>
        <div>
          <label>
            {en ? "Minimum" : "Mínimo"}
            <input type="number" min="0" value={draftMin === "0" ? "" : draftMin} onChange={(e) => setDraftMin(e.target.value)} placeholder="Q 0" />
          </label>
          <label>
            {en ? "Maximum" : "Máximo"}
            <input
              type="number"
              min="0"
              value={draftMax === "99999" ? "" : draftMax}
              onChange={(e) => setDraftMax(e.target.value)}
              placeholder={en ? "No limit" : "Sin límite"} />
          </label>
        </div>
      </div>
      <button className="filter-apply" onClick={apply}>
        {en ? "Apply" : "Aplicar"}
      </button>
      <span className="result-count">
        {filtered.length}
        {" "}{en ? (filtered.length === 1 ? "option" : "options") : (filtered.length === 1 ? "opción" : "opciones")}
      </span>
    </section>
    <section className="catalog-grid">
      {filtered.map((r) => (<article key={r.slug}>
        <Link className="catalog-image-link" href={detailHref(r.slug)}>
          <img src={r.image} alt={ui(r.name)} />
        </Link>
        <div>
          <Link className="room-title-link" href={detailHref(r.slug)}>
            <h2>
              {ui(r.name)}
            </h2>
          </Link>
          <p>
            {ui(r.description)}
          </p>
          {connected && availabilityText(r.slug, r.bookable) && <small role="status">{availabilityText(r.slug, r.bookable)}</small>}
          {r.illustrativePhotos && <small>{en ? 'Illustrative images' : 'Imágenes ilustrativas'}</small>}
          {!connected && <span className="room-floor">
            {en ? "Floor" : "Piso"}
            {r.floor}
          </span>}
          <span>
            <Users size={15} />
            {r.capacity}
            {en ? "guests" : "huéspedes"}
          </span>
          {r.beds && <span><BedDouble size={15} />{ui(r.beds)}</span>}
          <footer>
            <b>
              {money(r.price)}
              <small>
                <UiText text=" / " />
                {en ? "night" : "noche"}
              </small>
            </b>
            <Link href={detailHref(r.slug)}>
              {en ? "View room" : "Ver habitación"}
            </Link>
          </footer>
        </div>
      </article>))}
    </section>
    {loading && <p role="status">{en ? "Loading rooms..." : "Cargando habitaciones..."}</p>}
    {error && <p role="alert">{error}</p>}
    {!loading && !error && filtered.length === 0 && (<div className="catalog-empty">
      {en
        ? "No rooms match those criteria. Try another range or category."
        : "No encontramos habitaciones con esos criterios. Prueba otro rango o categoría."}
    </div>)}
  </main>);
}
