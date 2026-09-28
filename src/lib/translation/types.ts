export type SupportedLocale = 'es' | 'en';
export interface LocalizedText {
  es: string;
  en: string;
  translatedAt?: string;
  provider?: 'deepl';
}
export type TranslatableContentKind = 'room' | 'amenity' | 'menu-item' | 'service' | 'promotion' | 'public-notice' | 'chat-message';
export interface TranslateRequest {
  texts: string[];
  sourceLocale?: SupportedLocale;
  targetLocale: SupportedLocale;
  contentKind: TranslatableContentKind;
}
export interface TranslateResponse {
  translations: string[];
  provider: 'deepl';
}
