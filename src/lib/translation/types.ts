export type SupportedLocale = 'es' | 'en';
export interface LocalizedText {
  es: string;
  en: string;
  translatedAt?: string;
  provider?: 'deepl' | 'libretranslate';
}
export type TranslatableContentKind = 'room' | 'amenity' | 'menu-item' | 'service' | 'promotion' | 'public-notice' | 'chat-message';
export interface TranslateRequest {
  texts: string[];
  sourceLocale?: SupportedLocale;
  targetLocale: SupportedLocale;
  contentKind: TranslatableContentKind;
  protectedTerms?: string[];
}
export interface TranslateResponse {
  translations: string[];
  provider: 'deepl' | 'libretranslate';
}
