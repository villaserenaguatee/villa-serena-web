'use client';
import type {TranslatableContentKind} from './types';
// Preserve callers' layout while rendering API content verbatim.
export function useContentTranslation(_texts: string[], _kind: TranslatableContentKind) {
  return {en: false, text: (original: string) => original, loading: false, failed: false, retry: () => {}};
}
