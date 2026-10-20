"use client";
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { usePublicLanguage } from './PublicLanguageToggle';

export default function LegalBackButton() {
  const router = useRouter();
  const { en } = usePublicLanguage();
  function goBack() {
    // Direct visits and external referrers must not leave the guest stranded.
    let internal = false;
    try { internal = new URL(document.referrer).origin === window.location.origin; } catch { /* No referrer. */ }
    if (internal && window.history.length > 1) router.back();
    else router.push('/');
  }
  return <button type="button" onClick={goBack} className="icon-back legal-back" aria-label={en ? 'Back' : 'Volver'}>
    <ArrowLeft size={24} strokeWidth={1.8} aria-hidden="true" />
  </button>;
}
