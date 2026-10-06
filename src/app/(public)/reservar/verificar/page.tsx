"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import VillaSerenaLogo from "@/components/common/VillaSerenaLogo";
import EmailVerificationFlow from "@/components/common/EmailVerificationFlow";
import { usePublicLanguage } from "@/components/common/PublicLanguageToggle";
import { useCurrentGuest } from "@/features/huesped/hooks/useCurrentGuest";
import { BookingAttemptPendingError, readBookingDraft, updateDraftEmail } from "@/lib/bookingDraft";

export default function VerifyEmailPage() {
  const { en } = usePublicLanguage(), router = useRouter(), guest = useCurrentGuest();
  const query = useSearchParams(), draftId = query.get("draft");
  const isPublicBooking = draftId !== null;
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
  const verified = !isPublicBooking && guest?.correoVerificacion?.correo === correo && guest.correoVerificacion.estado === "verificado";
  function volver() {
    router.push(!isPublicBooking && guest ? "/huesped" : "/reservar/datos?" + query.toString());
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
  return <main className="login-overlay-page"><div className="login-overlay-bg" /><section className="floating-login-card max-h-[90dvh] overflow-y-auto">
    <VillaSerenaLogo href="/" /><h1 className="mb-4 text-2xl font-semibold text-[#17365D]">{en ? "Verify your email" : "Verifica tu correo"}</h1>
    {isPublicBooking && loaded && !publicEmail ? <>
      <p role="alert">{en ? "Your details are unavailable or expired. Return to the guest form." : "Tus datos no están disponibles o vencieron. Vuelve al formulario de huésped."}</p>
      <button type="button" className="login-submit" onClick={volver}>{en ? "Back to guest details" : "Volver a datos del huésped"}</button>
    </> : editar ? <form onSubmit={e => { e.preventDefault(); saveEmail(); }}>
      <label>{en ? "Email" : "Correo electrónico"}<input type="email" value={draft} onChange={e => setDraft(e.target.value)} /></label>
      {error && <p role="alert">{error}</p>}
      <button type="submit" className="login-submit">{en ? "Save changes" : "Guardar cambios"}</button>
      <button type="button" onClick={() => setEditar(false)}>{en ? "Cancel" : "Cancelar"}</button>
    </form> : <EmailVerificationFlow key={correo} correo={correo} verificado={Boolean(verified)} onCambiar={changeEmail} onVolver={volver} />}
    {isPublicBooking && publicEmail && !editar && <button type="button" className="login-submit" onClick={() => router.push("/reservar/pago?" + query.toString())}>{en ? "Continue to booking (email pending)" : "Continuar a la reserva (correo pendiente)"}</button>}
  </section></main>;
}
