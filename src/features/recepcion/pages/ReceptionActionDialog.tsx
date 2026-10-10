import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import ReceptionCloseButton from './ReceptionCloseButton';

export default function ReceptionActionDialog({ title, onClose, busy = false, children }: { title: string; onClose: () => void; busy?: boolean; children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  const closeRef = useRef(onClose);
  const busyRef = useRef(busy);
  closeRef.current = onClose;
  busyRef.current = busy;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLButtonElement>('button')?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busyRef.current) { e.stopPropagation(); closeRef.current(); }
      if (e.key === 'Tab') {
        const controls = Array.from(ref.current?.querySelectorAll<HTMLElement>('button:not(:disabled), select:not(:disabled), textarea:not(:disabled), input:not(:disabled)') ?? []);
        const first = controls[0], last = controls.at(-1);
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener('keydown', key);
    return () => { document.removeEventListener('keydown', key); previous?.focus(); };
  }, []);
  return createPortal(<div className="fixed inset-0 z-[120] grid place-items-center bg-[#071D34]/45 p-4" onClick={() => { if (!busy) onClose(); }}>
    <section ref={ref} role="dialog" aria-modal="true" aria-label={title} onClick={e => e.stopPropagation()} className="max-h-[85dvh] w-full max-w-[420px] overflow-y-auto rounded-2xl bg-white p-4 text-[#18345C] shadow-2xl">
      <header className="mb-3 flex items-center justify-between gap-2"><h3 className="text-xl font-semibold">{title}</h3><ReceptionCloseButton disabled={busy} onClick={onClose} /></header>
      {children}
    </section>
  </div>, document.body);
}
