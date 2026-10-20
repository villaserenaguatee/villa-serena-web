"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import VillaSerenaLogo from "@/components/common/VillaSerenaLogo";
import EmailVerificationFlow from "@/components/common/EmailVerificationFlow";
import { usePublicLanguage } from "@/components/common/PublicLanguageToggle";
import { useCurrentGuest } from "@/features/huesped/hooks/useCurrentGuest";
import { BookingAttemptPendingError, bookingDataHref, readBookingDraft, updateDraftEmail } from "@/lib/bookingDraft";
import { bookingEmail, waitForBookingEmail } from '@/lib/bookingEmail';
import { ArrowLeft } from 'lucide-react';

export default function VerifyEmailPage() {
  const { en } = usePublicLanguage(), router = useRouter(), guest = useCurrentGuest();
  const query = useSearchParams(), draftId = query.get("draft");
  const isPublicBooking = draftId !== null;
  const leaving=useRef(false);
  const bookingText = useTranslations("publicBooking");
  const [publicEmail, setPublicEmail] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [editar, setEditar] = useState(false), [draft, setDraft] = useState(""), [error, setError] = useState("");
  useEffect(() => {
    const saved = readBookingDraft(draftId || "");
    setPublicEmail(new URLSearchParams(saved?.params || "").get("correo") || "");
    setLoaded(true); setEditar(false); setError("");
  }, [draftId]);
  // A public booking keeps its own guest, even when a different guest is signed in.
  const correo = isPublicBooking ? publicEmail : guest?.correo || "";
  const [serverVerified, setServerVerified] = useState(false);
  const [requested, setRequested] = useState(false), [wait, setWait] = useState(0), [checking, setChecking] = useState(true);
  const verified = isPublicBooking ? serverVerified : guest?.correoVerificacion?.correo === correo && guest.correoVerificacion.estado === "verificado";
  useEffect(() => {
    setServerVerified(false);
    setChecking(true); setRequested(false); setWait(0);
    if (!isPublicBooking || !correo || !draftId) return;
    let active = true;
    bookingEmail('estado', { correo, borrador: draftId }, en).then(async initial => { const result=initial.envio==='PENDIENTE' ? await waitForBookingEmail({correo,borrador:draftId},en) : initial; if (active && !leaving.current) { setServerVerified(result.verificado === true); setRequested(result.solicitado === true); setWait(result.reenviarEn || 0); } }).catch(error => { if (active && !leaving.current) setError(error.message); }).finally(() => { if (active && !leaving.current) setChecking(false); });
    return () => { active = false; };
  }, [correo, draftId, isPublicBooking, en]);
  const service = useMemo(() => isPublicBooking && draftId ? {
    reenviar: async (address: string) => {
      const saved = new URLSearchParams(readBookingDraft(draftId)?.params || '');
      setError('');
      const input={correo:address,borrador:draftId};
      try { await bookingEmail('solicitar', { ...input, nombre: `${saved.get('nombre') || ''} ${saved.get('apellidos') || ''}`.trim() }, en); }
      catch(error) { const status=await bookingEmail('estado',input,en).catch(()=>null); if(!status?.solicitado && status?.envio!=='PENDIENTE') throw error; }
      await waitForBookingEmail(input,en);
      setServerVerified(false);
    },
    verificar: async (address: string, code: string): Promise<'verificado' | 'invalido' | 'expirado'> => {
      const result = await bookingEmail('verificar', { correo: address, borrador: draftId, codigo: code }, en);
      return result.verificado ? 'verificado' : 'invalido';
    },
  } : undefined, [isPublicBooking, draftId, en]);
  async function continueVerified() {
    if (!draftId || !correo || leaving.current) return;
    try {
      const result = await bookingEmail('estado', { correo, borrador: draftId }, en);
      if (leaving.current) return;
      if (result.verificado) router.replace('/reservar/pago?' + query.toString());
      else { setServerVerified(false); setError(en ? 'Verify your email before continuing.' : 'Verifica tu correo antes de continuar.'); }
    } catch (error) { setError(error instanceof Error ? error.message : ''); }
  }
  function volver() {
    leaving.current=true;
    router.replace(!isPublicBooking && guest ? "/huesped" : bookingDataHref(draftId || '', new URLSearchParams(query)));
  }
  function changeEmail() {
    if (!isPublicBooking && guest) { volver(); return; }
    setDraft(correo); setEditar(true);
  }
  function saveEmail() {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.trim())) {
      setError(en ? "Enter a valid email." : "Introduce un correo válido."); return;
    }
    try {
      if (!isPublicBooking && guest) { volver(); return; }
      updateDraftEmail(draftId || "", draft.trim());
      setPublicEmail(draft.trim()); setEditar(false); setError("");
    } catch (error) {
      setError(error instanceof BookingAttemptPendingError ? bookingText("requestUncertain") : en ? "Could not save." : "No se pudo guardar.");
    }
  }
  return <main className="login-overlay-page booking-verification-page"><div className="login-overlay-bg" /><section data-vs-ui="compact" className="floating-login-card booking-verification-card max-h-[90dvh] overflow-y-auto">
    <button type="button" className="booking-verification-back" onClick={volver} aria-label={en ? 'Back' : 'Volver'}><ArrowLeft size={24} /></button>
    <VillaSerenaLogo href="/" compact /><h1>{en ? "Verify your email" : "Verifica tu correo"}</h1>
    {isPublicBooking && loaded && !publicEmail ? <>
      <p role="alert">{en ? "Your details are unavailable or expired. Return to the guest form." : "Tus datos no están disponibles o vencieron. Vuelve al formulario de huésped."}</p>
      <button type="button" className="login-submit" onClick={volver}>{en ? "Back to guest details" : "Volver a datos del huésped"}</button>
    </> : editar ? <form data-vs-ui="compact" onSubmit={e => { e.preventDefault(); saveEmail(); }}>
      <label>{en ? "Email" : "Correo electrónico"}<input type="email" value={draft} onChange={e => setDraft(e.target.value)} /></label>
      {error && <p role="alert">{error}</p>}
      <button type="submit" className="login-submit">{en ? "Save changes" : "Guardar cambios"}</button>
      <button type="button" onClick={() => setEditar(false)}>{en ? "Cancel" : "Cancelar"}</button>
    </form> : <EmailVerificationFlow key={correo} correo={correo} verificado={Boolean(verified)} onCambiar={changeEmail} onVolver={volver} servicio={service} purpose={isPublicBooking ? 'booking' : undefined} solicitado={requested} reenviarEn={wait} loading={checking} onVerificado={() => { setServerVerified(true); void continueVerified(); }} />}
    {!editar && error && <p role="alert">{error}</p>}
  </section></main>;
}
