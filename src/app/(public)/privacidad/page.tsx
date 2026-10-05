"use client";
import { UiText } from "@/i18n/UiText";
import { useRouter } from "next/navigation";
import PrivacyPolicyContent from "@/components/common/PrivacyPolicyContent";
import VillaSerenaLogo from "@/components/common/VillaSerenaLogo";
import PublicLanguageToggle, { usePublicLanguage, } from "@/components/common/PublicLanguageToggle";
export default function Privacidad() {
  const { en } = usePublicLanguage();
  const router = useRouter();
  return (<main className="legal-page">
    <header>
      <button onClick={() => router.back()} className="icon-back legal-back" aria-label={en ? "Back" : "Volver"}>
        <UiText text="←" />
      </button>
      <VillaSerenaLogo />
    </header>
    <article>
      <PrivacyPolicyContent />
    </article>
  </main>);
}
