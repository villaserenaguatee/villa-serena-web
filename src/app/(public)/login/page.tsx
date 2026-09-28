"use client";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, LockKeyhole, Mail, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import VillaSerenaLogo from "@/components/common/VillaSerenaLogo";
import { ROLE_HOME } from "@/lib/auth/types";
import { useLocale, useTranslations } from "next-intl";
export default function LoginPage() {
  const t = useTranslations();
  const locale = useLocale();
  const en = locale.toLowerCase().startsWith("en");
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"login" | "forgot" | "code" | "reset">("login");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [recoveryCode, setRecoveryCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [resent, setResent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const codeRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const passRules = useMemo(() => [
    { t: t("auth.rules.length"), ok: newPass.length >= 8 },
    { t: t("auth.rules.uppercase"), ok: /[A-Z]/.test(newPass) },
    { t: t("auth.rules.lowercase"), ok: /[a-z]/.test(newPass) },
    { t: t("auth.rules.number"), ok: /\d/.test(newPass) },
    { t: t("auth.rules.special"), ok: /[^A-Za-z0-9]/.test(newPass) },
  ],
    [newPass, t]);
  useEffect(() => {
    if (cooldown <= 0)
      return;
    const timer = window.setInterval(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  },
    [cooldown]);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const u = await login(email, password);
      router.push(ROLE_HOME[u.role]);
    }
    catch (err) {
      setError(err instanceof Error ? err.message : t("auth.loginError"));
    }
    finally {
      setBusy(false);
    }
  }
  function enviarCodigo() {
    if (!email.trim() || cooldown > 0)
      return;
    setResent(mode === "code");
    const nuevo = String(Math.floor(100000 + Math.random() * 900000));
    setRecoveryCode(nuevo);
    setCode(["", "", "", "", "", ""]);
    setCodeError("");
    setCooldown(30);
    setMode("code");
    window.setTimeout(() => codeRefs.current[0]?.focus(), 80);
  }
  function cambiarCodigo(index: number,
    value: string) {
    const digits = value.replace(/\D/g, "");
    if (!digits) {
      setCode((actual) => actual.map((v, i) => i === index ? "" : v));
      return;
    }
    const valores = [...code];
    const pegado = digits.slice(0, 6 - index).split("");
    pegado.forEach((digit, offset) => { valores[index + offset] = digit; });
    setCode(valores);
    const siguiente = Math.min(5, index + pegado.length);
    window.setTimeout(() => codeRefs.current[siguiente]?.focus(), 0);
  }
  function verificarCodigo() {
    if (code.join("") !== recoveryCode) {
      setCodeError(en ? "The code does not match. Request a new one or check the 6 digits." : "El código no coincide. Solicita uno nuevo o revisa los 6 dígitos.");
      return;
    }
    setCodeError("");
    setMode("reset");
  }
  return (<main className="login-overlay-page">
    <div className="login-overlay-bg" />
    <Link href="/" className="floating-back icon-back" aria-label={t("common.back")} title={t("common.back")}>
      <ArrowLeft size={20} />
    </Link>
    <section className="floating-login-card">
      <Link href="/" className="floating-close" aria-label={t("common.close")}>
        <X />
      </Link>
      <VillaSerenaLogo href="/" />
      {mode === "login" && (<form onSubmit={submit}>
        <h1>
          {t("common.signIn")}
        </h1>
        <label>
          {t("auth.email")}
          <div className="input-icon">
            <Mail size={17} />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("auth.email")} required />
          </div>
        </label>
        <label>
          {t("auth.password")}
          <div className="input-icon">
            <LockKeyhole size={17} />
            <input type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t("auth.password")} required />
            <button type="button" onClick={() => setShow(v => !v)}>
              {show ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </label>
        <button type="button" className="forgot-link" onClick={() => {
          setError("");
          setMode("forgot");
        }}>
          {t("auth.forgotPassword")}
        </button>
        {error && <div className="login-error">
          {error}
        </div>}
        <button className="login-submit" disabled={busy}>
          {busy ? t("auth.signingIn") : t("common.signIn")}
        </button>
        <small className="account-note">
          {t("auth.guestActivationNotice")}
        </small>
      </form>)}
      {mode === "forgot" && (<div className="recovery-box">
        <h1>
          {t("auth.recoverPassword")}
        </h1>
        <p>
          {t("auth.recoverInstruction")}
        </p>
        <label>
          {t("auth.email")}
          <div className="input-icon">
            <Mail size={17} />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("auth.email")} autoFocus />
          </div>
        </label>
        <div className="recovery-help">
          {t("auth.codeDelivery")}
        </div>
        <button className="login-submit" disabled={!email.trim() || cooldown > 0} onClick={enviarCodigo}>
          {cooldown > 0 ? t("auth.resendWait", { seconds: cooldown }) : t("auth.sendCode")}
        </button>
        <button type="button" className="text-back icon-back" aria-label={t("common.back")} title={t("common.back")} onClick={() => setMode("login")}>
          <ArrowLeft size={20} />
        </button>
      </div>)}
      {mode === "code" && (<div className="recovery-box">
        <h1>
          {t("auth.verifyEmail")}
        </h1>
        <p>
          {t("auth.verificationInstruction", { email: email || t("auth.yourEmail") })}
        </p>
        <div className="verification-card">
          <Mail size={20} />
          <div>
            <b>
              {email}
            </b>
            <span>
              {en ? "Also check your spam folder." : "Revisa también la carpeta de spam."}
            </span>
          </div>
        </div>
        <div className="verification-code" aria-label={t("auth.verificationCode")}>
          {code.map((v,
            i) => <input
              key={i}
              ref={(el) => { codeRefs.current[i] = el; }}
              inputMode="numeric"
              autoComplete={i === 0 ? "one-time-code" : "off"}
              maxLength={1}
              value={v}
              onChange={(e) => cambiarCodigo(i, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Backspace" && !code[i] && i > 0)
                  codeRefs.current[i - 1]?.focus();
              }} />)}
        </div>
        {codeError && <p className="password-error">
          {codeError}
        </p>}
        {resent && <p className="recovery-success" role="status">
          {t("auth.codeResent")}
        </p>}
        <button className="login-submit" disabled={code.join("").length !== 6} onClick={verificarCodigo}>
          {t("auth.verify")}
        </button>
        <button type="button" className="resend-code" disabled={cooldown > 0} onClick={enviarCodigo}>
          {cooldown > 0 ? t("auth.resendWait", { seconds: cooldown }) : t("auth.resendCode")}
        </button>
        <button type="button" className="text-back icon-back" onClick={() => setMode("forgot")}>
          <ArrowLeft size={20} />
        </button>
      </div>)}
      {mode === "reset" && (<div className="recovery-box">
        <h1>
          {t("auth.newPassword")}
        </h1>
        <p className="recovery-success">
          {en ? "Code verified. You can now create a new password." : "Código verificado correctamente. Ahora puedes crear una nueva contraseña."}
        </p>
        <label>
          {t("auth.newPassword")}
          <input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} placeholder={t("auth.newPassword")} autoFocus />
        </label>
        <div className="password-rules compact">
          {passRules.map(x => <span className={x.ok ? "ok" : ""} key={x.t}>
            <span>✓</span>
            {x.t}
          </span>)}
        </div>
        <label>
          {t("auth.confirmPassword")}
          <input type="password" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} placeholder={t("auth.confirmPassword")} />
        </label>
        <button
          className="login-submit"
          disabled={!passRules.every(x => x.ok) || newPass !== confirmPass}
          onClick={() => {
            setNewPass("");
            setConfirmPass("");
            setCode(["", "", "", "", "", ""]);
            setMode("login");
          }}>
          {t("auth.savePassword")}
        </button>
      </div>)}
    </section>
  </main>);
}
