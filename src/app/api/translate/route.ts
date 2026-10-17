import { NextResponse } from 'next/server';
import { translateContent } from '@/lib/translation/server';
import type { TranslateRequest, TranslatableContentKind } from '@/lib/translation/types';
import { sameOrigin, authError } from '@/lib/bff/auth/http';
import { readLimitedBody } from '@/lib/bff/readLimitedBody';
const budget = globalThis as typeof globalThis & { vsTranslationBudget?: { expires: number; used: number } };
const allowedKinds = new Set<TranslatableContentKind>([
  'room', 'amenity', 'menu-item', 'service', 'promotion', 'public-notice',
  'chat-message'
]);
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const now = Date.now();
    if (!budget.vsTranslationBudget || budget.vsTranslationBudget.expires <= now) budget.vsTranslationBudget = { expires: now + 60000, used: 0 };
    if (++budget.vsTranslationBudget.used > 60) return NextResponse.json({error:'TRANSLATION_RATE_LIMIT'}, {status:429,headers:{'Retry-After':'60','Cache-Control':'no-store'}});
    const raw = await readLimitedBody(request, 24000);
    if (raw.length > 24000) return NextResponse.json({error:'INVALID_REQUEST'}, {status:413});
    let input: Partial<TranslateRequest>;
    try { input = JSON.parse(raw); } catch { return NextResponse.json({error:'INVALID_REQUEST'},{status:400}); }
    if (!input || typeof input !== 'object' || !Array.isArray(input.texts) || !input.texts.length || input.texts.length > 20 || input.texts.some(t => typeof t !== 'string' || !t.trim() || t.length > 5000)) return NextResponse.json({error:'INVALID_REQUEST'},{status:400});
    if (!Array.isArray(input.texts) || !input.targetLocale || !['es', 'en'].includes(input.targetLocale) || !input.contentKind || !allowedKinds.has(input.contentKind)) {
      return NextResponse.json({ error: 'INVALID_REQUEST' }, { status: 400 });
    }
    const sourceLocale = input.sourceLocale;
    if (input.protectedTerms !== undefined && (!Array.isArray(input.protectedTerms) || input.protectedTerms.length > 20 || input.protectedTerms.some(t => typeof t !== 'string' || t.length > 150 || !t.trim()))) return NextResponse.json({error:'INVALID_REQUEST'},{status:400});
    if (sourceLocale && (!['es', 'en'].includes(sourceLocale) || sourceLocale === input.targetLocale)) {
      return NextResponse.json({ error: 'INVALID_LOCALE_PAIR' }, { status: 400 });
    }
    const detectedSource = input.contentKind === 'chat-message' ? sourceLocale : (sourceLocale ?? 'es');
    return NextResponse.json(await translateContent(input.texts, detectedSource, input.targetLocale, input.protectedTerms), {headers:{'Cache-Control':'no-store'}});
  }
  catch (error) {
    if (error && typeof error === 'object' && 'codigo' in error) return authError(error);
    const code = error instanceof Error && error.message === 'TRANSLATION_NOT_CONFIGURED' ? error.message : 'TRANSLATION_FAILED';
    const status = code === 'TRANSLATION_NOT_CONFIGURED' ? 503 : 502;
    return NextResponse.json({ error: code }, { status });
  }
}
