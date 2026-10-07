"use client";
import Link from "next/link";
import { FormEvent, useState } from "react";
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
  const [mode, setMode] = useState<"login" | "forgot">("login");
  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const u = await login(email, password);
      router.push(u.staff?.debeCambiarContrasena ? '/panel/cambiar-contrasena' : ROLE_HOME[u.role]);
    }
    catch (err) {
      setError(err instanceof Error ? err.message : t("auth.loginError"));
    }
    finally {
      setBusy(false);
    }
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
      {mode === "forgot" && <div className="recovery-box">
        <h1>{t("auth.recoverPassword")}</h1>
        <p role="status">{t("auth.recoveryUnavailable")}</p>
        <button type="button" className="text-back icon-back" onClick={() => setMode("login")} aria-label={t("common.back")}><ArrowLeft size={20} /></button>
      </div>}
    </section>
  </main>);
}
