import 'server-only';
import type { SupportedLocale, TranslateResponse } from './types';
const MAX_ITEMS = 20;
const MAX_TEXT_LENGTH = 5000;
export async function translateWithDeepL(texts: string[],
  sourceLocale: SupportedLocale | undefined = 'es',
  targetLocale: SupportedLocale = 'en'): Promise<TranslateResponse> {
  const apiKey = process.env.DEEPL_API_KEY;
  if (!apiKey)
    throw new Error('TRANSLATION_NOT_CONFIGURED');
  if (!texts.length || texts.length > MAX_ITEMS)
    throw new Error('INVALID_TRANSLATION_BATCH');
  if (texts.some(text => !text.trim() || text.length > MAX_TEXT_LENGTH))
    throw new Error('INVALID_TRANSLATION_TEXT');
  const endpoint = process.env.DEEPL_API_URL ?? 'https://api-free.deepl.com/v2/translate';
  const body = new URLSearchParams({
    target_lang: targetLocale === 'es' ? 'ES' : 'EN-US',
  });
  if (sourceLocale)
    body.set('source_lang', sourceLocale === 'es' ? 'ES' : 'EN');
  for (const text of texts)
    body.append('text', text);
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { Authorization: `DeepL-Auth-Key ${apiKey}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    cache: 'no-store'
  });
  if (!response.ok)
    throw new Error(`TRANSLATION_PROVIDER_ERROR_${response.status}`);
  const payload = await response.json() as {
    translations?: Array<{
      text?: string;
    }>;
  };
  const translations = payload.translations?.map(item => item.text?.trim() ?? '') ?? [];
  if (translations.length !== texts.length || translations.some(text => !text)) {
    throw new Error('INVALID_TRANSLATION_PROVIDER_RESPONSE');
  }
  return { translations, provider: 'deepl' };
}
