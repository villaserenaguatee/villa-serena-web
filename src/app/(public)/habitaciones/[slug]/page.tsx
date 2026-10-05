"use client";
import { UiText, useUiText } from "@/i18n/UiText";
import Link from "next/link";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, BedDouble, Check, Users, MapPin, Maximize2, } from "lucide-react";
import VillaSerenaLogo from "@/components/common/VillaSerenaLogo";
import PublicLanguageToggle, { usePublicLanguage, } from "@/components/common/PublicLanguageToggle";
import GuestSelector from "@/components/common/GuestSelector";
import BilingualDateInput from "@/components/common/BilingualDateInput";
import { money, usePublicRooms } from "@/data/publicRooms";
import { availableRoom, usePublicAvailability, validGuests, validStay, todayISO } from "@/lib/publicAvailability";
export default function RoomDetail() {
  const publicRooms = usePublicRooms();
  const sp = useSearchParams();
  const router = useRouter();
  const fromResults = sp.get("origen") === "disponibilidad";
  const ui = useUiText();
  const { en } = usePublicLanguage();
  const { slug } = useParams();
  const room = publicRooms.find((r) => r.slug === slug);
  const [open, setOpen] = useState(false),
    [checked, setChecked] = useState(false),
    [arrival, setArrival] = useState(fromResults ? sp.get("llegada") || "" : ""),
    [departure, setDeparture] = useState(fromResults ? sp.get("salida") || "" : ""),
    [adults, setAdults] = useState(fromResults ? Number(sp.get("adultos") || sp.get("huespedes") || 2) : 2),
    [children, setChildren] = useState(fromResults ? Number(sp.get("ninos") || 0) : 0),
    [photo, setPhoto] = useState(0);
  const total = adults + children;
  const inventory = usePublicAvailability({ arrival, departure, adults, children });
  const canCheck = validGuests(adults, children) && validStay(arrival, departure) &&
    total <= Number(room?.capacity || 0);
  const physical = room && canCheck ? availableRoom(room, arrival, departure, total, inventory, fromResults ? sp.get("habitacionId") || undefined : undefined) : undefined;
  const reserveHref = useMemo(() => room
    ? `/reservar/datos?${new URLSearchParams({
      habitacion: room.name,
      slug: room.slug,
      habitacionId: physical?.id || "",
      llegada: arrival,
      salida: departure,
      adultos: String(adults),
      ninos: String(children),
      huespedes: String(total)
    })}`
    : "#",
    [room, physical?.id, arrival, departure, adults, children, total]);
  if (!room)
    return (<main className="room-detail-page">
      <p>
        {en ? "Room not found." : "Habitación no encontrada."}
      </p>
    </main>);
  return (<main className="room-detail-page">
    <header>
      <Link href={fromResults ? `/reservar/habitaciones?${sp.toString()}` : "/catalogo"} className="icon-back" aria-label={en ? "Back" : "Volver"}>
        <ArrowLeft />
      </Link>
      <VillaSerenaLogo />
    </header>
    <section className="room-detail">
      <div className="room-detail-gallery">
        <div className="room-detail-photo">
          <img src={room.gallery[photo]} alt={`${ui(room.name)} ${photo + 1}`} />
          <button className="photo-prev" onClick={() => setPhoto((photo - 1 + room.gallery.length) % room.gallery.length)}>
            <ArrowLeft />
          </button>
          <button className="photo-next" onClick={() => setPhoto((photo + 1) % room.gallery.length)}>
            <ArrowRight />
          </button>
          <span className="photo-count">
            {photo + 1}
            <UiText text=" / " />
            {room.gallery.length}
          </span>
        </div>
        <div className="room-thumbs">
          {room.gallery.map((img, i) => (<button className={i === photo ? "active" : ""} key={img} onClick={() => setPhoto(i)}>
            <img src={img} alt="" />
          </button>))}
        </div>
      </div>
      <div className="room-detail-copy">
        <span className="section-kicker">
          {ui(room.type).toUpperCase()}
        </span>
        <h1>
          {ui(room.name)}
        </h1>
        <p className="room-detail-desc">
          {ui(room.description)}
        </p>
        <div className="room-detail-meta">
          <span>
            <Maximize2 />
            {room.size}
            <UiText text=" m²" />
          </span>
          <span>
            <Users />
            {en ? "Maximum" : "Máximo"}
            {Math.min(room.capacity, physical?.capacidad ?? room.capacity)}
            {" "}
            {en ? "guests" : "huéspedes"}
          </span>
          <span>
            <BedDouble />
            {ui(room.beds)}
          </span>
          <span>
            <MapPin />
            {en ? "Floor" : "Piso"}
            {room.floor}
          </span>
        </div>
        <h3>
          {en ? "Room features" : "Características de la habitación"}
        </h3>
        <div className="room-feature-list">
          {room.features.map((f) => (<span key={f}>
            <Check size={16} />
            {ui(f)}
          </span>))}
        </div>
        <div className="room-detail-book">
          <div>
            <small>
              {en ? "From" : "Desde"}
            </small>
            <b>
              {money(room.price)}
              {" "}
              <em>
                <UiText text="/ " />
                {en ? "night" : "noche"}
              </em>
            </b>
          </div>
          {fromResults ? (<button disabled={!physical} onClick={() => router.push(reserveHref)}>
            {en ? "Book room" : "Reservar habitación"}
          </button>) : <button onClick={() => {
            setChecked(false);
            setOpen(true);
          }}>
            {en ? "Check availability" : "Consultar disponibilidad"}
          </button>}
        </div>
      </div>
    </section>
    {inventory?.error && <p role="alert">{en ? "Availability could not be checked. Try again." : "No se pudo consultar la disponibilidad. Intenta nuevamente."}</p>}
    {fromResults && inventory && !inventory.error && !physical && <p role="alert">
      {en ? "This room is no longer available for this stay. Return to the results to choose another room." : "Esta habitación ya no está disponible para esta estancia. Vuelve a los resultados para elegir otra habitación."}
    </p>}
    {open && !fromResults && (<div className="booking-modal-backdrop" onMouseDown={() => setOpen(false)}>
      <div className="availability-modal" onMouseDown={(e) => e.stopPropagation()}>
        <button className="booking-modal-close" onClick={() => setOpen(false)}>
          <UiText text="×" />
        </button>
        <span className="section-kicker">
          {en ? "CHECK AVAILABILITY" : "CONSULTAR DISPONIBILIDAD"}
        </span>
        <h2>
          {ui(room.name)}
        </h2>
        <div className="booking-modal-grid">
          <label>
            {en ? "Arrival" : "Llegada"}
            <BilingualDateInput
              value={arrival}
              min={todayISO()}
              onChange={(v) => {
                setArrival(v);
                if (departure && departure <= v)
                  setDeparture("");
                setChecked(false);
              }} />
          </label>
          <label>
            {en ? "Departure" : "Salida"}
            <BilingualDateInput
              value={departure}
              min={arrival}
              onChange={(v) => {
                setDeparture(v);
                setChecked(false);
              }} />
          </label>
        </div>
        <label>
          {en ? "Guests" : "Huéspedes"}
          <GuestSelector
            adults={adults}
            children={children}
            onAdults={(n) => {
              setAdults(n);
              setChecked(false);
            }}
            onChildren={(n) => {
              setChildren(n);
              setChecked(false);
            }}
            max={room.capacity} />
        </label>
        {!checked ? (<button className="availability-button" disabled={!canCheck || !inventory || inventory.error} onClick={() => canCheck && setChecked(true)}>
          {en ? "Check availability" : "Comprobar disponibilidad"}
        </button>) : physical ? (<div className="availability-result">
          <b>
            {en ? "Available ✓" : "Disponible ✓"}
          </b>
          <span>
            {en
              ? `Available for ${adults} adult${adults === 1 ? "" : "s"}${children ? ` and ${children} child${children === 1 ? "" : "ren"}` : ""} on the selected dates.`
              : `Disponible para ${adults} adulto${adults === 1 ? "" : "s"}${children ? ` y ${children} niño${children === 1 ? "" : "s"}` : ""} en las fechas seleccionadas.`}
          </span>
          <Link href={reserveHref}>
            {en ? "Book room" : "Reservar habitación"}
          </Link>
        </div>) : (<div className="availability-result">
          <b>
            {!inventory ? (en ? "Loading availability..." : "Cargando disponibilidad...") : inventory.error ? (en ? "Could not check availability" : "No se pudo consultar disponibilidad") : (en ? "Not available" : "No disponible")}
          </b>
          <span>
            {inventory && !inventory.error && (en ? "This room is occupied or unavailable for part of the selected stay." : "Esta habitación está ocupada o no disponible durante parte de las fechas seleccionadas.")}
          </span>
        </div>)}
      </div>
    </div>)}
  </main>);
}
