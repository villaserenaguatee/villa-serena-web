"use client";
import BookingTermsContent from '@/components/common/BookingTermsContent';
import { useRouter } from 'next/navigation';
import VillaSerenaLogo from '@/components/common/VillaSerenaLogo';
import PublicLanguageToggle, { usePublicLanguage } from '@/components/common/PublicLanguageToggle';
export default function Terminos() {
  const router = useRouter();
  const { en } = usePublicLanguage();
  return <><PublicLanguageToggle /><main className="legal-page">
    <header>
      <button onClick={() => router.back()} className="icon-back legal-back" aria-label={en ? 'Back' : 'Volver'}>←</button>
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
