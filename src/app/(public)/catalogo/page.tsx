"use client";
import { UiText, useUiText } from "@/i18n/UiText";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, BedDouble, Users } from "lucide-react";
import VillaSerenaLogo from "@/components/common/VillaSerenaLogo";
import PublicLanguageToggle, { usePublicLanguage, } from "@/components/common/PublicLanguageToggle";
import GuestSelector from "@/components/common/GuestSelector";
import { money, usePublicRooms } from "@/data/publicRooms";
export default function Catalogo() {
  const publicRooms = usePublicRooms();
  const ui = useUiText();
  const { en } = usePublicLanguage();
  const [draftCat, setDraftCat] = useState("Todas"),
    [adults, setAdults] = useState(1),
    [children, setChildren] = useState(0),
    [draftFloor, setDraftFloor] = useState("Todos"),
    [draftMin, setDraftMin] = useState("0"),
    [draftMax, setDraftMax] = useState("99999");
  const [filters, setFilters] = useState({
    cat: "Todas",
    guests: 1,
    floor: "Todos",
    min: 0,
    max: 99999,
  });
  const categories = [
    "Todas",
    ...Array.from(new Set(publicRooms.map((r) => r.type))),
  ];
  const filtered = useMemo(() => publicRooms.filter((r) => (filters.cat === "Todas" || r.type === filters.cat) &&
    r.capacity >= filters.guests &&
    (filters.floor === "Todos" || r.floor === Number(filters.floor)) &&
    r.price >= filters.min &&
    r.price <= filters.max),
    [filters]);
  const apply = () => setFilters({
    cat: draftCat,
    guests: adults + children,
    floor: draftFloor,
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
          ? "Find your space at Villa Serena"
          : "Encuentra tu espacio en Villa Serena"}
      </h1>
      <p>
        {en
          ? "Explore our rooms and choose the ideal option for your stay."
          : "Explora nuestras habitaciones y elige la opción ideal para tu estancia."}
      </p>
    </section>
    <section className="catalog-filters refined">
      <label>
        {en ? "Category" : "Categoría"}
        <select value={draftCat} onChange={(e) => setDraftCat(e.target.value)}>
          {categories.map((t) => (<option key={t}>
            {en && t === "Todas" ? "All" : t}
          </option>))}
        </select>
      </label>
      <label>
        {en ? "Guests" : "Huéspedes"}
        <GuestSelector adults={adults} children={children} onAdults={setAdults} onChildren={setChildren} max={5} />
      </label>
      <label>
        {en ? "Floor" : "Piso"}
        <select value={draftFloor} onChange={(e) => setDraftFloor(e.target.value)}>
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
        {en ? "options" : "opciones"}
      </span>
    </section>
    <section className="catalog-grid">
      {filtered.map((r) => (<article key={r.slug}>
        <Link className="catalog-image-link" href={`/habitaciones/${r.slug}`}>
          <img src={r.image} alt={ui(r.name)} />
        </Link>
        <div>
          <Link className="room-title-link" href={`/habitaciones/${r.slug}`}>
            <h2>
              {ui(r.name)}
            </h2>
          </Link>
          <p>
            {ui(r.description)}
          </p>
          <span className="room-floor">
            {en ? "Floor" : "Piso"}
            {r.floor}
          </span>
          <span>
            <Users size={15} />
            {r.capacity}
            {en ? "guests" : "huéspedes"}
          </span>
          <span>
            <BedDouble size={15} />
            {ui(r.beds)}
          </span>
          <footer>
            <b>
              {money(r.price)}
              <small>
                <UiText text=" / " />
                {en ? "night" : "noche"}
              </small>
            </b>
            <Link href={`/habitaciones/${r.slug}`}>
              {en ? "View room" : "Ver habitación"}
            </Link>
          </footer>
        </div>
      </article>))}
    </section>
    {filtered.length === 0 && (<div className="catalog-empty">
      {en
        ? "No rooms match those criteria. Try another range or category."
        : "No encontramos habitaciones con esos criterios. Prueba otro rango o categoría."}
    </div>)}
  </main>);
}
