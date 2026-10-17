import 'server-only';
import type { SupportedLocale, TranslateResponse } from './types';
const MAX_ITEMS = 20;
const MAX_TEXT_LENGTH = 5000;
export async function translateContent(texts: string[],
  sourceLocale: SupportedLocale | undefined,
  targetLocale: SupportedLocale = 'en', protectedTerms: string[] = []): Promise<TranslateResponse> {
  if (process.env.TRANSLATION_PROVIDER === 'libretranslate') {
    const endpoint = process.env.LIBRETRANSLATE_URL;
    if (!endpoint) throw new Error('TRANSLATION_NOT_CONFIGURED');
    const url = new URL(endpoint);
    // The local adapter must never send conversations to an arbitrary remote host.
    if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) || url.protocol !== 'http:' || url.username || url.password) throw new Error('TRANSLATION_NOT_CONFIGURED');
    if (!texts.length || texts.length > MAX_ITEMS || texts.some(t => typeof t !== 'string' || !t.trim() || t.length > MAX_TEXT_LENGTH)) throw new Error('INVALID_TRANSLATION_TEXT');
    const terms = [...new Set(['Villa Serena', ...protectedTerms, ...protectedTerms.flatMap(name=>name.split(/\s+/).filter(word=>word.length>=3&&!['del','las','los'].includes(word.toLowerCase())))])].filter(Boolean).sort((a, b) => b.length - a.length);
    const escaped = terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const pattern = new RegExp(escaped.concat(['[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}', 'VS-[A-Z0-9]{6}', '\\+?\\d[\\d.,:/ -]*\\d|\\d']).join('|'), 'gi');
    const protectedValues: string[][] = [];
    const masked = texts.map(text => {
      const values: string[] = []; protectedValues.push(values);
      return text.replace(pattern, value => { values.push(value); return `ZXQKEEP${values.length - 1}QXZ`; });
    });
    const response = await fetch(new URL('/translate', url), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ q: masked, source: sourceLocale ?? 'auto', target: targetLocale, format: 'text' }), cache: 'no-store', signal: AbortSignal.timeout(texts.length>1?45000:20000) });
    if (!response.ok) throw new Error('TRANSLATION_FAILED');
    const payload = await response.json();
    const results: unknown[] = Array.isArray(payload.translatedText) ? payload.translatedText : [payload.translatedText];
    if (results.length !== texts.length) throw new Error('INVALID_TRANSLATION_PROVIDER_RESPONSE');
    const translations = results.map((value, i) => {
      if (typeof value !== 'string' || !value.trim() || value.length > MAX_TEXT_LENGTH * 3) throw new Error('INVALID_TRANSLATION_PROVIDER_RESPONSE');
      let result = value;
      protectedValues[i].forEach((original, n) => {
        const marker = `ZXQKEEP${n}QXZ`;
        const matches = result.match(new RegExp(marker, 'g'));
        if (matches?.length !== 1) throw new Error('INVALID_TRANSLATION_PROVIDER_RESPONSE');
        result = result.replace(marker, () => original);
      });
      return result;
    });
    return { translations, provider: 'libretranslate' };
  }
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
    signal: AbortSignal.timeout(15000),
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
