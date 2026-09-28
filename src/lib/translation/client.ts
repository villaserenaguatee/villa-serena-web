import type { TranslateRequest, TranslateResponse, TranslatableContentKind } from './types';
export async function translatePublicContent(texts: string[],
  contentKind: TranslatableContentKind) {
  const body: TranslateRequest = { texts, targetLocale: 'en', contentKind };
  const response = await fetch('/api/translate', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
  });
  const result = await response.json() as TranslateResponse | {
    error: string;
  };
  if (!response.ok || !('translations' in result)) {
    throw new Error('No fue posible generar la traducción. El contenido no se guardó.');
  }
  return result;
}
export async function translateChatMessage(text: string,
  sourceLocale: 'es' | 'en' | undefined,
  targetLocale: 'es' | 'en') {
  const body: TranslateRequest = { texts: [text], sourceLocale, targetLocale, contentKind: 'chat-message' };
  const response = await fetch('/api/translate', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
  });
  const result = await response.json() as TranslateResponse | {
    error: string;
  };
  if (!response.ok || !('translations' in result) || !result.translations[0]) {
    throw new Error('No fue posible traducir el mensaje.');
  }
  return result.translations[0];
}
