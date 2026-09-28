"use client";
import { UiText, useUiText } from "@/i18n/UiText";
import { ClipboardEvent, KeyboardEvent, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import VillaSerenaLogo from "@/components/common/VillaSerenaLogo";
export default function Verificar() {
  const ui = useUiText();
  const r = useRouter(), sp = useSearchParams();
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const email = sp.get("correo") || "";
  const masked = email
    ? email[0] + "***@" + (email.split("@")[1] || "gmail.com")
    : "m***@gmail.com";
  function change(i: number,
    value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const n = [...code];
    n[i] = digit;
    setCode(n);
    if (digit && i < 5)
      refs.current[i + 1]?.focus();
  }
  function key(i: number, e: KeyboardEvent) {
    if (e.key === "Backspace" && !code[i] && i > 0)
      refs.current[i - 1]?.focus();
  }
  function paste(e: ClipboardEvent) {
    const digits = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (digits.length < 2)
      return;
    e.preventDefault();
    const n = Array(6).fill("");
    digits.split("").forEach((d, i) => (n[i] = d));
    setCode(n);
    refs.current[Math.min(digits.length, 6) - 1]?.focus();
  }
  return (<main className="reserve-public reserve-center">
    <button className="icon-back reserve-icon-back" onClick={() => r.back()} aria-label={ui("Volver")} title={ui("Volver")}>
      <ArrowLeft size={20} />
    </button>
    <VillaSerenaLogo />
    <section className="reserve-form-card">
      <span className="reserve-kicker">
        <UiText text="SEGURIDAD" />
      </span>
      <h1>
        <UiText text="Verifica tu correo" />
      </h1>
      <p>
        <UiText text="Enviamos un código de verificación a:" />
        <br />
        <b>
          {masked}
        </b>
      </p>
      <div className="otp-row">
        {code.map((v,
          i) => (<input
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            maxLength={1}
            inputMode="numeric"
            value={v}
            onChange={(e) => change(i, e.target.value)}
            onKeyDown={(e) => key(i, e)}
            onPaste={paste} />))}
      </div>
      <button
        className="reserve-primary"
        disabled={code.some((v) => !v)}
        onClick={() => r.push("/reservar/pago?" +
          new URLSearchParams(Object.fromEntries(sp.entries())))}>
        <UiText text="Verificar" />
      </button>
    </section>
  </main>);
}
