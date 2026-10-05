"use client";
import { ArrowRight, Camera, CreditCard, DoorOpen, Globe2, IdCard, LockKeyhole, Shield, UserRound, X, } from "lucide-react";
import { usePublicLanguage } from "@/components/common/PublicLanguageToggle";
import { agregarTarjeta, eliminarTarjeta, leerTarjetas } from "@/store/paymentStore";
import { actualizarHuespedCentral, leerHuespedes } from "@/store/guestStore";
import { useEffect, useRef, useState } from "react";
import PrivacyPolicyContent from "@/components/common/PrivacyPolicyContent";
import VillaSerenaCard from "@/components/common/VillaSerenaCard";
import { marcaTarjeta, validarTarjeta, type CardForm } from "@/lib/cardForm";
type Seccion = null | "personal" | "contacto" | "idioma" | "pago" | "privacidad" | "seguridad";
interface PerfilHuespedProps {
  huespedId: string;
  documento?: string;
  nombre: string;
  telefono: string;
  correo: string;
  foto?: string | null;
  idioma?: string;
  onVolver: () => void;
  onCerrarSesion?: () => void;
  onFoto?: (foto: string | null) => void;
  onTelefono?: (telefono: string) => void;
  onIdioma?: (idioma?: string) => void;
  onAviso?: (mensaje: string) => void;
  onSolicitarCorreccion?: (datos: unknown) => void;
}
export default function PerfilHuesped({ huespedId, nombre, correo, telefono, foto: fotoInicial = null, onVolver, onCerrarSesion, onFoto, onIdioma, onTelefono, }: PerfilHuespedProps) {
  const { lang } = usePublicLanguage();
  const en = lang === "EN";
  const tr = (es: string, english: string) => en ? english : es;
  const [tarjetas, setTarjetas] = useState(() => leerTarjetas(huespedId));
  const [perfil, setPerfil] = useState(() => leerHuespedes().find(h => h.id === huespedId));
  const [error, setError] = useState("");
  const [estado, setEstado] = useState("");
  const [telefonoEdit, setTelefonoEdit] = useState(telefono);
  const [clave, setClave] = useState({ actual: "", nueva: "", confirmar: "" });
  const [tarjeta, setTarjeta] = useState<CardForm>({ titular: nombre, numero: "", cvv: "", vencimiento: "" });
  const [erroresTarjeta, setErroresTarjeta] = useState<Partial<Record<keyof CardForm, string>>>({});
  function abrir(s: Seccion) {
    setError(""); setEstado(""); setClave({ actual: "", nueva: "", confirmar: "" });
    const actual = leerHuespedes().find(h => h.id === huespedId);
    setPerfil(actual);
    setTelefonoEdit(actual?.telefono ?? telefono);
    setTarjeta({ titular: actual?.nombre || nombre, numero: "", cvv: "", vencimiento: "" });
    setErroresTarjeta({});
    setSeccion(s);
  }
  function cerrar() { setTarjeta({ titular: "", numero: "", cvv: "", vencimiento: "" }); setClave({ actual: "", nueva: "", confirmar: "" }); setSeccion(null); }
  function guardarTelefono() {
    setError(""); setEstado("");
    try {
      if (!leerHuespedes().some(h => h.id === huespedId)) throw new Error();
      const guardado = actualizarHuespedCentral(huespedId, { telefono: telefonoEdit.trim() });
      setPerfil(guardado);
      onTelefono?.(telefonoEdit.trim());
      setEstado(tr("Cambios guardados en este dispositivo.", "Changes saved on this device."));
    } catch { setError(tr("No se pudieron guardar los cambios. Intenta nuevamente.", "Changes could not be saved. Please retry.")); }
  }
  function confirmar(e: React.FormEvent) {
    e.preventDefault(); setError(""); setEstado("");
    if (seccion === "contacto") {
      if (!/^\+?[\d\s()-]{7,20}$/.test(telefonoEdit.trim()) || telefonoEdit.replace(/\D/g, "").length < 7) return setError(tr("Escribe un teléfono válido.", "Enter a valid phone number."));
      const actual = leerHuespedes().find(h => h.id === huespedId);
      if (actual?.telefono === telefonoEdit.trim()) { setEstado(tr("No hay cambios para guardar.", "No changes to save.")); return; }
      guardarTelefono();
    }
    else if (seccion === "seguridad") {
      if (!clave.actual) return setError(tr("Introduce tu contraseña actual.", "Enter your current password."));
      if (clave.nueva.length < 8 || !/[a-zA-Z]/.test(clave.nueva) || !/\d/.test(clave.nueva)) return setError(tr("Usa al menos 8 caracteres, letras y números.", "Use at least 8 characters, letters and numbers."));
      if (clave.nueva !== clave.confirmar || clave.actual === clave.nueva) return setError(tr("La confirmación debe coincidir y la nueva clave debe ser diferente.", "Confirmation must match and the new password must differ."));
      setClave({ actual: "", nueva: "", confirmar: "" });
      setEstado(tr("Validación local completada. Falta conectar el servicio para verificar la clave actual y actualizarla. Tu contraseña no ha cambiado.", "Local validation complete. A service must verify the current password and update it. Your password has not changed."));
    } else if (seccion === "pago") {
      const errores = validarTarjeta(tarjeta, en);
      setErroresTarjeta(errores);
      if (Object.keys(errores).length) return;

      try {
        agregarTarjeta(huespedId, { titular: tarjeta.titular.trim(), marca: marcaTarjeta(tarjeta.numero), ultimos4: tarjeta.numero.replace(/\D/g, "").slice(-4), vencimiento: tarjeta.vencimiento, demo: true, principal: tarjetas.length === 0 });
        setTarjetas(leerTarjetas(huespedId));
        setEstado(tr("Método de pago guardado.", "Payment method saved."));
      } catch { setError(tr("No se pudo guardar el método de pago.", "The payment method could not be saved.")); }
      finally { setTarjeta({ titular: perfil?.nombre || nombre, numero: "", cvv: "", vencimiento: "" }); }
    }
  }
  const [seccion, setSeccion] = useState<Seccion>(null);
  const [foto, setFoto] = useState<string | null>(fotoInicial);
  const drawer = useRef<HTMLElement>(null);
  useEffect(() => {
    if (seccion) return;
    const previous = document.activeElement as HTMLElement | null;
    const elements = () => Array.from(drawer.current?.querySelectorAll<HTMLElement>('button, input:not([type="file"])') || []);
    elements()[0]?.focus();
    function key(e: KeyboardEvent) {
      if (e.key === "Escape") { e.preventDefault(); onVolver(); }
      if (e.key === "Tab") {
        const items = elements(), first = items[0], last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    }
    document.addEventListener('keydown', key);
    return () => { document.removeEventListener('keydown', key); previous?.focus(); };
  }, [seccion, onVolver]);
  const inputFoto = useRef<HTMLInputElement>(null);
  const nombreActual = perfil?.nombre || nombre;
  const iniciales = nombreActual
    .split(" ")
    .map((x) => x[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  function cargarFoto(file?: File) {
    if (!file)
      return;
    const reader = new FileReader();
    reader.onload = () => {
      const nuevaFoto = String(reader.result);
      setFoto(nuevaFoto);
      onFoto?.(nuevaFoto);
    };
    reader.readAsDataURL(file);
  }
  const items = [
    {
      key: "personal" as const,
      titulo: "Información personal",
      sub: nombreActual,
      icono: UserRound,
    },
    {
      key: "contacto" as const,
      titulo: "Datos de contacto",
      sub: perfil?.telefono || telefono || correo,
      icono: IdCard,
    },
    {
      key: "idioma" as const,
      titulo: "Idioma",
      sub: lang === "EN" ? "English" : "Español",
      icono: Globe2,
    },
    {
      key: "pago" as const,
      titulo: "Métodos de pago",
      sub: tarjetas.length ? tarjetas.map(t => `${t.marca} •••• ${t.ultimos4}`).join(", ") : tr("Sin tarjetas guardadas", "No saved cards"),
      icono: CreditCard,
    },
    {
      key: "privacidad" as const,
      titulo: "Privacidad",
      sub: tr("Datos y comunicaciones", "Data and communications"),
      icono: Shield,
    },
    {
      key: "seguridad" as const,
      titulo: "Seguridad",
      sub: "Contraseña",
      icono: LockKeyhole,
    },
  ];
  return (<div
    className="fixed inset-0 z-[120] bg-[#071D34]/25"
    onMouseDown={(e) => {
      if (e.target === e.currentTarget) {
        onVolver();
      }
    }}>
    <aside ref={drawer} role="dialog" aria-hidden={!!seccion} aria-modal={!seccion} aria-label={tr("Perfil", "Profile")} className="h-full w-[min(430px,94vw)] overflow-y-auto bg-[#F8F6F0] p-4 shadow-2xl sm:p-6" onMouseDown={(e) => e.stopPropagation()}>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[26px] font-semibold text-[#17365D]">
            Perfil
          </h1>

          <p className="mt-1 text-sm text-[#72829A]">
            {tr("Administra tus datos, preferencias y seguridad.", "Manage your details, preferences and security.")}
          </p>
        </div>

        <button
          type="button"
          onClick={onVolver}
          className="grid h-11 w-11 place-items-center rounded-full border border-[#17365D] text-[#17365D] transition hover:bg-white"
          aria-label={tr("Cerrar perfil", "Close profile")}>
          <X size={24} />
        </button>
      </div>

      <div className="mt-6 rounded-2xl border border-[#E6E0D7] bg-white p-5">
        <div className="flex items-center gap-4">
          <div className="grid h-[88px] w-[88px] shrink-0 place-items-center overflow-hidden rounded-full bg-[#E6C54A] text-lg font-semibold text-[#17365D]">
            {foto ? (<img src={foto} alt={tr("Foto de perfil", "Profile photo")} className="h-full w-full object-cover" />) : (iniciales)}
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="truncate text-[18px] font-semibold text-[#17365D]">
              {nombre}
            </h2>

            <p className="text-sm text-[#72829A]">{tr("Huésped", "Guest")}</p>
          </div>

          <button
            type="button"
            onClick={() => inputFoto.current?.click()}
            className="flex shrink-0 items-center gap-2 rounded-lg border border-[#17365D] px-3 py-2 text-sm font-semibold text-[#17365D] transition hover:bg-[#F8F6F0]">
            <Camera size={17} />
            {tr("Cambiar foto", "Change photo")}
          </button>

          <input ref={inputFoto} type="file" accept="image/*" className="hidden" onChange={(e) => cargarFoto(e.target.files?.[0])} />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {items.map((item) => {
          const Icono = item.icono;
          return (<button
            key={item.key}
            type="button"
            onClick={() => abrir(item.key)}
            className="flex min-h-[112px] items-center gap-3 rounded-2xl border border-[#E6E0D7] bg-white p-4 text-left transition hover:border-[#C99B21] hover:shadow-sm">
            <Icono size={22} className="shrink-0 text-[#C79300]" />

            <div className="min-w-0 flex-1">
              <p className="font-semibold leading-6 text-[#17365D]">
                {tr(item.titulo, {"personal":"Personal information","contacto":"Contact details","idioma":"Language","pago":"Payment methods","privacidad":"Privacy","seguridad":"Security"}[item.key])}
              </p>

              <p className="mt-0.5 truncate text-sm text-[#72829A]">
                {item.sub}
              </p>
            </div>

            <ArrowRight size={18} className="shrink-0 text-[#91A0B1]" />
          </button>);
        })}
      </div>

      <button
        type="button"
        onClick={() => onCerrarSesion?.()}
        className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-3 font-semibold text-red-600 transition hover:bg-red-50">
        <DoorOpen size={20} />
        {tr("Cerrar sesión", "Sign out")}
      </button>
    </aside>

    {seccion && (<Modal key={seccion} titulo={tr(items.find(i => i.key === seccion)?.titulo || "Perfil", ({ personal: "Personal information", contacto: "Contact details", idioma: "Language", pago: "Payment methods", privacidad: "Privacy", seguridad: "Password" })[seccion])} onClose={cerrar} cerrarLabel={tr("Cerrar", "Close")}>
      <form onSubmit={confirmar} noValidate className="space-y-4">
        {seccion === "personal" && <>
          <Campo label={tr("Nombre completo", "Full name")} valor={perfil?.nombre || nombre} readOnly />
          <Campo label={tr("Tipo de documento", "Document type")} valor={perfil?.tipoDocumento || ""} readOnly />
          <Campo label={tr("Documento", "Document")} valor={perfil?.documento || ""} readOnly />
          <Campo label={tr("Nacionalidad", "Nationality")} valor={perfil?.nacionalidad || ""} readOnly />
        </>}
        {seccion === "contacto" && <>
          <Campo label={tr("Correo electrónico", "Email")} valor={perfil?.correo || correo} readOnly />
          <Campo label={tr("Teléfono", "Phone")} valor={telefonoEdit} onChange={setTelefonoEdit} type="tel" autoComplete="tel" />
        </>}
        {seccion === "idioma" && <label className="block text-sm text-[#17365D]">{tr("Idioma preferido", "Preferred language")}
          <select value={lang} onChange={e => onIdioma?.(e.target.value)} className="mt-2 w-full rounded-xl border p-3"><option value="ES">Español</option><option value="EN">English</option></select>
        </label>}
        {seccion === "privacidad" && <div className="space-y-3 text-sm leading-6 text-[#17365D] [&_h1]:text-lg [&_h1]:font-semibold [&_h2]:pt-2 [&_h2]:font-semibold [&_p]:text-[#72829A] [&_small]:block [&_small]:text-xs [&_a]:underline [&_.legal-contact]:space-y-2">
          <PrivacyPolicyContent />
          <a href="/privacidad" target="_blank" rel="noopener noreferrer" className="inline-flex rounded-xl border border-[#17365D] px-4 py-2 font-semibold">{tr("Ver política de privacidad", "View privacy policy")}</a>
        </div>}
        {seccion === "seguridad" && <>
          <Campo label={tr("Contraseña actual", "Current password")} valor={clave.actual} onChange={v => setClave({ ...clave, actual: v })} type="password" autoComplete="current-password" />
          <Campo label={tr("Nueva contraseña", "New password")} valor={clave.nueva} onChange={v => setClave({ ...clave, nueva: v })} type="password" autoComplete="new-password" />
          <Campo label={tr("Confirmar contraseña", "Confirm password")} valor={clave.confirmar} onChange={v => setClave({ ...clave, confirmar: v })} type="password" autoComplete="new-password" />
          <p className="text-sm text-[#72829A]">{tr("Mínimo 8 caracteres, con letras y números. Confirmar valida el formulario; el cambio requiere integrar el servicio de autenticación.", "At least 8 characters with letters and numbers. Confirm validates the form; changing the password requires authentication service integration.")}</p>
        </>}
        {seccion === "pago" && <>
          {tarjetas.map(t => <div key={t.id} className="rounded-xl border border-[#E6E0D7] bg-[#F8F6F0] p-3"><div className="visual-card-wrap"><VillaSerenaCard numero={"•••• •••• •••• " + t.ultimos4} titular={t.titular} vencimiento={t.vencimiento} marca={t.marca} /></div><p className="mt-3 text-sm text-[#17365D]">{t.marca} •••• {t.ultimos4}</p><button type="button" className="mt-2 text-sm text-red-600" onClick={() => { try { eliminarTarjeta(huespedId, t.id); setTarjetas(leerTarjetas(huespedId)); } catch { setError(tr("No se pudo eliminar.", "Could not remove.")); } }}>{tr("Eliminar método de pago", "Remove payment method")}</button></div>)}
          <div className="visual-card-wrap"><VillaSerenaCard numero={tarjeta.numero} titular={tarjeta.titular} vencimiento={tarjeta.vencimiento} marca={marcaTarjeta(tarjeta.numero)} /></div>
          <Campo label={tr("Nombre del titular", "Cardholder name")} valor={tarjeta.titular} onChange={v => setTarjeta({ ...tarjeta, titular: v })} autoComplete="cc-name" error={erroresTarjeta.titular} />
          <Campo label={tr("Número de tarjeta", "Card number")} valor={tarjeta.numero} onChange={v => setTarjeta({ ...tarjeta, numero: v.replace(/\D/g, "").slice(0, 19).replace(/(.{4})/g, "$1 ").trim() })} autoComplete="cc-number" inputMode="numeric" maxLength={23} error={erroresTarjeta.numero} />
          <p className="text-xs text-[#72829A]">{tr("Marca detectada", "Detected brand")}: {marcaTarjeta(tarjeta.numero) || "—"}</p>
          <div className="grid grid-cols-2 gap-3"><Campo label={tr("Vencimiento MM/AA", "Expiry MM/YY")} valor={tarjeta.vencimiento} onChange={v => { const d = v.replace(/\D/g, "").slice(0, 4); setTarjeta({ ...tarjeta, vencimiento: d.length > 2 ? d.slice(0, 2) + "/" + d.slice(2) : d }); }} autoComplete="cc-exp" maxLength={5} error={erroresTarjeta.vencimiento} /><Campo label="CVV/CVC" valor={tarjeta.cvv} onChange={v => setTarjeta({ ...tarjeta, cvv: v.replace(/\D/g, "").slice(0, 4) })} type="password" inputMode="numeric" autoComplete="off" maxLength={4} error={erroresTarjeta.cvv} /></div>
        </>}
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        {estado && <p role="status" className="text-sm text-[#17365D]">{estado}</p>}
        <div className="flex flex-wrap justify-end gap-3 border-t border-[#E6E0D7] pt-4">
          <button type="button" onClick={cerrar} className="rounded-xl border border-[#17365D] px-4 py-2 text-[#17365D]">{tr("Cerrar", "Close")}</button>
          {(seccion === "contacto" || seccion === "seguridad" || seccion === "pago") && <button type="submit" className="rounded-xl bg-[#17365D] px-4 py-2 font-semibold text-white">{seccion === "seguridad" ? tr("Confirmar", "Confirm") : seccion === "pago" ? tr("Guardar método de pago", "Save payment method") : tr("Guardar cambios", "Save changes")}</button>}
        </div>
      </form>
    </Modal>)}

  </div>);
}
function Modal({ titulo, children, onClose, cerrarLabel }: { titulo: string; children: React.ReactNode; onClose: () => void; cerrarLabel: string }) {
  const ref = useRef<HTMLElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const targets = () => Array.from(ref.current?.querySelectorAll<HTMLElement>('button, input, select, textarea, [tabindex="0"]') || []).filter(e => !e.hasAttribute('disabled'));
    (ref.current?.querySelector<HTMLElement>('input, select') || targets()[0])?.focus();
    function key(e: KeyboardEvent) {
      if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); closeRef.current(); }
      if (e.key === "Tab") {
        const items = targets(), first = items[0], last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    }
    document.addEventListener('keydown', key);
    return () => { document.removeEventListener('keydown', key); previous?.focus(); };
  }, []);
  return <div className="fixed inset-0 z-[140] grid place-items-center bg-[#071D34]/50 p-4" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
    <section ref={ref} role="dialog" aria-modal="true" aria-labelledby="guest-profile-modal-title" className="max-h-[90dvh] w-full max-w-[520px] overflow-y-auto rounded-2xl bg-white shadow-2xl" onMouseDown={e => e.stopPropagation()}>
      <div className="flex items-center justify-between border-b border-[#E6E0D7] px-5 py-4"><h2 id="guest-profile-modal-title" className="text-xl font-semibold text-[#17365D]">{titulo}</h2><button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full text-[#17365D]" aria-label={cerrarLabel}><X size={23} /></button></div>
      <div className="p-5">{children}</div>
    </section>
  </div>;
}
function Campo({ label, valor, onChange, type = "text", readOnly, autoComplete, maxLength, inputMode, error }: { label: string; valor: string; onChange?: (v: string) => void; type?: string; readOnly?: boolean; autoComplete?: string; maxLength?: number; inputMode?: "numeric"; error?: string }) {
  return <label className="block text-sm font-semibold text-[#17365D]">{label}<input type={type} value={valor} readOnly={readOnly} autoComplete={autoComplete} maxLength={maxLength} inputMode={inputMode} aria-invalid={!!error} onChange={e => onChange?.(e.target.value)} className="mt-1 w-full rounded-xl border border-[#D9D3CA] bg-white px-3 py-2 font-normal outline-none focus:ring-2 focus:ring-[#C99B21] read-only:bg-[#FAF9F6]" />{error && <span role="alert" className="mt-1 block text-xs font-normal text-red-700">{error}</span>}</label>;
}
