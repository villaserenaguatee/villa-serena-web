'use client';
// Historical translations remain stored, but the MVP always displays the original.
export default function TranslatedChatText({text}: {text: string; received: boolean; protectedTerms?: string[]}) {
  return <div translate="no" data-vs-preserve-text><p>{text}</p></div>;
}
