"use client";
import BookingDraftActions from '@/components/common/BookingDraftActions';
import { passportCountries, validPassportIssuer, validDocument, validNationalPhone } from "@/lib/guestValidation";
import { UiText, useUiText } from "@/i18n/UiText";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import VillaSerenaLogo from "@/components/common/VillaSerenaLogo";
import { usePublicLanguage } from "@/components/common/PublicLanguageToggle";
import { bookingEmail } from '@/lib/bookingEmail';
import { money } from "@/data/publicRooms";
import { usePublicCatalog, usePublicQuotes } from "@/lib/usePublicCatalog";
import { availableRoom, usePublicAvailability, validGuests } from "@/lib/publicAvailability";
import { saveBookingDraft, readBookingDraft, mergeBookingProfile, BookingAttemptPendingError } from "@/lib/bookingDraft";
import BookingCountryPicker from "@/components/common/BookingCountryPicker";
import { getCountryCallingCode } from "libphonenumber-js/max";
export default function Datos() {
  const { rooms: publicRooms, connected, loading: catalogLoading, error: catalogError } = usePublicCatalog();
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
    [passportIssuer, setPassportIssuer] = useState(''),
    [documento, setDocumento] = useState(""),
    [nacionalidad, setNacionalidad] = useState("Guatemala"),
    [hora, setHora] = useState("15:00"),
    [review, setReview] = useState(false);
  const countryOptions = useMemo(() => {
    const names = new Intl.DisplayNames([en ? 'en' : 'es'], { type: 'region' });
    return passportCountries.map(code => ({ value: code, label: names.of(code) || code })).sort((a, b) => a.label.localeCompare(b.label, en ? 'en' : 'es'));
  }, [en]);
  const phoneOptions = useMemo(() => countryOptions.map(o => ({ value: '+' + getCountryCallingCode(o.value as typeof passportCountries[number]), label: o.label + ' (+' + getCountryCallingCode(o.value as typeof passportCountries[number]) + ')' })), [countryOptions]);
  const habitacion = sp.get("habitacion") || "",
    llegada = sp.get("llegada") || "",
    salida = sp.get("salida") || "",
    adultos = sp.get("adultos") || sp.get("huespedes") || "1",
    ninos = sp.get("ninos") || "0",
    huespedes = String(Number(adultos) + Number(ninos));
  const room = publicRooms.find((x) => sp.get("slug") ? x.slug === sp.get("slug") : x.name === habitacion);
  const inventory = usePublicAvailability({ arrival: llegada, departure: salida, adults: Number(adultos), children: Number(ninos) }, room?.capacity ?? 0, !connected);
  const quoteResult = usePublicQuotes(llegada, salida, Number(adultos), Number(ninos), room?.capacity ?? 0);
  const quote = quoteResult.quotes.find(q => q.ofertaSlug === room?.slug);
  const physical = room && validGuests(Number(adultos), Number(ninos)) ? availableRoom(room, llegada, salida, Number(huespedes), inventory, sp.get("habitacionId") || undefined) : undefined;
  const available = Boolean(quote) && (connected || Boolean(physical));
  const nights = useMemo(() => {
    if (!llegada || !salida)
      return 1;
    return Math.max(1, Math.ceil((new Date(salida).getTime() - new Date(llegada).getTime()) / 86400000));
  }, [llegada, salida]);
  const total = quote?.total ?? 0;
  const [draftError, setDraftError] = useState("");
  const continueLock = useRef(false);
  const reviewLock=useRef(false);
  const [savingReview,setSavingReview]=useState(false);
  const [continuing, setContinuing] = useState(false);
  const [socialBusy, setSocialBusy] = useState(false), [socialMessage, setSocialMessage] = useState("");
  useEffect(() => {
    const draft = readBookingDraft(sp.get("draft") || "");
    if (!draft) return;
    const saved = new URLSearchParams(draft.params);
    setNombre(saved.get("nombre") || ""); setApellidos(saved.get("apellidos") || "");
    setCorreo(saved.get("correo") || ""); setDocumento(saved.get("documento") || "");
    setDocType(saved.get("tipoDocumento") || "DPI"); setNacionalidad(saved.get("nacionalidad") || "Guatemala");
    setPassportIssuer(saved.get('paisEmisorPasaporte') || '');
    const [code, ...phone] = (saved.get("telefono") || "+502 ").split(" ");
    setPrefix(code); setTel(phone.join(" ")); setHora(saved.get("hora") || "15:00");
    if(sp.get('editar')==='1') {
      setReview(false);setValidationShown(false);setDraftError('');
      continueLock.current=false;setContinuing(false);
    }
  }, [sp]);
  useEffect(() => {
    const status = sp.get('social'), draftId = sp.get('draft');
    if (!status) return;
    if (status !== 'profile' || !draftId) {
      setSocialMessage(status === 'cancelled' ? (en ? 'Sign-in cancelled. Your booking details are preserved; you can continue with email.' : 'Acceso cancelado. Conservamos los datos de tu reserva; puedes continuar con correo.') : (en ? 'Sign-in could not be completed. You can retry or continue with email.' : 'No se pudo completar el acceso. Puedes reintentar o continuar con correo.'));
      return;
    }
    const controller = new AbortController();
    fetch('/api/auth/booking-social/profile?draft=' + encodeURIComponent(draftId), { cache: 'no-store', signal: controller.signal }).then(async response => {
      if (!response.ok) throw new Error('profile');
      const profile = await response.json();
      const params = mergeBookingProfile(draftId, profile);
      setNombre(params.get('nombre') || ''); setApellidos(params.get('apellidos') || ''); setCorreo(params.get('correo') || '');
      setSocialMessage(en ? 'Profile received. Review and complete your details to continue; no booking has been created.' : 'Perfil recibido. Revisa y completa tus datos para continuar; todavía no se ha creado una reserva.');
    }).catch(() => { if (!controller.signal.aborted) setSocialMessage(en ? 'Your profile could not be loaded. Your booking details are preserved; continue with email.' : 'No se pudo cargar tu perfil. Conservamos los datos de tu reserva; continúa con correo.'); });
    return () => controller.abort();
  }, [sp, en]);
  async function socialLogin(provider: 'google' | 'facebook') {
    if (socialBusy) return;
    setMethod(provider); setSocialBusy(true); setSocialMessage('');
    try {
      const query = saveBookingDraft(q(), sp.get('draft') || '');
      // Put the draft in history before leaving, including when configuration is absent.
      window.history.replaceState(null, '', '/reservar/datos?' + query.toString());
      const response = await fetch(`/api/auth/booking-social/${provider}/start`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: query.toString() }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.codigo === 'SOCIAL_NO_CONFIGURADO' ? 'configuration' : 'request');
      window.location.assign(result.url);
    } catch (error) {
      setSocialMessage(error instanceof BookingAttemptPendingError ? bookingText('requestUncertain') : error instanceof Error && error.message === 'configuration' ? (en ? 'This sign-in option is not available yet. Your booking details are preserved; continue with email.' : 'Esta opción de acceso todavía no está disponible. Conservamos los datos de tu reserva; continúa con correo.') : (en ? 'Sign-in could not be started. You can retry or continue with email.' : 'No se pudo iniciar el acceso. Puedes reintentar o continuar con correo.'));
      setSocialBusy(false);
    }
  }
  async function continueBooking() {
    if (!available || continueLock.current) return;
    continueLock.current = true; setContinuing(true);
    try {
      const params = q(), saved = saveBookingDraft(params, sp.get('draft') || '');
      const status = await bookingEmail('estado', { correo: params.get('correo') || '', borrador: saved.get('draft') || '' }, en).catch(() => ({ verificado: false }));
      r.push((status.verificado ? '/reservar/pago?' : '/reservar/verificar?') + saved);
    }
    catch (error) { continueLock.current = false; setContinuing(false); setDraftError(error instanceof BookingAttemptPendingError ? bookingText("requestUncertain") : en ? "Could not save your details. Try again." : "No se pudieron guardar tus datos. Intenta nuevamente."); }
  }
  const q = () => new URLSearchParams({
    nombre,
    apellidos,
    correo,
    telefono: `${prefix} ${tel}`,
    tipoDocumento: docType,
    documento,
    paisEmisorPasaporte: docType === 'Pasaporte' ? passportIssuer : '',
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
  const [validationShown, setValidationShown] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    if(reviewLock.current)return;
    setValidationShown(true);
    if (!validDocument(docType, documento) || (docType === 'Pasaporte' && !validPassportIssuer(passportIssuer)) || !validNationalPhone(prefix, tel)) return;
    if (![nombre, apellidos, correo, tel, documento, nacionalidad].every(v => v.trim())) {
      setDraftError(en ? "Complete all required guest details." : "Completa todos los datos obligatorios del huésped.");
      return;
    }
    if (`${nombre.trim()} ${apellidos.trim()}`.length > 150 || correo.length > 150 || nacionalidad.length > 60) {
      setDraftError(en ? "Use up to 150 characters for your full name and email, and 60 for nationality." : "Usa hasta 150 caracteres en el nombre completo y correo, y 60 en nacionalidad.");
      return;
    }
    setDraftError("");
    if (available) {
      reviewLock.current=true;setSavingReview(true);
      try {
        const params=q(),id=sp.get('draft')||'',previous=readBookingDraft(id);
        if(previous?.attempt&&previous.params!==params.toString())throw new BookingAttemptPendingError();
        const oldEmail=new URLSearchParams(previous?.params||'').get('correo')||'';
        if(previous&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(oldEmail.trim())&&oldEmail.trim().toLowerCase()!==correo.trim().toLowerCase())await bookingEmail('actualizar',{correo,borrador:id,anterior:oldEmail},en);
        const saved=saveBookingDraft(params,id);
        setReview(true);
        r.replace('/reservar/datos?'+saved.toString());
      } catch(error) {
        setDraftError(error instanceof BookingAttemptPendingError?bookingText('requestUncertain'):en?'Could not save your details. Try again.':'No se pudieron guardar tus datos. Intenta nuevamente.');
      } finally {reviewLock.current=false;setSavingReview(false);}
    }
  }
  if (!available)
    return (<main className="reserve-public">
      <p role="status">
        {catalogError || (!catalogLoading && quoteResult.error) || (catalogLoading || quoteResult.loading || (!connected && !inventory) ? (en ? "Loading availability..." : "Cargando disponibilidad...") : !connected && inventory?.error ? (en ? "Availability could not be checked. Try again." : "No se pudo consultar la disponibilidad. Intenta nuevamente.") : (en ? "This room is unavailable or the stay is invalid." : "La habitación no está disponible o la estancia no es válida."))}
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
        {connected && <p role="note">{room?.inventoryNote}</p>}
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
          <div className="social-booking social-booking-google-only">
            <button type="button" disabled={socialBusy} onClick={() => void socialLogin('google')} className={method === "google" ? "active" : ""}>
              <span aria-hidden="true">G&nbsp;&nbsp;</span>
              {en ? "Fill in with Google" : "Completar con Google"}
            </button>
          </div>
          {socialBusy && <p role="status">{en ? 'Opening sign-in…' : 'Abriendo acceso…'}</p>}
          {socialMessage && <p role="status">{socialMessage}</p>}
          <div className="or-divider">
            <span>
              {en ? "or fill in your details manually" : "o completa tus datos manualmente"}
            </span>
          </div>
          <form onSubmit={submit} onInvalidCapture={() => setValidationShown(true)}>
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
              <label className="booking-document-type">
                <UiText text="Tipo de documento" />
                <select value={docType} onChange={(e) => { setDocType(e.target.value); if (e.target.value === 'DPI') setDocumento(value => value.replace(/\D/g, '').slice(0, 13)); }}>
                  <option value="DPI">DPI</option>
                  <option value="Pasaporte">
                    {ui("Pasaporte")}
                  </option>
                </select>
              </label>
              {docType === 'Pasaporte' && <label>
                {en ? 'Passport issuing country' : 'País emisor del pasaporte'}
                <BookingCountryPicker label={en ? 'Passport issuing country' : 'País emisor del pasaporte'} value={passportIssuer} options={countryOptions} onChange={setPassportIssuer} en={en} />
                {validationShown && !validPassportIssuer(passportIssuer) && <small id="reservation-issuer-error" role="alert" className="text-red-800">{en ? 'Select the passport issuing country.' : 'Selecciona el país emisor del pasaporte.'}</small>}
              </label>}
              <label>
                <UiText text="Número de documento" />
                <input
                  aria-label={en ? 'Document number' : 'Número de documento'}
                  required
                  value={documento}
                  aria-invalid={validationShown && !validDocument(docType, documento)}
                  aria-describedby="reservation-document-error"
                  onChange={(e) => setDocumento(docType === "DPI" ? e.target.value.replace(/\D/g, "").slice(0, 13) : e.target.value)}
                  pattern={docType === 'DPI' ? '[0-9]{13}' : '[A-Za-z0-9]+'}
                  title={docType === 'DPI' ? (en ? 'Exactly 13 digits' : 'Exactamente 13 dígitos') : (en ? 'Use the letters and numbers printed on your passport' : 'Usa las letras y números impresos en tu pasaporte')}
                  maxLength={docType === "DPI" ? 13 : 30}
                  inputMode={docType === "DPI" ? "numeric" : "text"} />
                {validationShown && !validDocument(docType, documento) && <small id="reservation-document-error" role="alert" className="text-red-800">{docType === 'DPI' ? (en ? 'The DPI must contain exactly 13 digits.' : 'El DPI debe contener exactamente 13 dígitos.') : (en ? 'Use letters and numbers only, within the supported 30-character storage limit.' : 'Usa solo letras y números, dentro del límite de almacenamiento de 30 caracteres.')}</small>}
              </label>
              <label>
                <UiText text="Correo electrónico" />
                <input required type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} />
              </label>
              <label className="booking-phone-field">
                <UiText text="Teléfono" />
                <div className="phone-combo">
                  <BookingCountryPicker compact label={en ? 'Phone country code' : 'Prefijo telefónico'} value={prefix} options={phoneOptions} onChange={code => { setPrefix(code); setTel(value => value.replace(/\D/g, '').slice(0, code === '+502' ? 8 : 15 - code.length + 1)); }} en={en} />
                  <input
                    className="phone-number-input"
                    aria-label={en ? 'Phone' : 'Teléfono'}
                    required
                    inputMode="tel"
                    value={tel}
                    aria-invalid={validationShown && !validNationalPhone(prefix, tel)}
                    aria-describedby="reservation-phone-error"
                    onChange={(e) => setTel(e.target.value.replace(/\D/g, "").slice(0, prefix === "+502" ? 8 : 15 - prefix.length + 1))}
                    maxLength={prefix === '+502' ? 8 : 15 - prefix.length + 1} pattern={prefix === '+502' ? '[0-9]{8}' : '[0-9]+'} />
                </div>
                {validationShown && !validNationalPhone(prefix, tel) && <small id="reservation-phone-error" role="alert" className="text-red-800">{prefix === '+502' ? (en ? 'Enter exactly 8 digits, without repeating +502. Letters are not allowed.' : 'Introduce exactamente 8 dígitos, sin repetir +502. No se admiten letras.') : (en ? 'Enter a valid number for the selected country, without repeating the country code.' : 'Introduce un número válido para el país elegido, sin repetir el prefijo.')}</small>}
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
            <button className="reserve-primary" disabled={savingReview}>
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
          {docType === 'Pasaporte' && <div><small>{en ? 'Passport issuing country' : 'País emisor del pasaporte'}</small><b>{new Intl.DisplayNames([en ? 'en' : 'es'], { type: 'region' }).of(passportIssuer)}</b></div>}
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
            <button className="reserve-primary" disabled={continuing} onClick={continueBooking}>
              <UiText text="Continuar" />
            </button>
          </div>
        </div>)}
      </section>
    </div>
    <BookingDraftActions />
  </main>);
}
