'use client';
import { useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';

/** Keep field popovers outside the scrolling dialog. */
export default function AnchoredPopover({ anchor, children, width = 300, onClose, className = '' }: {
  anchor: RefObject<HTMLElement | null>; children: ReactNode; width?: number;
  onClose: () => void; className?: string;
}) {
  const popup = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ left: 8, top: 8, ready: false });
  useLayoutEffect(() => {
    const place = () => {
      if (!anchor.current || !popup.current) return;
      const field = anchor.current.getBoundingClientRect(), height = popup.current.offsetHeight;
      const viewport = window.visualViewport;
      const topEdge = (viewport?.offsetTop ?? 0) + 8;
      const bottomEdge = (viewport?.offsetTop ?? 0) + (viewport?.height ?? window.innerHeight) - 8;
      const leftEdge = (viewport?.offsetLeft ?? 0) + 8;
      const rightEdge = (viewport?.offsetLeft ?? 0) + (viewport?.width ?? window.innerWidth) - 8;
      const below = field.bottom + 8, above = field.top - height - 8;
      const top = below + height <= bottomEdge ? below : above >= topEdge ? above : Math.max(topEdge, bottomEdge - height);
      setPosition({ left: Math.max(leftEdge, Math.min(field.left, rightEdge - popup.current.offsetWidth)), top, ready: true });
    };
    const dismiss = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!popup.current?.contains(target) && !anchor.current?.contains(target)) onClose();
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.stopPropagation(); onClose(); anchor.current?.focus(); }
    };
    place();
    const observer = new ResizeObserver(place);
    if (popup.current) observer.observe(popup.current);
    window.addEventListener('resize', place); window.addEventListener('scroll', place, true);
    window.visualViewport?.addEventListener('resize', place); window.visualViewport?.addEventListener('scroll', place);
    document.addEventListener('pointerdown', dismiss); document.addEventListener('keydown', escape, true);
    return () => {
      observer.disconnect(); window.removeEventListener('resize', place); window.removeEventListener('scroll', place, true);
      window.visualViewport?.removeEventListener('resize', place); window.visualViewport?.removeEventListener('scroll', place);
      document.removeEventListener('pointerdown', dismiss); document.removeEventListener('keydown', escape, true);
    };
  }, [anchor, onClose]);
  return createPortal(<div ref={popup} className={className} data-availability-popover
    style={{ position: 'fixed', zIndex: 10000, width: `min(${width}px, calc(100vw - 16px))`, left: position.left, top: position.top, visibility: position.ready ? 'visible' : 'hidden' }}>{children}</div>, document.body);
}
