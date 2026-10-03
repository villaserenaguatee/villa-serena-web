"use client";
import { useState } from "react";
import { usePublicLanguage } from "@/components/common/PublicLanguageToggle";
export type VerificationState = "pendiente" | "verificando" | "verificado" | "invalido" | "expirado" | "error";
export interface EmailVerificationService {
  reenviar: (correo: string) => Promise<void>;
  verificar: (correo: string, codigo: string) => Promise<"verificado" | "invalido" | "expirado">;
}
export default function EmailVerificationFlow({ correo, verificado = false, onCambiar, onVolver, onVerificado, servicio }: { correo: string; verificado?: boolean; onCambiar: () => void; onVolver: () => void; onVerificado?: () => void; servicio?: EmailVerificationService }) {
  const { en } = usePublicLanguage();
  const tr = (es: string, english: string) => en ? english : es;
  const [estado, setEstado] = useState<VerificationState>(verificado ? "verificado" : "pendiente");
  const [codigo, setCodigo] = useState("");
  const [enviado, setEnviado] = useState(false);
  async function ejecutar(reenviar: boolean) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo) || (!reenviar && !/^\d{6}$/.test(codigo))) { setEstado("invalido"); return; }
    setEstado("verificando"); setEnviado(false);
    try {
      if (!servicio) throw new Error("Integration required");
      if (reenviar) { await servicio.reenviar(correo); setEnviado(true); setEstado("pendiente"); }
      else { const result = await servicio.verificar(correo, codigo); setEstado(result); if (result === "verificado") { setCodigo(""); onVerificado?.(); } }
    } catch { setEstado("error"); }
  }
  const messages: Record<VerificationState, string> = {
    pendiente: tr("Pendiente de verificación", "Pending verification"),
    verificando: tr("Procesando solicitud…", "Processing request…"),
    verificado: tr("Correo verificado", "Email verified"),
    invalido: tr("Correo, enlace o código inválido. Revisa los datos.", "Invalid email, link or code. Check the details."),
    expirado: tr("La verificación expiró. Solicita un nuevo código.", "Verification expired. Request a new code."),
    error: servicio ? tr("No se pudo completar la solicitud. Puedes reintentar.", "The request failed. You can retry.") : tr("No se envió ningún correo: falta conectar el proveedor de verificación. Tu correo sigue pendiente.", "No email was sent: verification provider integration is required. Your email is still pending."),
  };
  return <div className="space-y-4 text-[#17365D]">
    <p className="text-sm text-[#72829A]">{tr("Verifica la dirección asociada a tu perfil.", "Verify the address associated with your profile.")}</p>
    <p className="break-all rounded-xl border border-[#E6E0D7] bg-[#F8F6F0] p-3 font-semibold">{correo || tr("Correo sin indicar", "No email provided")}</p>
    <p role={estado === "error" || estado === "invalido" || estado === "expirado" ? "alert" : "status"} data-state={estado} className="rounded-xl border border-[#E6E0D7] p-3 text-sm">{messages[estado]}</p>
    {enviado && <p role="status">{tr("El proveedor aceptó el envío. Revisa tu bandeja de entrada.", "The provider accepted the send request. Check your inbox.")}</p>}
    {estado !== "verificado" && <form className="space-y-3" onSubmit={e => { e.preventDefault(); void ejecutar(false); }}>
      <label className="block text-sm font-semibold">{tr("Código de verificación", "Verification code")}<input value={codigo} onChange={e => setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" maxLength={6} className="mt-2 w-full rounded-xl border border-[#D9D3CA] p-3 tracking-[0.3em]" /></label>
      {!servicio && <p className="text-sm text-[#72829A]">{tr("Formulario preparado para integrar el servicio. No existe un código de prueba ni se verifica el correo localmente.", "Form ready for service integration. There is no test code or local email verification.")}</p>}
      <div className="flex flex-wrap gap-3"><button disabled={estado === "verificando"} type="submit" className="rounded-xl bg-[#17365D] px-4 py-2 font-semibold text-white disabled:opacity-50">{tr("Verificar correo", "Verify email")}</button><button disabled={estado === "verificando"} type="button" onClick={() => void ejecutar(true)} className="rounded-xl border border-[#17365D] px-4 py-2 disabled:opacity-50">{tr("Reenviar", "Resend")}</button></div>
    </form>}
    <div className="flex flex-wrap gap-3 border-t border-[#E6E0D7] pt-3"><button type="button" disabled={estado === "verificando"} onClick={onCambiar} className="font-semibold underline">{tr("Cambiar correo", "Change email")}</button><button type="button" onClick={onVolver} className="font-semibold underline">{tr("Volver", "Back")}</button></div>
  </div>;
}
