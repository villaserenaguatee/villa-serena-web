import { NextResponse } from 'next/server';
import { translateWithDeepL } from '@/lib/translation/server';
import type { TranslateRequest, TranslatableContentKind } from '@/lib/translation/types';
const allowedKinds = new Set<TranslatableContentKind>([
  'room', 'amenity', 'menu-item', 'service', 'promotion', 'public-notice',
  'chat-message'
]);
export async function POST(request: Request) {
  try {
    const input = await request.json() as Partial<TranslateRequest>;
    if (!Array.isArray(input.texts) || !input.targetLocale || !['es', 'en'].includes(input.targetLocale) || !input.contentKind || !allowedKinds.has(input.contentKind)) {
      return NextResponse.json({ error: 'INVALID_REQUEST' }, { status: 400 });
    }
    const sourceLocale = input.sourceLocale;
    if (sourceLocale && (!['es', 'en'].includes(sourceLocale) || sourceLocale === input.targetLocale)) {
      return NextResponse.json({ error: 'INVALID_LOCALE_PAIR' }, { status: 400 });
    }
    const detectedSource = input.contentKind === 'chat-message' ? sourceLocale : (sourceLocale ?? 'es');
    return NextResponse.json(await translateWithDeepL(input.texts, detectedSource, input.targetLocale));
  }
  catch (error) {
    const code = error instanceof Error ? error.message : 'TRANSLATION_FAILED';
    const status = code === 'TRANSLATION_NOT_CONFIGURED' ? 503 : 502;
    return NextResponse.json({ error: code }, { status });
  }
}
