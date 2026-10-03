"use client";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { UiText } from "@/i18n/UiText";
import VillaSerenaLogo from "@/components/common/VillaSerenaLogo";
export default function PendingAuthService() {
  const t = useTranslations("auth");
  return <main className="reserve-public reserve-center">
    <VillaSerenaLogo />
    <section className="reserve-form-card">
      <h1><UiText text="Activar mi cuenta" /></h1>
      <p role="status">{t("activationUnavailable")}</p>
      <Link href="/login" className="reserve-primary">{t("backToLogin")}</Link>
    </section>
  </main>;
}
