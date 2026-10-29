"use client";
import BookingTermsContent from '@/components/common/BookingTermsContent';
import LegalBackButton from '@/components/common/LegalBackButton';
import VillaSerenaLogo from '@/components/common/VillaSerenaLogo';
import { usePublicLanguage } from '@/components/common/PublicLanguageToggle';
export default function Terminos() {
  const { en } = usePublicLanguage();
  return <><main className="legal-page">
    <header>
      <LegalBackButton />
      <VillaSerenaLogo />
    </header>
    <article>
      <span className="section-kicker">VILLA SERENA</span>
      <h1>
        {en ? 'Terms and conditions' : 'Términos y condiciones'}
      </h1>
      <BookingTermsContent />
    </article>
  </main></>;
}
