'use client';
// Compatibility facade: the MVP has a single interface language.
export type PublicLang = 'ES' | 'EN';
export function getPublicLang(): PublicLang { return 'ES'; }
export function usePublicLanguage(): {lang: PublicLang; en: boolean} { return {lang: 'ES', en: false}; }
export default function PublicLanguageToggle(_props: {className?: string}) { return null; }
