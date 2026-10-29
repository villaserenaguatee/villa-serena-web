"use client";
import {usePublicLanguage} from "@/components/common/PublicLanguageToggle";
import {EditorialContentProvider,EditorialText,EditorialLink} from './EditorialContent';
import type {EditorialDocument,EditorialId} from '@/lib/editorial/catalog';

import ContactForm from '@/components/public/ContactForm';
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CalendarDays, KeyRound, MessageCircle, ShieldCheck, Wifi, Smartphone, Mail, MapPin, Phone, Clock3, Search, BookOpen, HelpCircle, Users, Minus, Plus, ChevronDown, ChevronLeft, ChevronRight, } from "lucide-react";
import VillaSerenaLogo from "@/components/common/VillaSerenaLogo";
import { UiText, useUiText } from "@/i18n/UiText";
import BilingualDateInput from "@/components/common/BilingualDateInput";
import { usePublicCatalog, usePublicHotel } from "@/lib/usePublicCatalog";
import { publicSearchError } from "@/lib/publicStayValidation";
import ScopedI18nProvider from "@/i18n/ScopedI18nProvider";
import { validStay } from "@/lib/publicAvailability";

const slides = [
  [
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1900&q=90",
    "BIENVENIDO A VILLA SERENA",
    "Tu descanso comienza aquí.",
  ],
  [
    "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1900&q=90",
    "DESCANSO Y CONFORT",
    "Un espacio para sentirte bien.",
  ],
  [
    "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1900&q=90",
    "EXPERIENCIAS VILLA SERENA",
    "Momentos para disfrutar.",
  ],
];
const preferences = [
  "Romántica",
  "Descanso",
  "Familiar",
  "Negocios",
  "Bienestar",
];
const restaurantCategories = [
  ["Desayuno", "Breakfast"],
  ["Almuerzo", "Lunch"],
  ["Entre horarios", "Between meals"],
  ["Cena", "Dinner"],
  ["Postres", "Desserts"],
  ["Bebidas sin alcohol", "Non-alcoholic drinks"],
  ["Bebidas con alcohol", "Alcoholic drinks"],
] as const;
const prefTextES: Record<string, string> = {
  Romántica: "Ambientes íntimos para disfrutar una estancia especial en pareja.",
  Descanso: "Opciones serenas y cómodas para desconectarte y descansar.",
  Familiar: "Habitaciones con capacidad y comodidad para compartir en familia.",
  Negocios: "Espacios prácticos y tranquilos para combinar descanso y trabajo.",
  Bienestar: "Habitaciones con ambientes tranquilos, terrazas o vistas que acompañan una visita de descanso.",
};
type PublicReview = { id?: string; name: string; country: string; countryEn: string; date: string; dateEn: string; rating: number; text: string; textEn: string; sample?: boolean };
type SavedPublicReview = { id?: string; reservaId?: string; creadaEn: string; nombre?: string; pais?: string; estrellas: number; experiencia?: string; experienciaEn?: string; autorizaPublicar: boolean; verificada: boolean };
const samplePublicReviews = [
  {
    id: "sample-1",
    name: "María G.",
    country: "Guatemala",
    countryEn: "Guatemala",
    date: "septiembre de 2026",
    dateEn: "September 2026",
    rating: 5,
    text: "Una estancia muy tranquila. La habitación estaba impecable y la atención fue excelente.",    textEn: "A very peaceful stay. The room was spotless and the service was excellent.",
    sample: true
  },
  {
    id: "sample-2",
    name: "Carlos M.",
    country: "Guatemala",
    countryEn: "Guatemala",
    date: "septiembre de 2026",
    dateEn: "September 2026",
    rating: 5,
    text: "Nos gustó mucho el ambiente del hotel, el servicio y la comodidad de la habitación.",
    textEn: "We really enjoyed the hotel atmosphere, the service and the comfort of the room.",
    sample: true
  },
  {
    id: "sample-3",
    name: "Andrea R.",
    country: "Guatemala",
    countryEn: "Guatemala",
    date: "agosto de 2026",
    dateEn: "August 2026",
    rating: 4,
    text: "El personal fue muy amable y todo estuvo muy ordenado. Volvería a hospedarme en Villa Serena.",
    textEn: "The staff were very friendly and everything was well organized. I would stay at Villa Serena again.",
    sample: true
  },
];
const prefTextEN: Record<string, string> = {
  Romántica: "Intimate spaces for a special stay as a couple.",
  Descanso: "Peaceful and comfortable options to disconnect and rest.",
  Familiar: "Rooms with the space and comfort needed to enjoy time with family.",
  Negocios: "Practical and quiet spaces to combine rest and work.",
  Bienestar: "Rooms with peaceful settings, terraces or views designed for a relaxing stay.",
};
export type PublicHomePreview={hotel:ReturnType<typeof usePublicHotel>;rooms:ReturnType<typeof usePublicCatalog>['rooms'];loading:boolean;error:string;mobile:boolean};
export default function PublicHome({preview,editorial,loadPublished=true}:{preview?:PublicHomePreview;editorial?:EditorialDocument;loadPublished?:boolean}) {
  return (<ScopedI18nProvider>
    <EditorialContentProvider loadPublished={loadPublished} preview={Boolean(preview)} document={editorial}><HomeContent preview={preview}/></EditorialContentProvider>
  </ScopedI18nProvider>);
}
function HomeContent({preview}:{preview?:PublicHomePreview}) {
  const liveCatalog=usePublicCatalog(!preview);
  const {rooms:publicRooms,loading:catalogLoading,error:catalogError}=preview??liveCatalog;
  const liveHotel=usePublicHotel(!preview);
  const hotel = preview?preview.hotel:liveHotel;
  const hotelPhotos=hotel?.fotos??[];
  const photoCount=hotelPhotos.length;
  const ui = useUiText();
  const [slide, setSlide] = useState(0),
    [preference, setPreference] = useState("Descanso"),
    [serviceOpen, setServiceOpen] = useState<string | null>(null),
    [helpOpen, setHelpOpen] = useState<string | null>(null),
    [guestOpen, setGuestOpen] = useState(false),
    [adults, setAdults] = useState(2),
    [children, setChildren] = useState(0),
    [arrival, setArrival] = useState(""),
    [departure, setDeparture] = useState("");
  const [reviewPage, setReviewPage] = useState(0);
  useEffect(() => {
    if(preview)return;
    const header = document.querySelector<HTMLElement>('[data-public-navigation]');
    if (!header) return;
    const update = () => {
      header.classList.toggle('is-scrolled', window.scrollY > 12);
      document.documentElement.style.setProperty('--public-nav-height', header.offsetHeight + 'px');
    };
    const resize = new ResizeObserver(update); resize.observe(header);
    window.addEventListener('scroll', update, { passive: true }); update();
    return () => { resize.disconnect(); window.removeEventListener('scroll', update); document.documentElement.style.removeProperty('--public-nav-height'); };
  }, [Boolean(preview)]);
  const [reviewsPerPage,setReviewsPerPage]=useState(3);
  const [searchError, setSearchError] = useState("");
  const invalidSearch = publicSearchError(arrival, departure, adults, children, Math.max(0, ...publicRooms.map(room => room.capacity)));
  const [publicReviews, setPublicReviews] = useState<PublicReview[]>([]);
  const [reviewTranslations, setReviewTranslations] = useState<Record<string, string>>({});
  useEffect(() => {
    const cargarResenas = () => {
      try {
        const saved = JSON.parse(localStorage.getItem("vs-resenas-publicas") || "[]")
          .filter((r: SavedPublicReview) => r.autorizaPublicar && r.verificada && r.estrellas >= 1 && r.estrellas <= 5)
          .map((r: SavedPublicReview) => ({
            id: r.id || `${r.reservaId || "stay"}-${r.creadaEn}`,
            name: r.nombre || "Huésped Villa Serena",
            country: r.pais || "Guatemala",
            countryEn: r.pais || "Guatemala",
            date: new Date(r.creadaEn).toLocaleDateString("es-GT", { month: "long", year: "numeric" }),
            dateEn: new Date(r.creadaEn).toLocaleDateString("en-US", { month: "long", year: "numeric" }),
            rating: r.estrellas,
            text: r.experiencia || "",
            textEn: r.experienciaEn || "",
          }));
        setPublicReviews(saved.length ? saved : samplePublicReviews);
      }
      catch {
        setPublicReviews(samplePublicReviews);
      }
    };
    cargarResenas();
    window.addEventListener("vs-resenas-updated", cargarResenas);
    return () => window.removeEventListener("vs-resenas-updated", cargarResenas);
  },
    []);
  const reviewAverage = publicReviews.length ? publicReviews.reduce((s, r) => s + r.rating, 0) / publicReviews.length : 0;
  const reviewPages = Math.max(1, Math.ceil(publicReviews.length / reviewsPerPage));
  useEffect(()=>setReviewPage(p=>Math.min(p,reviewPages-1)),[reviewPages]);
  useEffect(() => {
    if(photoCount<2)return;
    const t = setInterval(() => setSlide((s) => (s + 1) % photoCount), 6500);
    return () => clearInterval(t);
  }, [photoCount]);
  const recommended = useMemo(() => publicRooms.filter((r) => r.preferences.includes(preference)).slice(0, 3), [preference, publicRooms]);
  const featured = publicRooms.filter((r) => ["deluxe-jardin", "suite-serena", "familiar-premium"].includes(r.slug));
  const searchHref = "/reservar/habitaciones?" +
    new URLSearchParams({
      llegada: arrival,
      salida: departure,
      adultos: String(adults),
      ninos: String(children),
      huespedes: String(adults + children),
    });
  const renderHelpAnswer = (key: string) => {
    const linkClass = "help-answer-link";
    if (key === "availability") return en
      ? <>From <a className={linkClass} href="#inicio">Home</a>, select your arrival date, departure date and number of guests. Then select <a className={linkClass} href="#buscar">Check availability</a> to view the rooms available for your stay.</>
      : <>Desde <a className={linkClass} href="#inicio">Inicio</a>, selecciona tu fecha de llegada, fecha de salida y número de huéspedes. Luego selecciona <a className={linkClass} href="#buscar">Comprobar disponibilidad</a> para consultar las habitaciones disponibles para tu estancia.</>;
    if (key === "rooms") return en
      ? <>Select <a className={linkClass} href="/catalogo">View rooms</a> to browse the Villa Serena catalog. You can explore rooms and filter by category, number of guests and price range.</>
      : <>Selecciona <a className={linkClass} href="/catalogo">Ver habitaciones</a> para consultar el catálogo de Villa Serena. Puedes explorar las habitaciones y filtrar por categoría, número de huéspedes y rango de precio.</>;
    if (key === "book") return en
      ? <>Use <a className={linkClass} href="#buscar">Check availability</a> to find a room for your dates and guests. Open its details and select Book room. Enter your details manually, review them and verify your email with the code sent to you before continuing to payment. Review the total and <a className={linkClass} href="/terminos">booking conditions</a>. Continue payment opens Recurrente, where you enter your card details in Guatemalan quetzales (GTQ). Your booking is confirmed only after payment is verified.</>
      : <>Desde <a className={linkClass} href="#buscar">Comprobar disponibilidad</a>, busca una habitación para tus fechas y huéspedes. Abre su detalle y pulsa Reservar habitación. Completa tus datos manualmente, revísalos y verifica tu correo con el código recibido antes de pasar a Pago. Revisa el total y las <a className={linkClass} href="/terminos">condiciones de reserva</a>. Continuar pago abre Recurrente, donde introduces tu tarjeta para pagar en quetzales (GTQ). La reserva se confirma únicamente cuando se comprueba el pago.</>;
    if (key === "services") return en
      ? <>In <a className={linkClass} href="#servicios">Services and experiences</a>, select View information to read about the restaurant, spa, gym and pool. These public information windows do not make a booking or request a service. During your stay, the guest portal shows the options available for your booking status. Contact <a className={linkClass} href="#contacto">Reception</a> if you need assistance.</>
      : <>En <a className={linkClass} href="#servicios">Servicios y experiencias</a>, pulsa Ver información para conocer el restaurante, spa, gimnasio y piscina. Estas ventanas informativas no realizan reservas ni solicitudes de servicios. Durante tu estancia, el portal muestra las opciones disponibles según el estado de tu reserva. Consulta a <a className={linkClass} href="#contacto">Recepción</a> si necesitas ayuda.</>;
    if (key === "stay") return en
      ? <>Open <a className={linkClass} href="/login">Sign in</a> and select Get your access code below the main button. Enter the email you used to book and select Send code. Check your inbox and spam folder, then return to sign in with that email and the six-digit code in Password or access code. It expires after 10 minutes and can be used only once; request another after the waiting period if needed. The booking code beginning VS- and the email verification code used before payment are not portal access codes. The portal shows your stay, check-in, services and account according to your booking status.</>
      : <>Abre <a className={linkClass} href="/login">Iniciar sesión</a> y pulsa Obtén tu código de acceso, debajo del botón principal. Escribe el correo con el que reservaste y pulsa Enviar código. Revisa tu bandeja y Spam; vuelve al inicio de sesión e introduce ese correo y el código de seis dígitos en Contraseña o código de acceso. Vence en 10 minutos y se usa una sola vez; si lo necesitas, solicita otro al terminar la espera. El código de reserva que empieza con VS- y el código de verificación del correo previo al pago no sirven para entrar al portal. Allí puedes consultar estancia, check-in, servicios y cuenta según el estado de tu reserva.</>;
    if (key === "payment") return en
      ? <>Returning from Recurrente or closing its page does not confirm or immediately cancel a payment. The result page checks the booking and payment status. If it is pending, being verified or cannot be checked, use Check status and do not start another booking or payment for the same stay. Never assume a connection error means a rejected payment. If you closed the result page, contact <a className={linkClass} href="#contacto">Reception</a> with your booking code; if you do not have it, explain what happened before retrying. Read the <a className={linkClass} href="/privacidad">privacy policy</a> for information about payment data.</>
      : <>Volver de Recurrente o cerrar su página no confirma ni cancela inmediatamente un pago. La pantalla de resultado consulta el estado de la reserva y del pago. Si sigue pendiente, en verificación o no puede consultarse, pulsa Consultar estado y no inicies otra reserva ni otro pago para la misma estancia. Un error de conexión no significa que el pago haya sido rechazado. Si cerraste el resultado, contacta a <a className={linkClass} href="#contacto">Recepción</a> con tu código de reserva; si no lo tienes, explica lo ocurrido antes de reintentar. Consulta la <a className={linkClass} href="/privacidad">política de privacidad</a> sobre los datos de pago.</>;
    if (key === "password") return en
      ? <>Staff sign in with their email and password. On <a className={linkClass} href="/login">Sign in</a>, select Forgot your password?, enter your staff email and select Send link. If it belongs to an active account, a temporary link is sent to set and confirm a new password. A configured, accessible mailbox is required. If the link expires or you cannot receive email, contact <a className={linkClass} href={hotel?.contacto?.correo?`mailto:${hotel.contacto.correo}`:undefined}>the hotel</a>. Guests use an access code instead of this password recovery process.</>
      : <>El personal entra con su correo y contraseña. En <a className={linkClass} href="/login">Iniciar sesión</a>, pulsa ¿Olvidaste tu contraseña?, introduce tu correo laboral y pulsa Enviar enlace. Si corresponde a una cuenta activa, recibirás un enlace temporal para establecer y confirmar una contraseña nueva. Necesitas una bandeja configurada y accesible. Si el enlace vence o no puedes recibir correo, contacta al <a className={linkClass} href={hotel?.contacto?.correo?`mailto:${hotel.contacto.correo}`:undefined}>hotel</a>. Los huéspedes utilizan su código de acceso, no esta recuperación de contraseña.</>;
    return en
      ? <>Contact <a className={linkClass} href="#contacto">Reception</a> with your booking code. Guests cannot directly change or cancel bookings from the public website or portal. A change requires cancellation and a new booking, subject to availability. A full online payment refund applies when Reception executes the cancellation at least 48 hours before 15:00 on arrival day, Guatemala time; with less notice there is no refund. Sending the request within that period does not itself guarantee a refund. Read the <a className={linkClass} href="/terminos">cancellation and refund conditions</a>. For bookings through an external platform, contact that platform.</>
      : <>Contacta a <a className={linkClass} href="#contacto">Recepción</a> con tu código de reserva. El huésped no puede modificar ni cancelar directamente desde la web pública o el portal. Un cambio requiere cancelar y crear otra reserva, sujeto a disponibilidad. Corresponde reembolso total del pago en línea si Recepción ejecuta la cancelación al menos 48 horas antes de las 15:00 del día de llegada, hora de Guatemala; con menos anticipación no hay reembolso. Enviar la solicitud dentro del plazo no garantiza por sí mismo el reembolso. Consulta las <a className={linkClass} href="/terminos">condiciones de cancelación y reembolso</a>. Si reservaste mediante una plataforma externa, contacta a esa plataforma.</>;
  };
  const { en } = usePublicLanguage();
  useEffect(()=>{if(preview){setReviewsPerPage(preview.mobile?1:3);return;}const mq=matchMedia('(max-width:700px)');const update=()=>{setReviewsPerPage(mq.matches?1:3);setReviewPage(0);};update();mq.addEventListener('change',update);return()=>mq.removeEventListener('change',update);},[preview?.mobile]);
  return (<>
    <main className="hotel-site">
      <header className="hotel-nav" data-public-navigation>
        <VillaSerenaLogo light />
        <nav>
          <a href="#inicio">
            {en ? "Home" : "Inicio"}
          </a>
          <a href="#habitaciones">
            {en ? "Rooms" : "Habitaciones"}
          </a>
          <a href="#servicios">
            {en ? "Services" : "Servicios"}
          </a>
          <a href="#nosotros">
            {en ? "About us" : "Nosotros"}
          </a>
          <a href="#contacto">
            {en ? "Contact" : "Contacto"}
          </a>
        </nav>
        <div className="hotel-nav-actions">
          <Link href="/login" className="nav-login">
            {en ? "Sign in" : "Iniciar sesión"}
          </Link>
          <EditorialLink editorialId="inicio.boton" href="#buscar" className="gold-button">
            {en ? "Book now" : "Reservar ahora"}
          </EditorialLink>
        </div>
      </header>

      <section
        id="inicio" data-site-section="inicio" data-site-field="fotos"
        className="hotel-hero"
        style={{
          backgroundImage: photoCount?`linear-gradient(90deg,rgba(8,28,50,.84),rgba(16,39,71,.36),rgba(16,39,71,.08)),url(${JSON.stringify(hotelPhotos[slide%photoCount])})`:'linear-gradient(90deg,#071d34,#18345c)',
        }}>
        <div className="hero-copy">
          <span className="hero-kicker" data-site-field="nombre">
            {hotel?.nombre?`${en?"WELCOME TO":"BIENVENIDO A"} ${hotel.nombre.toLocaleUpperCase()}`:en ? "WELCOME TO VILLA SERENA" : slides[slide%slides.length][1]}
          </span>
          <EditorialText editorialId="inicio.titulo" as="h1">
            {en ? "Your rest starts here." : slides[slide%slides.length][2]}
          </EditorialText>
          <EditorialText editorialId="inicio.descripcion" as="p" data-site-field="descripcion">
            {en
              ? "Warm hospitality, comfortable rooms and thoughtful experiences for your stay."
              : hotel?.descripcion ?? "Hospitalidad cercana, habitaciones cómodas y experiencias pensadas para acompañar tu estancia."}
          </EditorialText>
        </div>
        <button type="button" aria-label={en ? "Previous slide" : "Imagen anterior"} className="carousel-arrow carousel-prev" disabled={photoCount<2} onClick={() => setSlide((slide - 1 + photoCount) % photoCount)}>
          <ArrowLeft />
        </button>
        <button type="button" aria-label={en ? "Next slide" : "Imagen siguiente"} className="carousel-arrow carousel-next" disabled={photoCount<2} onClick={() => setSlide((slide + 1) % photoCount)}>
          <ArrowRight />
        </button>
        <div className="carousel-dots">
          {hotelPhotos.map((_, i) => (<button key={i} className={i === slide ? "active" : ""} onClick={() => setSlide(i)} />))}
        </div>
        <div id="buscar" className="hero-availability">
          <label>
            <small>
              {en ? "CHECK IN" : "LLEGADA"}
            </small>
            <BilingualDateInput portal value={arrival} rangeStart={arrival} rangeEnd={departure} rangeEdge="arrival" onChange={(v) => {
              setArrival(v);
              if (departure && departure <= v)
                setDeparture('');
            }} />
          </label>
          <label>
            <small>
              {en ? "CHECK OUT" : "SALIDA"}
            </small>
            <BilingualDateInput portal value={departure} min={arrival} minExclusive rangeStart={arrival} rangeEnd={departure} rangeEdge="departure" onChange={setDeparture} />
          </label>
          <div className="guest-picker">
            <small>
              {en ? "GUESTS" : "HUÉSPEDES"}
            </small>
            <button onClick={() => setGuestOpen(!guestOpen)}>
              <Users size={16} />
              {adults + children}
              {en ? "guests" : "huéspedes"}
            </button>
            {guestOpen && (<div className="guest-popover">
              <div>
                <span>
                  {en ? "Adults" : "Adultos"}
                </span>
                <p>
                  <button onClick={() => setAdults(Math.max(1, adults - 1))}>
                    <Minus />
                  </button>
                  <b>
                    {adults}
                  </b>
                  <button disabled={adults + children >= 5} onClick={() => adults + children < 5 && setAdults(adults + 1)}>
                    <Plus />
                  </button>
                </p>
              </div>
              <div>
                <span>
                  {en ? "Children" : "Niños"}
                </span>
                <p>
                  <button onClick={() => setChildren(Math.max(0, children - 1))}>
                    <Minus />
                  </button>
                  <b>
                    {children}
                  </b>
                  <button disabled={adults + children >= 5} onClick={() => adults + children < 5 && setChildren(children + 1)}>
                    <Plus />
                  </button>
                </p>
              </div>
              <button className="guest-confirm" onClick={() => setGuestOpen(false)}>
                {en ? "Confirm" : "Confirmar"}
              </button>
            </div>)}
          </div>
          <Link
            className={invalidSearch
              ? "availability-search disabled"
              : "availability-search"}
            aria-describedby={searchError ? 'public-search-error' : undefined}
            style={{ pointerEvents: 'auto' }}
            onClick={(event) => { setSearchError(invalidSearch || ""); if (invalidSearch) event.preventDefault(); }}
            href={!invalidSearch ? searchHref : "#buscar"}>
            {en ? "Check availability" : "Comprobar disponibilidad"}
            {" "}
            <ArrowRight size={16} />
          </Link>
        </div>
        {searchError && <p id="public-search-error" role="alert">{searchError}</p>}
      </section>

      {hotelPhotos.length>0&&<section id="galeria-hotel" data-site-section="galeria-hotel" className="mx-auto max-w-7xl px-6 py-8"><EditorialText editorialId="galeria-hotel.titulo" as="h2" className="mb-4 font-serif text-3xl text-[#18345C]">{en?'Hotel gallery':'Galería del hotel'}</EditorialText><div className="grid grid-cols-2 gap-3 md:grid-cols-4">{hotelPhotos.map((src,index)=><img data-site-field="fotos" key={src+index} src={src} alt={(en?'Hotel photograph ':'Fotografía del hotel ')+(index+1)} className="h-40 w-full rounded-xl object-cover"/>)}</div></section>}
      <section id="habitaciones" data-site-section="habitaciones" className="hotel-section rooms-section">
        <div className="section-heading">
          <div>
            <EditorialText editorialId="habitaciones.subtitulo" as="span" className="section-kicker services-section-kicker">
              {en ? "ROOMS" : "HABITACIONES DESTACADAS"}
            </EditorialText>
            <EditorialText editorialId="habitaciones.titulo" as="h2" className="services-section-title">
              {en
                ? "Find your place to rest"
                : "Encuentra tu espacio para descansar"}
            </EditorialText>
          </div>
          <EditorialLink editorialId="habitaciones.boton" className="more-rooms-button" href="/catalogo">
            {en ? "View all rooms" : "Ver todas las habitaciones"}
            {" "}
            <ArrowRight size={15} />
          </EditorialLink>
        </div>
        {catalogLoading && <p role="status">{en ? "Loading rooms..." : "Cargando habitaciones..."}</p>}{catalogError && <p role="alert">{catalogError}</p>}
        <div className="public-room-grid">
          {featured.map((r) => (<article key={r.slug} className="public-room-card">
            <Link href={`/habitaciones/${r.slug}`} className="room-photo">
              {r.image?<img src={r.image} alt={ui(r.name)} />:<div className="rounded-lg bg-[#F8F6F0] p-6 text-[#536579]">{en?'No photograph available':'Sin fotografía disponible'}</div>}{r.illustrativePhotos&&<small className="block text-xs text-[#536579]">{en?'Illustrative photograph':'Fotografía ilustrativa'}</small>}
              <span>
                {ui(r.type)}
              </span>
            </Link>
            <div>
              <h3>
                {ui(r.name)}
              </h3>
              <p>
                {ui(r.beds)}
                <UiText text=" · " />
                {Number.isFinite(r.size) && r.size > 0 && <>{r.size}<UiText text=" m² · " /></>}
                {r.capacity}
                {en ? " guests" : " huéspedes"}
              </p>
              <footer>
                <b>Q{r.price.toFixed(2)} <small>{en ? "/ night" : "/ noche"}</small></b>
                <Link href={`/habitaciones/${r.slug}`}>
                  {en ? "View room" : "Ver habitación"}
                  <UiText text=" →" />
                </Link>
              </footer>
            </div>
          </article>))}
        </div>
      </section>

      <section id="estancias" data-site-section="estancias" className="preference-section">
        <EditorialText editorialId="estancias.subtitulo" as="span" className="section-kicker">
          {en ? "A STAY FOR YOU" : "VILLA SERENA SE ADAPTA A TI"}
        </EditorialText>
        <EditorialText editorialId="estancias.titulo" as="h2">
          {en
            ? "What kind of stay are you looking for?"
            : "¿Qué tipo de estancia buscas?"}
        </EditorialText>
        <EditorialText editorialId="estancias.descripcion" as="p">
          {en
            ? "Choose what you want to enjoy and discover rooms that match your visit."
            : "Elige lo que quieres disfrutar y descubre habitaciones que se adapten a tu visita."}
        </EditorialText>
        <div className="preference-row">
          {preferences.map((p) => (<button key={p} className={preference === p ? "active" : ""} onClick={() => setPreference(p)}>
            {en
              ? ({
                Romántica: "Romantic",
                Descanso: "Rest",
                Familiar: "Family",
                Negocios: "Business",
                Bienestar: "Wellness",
              } as Record<string, string>)[p]
              : p}
          </button>))}
        </div>
        <EditorialText editorialId={({Romántica:'estancias.romantica',Descanso:'estancias.descanso',Familiar:'estancias.familiar',Negocios:'estancias.negocios',Bienestar:'estancias.bienestar'} as Record<string,EditorialId>)[preference]} as="p" className="preference-explain">
          {(en ? prefTextEN : prefTextES)[preference]}
        </EditorialText>
        <div className="recommend-grid">
          {recommended.map((r,
            i) => (<article className="recommend-mini" key={r.slug}>
              <Link href={`/habitaciones/${r.slug}`}>
                {r.image?<img src={r.image} alt={ui(r.name)} />:<div className="rounded-lg bg-[#F8F6F0] p-6 text-[#536579]">{en?'No photograph available':'Sin fotografía disponible'}</div>}{r.illustrativePhotos&&<small className="block text-xs text-[#536579]">{en?'Illustrative photograph':'Fotografía ilustrativa'}</small>}
                {i === 0 && (<span className="recommend-photo-badge">
                  {en ? "Recommended for you" : "Recomendada para ti"}
                </span>)}
              </Link>
              <div>
                <h3>
                  {ui(r.name)}
                </h3>
                <p>
                  {ui(r.beds)}
                  <UiText text=" · " />
                  {Number.isFinite(r.size) && r.size > 0 && <>{r.size}<UiText text=" m² · " /></>}
                  {r.capacity}
                  {en ? " guests" : " huéspedes"}
                </p>
                <div className="recommend-bottom">
                  <b>Q{r.price.toFixed(2)} <small>{en ? "/ night" : "/ noche"}</small></b>
                  <Link href={`/habitaciones/${r.slug}`}>
                    {en ? "View room" : "Ver habitación"}
                    {" "}
                    <ArrowRight size={15} />
                  </Link>
                </div>
              </div>
            </article>))}
        </div>
      </section>

      <section id="servicios" data-site-section="servicios" className="services-rich">
        <div className="section-heading">
          <div>
            <EditorialText editorialId="servicios.subtitulo" as="span" className="section-kicker services-section-kicker">
              <UiText text="SERVICIOS Y EXPERIENCIAS" />
            </EditorialText>
            <EditorialText editorialId="servicios.titulo" as="h2" className="services-section-title">
              <UiText text="Disfruta cada momento de tu estancia" />
            </EditorialText>
          </div>
        </div>
        <div className="service-cards">
          {[
            [
              "Spa",
              "Masajes relajantes, tratamientos faciales y corporales.",
              "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1000&q=85",
            ],
            [
              "Gimnasio",
              "Cardio, pesas, fuerza, movilidad y estiramiento.",
              "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1000&q=85",
            ],
            [
              "Piscina",
              "Piscina, área de descanso, camastros y toallas para huéspedes.",
              "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1000&q=85",
            ],
            [
              "Restaurante",
              "Desayunos, platos guatemaltecos, bebidas y postres.",
              "https://resources.diariolibre.com/images/documents/10157/0/image_content_5578694_20150926110822.jpg",
            ],
          ].map(([n, d, img]) => {
            const serviceName = en
              ? ({
                Gimnasio: "Gym",
                Piscina: "Pool",
                Restaurante: "Restaurant",
                Spa: "Spa",
              } as Record<string, string>)[n] || n
              : n;
            const serviceDesc = en
              ? ({
                "Masajes relajantes, tratamientos faciales y corporales.": "Relaxing massages, facial and body treatments.",
                "Cardio, pesas, fuerza, movilidad y estiramiento.": "Cardio, weights, strength, mobility and stretching.",
                "Piscina, área de descanso, camastros y toallas para huéspedes.": "Pool, relaxation area, loungers and towels for guests.",
                "Desayunos, platos guatemaltecos, bebidas y postres.": "Breakfasts, Guatemalan dishes, drinks and desserts.",
              } as Record<string, string>)[d] || d
              : d;
            return (<article key={n} className="service-card">
              <img src={img} alt={serviceName} />
              <div>
                <h3>
                  {serviceName}
                </h3>
                <p>
                  {serviceDesc}
                </p>
                <button className="schedule-link" onClick={() => setServiceOpen(n)}>
                  {en ? "View information" : "Ver información"}
                </button>
              </div>
            </article>);
          })}
        </div>
      </section>

      {serviceOpen && (<div className="booking-modal-backdrop" onMouseDown={() => {
        setServiceOpen(null);
      }}>
        <section data-vs-ui="compact" data-vs-dialog="compact" data-vs-size="standard" className="service-info-modal service-info-rich" onMouseDown={(e) => e.stopPropagation()}>
          <button className="booking-modal-close" onClick={() => {
            setServiceOpen(null);
          }}>
            <UiText text="×" />
          </button>
          <>
            <span className="section-kicker">
              <UiText text="SERVICIOS VILLA SERENA" />
            </span>
            <h2>
              <UiText text={serviceOpen} />
            </h2>
            <p className="service-modal-description">
              <UiText text={serviceOpen === "Spa"
                ? "Masajes relajantes, tratamientos faciales y corporales."
                : serviceOpen === "Gimnasio"
                  ? "Cardio, pesas, fuerza, movilidad y estiramiento."
                  : serviceOpen === "Piscina"
                    ? "Piscina, área de descanso, camastros y toallas para huéspedes."
                    : "Desayunos, platos guatemaltecos, bebidas y postres."} />
            </p>
            <div className="service-hours">
              <Clock3 />
              <div>
                <b>
                  <UiText text="Horario" />
                </b>
                {serviceOpen === "Spa" && (<>
                  <span>
                    <UiText text="Lunes a viernes · 9:00 a. m. – 8:00 p. m." />
                  </span>
                  <span>
                    <UiText text="Sábado y domingo · 9:00 a. m. – 7:00 p. m." />
                  </span>
                </>)}
                {serviceOpen === "Gimnasio" && (<>
                  <span>
                    <UiText text="Lunes a viernes · 6:00 a. m. – 10:00 p. m." />
                  </span>
                  <span>
                    <UiText text="Sábado y domingo · 7:00 a. m. – 9:00 p. m." />
                  </span>
                </>)}
                {serviceOpen === "Piscina" && (<>
                  <span>
                    <UiText text="Lunes a viernes · 7:00 a. m. – 9:00 p. m." />
                  </span>
                  <span>
                    <UiText text="Sábado y domingo · 8:00 a. m. – 9:00 p. m." />
                  </span>
                </>)}
                {serviceOpen === "Restaurante" && (<>
                  <span>
                    <b>
                      <UiText text="Lunes a viernes" />
                    </b>
                    <UiText text=" · Desayuno 6:30–10:30 · Almuerzo 12:00–3:00 · Cena 6:00–10:00" />
                  </span>
                  <span>
                    <b>
                      <UiText text="Sábado y domingo" />
                    </b>
                    <UiText text=" · Desayuno 7:00–11:00 · Almuerzo 12:00–4:00 · Cena 6:00–10:00" />
                  </span>
                </>)}
              </div>
            </div>
            {(serviceOpen === "Gimnasio" || serviceOpen === "Piscina") && <div className="service-included">
              <b>
                {en ? "Included for guests" : "Incluido para huéspedes"}
              </b>
              <p>
                {serviceOpen === "Gimnasio" ? (en ? "Cardio, weights, strength, mobility and stretching areas." : "Áreas de cardio, pesas, fuerza, movilidad y estiramiento.") : (en ? "Pool, relaxation area, loungers and towels." : "Piscina, área de descanso, camastros y toallas.")}
              </p>
            </div>}
            {serviceOpen === "Spa" && <div className="service-included">
              <b>
                {en ? "Treatments by reservation" : "Tratamientos con reservación"}
              </b>
              <p>
                {en ? "Relaxing massages and facial or body treatments. Prices depend on the selected treatment." : "Masajes relajantes y tratamientos faciales o corporales. El costo depende del tratamiento seleccionado."}
              </p>
            </div>}
            {serviceOpen === "Restaurante" && <div className="service-included">
              <b>
                {en ? "Available menu categories" : "Categorías disponibles"}
              </b>
              <p className="restaurant-category-list">
                {restaurantCategories.map(([es, english], index) => <span key={es}>
                  {en ? english : es}
                  {index < restaurantCategories.length - 1 ? " · " : ""}
                </span>)}
              </p>
            </div>}
          </>
        </section>
      </div>)}

      <section id="nosotros" data-site-section="nosotros" className="about-showcase">
        <div className="about-showcase-photo">
          {hotelPhotos[0]?<img data-site-field="fotos" src={hotelPhotos[0]} alt="Villa Serena" />:<div className="rounded-xl bg-[#F8F6F0] p-6 text-[#536579]">{en?'No hotel photograph available.':'Sin fotografía del hotel disponible.'}</div>}
        </div>
        <div className="about-showcase-copy">
          <EditorialText editorialId="nosotros.subtitulo" as="span" className="section-kicker">
            <UiText text="ACERCA DE NOSOTROS" />
          </EditorialText>
          <EditorialText editorialId="nosotros.titulo" as="h2">
            <UiText text="Un lugar pensado para disfrutar con tranquilidad" />
          </EditorialText>
          <EditorialText editorialId="nosotros.descripcion" as="p">
            <UiText text="Villa Serena combina descanso, atención cercana y espacios acogedores para acompañar cada momento de tu estancia." />
          </EditorialText>
          <EditorialLink editorialId="nosotros.boton" href="/nosotros" className="gold-button">
            <UiText text="DESCUBRE MÁS SOBRE NOSOTROS " />
            <ArrowRight size={16} />
          </EditorialLink>
        </div>
      </section>

      <section className="why-serena" data-site-section="por-que">
        <div className="why-heading">
          <EditorialText editorialId="por-que.subtitulo" as="span" className="section-kicker why-kicker">
            <UiText text="¿POR QUÉ ELEGIRNOS?" />
          </EditorialText>
          <EditorialText editorialId="por-que.titulo" as="h2">
            <UiText text="Una estancia pensada para disfrutar cada momento" />
          </EditorialText>
          <EditorialText editorialId="por-que.descripcion" as="p">
            <UiText text="Comodidad, atención personalizada y experiencias que complementan tu visita." />
          </EditorialText>
        </div>
        <div className="why-grid">
          <article>
            <span>
              <UiText text="01" />
            </span>
            <EditorialText editorialId="por-que.item1.titulo" as="h3">
              <UiText text="Hospitalidad" />
            </EditorialText>
            <EditorialText editorialId="por-que.item1.descripcion" as="p">
              <UiText text="Atención cercana y personalizada durante tu estancia." />
            </EditorialText>
          </article>
          <article>
            <span>
              <UiText text="02" />
            </span>
            <EditorialText editorialId="por-que.item2.titulo" as="h3">
              <UiText text="Gastronomía" />
            </EditorialText>
            <EditorialText editorialId="por-que.item2.descripcion" as="p">
              <UiText text="Sabores guatemaltecos y opciones para distintos momentos del día." />
            </EditorialText>
          </article>
          <article>
            <span>
              <UiText text="03" />
            </span>
            <EditorialText editorialId="por-que.item3.titulo" as="h3">
              <UiText text="Bienestar" />
            </EditorialText>
            <EditorialText editorialId="por-que.item3.descripcion" as="p">
              <UiText text="Spa, piscina y espacios diseñados para descansar." />
            </EditorialText>
          </article>
          <article>
            <span>
              <UiText text="04" />
            </span>
            <EditorialText editorialId="por-que.item4.titulo" as="h3">
              <UiText text="Experiencias" />
            </EditorialText>
            <EditorialText editorialId="por-que.item4.descripcion" as="p">
              <UiText text="Servicios y detalles que complementan tu visita." />
            </EditorialText>
          </article>
        </div>
      </section>

      <section className="digital-section digital-inside">
        <div className="digital-copy">
          <span className="section-kicker light">
            <UiText text="TU ESTANCIA, TAMBIÉN DIGITAL" />
          </span>
          <h2>
            <UiText text="Todo lo importante," />
            <br />
            <UiText text="más cerca de ti." />
          </h2>
          <p>
            <UiText text="Gestiona momentos clave de tu estancia desde tu llegada hasta tu salida." />
          </p>
          <div className="digital-features digital-feature-cards">
            <span>
              <CalendarDays />
              <UiText text="Check-in digital" />
            </span>
            <span>
              <MessageCircle />
              <UiText text="Restaurante y servicios" />
            </span>
            <span>
              <ShieldCheck />
              <UiText text="Mi habitación" />
            </span>
            <span>
              <Smartphone />
              <UiText text="Cuenta y check-out" />
            </span>
          </div>
          <Link href="/login" className="gold-button">
            <UiText text="Gestionar mi estancia " />
            <ArrowRight size={16} />
          </Link>
        </div>
        <div className="digital-photo">
          <img src="https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=1200&q=85" alt="Estancia digital" />
        </div>
      </section>

      <section id="contacto" data-site-section="contacto" className="contact-section contact-expanded">
        <div className="contact-copy">
          <EditorialText editorialId="contacto.subtitulo" as="span" className="section-kicker">
            <UiText text="CONTACTO Y AYUDA" />
          </EditorialText>
          <EditorialText editorialId="contacto.titulo" as="h2">
            <UiText text="Estamos para ayudarte" />
          </EditorialText>
          <p>
            <UiText text="Encuentra respuestas rápidas o envíanos una consulta." />
          </p>
          <div className="contact-details">
            <span>
              <Mail />
              <a data-site-field="correo" href={hotel?.contacto?.correo?`mailto:${hotel.contacto.correo}`:undefined}>{hotel?.contacto?.correo??(en?"Not registered":"No registrado")}</a>
            </span>
            <span>
              <MapPin />
              <span data-site-field="direccion">{hotel?.ubicacion?.direccion??(en?"Not registered":"No registrado")}</span>
            </span>
            <span>
              <Phone />
              <a data-site-field="telefono" href={hotel?.contacto?.telefono?`tel:${hotel.contacto.telefono.replace(/[^+0-9]/g,'')}`:undefined}>{hotel?.contacto?.telefono??(en?"Not registered":"No registrado")}</a>
            </span>
          </div>
          <div id="ayuda" data-site-section="ayuda" className="help-links help-accordion">
            <EditorialText editorialId="ayuda.titulo" as="h3">
              <UiText text="Ayuda" />
            </EditorialText>
            {[
              ["availability", "¿Cómo comprobar disponibilidad?"],
              ["rooms", "¿Dónde puedo ver todas las habitaciones?"],
              ["book", "¿Cómo reservar una estancia?"],
              ["services", "¿Qué servicios y experiencias ofrece el hotel?"],
              ["stay", "¿Cómo gestiono mi estancia?"],
              ["changes", "¿Cómo modifico o cancelo una reserva?"],
              ["payment", "¿Qué hago si mi pago queda pendiente?"],
              ["password", "¿Cómo recupero mi contraseña de personal?"],
            ].map(([k, t]) => (<article key={k}>
              <button type="button" id={`help-question-${k}`} aria-expanded={helpOpen === k} aria-controls={`help-answer-${k}`} onClick={() => setHelpOpen(helpOpen === k ? null : k)}>
                <HelpCircle />
                {en ? ({availability:'How do I check availability?',rooms:'Where can I see all rooms?',book:'How do I book a stay?',services:'What services and experiences does the hotel offer?',stay:'How do I manage my stay?',changes:'How do I change or cancel a booking?',payment:'What if my payment is pending?',password:'How do staff reset their password?'} as Record<string,string>)[k] : t}
                <ChevronDown className={helpOpen === k ? "help-chevron open" : "help-chevron"} aria-hidden />
              </button>
              <div hidden={helpOpen !== k} id={`help-answer-${k}`} role="region" aria-labelledby={`help-question-${k}`}>
                <p>
                  {renderHelpAnswer(k)}
                </p>
              </div>
            </article>))}
          </div>
        </div>
        <ContactForm />
      </section>
      <section id="resenas" className="guest-experiences" aria-labelledby="guest-experiences-title">

        <div className="guest-experiences-body">
          <span className="section-kicker">
            {publicReviews.every((r) => r.sample) ? (en ? "REVIEW PREVIEW" : "VISTA DE RESEÑAS") : (en ? "REAL EXPERIENCES" : "EXPERIENCIAS REALES")}
          </span>
          <h2 id="guest-experiences-title">
            {en ? "Experiences from our guests" : "Experiencias de nuestros huéspedes"}
          </h2>
          <p>
            {publicReviews.every((r) => r.sample) ? (en ? "Sample reviews are shown so you can preview how this section looks." : "Se muestran reseñas de muestra para visualizar cómo se verá esta sección.") : (en ? "Verified reviews from guests who enjoyed their stay at Villa Serena." : "Opiniones verificadas de huéspedes que vivieron su estancia en Villa Serena.")}
          </p>
          {publicReviews.length === 0 ? <div className="review-empty">
            <ShieldCheck size={22} />
            <b>
              {en ? "No reviews available yet." : "Aún no hay reseñas disponibles."}
            </b>
            <p>
              {en ? "Verified reviews will appear here after completed stays." : "Las reseñas verificadas aparecerán aquí después de estancias completadas."}
            </p>
          </div> : <>
            <div className="review-summary">
              <strong>
                {reviewAverage.toFixed(1)}
                <small>
                  {en ? "out of 5" : "de 5"}
                </small>
              </strong>
              <span aria-label={`${reviewAverage.toFixed(1)} ${en ? "out of 5 stars" : "de 5 estrellas"}`}>★★★★★</span>
              <i>
              </i>
              <b>
                <ShieldCheck size={16} />
                {publicReviews.every((r) => r.sample) ? (en ? "Sample reviews" : "Reseñas de muestra") : (en ? "Verified reviews" : "Opiniones verificadas")}
              </b>
            </div>
            <div className="review-carousel">
              <button
                className="review-arrow review-arrow-left"
                aria-label={en ? "Previous reviews" : "Opiniones anteriores"}
                onClick={() => setReviewPage((reviewPage - 1 + reviewPages) % reviewPages)}><ChevronLeft size={20} aria-hidden/></button>
              <div className="review-grid">
                {publicReviews.slice(reviewPage * reviewsPerPage, reviewPage * reviewsPerPage + reviewsPerPage).map(review => {
                  const key = review.id || `${review.name}-${review.date}`;                  return <article key={key} className="review-card">
                    <div className="review-stars" aria-label={`${review.rating} ${en ? "out of 5 stars" : "de 5 estrellas"}`}>
                      {[1, 2, 3, 4, 5].map(n => <span key={n} className={n <= review.rating ? 'filled' : ''}>★</span>)}
                    </div>
                    <div className="review-person">
                      <span className="review-avatar" aria-hidden>
                        {review.name.split(' ').map((v: string) => v[0]).join('').slice(0, 2)}
                      </span>
                      <div>
                        <b>
                          {review.name}
                        </b>
                        <small>
                          {en ? review.countryEn : review.country}
                          <br />
                          {en ? review.dateEn : review.date}
                        </small>
                      </div>
                    </div>
                    <em>
                      <ShieldCheck size={13} />
                      {review.sample ? (en ? "Sample review" : "Reseña de muestra") : (en ? "Verified stay" : "Estancia verificada")}
                    </em>
                    <p>
                      {en ? review.textEn || reviewTranslations[key] || 'This review is not available in English yet.' : review.text}
                    </p>

                  </article>;
                })}
              </div>
              <button
                className="review-arrow review-arrow-right"
                aria-label={en ? "Next reviews" : "Opiniones siguientes"}
                onClick={() => setReviewPage((reviewPage + 1) % reviewPages)}><ChevronRight size={20} aria-hidden/></button>
            </div>
            <div className="review-dots">
              {Array.from({ length: reviewPages }, (_, page) => page).map(page => <button
                key={page}
                aria-label={`${en ? 'Reviews page' : 'Página de opiniones'} ${page + 1}`}
                className={reviewPage === page ? 'active' : ''}
                onClick={() => setReviewPage(page)} />)}
            </div>
          </>}
        </div>
      </section>
      <footer className="hotel-footer" data-site-section="pie">
        <div className="footer-brand">
          <VillaSerenaLogo light href="/" />
          <EditorialText editorialId="pie.descripcion" as="p">
            <UiText text="Tu descanso comienza aquí." />
          </EditorialText>
        </div>
        <div>
          <b>
            <UiText text="Enlaces" />
          </b>
          <a href="#inicio">
            <UiText text="Inicio" />
          </a>
          <a href="#habitaciones">
            <UiText text="Habitaciones" />
          </a>
          <a href="#servicios">
            <UiText text="Servicios y experiencias" />
          </a>
          <a href="#nosotros">
            <UiText text="Nosotros" />
          </a>
        </div>
        <div>
          <b>
            <UiText text="Contacto" />
          </b>
          <span>
            <span data-site-field="direccion">{hotel?.ubicacion?.direccion??(en?"Not registered":"No registrado")}</span>
          </span>
          <a data-site-field="correo" href={hotel?.contacto?.correo?`mailto:${hotel.contacto.correo}`:undefined}>{hotel?.contacto?.correo??(en?"Not registered":"No registrado")}</a>
          <a data-site-field="telefono" href={hotel?.contacto?.telefono?`tel:${hotel.contacto.telefono.replace(/[^+0-9]/g,'')}`:undefined}>{hotel?.contacto?.telefono??(en?"Not registered":"No registrado")}</a>
        </div>
        <div>
          <b>
            <UiText text="Ayuda" />
          </b>
          <a href="#buscar">
            <UiText text="Comprobar disponibilidad" />
          </a>
          <Link href="/catalogo">
            <UiText text="Ver habitaciones" />
          </Link>
          <Link href="/login">
            <UiText text="Gestionar mi estancia" />
          </Link>
          <a href="#contacto">
            <UiText text="Contacto y ayuda" />
          </a>
        </div>
        <div className="footer-legal">
          <span>© 2026 Villa Serena</span>
          <Link href="/privacidad">
            <UiText text="Política de privacidad" />
          </Link>
          <Link href="/terminos">
            <UiText text="Términos y condiciones" />
          </Link>
        </div>
      </footer>
    </main>
  </>);
}
