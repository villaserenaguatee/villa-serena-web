"use client";
import { UiText, useUiText } from "@/i18n/UiText";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ChevronDown, Search } from "lucide-react";
import VillaSerenaLogo from "@/components/common/VillaSerenaLogo";
import { usePublicLanguage } from "@/components/common/PublicLanguageToggle";
import { money } from "@/data/publicRooms";
import { usePublicCatalog, usePublicQuotes } from "@/lib/usePublicCatalog";
import { availableRoom, usePublicAvailability, validGuests } from "@/lib/publicAvailability";
import { saveBookingDraft, readBookingDraft, BookingAttemptPendingError } from "@/lib/bookingDraft";
export default function Datos() {
  const { rooms: publicRooms, loading: catalogLoading, error: catalogError } = usePublicCatalog();
  const ui = useUiText();
  const bookingText = useTranslations("publicBooking");
  const { en } = usePublicLanguage();
  const r = useRouter(), sp = useSearchParams();
  const [method, setMethod] = useState("email"),
    [nombre, setNombre] = useState(""),
    [apellidos, setApellidos] = useState(""),
    [correo, setCorreo] = useState(""),
    [tel, setTel] = useState(""),
    [prefix, setPrefix] = useState("+502"),
    [docType, setDocType] = useState("DPI"),
    [documento, setDocumento] = useState(""),
    [nacionalidad, setNacionalidad] = useState("Guatemala"),
    [hora, setHora] = useState("15:00"),
    [review, setReview] = useState(false),
    [countryOpen, setCountryOpen] = useState(false),
    [countrySearch, setCountrySearch] = useState("");
  const habitacion = sp.get("habitacion") || "",
    llegada = sp.get("llegada") || "",
    salida = sp.get("salida") || "",
    adultos = sp.get("adultos") || sp.get("huespedes") || "1",
    ninos = sp.get("ninos") || "0",
    huespedes = String(Number(adultos) + Number(ninos));
  const room = publicRooms.find((x) => sp.get("slug") ? x.slug === sp.get("slug") : x.name === habitacion);
  const inventory = usePublicAvailability({ arrival: llegada, departure: salida, adults: Number(adultos), children: Number(ninos) }, room?.capacity ?? 0);
  const quoteResult = usePublicQuotes(llegada, salida, Number(adultos), Number(ninos), room?.capacity ?? 0);
  const quote = quoteResult.quotes.find(q => q.tipoHabitacion.id === room?.apiTypeId);
  const physical = room && validGuests(Number(adultos), Number(ninos)) ? availableRoom(room, llegada, salida, Number(huespedes), inventory, sp.get("habitacionId") || undefined) : undefined;
  const nights = useMemo(() => {
    if (!llegada || !salida)
      return 1;
    return Math.max(1, Math.ceil((new Date(salida).getTime() - new Date(llegada).getTime()) / 86400000));
  }, [llegada, salida]);
  const total = quote?.total ?? 0;
  const [draftError, setDraftError] = useState("");
  useEffect(() => {
    const draft = readBookingDraft(sp.get("draft") || "");
    if (!draft) return;
    const saved = new URLSearchParams(draft.params);
    setNombre(saved.get("nombre") || ""); setApellidos(saved.get("apellidos") || "");
    setCorreo(saved.get("correo") || ""); setDocumento(saved.get("documento") || "");
    setDocType(saved.get("tipoDocumento") || "DPI"); setNacionalidad(saved.get("nacionalidad") || "Guatemala");
    const [code, ...phone] = (saved.get("telefono") || "+502 ").split(" ");
    setPrefix(code); setTel(phone.join(" ")); setHora(saved.get("hora") || "15:00");
  }, [sp]);
  function continueBooking() {
    if (!physical || !quote) return;
    try { r.push("/reservar/pago?" + saveBookingDraft(q(), sp.get("draft") || "")); }
    catch (error) { setDraftError(error instanceof BookingAttemptPendingError ? bookingText("requestUncertain") : en ? "Could not save your details. Try again." : "No se pudieron guardar tus datos. Intenta nuevamente."); }
  }
  const q = () => new URLSearchParams({
    nombre,
    apellidos,
    correo,
    telefono: `${prefix} ${tel}`,
    tipoDocumento: docType,
    documento,
    nacionalidad,
    hora,
    habitacion: room?.name || habitacion,
    slug: room?.slug || "",
    habitacionId: physical?.id || "",
    tipoHabitacionId: String(room?.apiTypeId || ""),
    categoria: room?.type || "",
    precio: String(room?.price || 0),
    noches: String(nights),
    llegada,
    salida,
    adultos,
    ninos,
    huespedes,
    total: String(total),
  });
  function submit(e: FormEvent) {
    e.preventDefault();
    if (![nombre, apellidos, correo, tel, documento, nacionalidad].every(v => v.trim())) {
      setDraftError(en ? "Complete all required guest details." : "Completa todos los datos obligatorios del huésped.");
      return;
    }
    if (`${nombre.trim()} ${apellidos.trim()}`.length > 150 || correo.length > 150 || nacionalidad.length > 60) {
      setDraftError(en ? "Use up to 150 characters for your full name and email, and 60 for nationality." : "Usa hasta 150 caracteres en el nombre completo y correo, y 60 en nacionalidad.");
      return;
    }
    setDraftError("");
    if (physical && quote)
      setReview(true);
  }
  if (!physical || !quote)
    return (<main className="reserve-public">
      <p role="status">
        {catalogError || (!catalogLoading && quoteResult.error) || (!inventory || catalogLoading || quoteResult.loading ? (en ? "Loading availability..." : "Cargando disponibilidad...") : inventory.error ? (en ? "Availability could not be checked. Try again." : "No se pudo consultar la disponibilidad. Intenta nuevamente.") : (en ? "This room is unavailable or the stay is invalid." : "La habitación no está disponible o la estancia no es válida."))}
      </p>
      <button className="reserve-primary" onClick={() => r.push(`/reservar/habitaciones?${sp.toString()}`)}>
        {en ? "Back to results" : "Volver a resultados"}
      </button>
    </main>);
  return (<main className="reserve-public booking-checkout">
    <header className="reserve-nav">
      <button className="icon-back" onClick={() => r.back()}>
        <ArrowLeft />
      </button>
      <VillaSerenaLogo />
    </header>
    <div className="checkout-layout">
      <aside className="booking-summary-card">
        <h2>
          <UiText text="Tu reserva" />
        </h2>
        {room && <img src={room.image} alt={ui(room.name)} />}
        <h3>
          {ui(room?.name || habitacion)}
        </h3>
        {room && <p>{ui(room.type)} · {money(room.price)} {en ? "/ night" : "/ noche"}</p>}
        <div className="summary-dates">
          <span>
            <small>
              <UiText text="Llegada" />
            </small>
            <b>
              {llegada}
            </b>
          </span>
          <span>
            <small>
              <UiText text="Salida" />
            </small>
            <b>
              {salida}
            </b>
          </span>
          <span>
            <small>
              <UiText text="Noches" />
            </small>
            <b>
              {nights}
            </b>
          </span>
          <span>
            <small>
              <UiText text="Huéspedes" />
            </small>
            <b>
              {adultos}
              {en
                ? ` adult${adultos === "1" ? "" : "s"}`
                : ` adulto${adultos === "1" ? "" : "s"}`}
              {Number(ninos) > 0
                ? en
                  ? ` · ${ninos} child${ninos === "1" ? "" : "ren"}`
                  : ` · ${ninos} niño${ninos === "1" ? "" : "s"}`
                : ""}
            </b>
          </span>
        </div>
        <div className="summary-total">
          <span>
            <UiText text="Importe estimado" />
          </span>
          <b>
            {money(total)}
          </b>
        </div>
      </aside>
      <section className="reserve-form-card reserve-form-wide checkout-form">
        <span className="reserve-kicker">
          <UiText text="RESERVA · DATOS DEL HUÉSPED" />
        </span>
        <h1>
          {ui(review ? "Revisa tus datos" : "Introduce tus datos")}
        </h1>
        {!review ? (<>
          <p className="social-copy">
            <UiText text="Continúa con una opción rápida o introduce tus datos con correo electrónico." />
          </p>
          <div className="social-booking">
            <button onClick={() => setMethod("google")} className={method === "google" ? "active" : ""}>
              <span aria-hidden="true">G&nbsp;&nbsp;</span>
              {en ? "Continue with Google" : "Continuar con Google"}
            </button>
            <button onClick={() => setMethod("facebook")} className={method === "facebook" ? "active" : ""}>
              <span aria-hidden="true">f&nbsp;&nbsp;</span>
              {en ? "Continue with Facebook" : "Continuar con Facebook"}
            </button>
          </div>
          <div className="or-divider">
            <span>
              <UiText text="o continúa con tu correo" />
            </span>
          </div>
          <form onSubmit={submit}>
            {draftError && <p role="alert">{draftError}</p>}
            <div className="guest-form-grid">
              <label>
                <UiText text="Nombre" />
                <input required value={nombre} onChange={(e) => setNombre(e.target.value)} />
              </label>
              <label>
                <UiText text="Apellidos" />
                <input required value={apellidos} onChange={(e) => setApellidos(e.target.value)} />
              </label>
              <label>
                <UiText text="Tipo de documento" />
                <select value={docType} onChange={(e) => setDocType(e.target.value)}>
                  <option value="DPI">DPI</option>
                  <option value="Pasaporte">
                    {ui("Pasaporte")}
                  </option>
                </select>
              </label>
              <label>
                <UiText text="Número de documento" />
                <input
                  required
                  value={documento}
                  onChange={(e) => setDocumento(e.target.value.replace(docType === "DPI" ? /\D/g : /[^A-Za-z0-9]/g, "").slice(0, docType === "DPI" ? 13 : 20))}
                  maxLength={docType === "DPI" ? 13 : 20}
                  inputMode={docType === "DPI" ? "numeric" : "text"} />
              </label>
              <label>
                <UiText text="Correo electrónico" />
                <input required type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} />
              </label>
              <label>
                <UiText text="Teléfono" />
                <div className="phone-combo">
                  <div className="country-picker">
                    <button type="button" className="country-trigger" onClick={() => setCountryOpen(!countryOpen)}>
                      {({
                        " +502": "🇬🇹",
                        "+502": "🇬🇹",
                        "+503": "🇸🇻",
                        "+504": "🇭🇳",
                        "+501": "🇧🇿",
                        "+506": "🇨🇷",
                        "+507": "🇵🇦",
                        "+52": "🇲🇽",
                        "+1": "🇺🇸",
                        "+57": "🇨🇴",
                        "+34": "🇪🇸",
                        "+51": "🇵🇪",
                        "+54": "🇦🇷",
                        "+56": "🇨🇱",
                        "+593": "🇪🇨",
                        "+591": "🇧🇴",
                        "+595": "🇵🇾",
                        "+598": "🇺🇾",
                        "+58": "🇻🇪",
                        "+55": "🇧🇷",
                        "+44": "🇬🇧",
                        "+33": "🇫🇷",
                        "+49": "🇩🇪",
                        "+39": "🇮🇹",
                      } as Record<string, string>)[prefix] || "🌐"}
                      {" "}
                      {prefix}
                      <ChevronDown size={16} />
                    </button>
                    {countryOpen && (<div className="country-menu">
                      <div className="country-search">
                        <Search size={15} />
                        <input autoFocus placeholder={ui("Buscar país o código")} value={countrySearch} onChange={(e) => setCountrySearch(e.target.value)} />
                      </div>
                      <div className="country-list">
                        {[
                          ["🇬🇹", "+502", "Guatemala"],
                          ["🇸🇻", "+503", "El Salvador"],
                          ["🇭🇳", "+504", "Honduras"],
                          ["🇧🇿", "+501", "Belice"],
                          ["🇨🇷", "+506", "Costa Rica"],
                          ["🇵🇦", "+507", "Panamá"],
                          ["🇲🇽", "+52", "México"],
                          ["🇺🇸", "+1", "Estados Unidos / Canadá"],
                          ["🇨🇴", "+57", "Colombia"],
                          ["🇪🇸", "+34", "España"],
                          ["🇵🇪", "+51", "Perú"],
                          ["🇦🇷", "+54", "Argentina"],
                          ["🇨🇱", "+56", "Chile"],
                          ["🇪🇨", "+593", "Ecuador"],
                          ["🇧🇴", "+591", "Bolivia"],
                          ["🇵🇾", "+595", "Paraguay"],
                          ["🇺🇾", "+598", "Uruguay"],
                          ["🇻🇪", "+58", "Venezuela"],
                          ["🇧🇷", "+55", "Brasil"],
                          ["🇬🇧", "+44", "Reino Unido"],
                          ["🇫🇷", "+33", "Francia"],
                          ["🇩🇪", "+49", "Alemania"],
                          ["🇮🇹", "+39", "Italia"],
                        ]
                          .filter((x) => (x[1] + " " + x[2])
                            .toLowerCase()
                            .includes(countrySearch
                              .toLowerCase()
                              .replace(/^\+/, "")
                              .trim()) || x[1].includes(countrySearch.trim()))
                          .map((x) => (<button
                            type="button"
                            key={x[1]}
                            onClick={() => {
                              setPrefix(x[1]);
                              setCountryOpen(false);
                              setCountrySearch("");
                            }}>
                            <span>
                              {x[0]}
                            </span>
                            <b>
                              {x[1]}
                            </b>
                            <span>
                              {ui(x[2])}
                            </span>
                          </button>))}
                      </div>
                    </div>)}
                  </div>
                  <input
                    className="phone-number-input"
                    required
                    inputMode="tel"
                    placeholder="5555 5555"
                    value={tel}
                    onChange={(e) => setTel(e.target.value.replace(/\D/g, "").slice(0, ["+1", "+52", "+34", "+44"].includes(prefix) ? 10 : 8))}
                    maxLength={["+1", "+52", "+34", "+44"].includes(prefix) ? 10 : 8} />
                </div>
              </label>
              <label>
                <UiText text="Nacionalidad" />
                <input required value={nacionalidad} onChange={(e) => setNacionalidad(e.target.value)} />
              </label>
              <label>
                <UiText text="Hora estimada de llegada" />
                <input required type="time" value={hora} onChange={(e) => setHora(e.target.value)} />
              </label>
            </div>
            <button className="reserve-primary">
              <UiText text="Revisar datos" />
            </button>
          </form>
        </>) : (<div className="data-review">
          <div>
            <small>
              <UiText text="Huésped" />
            </small>
            <b>
              {nombre}
              {" "}
              {apellidos}
            </b>
          </div>
          <div>
            <small>
              {docType}
            </small>
            <b>
              {documento}
            </b>
          </div>
          <div>
            <small>
              <UiText text="Correo" />
            </small>
            <b>
              {correo}
            </b>
          </div>
          <div>
            <small>
              <UiText text="Teléfono" />
            </small>
            <b>
              {prefix}
              {tel}
            </b>
          </div>
          <div>
            <small>
              <UiText text="Nacionalidad" />
            </small>
            <b>
              {nacionalidad}
            </b>
          </div>
          <div>
            <small>
              <UiText text="Hora estimada de llegada" />
            </small>
            <b>
              {hora}
            </b>
          </div>
          <div>
            <small>
              <UiText text="Habitación" />
            </small>
            <b>
              {ui(habitacion)}
            </b>
          </div>
          <div>
            <small>
              <UiText text="Estancia" />
            </small>
            <b>
              {llegada}
              <UiText text=" → " />
              {salida}
            </b>
          </div>
          {draftError && <p role="alert">{draftError}</p>}
          <div className="review-actions">
            <button className="reserve-secondary" onClick={() => setReview(false)}>
              <UiText text="Editar" />
            </button>
            <button className="reserve-primary" onClick={continueBooking}>
              <UiText text="Continuar" />
            </button>
          </div>
        </div>)}
      </section>
    </div>
  </main>);
}
