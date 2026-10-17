'use client';
import { useEffect, useRef, useState } from 'react';
import { usePublicLanguage } from './PublicLanguageToggle';
import { translateChatMessage } from '@/lib/translation/client';

// Only successful translations are cached, in this tab's memory. Originals remain in the API.
const cache = new Map<string, string>();
export default function TranslatedChatText({ text, received, protectedTerms = [] }: { text: string; received: boolean; protectedTerms?: string[] }) {
  const { en } = usePublicLanguage();
  const target = en ? 'en' : 'es';
  const [result, setResult] = useState(''), [status, setStatus] = useState<'loading' | 'ok' | 'error' | 'original'>('original');
  const [original, setOriginal] = useState(false), [retry, setRetry] = useState(0);
  const generation = useRef(0);
  const termsKey = JSON.stringify(protectedTerms);
  useEffect(() => {
    const n = ++generation.current;
    setOriginal(false); setResult('');
    if (!received) { setStatus('original'); return; }
    const key = JSON.stringify([text, target, termsKey]);
    const prior = cache.get(key);
    if (prior) { setResult(prior); setStatus('ok'); return; }
    setStatus('loading');
    translateChatMessage(text, undefined, target, JSON.parse(termsKey)).then(translated => {
      if (n !== generation.current) return;
      if (cache.size >= 500) cache.delete(cache.keys().next().value!);
      cache.set(key, translated); setResult(translated); setStatus('ok');
    }).catch(() => { if (n === generation.current) setStatus('error'); });
    return () => { generation.current++; };
  }, [text, target, received, termsKey, retry]);
  return <div translate="no" data-vs-preserve-text>
    <p>{status === 'ok' && !original ? result : text}</p>
    {received && status === 'loading' && <p role="status" className="mt-1 text-xs opacity-75">{en ? 'Translating… Original shown.' : 'Traduciendo… Se muestra el original.'}</p>}
    {received && status === 'ok' && <button type="button" onClick={() => setOriginal(v => !v)} className="mt-1 text-xs underline underline-offset-2">{original ? (en ? 'View translation' : 'Ver traducción') : (en ? 'View original' : 'Ver original')}</button>}
    {received && status === 'error' && <div className="mt-1 text-xs"><p role="status">{en ? 'Translation unavailable. Original shown.' : 'No se pudo traducir. Se muestra el original.'}</p><button type="button" onClick={() => setRetry(v => v + 1)} className="mt-1 underline underline-offset-2">{en ? 'Retry translation' : 'Reintentar traducción'}</button></div>}
  </div>;
}
