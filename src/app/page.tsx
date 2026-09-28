"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CalendarDays, KeyRound, MessageCircle, ShieldCheck, Wifi, Smartphone, Mail, MapPin, Phone, Clock3, Search, BookOpen, HelpCircle, Users, Minus, Plus, ChevronDown, } from "lucide-react";
import VillaSerenaLogo from "@/components/common/VillaSerenaLogo";
import PublicLanguageToggle, { usePublicLanguage, } from "@/components/common/PublicLanguageToggle";
import { UiText, useUiText } from "@/i18n/UiText";
import BilingualDateInput from "@/components/common/BilingualDateInput";
import { money, usePublicRooms } from "@/data/publicRooms";
import { translatePublicContent } from "@/lib/translation/client";
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
const samplePublicReviews = [
  {
    id: "sample-1",
    name: "María G.",
    country: "Guatemala",
    countryEn: "Guatemala",
    date: "septiembre de 2026",
    dateEn: "September 2026",
    rating: 5,
    text: "Una estancia muy tranquila. La habitación estaba impecable y la atención fue excelente.",
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
export default function Home() {
  return (<ScopedI18nProvider>
    <HomeContent />
  </ScopedI18nProvider>);
}
function HomeContent() {
  const publicRooms = usePublicRooms();
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
  const [publicReviews, setPublicReviews] = useState<any[]>([]);
  const [reviewTranslations, setReviewTranslations] = useState<Record<string, string>>({});
  const [reviewOriginal, setReviewOriginal] = useState<Record<string, boolean>>({});
  const [reviewTranslationBusy, setReviewTranslationBusy] = useState<string | null>(null);
  useEffect(() => {
    const cargarResenas = () => {
      try {
        const saved = JSON.parse(localStorage.getItem("vs-resenas-publicas") || "[]")
          .filter((r: any) => r.autorizaPublicar && r.verificada && r.estrellas >= 1 && r.estrellas <= 5)
          .map((r: any) => ({
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
  async function alternarTraduccionResena(review: any) {
    const key = review.id || `${review.name}-${review.date}`;
    if (reviewOriginal[key]) {
      setReviewOriginal(v => ({ ...v, [key]: false }));
      return;
    }
    if (reviewTranslations[key]) {
      setReviewOriginal(v => ({ ...v, [key]: true }));
      return;
    }
    if (!review.text)
      return;
    setReviewTranslationBusy(key);
    try {
      const result = await translatePublicContent([review.text], "public-notice");
      const translated = result.translations[0];
      if (translated) {
        setReviewTranslations(v => ({ ...v, [key]: translated }));
        setReviewOriginal(v => ({ ...v, [key]: true }));
      }
    }
    catch { }
    finally {
      setReviewTranslationBusy(null);
    }
  }
  const reviewAverage = publicReviews.length ? publicReviews.reduce((s, r) => s + r.rating, 0) / publicReviews.length : 0;
  const reviewPages = Math.max(1, Math.ceil(publicReviews.length / 3));
  useEffect(() => {
    const t = setInterval(() => setSlide((s) => (s + 1) % slides.length), 6500);
    return () => clearInterval(t);
  }, []);
  const recommended = useMemo(() => publicRooms.filter((r) => r.preferences.includes(preference)).slice(0, 3), [preference]);
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
    if (key === "availability") {
      return en ? (<>
        From <a className={linkClass} href="#inicio">
          <UiText text="Inicio" />
        </a>, select your arrival date, departure date and number of guests. Then select “<a className={linkClass} href="#buscar">
          <UiText text="Comprobar disponibilidad" />
        </a>” to view the rooms available for your stay.
      </>) : (<>
        Desde <a className={linkClass} href="#inicio">
          <UiText text="Inicio" />
        </a>, selecciona tu fecha de llegada, fecha de salida y número de huéspedes. Luego selecciona «<a className={linkClass} href="#buscar">
          <UiText text="Comprobar disponibilidad" />
        </a>» para consultar las habitaciones disponibles para tu estancia.
      </>);
    }
    if (key === "rooms") {
      return en ? (<>Select “<a className={linkClass} href="/catalogo">
        <UiText text="Ver habitaciones" />
      </a>” to browse the Villa Serena room catalog. You can explore rooms and filter by category, number of guests, floor and price range.</>) : (<>Selecciona «<a className={linkClass} href="/catalogo">
        <UiText text="Ver habitaciones" />
      </a>» para consultar el catálogo de Villa Serena. Puedes explorar las habitaciones y filtrar por categoría, número de huéspedes, piso y rango de precio.</>);
    }
    if (key === "book") {
      return en ? (<> <a className={linkClass} href="#buscar">
        <UiText text="Comprobar disponibilidad" />
      </a> for your dates, choose an available room and select “Book room”. Enter your details, review your stay information, select a payment method and confirm your reservation.</>) : (<>«<a className={linkClass} href="#buscar">Comprobar disponibilidad</a>» para tus fechas, elige una habitación disponible y selecciona «Reservar habitación». Completa tus datos, revisa la información de tu estancia, selecciona el método de pago y confirma tu reserva.</>);
    }
    if (key === "services") {
      return en ? (<>In “<a className={linkClass} href="#servicios">
        <UiText text="Servicios y experiencias" />
      </a>” you can find information about the Spa, Gym, Pool and Restaurant, including available details and opening hours for each service.</>) : (<>En «<a className={linkClass} href="#servicios">Servicios y experiencias</a>» puedes consultar información sobre Spa, Gimnasio, Piscina y Restaurante, incluyendo los detalles y horarios disponibles de cada servicio.</>);
    }
    if (key === "stay") {
      return en ? (<>Select “<a className={linkClass} href="/login">
        <UiText text="Gestionar mi estancia" />
      </a>” to access the options available during your stay, including check-in, restaurant and services, room information, reservations and experiences, account and check-out.</>) : (<>Selecciona «<a className={linkClass} href="/login">
        <UiText text="Gestionar mi estancia" />
      </a>» para acceder a las opciones disponibles durante tu estancia, como check-in, restaurante y servicios, información de tu habitación, reservas y experiencias, cuenta y check-out.</>);
    }
    return en ? (<>Go to “<a className={linkClass} href="/login">
      <UiText text="Gestionar mi estancia" />
    </a>” to view the options available for your reservation. If you need assistance with a modification or cancellation, you can contact Reception.</>) : (<>Ingresa a «<a className={linkClass} href="/login">
      <UiText text="Gestionar mi estancia" />
    </a>» para consultar las opciones disponibles para tu reserva. Si necesitas asistencia con una modificación o cancelación, puedes contactar a Recepción.</>);
  };
  const { en } = usePublicLanguage();
  return (<>
    <PublicLanguageToggle />
    <main className="hotel-site">
      <header className="hotel-nav">
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
          <a href="#buscar" className="gold-button">
            {en ? "Book now" : "Reservar ahora"}
          </a>
        </div>
      </header>

      <section
        id="inicio"
        className="hotel-hero"
        style={{
          backgroundImage: `linear-gradient(90deg,rgba(8,28,50,.84),rgba(16,39,71,.36),rgba(16,39,71,.08)),url('${slides[slide][0]}')`,
        }}>
        <div className="hero-copy">
          <span className="hero-kicker">
            {en ? "WELCOME TO VILLA SERENA" : slides[slide][1]}
          </span>
          <h1>
            {en ? "Your rest starts here." : slides[slide][2]}
          </h1>
          <p>
            {en
              ? "Warm hospitality, comfortable rooms and thoughtful experiences for your stay."
              : "Hospitalidad cercana, habitaciones cómodas y experiencias pensadas para acompañar tu estancia."}
          </p>
        </div>
        <button className="carousel-arrow carousel-prev" onClick={() => setSlide((slide - 1 + slides.length) % slides.length)}>
          <ArrowLeft />
        </button>
        <button className="carousel-arrow carousel-next" onClick={() => setSlide((slide + 1) % slides.length)}>
          <ArrowRight />
        </button>
        <div className="carousel-dots">
          {slides.map((_, i) => (<button key={i} className={i === slide ? "active" : ""} onClick={() => setSlide(i)} />))}
        </div>
        <div id="buscar" className="hero-availability">
          <label>
            <small>
              {en ? "CHECK IN" : "LLEGADA"}
            </small>
            <BilingualDateInput value={arrival} onChange={(v) => {
              setArrival(v);
              if (departure && departure <= v)
                setDeparture('');
            }} />
          </label>
          <label>
            <small>
              {en ? "CHECK OUT" : "SALIDA"}
            </small>
            <BilingualDateInput value={departure} min={arrival} onChange={setDeparture} />
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
            className={!validStay(arrival, departure)
              ? "availability-search disabled"
              : "availability-search"}
            aria-disabled={!validStay(arrival, departure)}
            href={validStay(arrival, departure) ? searchHref : "#"}>
            {en ? "Check availability" : "Comprobar disponibilidad"}
            {" "}
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <section id="habitaciones" className="hotel-section rooms-section">
        <div className="section-heading">
          <div>
            <span className="section-kicker services-section-kicker">
              {en ? "ROOMS" : "HABITACIONES DESTACADAS"}
            </span>
            <h2 className="services-section-title">
              {en
                ? "Find your place to rest"
                : "Encuentra tu espacio para descansar"}
            </h2>
          </div>
          <Link className="more-rooms-button" href="/catalogo">
            {en ? "View all rooms" : "Ver todas las habitaciones"}
            {" "}
            <ArrowRight size={15} />
          </Link>
        </div>
        <div className="public-room-grid">
          {featured.map((r) => (<article key={r.slug} className="public-room-card">
            <Link href={`/habitaciones/${r.slug}`} className="room-photo">
              <img src={r.image} alt={ui(r.name)} />
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
                {r.size}
                <UiText text=" m² · " />
                {r.capacity}
                {en ? "guests" : "huéspedes"}
              </p>
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
                  <UiText text=" →" />
                </Link>
              </footer>
            </div>
          </article>))}
        </div>
      </section>

      <section className="preference-section">
        <span className="section-kicker">
          {en ? "A STAY FOR YOU" : "VILLA SERENA SE ADAPTA A TI"}
        </span>
        <h2>
          {en
            ? "What kind of stay are you looking for?"
            : "¿Qué tipo de estancia buscas?"}
        </h2>
        <p>
          {en
            ? "Choose what you want to enjoy and discover rooms that match your visit."
            : "Elige lo que quieres disfrutar y descubre habitaciones que se adapten a tu visita."}
        </p>
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
        <p className="preference-explain">
          {(en ? prefTextEN : prefTextES)[preference]}
        </p>
        <div className="recommend-grid">
          {recommended.map((r,
            i) => (<article className="recommend-mini" key={r.slug}>
              <Link href={`/habitaciones/${r.slug}`}>
                <img src={r.image} alt={ui(r.name)} />
              </Link>
              <div>
                {i === 0 && (<span className="section-kicker">
                  {en ? "RECOMMENDED FOR YOU" : "RECOMENDADA PARA TI"}
                </span>)}
                <h3>
                  {ui(r.name)}
                </h3>
                <p>
                  {ui(r.beds)}
                  <UiText text=" · " />
                  {r.size}
                  <UiText text=" m² · " />
                  {r.capacity}
                  {en ? "guests" : "huéspedes"}
                </p>
                <div className="recommend-bottom">
                  <b>
                    {en ? "From" : "Desde"}
                    {money(r.price)}
                    {" "}
                    <small>
                      <UiText text="/ " />
                      {en ? "night" : "noche"}
                    </small>
                  </b>
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

      <section id="servicios" className="services-rich">
        <div className="section-heading">
          <div>
            <span className="section-kicker services-section-kicker">
              <UiText text="SERVICIOS Y EXPERIENCIAS" />
            </span>
            <h2 className="services-section-title">
              <UiText text="Disfruta cada momento de tu estancia" />
            </h2>
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
        <section className="service-info-modal service-info-rich" onMouseDown={(e) => e.stopPropagation()}>
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

      <section id="nosotros" className="about-showcase">
        <div className="about-showcase-photo">
          <img src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1400&q=90" alt="Villa Serena" />
        </div>
        <div className="about-showcase-copy">
          <span className="section-kicker">
            <UiText text="ACERCA DE NOSOTROS" />
          </span>
          <h2>
            <UiText text="Un lugar pensado para disfrutar con tranquilidad" />
          </h2>
          <p>
            <UiText text="Villa Serena combina descanso, atención cercana y espacios acogedores para acompañar cada momento de tu estancia." />
          </p>
          <Link href="/nosotros" className="gold-button">
            <UiText text="DESCUBRE MÁS SOBRE NOSOTROS " />
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <section className="why-serena">
        <div className="why-heading">
          <span className="section-kicker why-kicker">
            <UiText text="¿POR QUÉ ELEGIRNOS?" />
          </span>
          <h2>
            <UiText text="Una estancia pensada para disfrutar cada momento" />
          </h2>
          <p>
            <UiText text="Comodidad, atención personalizada y experiencias que complementan tu visita." />
          </p>
        </div>
        <div className="why-grid">
          <article>
            <span>
              <UiText text="01" />
            </span>
            <h3>
              <UiText text="Hospitalidad" />
            </h3>
            <p>
              <UiText text="Atención cercana y personalizada durante tu estancia." />
            </p>
          </article>
          <article>
            <span>
              <UiText text="02" />
            </span>
            <h3>
              <UiText text="Gastronomía" />
            </h3>
            <p>
              <UiText text="Sabores guatemaltecos y opciones para distintos momentos del día." />
            </p>
          </article>
          <article>
            <span>
              <UiText text="03" />
            </span>
            <h3>
              <UiText text="Bienestar" />
            </h3>
            <p>
              <UiText text="Spa, piscina y espacios diseñados para descansar." />
            </p>
          </article>
          <article>
            <span>
              <UiText text="04" />
            </span>
            <h3>
              <UiText text="Experiencias" />
            </h3>
            <p>
              <UiText text="Servicios y detalles que complementan tu visita." />
            </p>
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

      <section id="contacto" className="contact-section contact-expanded">
        <div className="contact-copy">
          <span className="section-kicker">
            <UiText text="CONTACTO Y AYUDA" />
          </span>
          <h2>
            <UiText text="Estamos para ayudarte" />
          </h2>
          <p>
            <UiText text="Encuentra respuestas rápidas o envíanos una consulta." />
          </p>
          <div className="contact-details">
            <span>
              <Mail />
              <a href="mailto:villaserenagt@gmail.com">
                <UiText text="villaserenagt@gmail.com" />
              </a>
            </span>
            <span>
              <MapPin />
              <UiText text="Huehuetenango, Guatemala" />
            </span>
            <span>
              <Phone />
              <a href="tel:+50277642580">
                <UiText text="+502 7764-2580" />
              </a>
            </span>
          </div>
          <div className="help-links help-accordion">
            <h3>
              <UiText text="Ayuda" />
            </h3>
            {[
              ["availability",
                "¿Cómo comprobar disponibilidad?",
                "Desde Inicio, selecciona tu fecha de llegada, fecha de salida y número de huéspedes. Luego selecciona «Comprobar disponibilidad» para consultar las habitaciones disponibles para tu estancia."],
              ["rooms",
                "¿Dónde puedo ver todas las habitaciones?",
                "Selecciona «Ver habitaciones» para consultar el catálogo de Villa Serena. Puedes explorar las habitaciones y filtrar por categoría, número de huéspedes, piso y rango de precio."],
              ["book",
                "¿Cómo reservar una estancia?",
                "Comprueba la disponibilidad para tus fechas, elige una habitación disponible y selecciona «Reservar habitación». Completa tus datos, revisa la información de tu estancia, selecciona el método de pago y confirma tu reserva."],
              ["services",
                "¿Qué servicios y experiencias ofrece el hotel?",
                "En «Servicios y experiencias» puedes consultar información sobre Spa, Gimnasio, Piscina y Restaurante, incluyendo los detalles y horarios disponibles de cada servicio."],
              ["stay",
                "¿Cómo gestiono mi estancia?",
                "Selecciona «Gestionar mi estancia» para acceder a las opciones disponibles durante tu estancia, como check-in, restaurante y servicios, información de tu habitación, reservas y experiencias, cuenta y check-out."],
              ["changes",
                "¿Cómo modifico o cancelo una reserva?",
                "Ingresa a «Gestionar mi estancia» para consultar las opciones disponibles para tu reserva. Si necesitas asistencia con una modificación o cancelación, puedes contactar a Recepción."],
            ].map(([k, t]) => (<article key={k}>
              <button onClick={() => setHelpOpen(helpOpen === k ? null : k)}>
                <HelpCircle />
                <UiText text={t} />
                <ChevronDown className={helpOpen === k ? "help-chevron open" : "help-chevron"} aria-hidden />
              </button>
              {helpOpen === k && (<div>
                <p>
                  {renderHelpAnswer(k)}
                </p>
              </div>)}
            </article>))}
          </div>
        </div>
        <form
          className="contact-compact"
          onSubmit={(e) => {
            e.preventDefault();
            alert(en ? "Thank you. We have received your message." : "Gracias. Hemos recibido tu mensaje.");
          }}>
          <h3>
            <UiText text="Sugerencias y consultas" />
          </h3>
          <label>
            <UiText text="Nombre" />
            <input required />
          </label>
          <label>
            <UiText text="Correo" />
            <input required type="email" />
          </label>
          <label>
            <UiText text="Mensaje" />
            <textarea required />
          </label>
          <button className="gold-button">
            <UiText text="Enviar mensaje" />
          </button>
        </form>
      </section>
      <section className="guest-experiences" aria-labelledby="guest-experiences-title">

        <div className="guest-experiences-body">
          <span className="section-kicker">
            {publicReviews.every((r: any) => r.sample) ? (en ? "REVIEW PREVIEW" : "VISTA DE RESEÑAS") : (en ? "REAL EXPERIENCES" : "EXPERIENCIAS REALES")}
          </span>
          <h2 id="guest-experiences-title">
            {en ? "Experiences from our guests" : "Experiencias de nuestros huéspedes"}
          </h2>
          <p>
            {publicReviews.every((r: any) => r.sample) ? (en ? "Sample reviews are shown so you can preview how this section looks." : "Se muestran reseñas de muestra para visualizar cómo se verá esta sección.") : (en ? "Verified reviews from guests who enjoyed their stay at Villa Serena." : "Opiniones verificadas de huéspedes que vivieron su estancia en Villa Serena.")}
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
              <span aria-label={`${reviewAverage.toFixed(1)} de 5 estrellas`}>★★★★★</span>
              <i>
              </i>
              <b>
                <ShieldCheck size={16} />
                {publicReviews.every((r: any) => r.sample) ? (en ? "Sample reviews" : "Reseñas de muestra") : (en ? "Verified reviews" : "Opiniones verificadas")}
              </b>
            </div>
            <div className="review-carousel">
              <button
                className="review-arrow review-arrow-left"
                aria-label={en ? "Previous reviews" : "Opiniones anteriores"}
                onClick={() => setReviewPage((reviewPage - 1 + reviewPages) % reviewPages)}>‹</button>
              <div className="review-grid">
                {publicReviews.slice(reviewPage * 3, reviewPage * 3 + 3).map(review => {
                  const key = review.id || `${review.name}-${review.date}`;
                  const mostrandoTraduccion = Boolean(reviewOriginal[key] && reviewTranslations[key]);
                  return <article key={key} className="review-card">
                    <div className="review-stars" aria-label={`${review.rating} de 5 estrellas`}>
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
                      {mostrandoTraduccion ? reviewTranslations[key] : review.text}
                    </p>
                    {review.text && <button type="button" className="review-translate" disabled={reviewTranslationBusy === key} onClick={() => alternarTraduccionResena(review)}>
                      {reviewTranslationBusy === key ? (en ? "Translating…" : "Traduciendo…") : mostrandoTraduccion ? (en ? "View original" : "Ver original") : (en ? "Translate review" : "Traducir reseña")}
                    </button>}
                  </article>;
                })}
              </div>
              <button
                className="review-arrow review-arrow-right"
                aria-label={en ? "Next reviews" : "Opiniones siguientes"}
                onClick={() => setReviewPage((reviewPage + 1) % reviewPages)}>›</button>
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
      <footer className="hotel-footer">
        <div className="footer-brand">
          <VillaSerenaLogo light href="/" />
          <p>
            <UiText text="Tu descanso comienza aquí." />
          </p>
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
            <UiText text="Huehuetenango, Guatemala" />
          </span>
          <a href="mailto:villaserenagt@gmail.com">
            <UiText text="villaserenagt@gmail.com" />
          </a>
          <a href="tel:+50277642580">+502 7764-2580</a>
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
