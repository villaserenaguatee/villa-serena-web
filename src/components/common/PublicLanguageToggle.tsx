'use client';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
export type PublicLang = 'ES' | 'EN';
export function getPublicLang(): PublicLang {
  if (typeof window === 'undefined')
    return 'ES';
  return localStorage.getItem('villa-serena-lang') === 'EN' ? 'EN' : 'ES';
}
export function usePublicLanguage() {
  const [lang, setLang] = useState<PublicLang>('ES');
  useEffect(() => {
    setLang(getPublicLang());
    const fn = (e: Event) => setLang((e as CustomEvent<PublicLang>).detail);
    window.addEventListener('villa-serena-language', fn);
    return () => window.removeEventListener('villa-serena-language', fn);
  },
    []);
  return { lang, en: lang === 'EN' };
}
export default function PublicLanguageToggle({ className = '' }: {
  className?: string;
}) {
  const { lang } = usePublicLanguage();
  const t = useTranslations('language');
  function toggle() {
    const next: PublicLang = lang === 'ES' ? 'EN' : 'ES';
    localStorage.setItem('villa-serena-lang', next);
    document.documentElement.lang = next === 'EN' ? 'en' : 'es';
    window.dispatchEvent(new CustomEvent('villa-serena-language', { detail: next }));
  }
  return <button type="button" className={`public-lang-fixed ${className}`} onClick={toggle} aria-label={t('switchTo')}>
    {t('shortTarget')}
  </button>;
}
