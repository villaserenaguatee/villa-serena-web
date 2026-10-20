"use client";
import LegalBackButton from '@/components/common/LegalBackButton';
import PrivacyPolicyContent from "@/components/common/PrivacyPolicyContent";
import VillaSerenaLogo from "@/components/common/VillaSerenaLogo";
export default function Privacidad() {
  return (<main className="legal-page">
    <header>
      <LegalBackButton />
      <VillaSerenaLogo />
    </header>
    <article>
      <PrivacyPolicyContent />
    </article>
  </main>);
}
