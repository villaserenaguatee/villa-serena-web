"use client";
import { useEffect, useRef, useState } from "react";
import { usePublicLanguage } from "@/components/common/PublicLanguageToggle";
import VerificationDigits from './VerificationDigits';
export type VerificationState = "pendiente" | "verificando" | "verificado" | "invalido" | "expirado" | "error";
export interface EmailVerificationService {
  reenviar: (correo: string) => Promise<void>;
  verificar: (correo: string, codigo: string) => Promise<"verificado" | "invalido" | "expirado">;
}
export default function EmailVerificationFlow({ correo, verificado = false, onCambiar, onVolver, onVerificado, servicio, purpose, solicitado = false, reenviarEn = 0, loading = false }: { correo: string; verificado?: boolean; onCambiar: () => void; onVolver: () => void; onVerificado?: () => void; servicio?: EmailVerificationService; purpose?: 'booking'; solicitado?: boolean; reenviarEn?: number; loading?: boolean }) {
  const { en } = usePublicLanguage();
  const tr = (es: string, english: string) => en ? english : es;
  const [estado, setEstado] = useState<VerificationState>(verificado ? "verificado" : "pendiente");
  const [codigo, setCodigo] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [digitsVersion,setDigitsVersion]=useState(0);
  const [detalle, setDetalle] = useState(''), [cooldown, setCooldown] = useState(0);
  const busy = useRef(false);
  useEffect(() => { setEstado(verificado ? 'verificado' : 'pendiente'); }, [verificado]);
  useEffect(() => { setEnviado(solicitado); setCooldown(Math.max(0, reenviarEn)); }, [solicitado, reenviarEn]);
  useEffect(() => { if (!cooldown) return; const timer = setTimeout(() => setCooldown(cooldown - 1), 1000); return () => clearTimeout(timer); }, [cooldown]);
  async function ejecutar(reenviar: boolean) {
    if (busy.current || (reenviar && cooldown > 0)) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo) || (!reenviar && !/^\d{6}$/.test(codigo))) { setEstado("invalido"); return; }
    busy.current = true; setEstado("verificando"); setDetalle('');
    try {
      if (!servicio) throw new Error("Integration required");
      if (reenviar) { await servicio.reenviar(correo); setEnviado(true); setCodigo('');setDigitsVersion(v=>v+1); setCooldown(60); setEstado("pendiente"); }
      else { const result = await servicio.verificar(correo, codigo); setEstado(result); if (result === "verificado") { setCodigo(""); onVerificado?.(); } }
    } catch (error) { setEstado("error"); if (servicio && error instanceof Error) setDetalle(error.message); }
    finally { busy.current = false; }
  }
  const messages: Record<VerificationState, string> = {
    pendiente: tr("Pendiente de verificación", "Pending verification"),
    verificando: tr("Procesando solicitud…", "Processing request…"),
    verificado: tr("Correo verificado", "Email verified"),
    invalido: tr("Correo, enlace o código inválido. Revisa los datos.", "Invalid email, link or code. Check the details."),
    expirado: tr("La verificación expiró. Solicita un nuevo código.", "Verification expired. Request a new code."),
    error: servicio ? tr("No se pudo completar la solicitud. Puedes reintentar.", "The request failed. You can retry.") : tr("No se envió ningún correo: falta conectar el proveedor de verificación. Tu correo sigue pendiente.", "No email was sent: verification provider integration is required. Your email is still pending."),
  };
  if (purpose === 'booking') return <div className="booking-verification-flow">
    <p className="booking-verification-explanation">{enviado && tr('Código enviado a ', 'Code sent to ')}<strong>{correo.slice(0,1)+'***@'+correo.split('@')[1]}</strong></p>
    {loading && <p role="status">{tr('Comprobando…', 'Checking…')}</p>}
    {['error', 'invalido', 'expirado'].includes(estado) && <p role="alert" className="text-sm text-red-800">{detalle || messages[estado]}</p>}
    {verificado ? <p role="status">{tr('Correo verificado', 'Email verified')}</p> : !enviado ? <button type="button" className="login-submit" disabled={loading || estado === 'verificando'} onClick={() => void ejecutar(true)}>{estado === 'verificando' ? tr('Enviando…', 'Sending…') : tr('Enviar código', 'Send code')}</button> : <form data-vs-ui="compact" onSubmit={e => { e.preventDefault(); void ejecutar(false); }}>
      <VerificationDigits key={digitsVersion} en={en} disabled={loading||estado==='verificando'} onChange={setCodigo}/>
      <button type="submit" className="login-submit" disabled={loading || estado === 'verificando'}>{estado === 'verificando' ? tr('Verificando…', 'Verifying…') : tr('Verificar y continuar', 'Verify and continue')}</button>
      <button type="button" className="booking-verification-secondary" disabled={estado === 'verificando' || cooldown > 0} onClick={() => void ejecutar(true)}>{cooldown ? tr(`Reenviar código en ${cooldown} s`, `Resend code in ${cooldown}s`) : tr('Reenviar código', 'Resend code')}</button>
    </form>}
  </div>;
  return <div className="space-y-4 text-[#17365D]">
    <p className="text-sm text-[#72829A]">{purpose === 'booking' ? tr('Verifica el correo de esta reserva. El código dura 10 minutos, es de un solo uso y no sirve para iniciar sesión.', 'Verify the email for this booking. The code lasts 10 minutes, is single-use and cannot be used to sign in.') : tr("Verifica la dirección asociada a tu perfil.", "Verify the address associated with your profile.")}</p>
    <p className="break-all rounded-xl border border-[#E6E0D7] bg-[#F8F6F0] p-3 font-semibold">{correo || tr("Correo sin indicar", "No email provided")}</p>
    <p role={estado === "error" || estado === "invalido" || estado === "expirado" ? "alert" : "status"} data-state={estado} className="rounded-xl border border-[#E6E0D7] p-3 text-sm">{estado === 'error' && detalle ? detalle : messages[estado]}</p>
    {enviado && <p role="status">{tr("Solicitud recibida. Revisa tu bandeja de entrada.", "Request received. Check your inbox.")}</p>}
    {estado !== "verificado" && <form data-vs-ui="compact" className="space-y-3" onSubmit={e => { e.preventDefault(); void ejecutar(false); }}>
      <label className="block text-sm font-semibold">{tr("Código de verificación", "Verification code")}<input value={codigo} onChange={e => setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" maxLength={6} className="mt-2 w-full rounded-xl border border-[#D9D3CA] p-3 tracking-[0.3em]" /></label>
      {!servicio && <p className="text-sm text-[#72829A]">{tr("Formulario preparado para integrar el servicio. No existe un código de prueba ni se verifica el correo localmente.", "Form ready for service integration. There is no test code or local email verification.")}</p>}
      <div className="flex flex-wrap gap-3"><button disabled={estado === "verificando"} type="submit" className="rounded-xl bg-[#17365D] px-4 py-2 font-semibold text-white disabled:opacity-50">{tr("Verificar correo", "Verify email")}</button><button disabled={estado === "verificando" || cooldown > 0} type="button" onClick={() => void ejecutar(true)} className="rounded-xl border border-[#17365D] px-4 py-2 disabled:opacity-50">{cooldown ? tr(`Reenviar en ${cooldown} s`, `Resend in ${cooldown}s`) : enviado ? tr("Reenviar", "Resend") : tr('Solicitar código', 'Request code')}</button></div>
    </form>}
    <div data-vs-actions="compact" className="flex flex-wrap gap-3 border-t border-[#E6E0D7] pt-3"><button type="button" disabled={estado === "verificando"} onClick={onCambiar} className="font-semibold underline">{tr("Cambiar correo", "Change email")}</button><button type="button" onClick={onVolver} className="font-semibold underline">{tr("Volver", "Back")}</button></div>
  </div>;
}
