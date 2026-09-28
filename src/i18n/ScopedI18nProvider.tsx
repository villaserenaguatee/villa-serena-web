'use client';
import { NextIntlClientProvider } from 'next-intl';
import { useEffect, useRef, type ReactNode } from 'react';
import { usePublicLanguage } from '@/components/common/PublicLanguageToggle';
import { translateUiText } from './UiText';
import es from './messages/es.json';
import en from './messages/en.json';
const messages = { ES: es, EN: en } as const;
export default function ScopedI18nProvider({ children }: {
  children: ReactNode;
}) {
  const { lang } = usePublicLanguage();
  return (<NextIntlClientProvider locale={lang === 'EN' ? 'en' : 'es'} messages={messages[lang]} timeZone="America/Guatemala">
    <TranslatedScope lang={lang}>
      {children}
    </TranslatedScope>
  </NextIntlClientProvider>);
}
function TranslatedScope({ children, lang }: {
  children: ReactNode;
  lang: 'ES' | 'EN';
}) {
  const root = useRef<HTMLDivElement>(null);
  const originals = useRef(new WeakMap<Node, string>());
  const attributeOriginals = useRef(new WeakMap<HTMLElement, Record<string, string>>());
  useEffect(() => {
    const element = root.current;
    if (!element)
      return;
    const traducir = () => {
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
      let node: Node | null;
      while ((node = walker.nextNode())) {
        const parent = node.parentElement;
        if (!parent || ['SCRIPT', 'STYLE'].includes(parent.tagName))
          continue;
        const current = node.textContent ?? '';
        let original = originals.current.get(node);
        if (original === undefined) {
          original = current;
          originals.current.set(node, original);
        }
        const previousTarget = lang === 'EN' ? translateUiText(original, true) : original;
        if (current !== previousTarget) {
          original = current;
          originals.current.set(node, original);
        }
        const target = lang === 'EN' ? translateUiText(original, true) : original;
        if (node.textContent !== target)
          node.textContent = target;
      }
      element.querySelectorAll<HTMLElement>('[placeholder],[title],[aria-label]').forEach(el => {
        for (const attr of ['placeholder', 'title', 'aria-label']) {
          const current = el.getAttribute(attr);
          if (!current)
            continue;
          const saved = attributeOriginals.current.get(el) ?? {};
          if (!saved[attr]) {
            saved[attr] = current;
            attributeOriginals.current.set(el, saved);
          }
          const original = saved[attr];
          el.setAttribute(attr, lang === 'EN' ? translateUiText(original, true) : original);
        }
      });
    };
    traducir();
    const observer = new MutationObserver(() => queueMicrotask(traducir));
    observer.observe(element, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  },
    [lang]);
  return <div ref={root} className="contents">
    {children}
  </div>;
}
