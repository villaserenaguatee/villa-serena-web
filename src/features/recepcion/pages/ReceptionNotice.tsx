import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';

/** Reemplazo visual de los avisos del navegador, sin ejecutar nuevas acciones. */
export default function ReceptionNotice({ title, message, onClose }: { title: string; message: string; onClose: () => void }) {
  const titleId = useId(), messageId = useId(), button = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    button.current?.focus();
    return () => { if (previous?.isConnected) previous.focus(); };
  }, []);
  return createPortal(<div className="fixed inset-0 z-[150] grid place-items-center bg-[#071D34]/45 p-4" onKeyDown={event => {
    if (event.key === 'Escape') { event.stopPropagation(); onClose(); }
    if (event.key === 'Tab') { event.preventDefault(); button.current?.focus(); }
  }}>
    <section role="alertdialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={messageId} className="w-full max-w-[420px] rounded-2xl border border-[#E5E0D8] bg-white p-5 text-[#18345C] shadow-2xl" style={{ fontFamily: '"Afacad", "Segoe UI", Arial, sans-serif' }}>
      <h2 id={titleId} className="text-xl font-semibold">{title}</h2>
      <p id={messageId} className="mt-2 break-words text-base leading-snug">{message}</p>
      <div className="mt-4 flex justify-end"><button ref={button} type="button" className="rounded-lg bg-[#18345C] px-5 py-2 font-semibold text-white" onClick={onClose}>Entendido</button></div>
    </section>
  </div>, document.body);
}
