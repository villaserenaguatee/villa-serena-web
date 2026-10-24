"use client";
import GuatemalaPhoneInput from '@/components/common/GuatemalaPhoneInput';
import PreviousBookingRequest from '@/components/public/PreviousBookingRequest';

import BookingSummaryCard from '@/components/public/BookingSummaryCard';
import { filterGuestNameInput, validBookingEmail, validDocument, validGuestName, validNationalPhone } from "@/lib/guestValidation";
import { UiText, useUiText } from "@/i18n/UiText";
import { type ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import VillaSerenaLogo from "@/components/common/VillaSerenaLogo";
import { usePublicLanguage } from "@/components/common/PublicLanguageToggle";
import { bookingEmail } from '@/lib/bookingEmail';

import { usePublicCatalog, usePublicQuotes } from "@/lib/usePublicCatalog";
import { availableRoom, usePublicAvailability, validGuests } from "@/lib/publicAvailability";
import { saveBookingDraft, readBookingDraft, BookingAttemptPendingError } from "@/lib/bookingDraft";
export default function Datos() {
  const { rooms: publicRooms, connected, loading: catalogLoading, error: catalogError } = usePublicCatalog();
  const ui = useUiText();
  const bookingText = useTranslations("publicBooking");
  const { en } = usePublicLanguage();
  const r = useRouter(), sp = useSearchParams();
  const prefix = '+502';
  const [nombre, setNombre] = useState(""),
    [apellidos, setApellidos] = useState(""),
    [correo, setCorreo] = useState(""),
    [tel, setTel] = useState(""),
    [docType] = useState("DPI"),
    [documento, setDocumento] = useState(""),
    [hora, setHora] = useState(""),
    [review, setReview] = useState(false);
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
  useEffect(() => {
    const draft = readBookingDraft(sp.get("draft") || "");
    if (!draft) return;
    const saved = new URLSearchParams(draft.params);
    setNombre(saved.get("nombre") || ""); setApellidos(saved.get("apellidos") || "");
    setCorreo(saved.get("correo") || ""); setDocumento(saved.get("tipoDocumento") === "Pasaporte" ? "" : saved.get("documento") || "");
    const [code, ...phone] = (saved.get("telefono") || "+502 ").split(" ");
    // Do not silently reinterpret an existing international draft as Guatemala.
    setTel(code === prefix ? phone.join('').replace(/\D/g, '').slice(0, 8) : ''); setHora(saved.get("hora") || "");
    if(sp.get('editar')==='1') {
      setReview(false);setValidationShown(false);setDraftError('');
      continueLock.current=false;setContinuing(false);
    }
  }, [sp]);
  async function continueBooking() {
    if (!available || continueLock.current) return;
    if (!validGuestName(nombre) || !validGuestName(apellidos)) {
      setValidationShown(true); setReview(false); return;
    }
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
  const formRef = useRef<HTMLFormElement>(null);
  const fieldErrors = {
    nombre: !validGuestName(nombre) ? 'Complete este campo' : '',
    apellidos: !validGuestName(apellidos) ? 'Complete este campo' : '',
    documento: !documento.trim() ? 'Complete este campo' : !validDocument(docType, documento) ? 'Ingrese los 13 dígitos del DPI' : '',
    correo: !correo.trim() ? 'Complete este campo' : !validBookingEmail(correo) ? 'Ingrese un correo electrónico válido' : '',
    tel: !tel.trim() ? 'Complete este campo' : !validNationalPhone(prefix, tel) ? 'Ingrese los 8 dígitos del teléfono' : '',
  };
  const nombreError = validationShown && Boolean(fieldErrors.nombre);
  const apellidosError = validationShown && Boolean(fieldErrors.apellidos);
  function editGuestName(field: 'nombre' | 'apellidos', event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget, original = input.value;
    const filtered = filterGuestNameInput(original);
    const caret = filterGuestNameInput(original.slice(0, input.selectionStart ?? original.length)).length;
    (field === 'nombre' ? setNombre : setApellidos)(filtered);
    if (filtered !== original) {
      input.value = filtered;
      input.setSelectionRange(caret, caret);
    }
  }
  async function submit(e: FormEvent) {
    e.preventDefault();
    if(reviewLock.current)return;
    setValidationShown(true);
    const firstError = (Object.keys(fieldErrors) as Array<keyof typeof fieldErrors>).find(key => fieldErrors[key]);
    if (firstError) {
      setDraftError('');
      formRef.current?.querySelector<HTMLInputElement>(`input[name="${firstError}"]`)?.focus();
      return;
    }
    if (`${nombre.trim()} ${apellidos.trim()}`.length > 150 || correo.length > 150) {
      setDraftError(en ? "Use up to 150 characters for your full name and email." : "Usa hasta 150 caracteres en el nombre completo y correo.");
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
  return (<main className="reserve-public booking-checkout booking-data-page"><PreviousBookingRequest/>
    <header className="reserve-nav">
      <button className="icon-back" onClick={() => r.back()}>
        <ArrowLeft />
      </button>
      <VillaSerenaLogo />
    </header>
    <div className="checkout-layout">
      <BookingSummaryCard image={room?.image} name={room?.name || sp.get("habitacion") || ""} category={room?.type} arrival={llegada} departure={salida} adults={Number(adultos)} childCount={Number(ninos)} nights={nights} nightlyPrice={room?.price} total={total} note={connected ? room?.inventoryNote : undefined}/>
      <div className="booking-form-column">
      <section data-vs-ui="compact" className="reserve-form-card reserve-form-wide checkout-form">
        <span className="reserve-kicker">
          <UiText text="RESERVA · DATOS DEL HUÉSPED" />
        </span>
        <h1>
          {ui(review ? "Revisa tus datos" : "Introduce tus datos")}
        </h1>
        {!review ? (<>
          <form data-vs-ui="compact" ref={formRef} noValidate onSubmit={submit}>
            {draftError && <p role="alert">{draftError}</p>}
            <div className="guest-form-grid">
              <label>
                <UiText text="Nombre" />
                <input name="nombre" required value={nombre} aria-label="Nombre"
                  aria-invalid={nombreError} aria-describedby="reservation-first-name-error"
                  onChange={(e) => editGuestName('nombre', e)} />
                {nombreError && <small id="reservation-first-name-error" role="alert" className="text-red-800">{fieldErrors.nombre}</small>}
              </label>
              <label>
                <UiText text="Apellidos" />
                <input name="apellidos" required value={apellidos} aria-label="Apellidos"
                  aria-invalid={apellidosError} aria-describedby="reservation-last-name-error"
                  onChange={(e) => editGuestName('apellidos', e)} />
                {apellidosError && <small id="reservation-last-name-error" role="alert" className="text-red-800">{fieldErrors.apellidos}</small>}
              </label>
              <label>
                <UiText text="DPI" />
                <input
                  name="documento"
                  aria-label={en ? 'Document number' : 'Número de documento'}
                  required
                  value={documento}
                  aria-invalid={validationShown && Boolean(fieldErrors.documento)}
                  aria-describedby="reservation-document-error"
                  onChange={(e) => setDocumento(e.target.value.replace(/\D/g, "").slice(0, 13))}
                  pattern="[0-9]{13}"
                  title="Exactamente 13 dígitos"
                  maxLength={13}
                  inputMode="numeric" />
                {validationShown && fieldErrors.documento && <small id="reservation-document-error" role="alert" className="text-red-800">{fieldErrors.documento}</small>}
              </label>
              <label>
                <UiText text="Correo electrónico" />
                <input name="correo" required type="email" value={correo} aria-invalid={validationShown && Boolean(fieldErrors.correo)} aria-describedby="reservation-email-error" onChange={(e) => setCorreo(e.target.value)} />
                {validationShown && fieldErrors.correo && <small id="reservation-email-error" role="alert" className="text-red-800">{fieldErrors.correo}</small>}
              </label>
              <label className="booking-phone-field">
                <UiText text="Teléfono" />
                <GuatemalaPhoneInput name="tel" label={en?'Phone':'Teléfono'} value={tel} onChange={setTel} error={validationShown?fieldErrors.tel:undefined} height={52}/>
              </label>
              <label>
                <UiText text="Hora estimada de llegada (opcional)" />
                <input name="hora" type="time" value={hora} onChange={(e) => setHora(e.target.value)} />
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
          {hora && <div>
            <small>
              <UiText text="Hora estimada de llegada" />
            </small>
            <b>
              {hora}
            </b>
          </div>}
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
    </div>
  </main>);
}
