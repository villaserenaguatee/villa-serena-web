"use client";
import { UiText, useUiText } from "@/i18n/UiText";
import { FormEvent, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Check, Eye, EyeOff } from "lucide-react";
import VillaSerenaLogo from "@/components/common/VillaSerenaLogo";
export default function Activar() {
  const ui = useUiText();
  const r = useRouter(), sp = useSearchParams();
  const [show, setShow] = useState(false),
    [showConfirm, setShowConfirm] = useState(false),
    [pass, setPass] = useState(""),
    [confirm, setConfirm] = useState(""),
    [focus, setFocus] = useState(false),
    [ok, setOk] = useState(false);
  const rules = useMemo(() => [
    { t: "Mínimo 8 caracteres", ok: pass.length >= 8 },
    { t: "Una letra mayúscula", ok: /[A-Z]/.test(pass) },
    { t: "Una letra minúscula", ok: /[a-z]/.test(pass) },
    { t: "Un número", ok: /\d/.test(pass) },
    { t: "Un carácter especial", ok: /[^A-Za-z0-9]/.test(pass) },
  ],
    [pass]);
  const valid = rules.every((x) => x.ok) && pass === confirm && !!confirm;
  const guest = `${sp.get("nombre") || ""} ${sp.get("apellidos") || ""}`.trim() ||
    "Huésped Villa Serena";
  function submit(e: FormEvent) {
    e.preventDefault();
    if (!valid)
      return;
    setOk(true);
    setTimeout(() => r.push("/login"), 900);
  }
  return (<main className="reserve-public reserve-center">
    <button className="icon-back reserve-icon-back" onClick={() => r.back()} aria-label={ui("Volver")} title={ui("Volver")}>
      <ArrowLeft size={20} />
    </button>
    <VillaSerenaLogo />
    <section className="reserve-form-card">
      <span className="reserve-kicker">
        <UiText text="PORTAL DEL HUÉSPED" />
      </span>
      <h1>
        <UiText text="Activa tu cuenta" />
      </h1>
      <div className="account-info">
        <span>
          <UiText text="Huésped" />
          <b>
            {guest}
          </b>
        </span>
        <span>
          <UiText text="Reserva" />
          <b>
            {sp.get("reserva")}
          </b>
        </span>
      </div>
      <form onSubmit={submit}>
        <label>
          <UiText text="Crear contraseña" />
          <div className="password-field">
            <input
              required
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              onFocus={() => setFocus(true)}
              onBlur={() => setTimeout(() => setFocus(false), 120)}
              type={show ? "text" : "password"}
              placeholder="••••••••••••" />
            <button type="button" onClick={() => setShow(!show)}>
              {show ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
          {focus && !rules.every((x) => x.ok) && (<small className="password-help-compact">
            <UiText text="Usa 8 caracteres o más e incluye mayúscula, minúscula, número y carácter especial." />
          </small>)}
        </label>
        <label>
          <UiText text="Confirmar contraseña" />
          <div className="password-field">
            <input required value={confirm} onChange={(e) => setConfirm(e.target.value)} type={showConfirm ? "text" : "password"} placeholder="••••••••••••" />
            <button type="button" onClick={() => setShowConfirm(!showConfirm)}>
              {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </label>
        {confirm && pass !== confirm && (<small className="password-error">
          <UiText text="Las contraseñas deben coincidir." />
        </small>)}
        {ok && (<div className="success-note">
          <UiText text="Cuenta activada. Te llevaremos al inicio de sesión." />
        </div>)}
        <button className="reserve-primary" disabled={!valid}>
          <UiText text="Activar mi cuenta" />
        </button>
      </form>
    </section>
  </main>);
}
