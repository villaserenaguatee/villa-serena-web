"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import VillaSerenaLogo from "@/components/common/VillaSerenaLogo";
import EmailVerificationFlow from "@/components/common/EmailVerificationFlow";
import { usePublicLanguage } from "@/components/common/PublicLanguageToggle";
import { useCurrentGuest } from "@/features/huesped/hooks/useCurrentGuest";
export default function VerifyEmailPage() {
  const { en } = usePublicLanguage(), router = useRouter(), guest = useCurrentGuest();
  const [publicEmail, setPublicEmail] = useState("");
  const [editar, setEditar] = useState(false), [draft, setDraft] = useState(""), [error, setError] = useState("");
  useEffect(() => { setPublicEmail(new URLSearchParams(window.location.search).get("correo") || ""); }, []);
  const correo = guest?.correo || publicEmail;
  function volver() { router.push(guest ? "/huesped" : "/reservar/datos" + window.location.search); }
  return <main className="login-overlay-page"><div className="login-overlay-bg" /><section className="floating-login-card max-h-[90dvh] overflow-y-auto">
    <VillaSerenaLogo href="/" /><h1 className="mb-4 text-2xl font-semibold text-[#17365D]">{en ? "Verify your email" : "Verifica tu correo"}</h1>
    {editar ? <form onSubmit={e => { e.preventDefault(); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.trim())) { setError(en ? "Enter a valid email." : "Introduce un correo válido."); return; } try { if (guest) { volver(); return; } else { setPublicEmail(draft.trim()); const params = new URLSearchParams(window.location.search); params.set("correo", draft.trim()); window.history.replaceState(null, "", "?" + params); } setEditar(false); setError(""); } catch { setError(en ? "Could not save." : "No se pudo guardar."); } }}>
      <label>{en ? "Email" : "Correo electrónico"}<input type="email" value={draft} onChange={e => setDraft(e.target.value)} /></label>{error && <p role="alert">{error}</p>}<button type="submit" className="login-submit">{en ? "Save changes" : "Guardar cambios"}</button><button type="button" onClick={() => setEditar(false)}>{en ? "Cancel" : "Cancelar"}</button>
    </form> : <EmailVerificationFlow key={correo} correo={correo} verificado={guest?.correoVerificacion?.correo === correo && guest.correoVerificacion.estado === "verificado"} onCambiar={() => { if (guest) { volver(); return; } setDraft(correo); setEditar(true); }} onVolver={volver} />}
  </section></main>;
}
