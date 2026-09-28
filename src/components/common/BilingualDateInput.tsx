'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { usePublicLanguage } from './PublicLanguageToggle';
type Props = {
  value: string;
  onChange: (value: string) => void;
  min?: string;
  className?: string;
};
const pad = (n: number) => String(n).padStart(2, '0');
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export default function BilingualDateInput({ value, onChange, min, className = '' }: Props) {
  const { en } = usePublicLanguage();
  const box = useRef<HTMLDivElement>(null);
  const selected = value ? new Date(value + 'T12:00:00') : null;
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() => selected || new Date());
  useEffect(() => {
    if (selected)
      setView(selected);
  }, [value]);
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  },
    []);
  const days = useMemo(() => {
    const y = view.getFullYear(), m = view.getMonth(), first = new Date(y, m, 1), start = first.getDay(), count = new Date(y, m + 1, 0).getDate();
    return [...Array(start).fill(null), ...Array.from({ length: count }, (_, i) => new Date(y, m, i + 1))];
  },
    [view]);
  const locale = en ? 'en-US' : 'es-GT';
  const label = selected ? selected.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' }) : (en ? 'mm/dd/yyyy' : 'dd/mm/aaaa');
  const weekdays = en ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] : ['do.', 'lu.', 'ma.', 'mi.', 'ju.', 'vi.', 'sá.'];
  const today = iso(new Date());
  const minDate = min && min > today ? min : today;
  return <div className={`vs-date ${className}`} ref={box}>
    <button type="button" className="vs-date-trigger" onClick={() => setOpen(!open)}>
      <span>
        {label}
      </span>
      <CalendarDays size={17} />
    </button>
    {open && <div className="vs-calendar" role="dialog" aria-label={en ? 'Calendar' : 'Calendario'}>
      <div className="vs-calendar-head">
        <button
          type="button"
          aria-label={en ? 'Previous month' : 'Mes anterior'}
          onClick={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))}>
          <ChevronLeft size={18} />
        </button>
        <strong>
          {view.toLocaleDateString(locale, { month: 'long', year: 'numeric' })}
        </strong>
        <button type="button" aria-label={en ? 'Next month' : 'Mes siguiente'} onClick={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))}>
          <ChevronRight size={18} />
        </button>
      </div>
      <div className="vs-weekdays">
        {weekdays.map(x => <span key={x}>
          {x}
        </span>)}
      </div>
      <div className="vs-days">
        {days.map((d,
          i) => d ? <button
            type="button"
            key={iso(d)}
            disabled={!!minDate && iso(d) < minDate}
            className={value === iso(d) ? 'selected' : ''}
            onClick={() => {
              onChange(iso(d));
              setOpen(false);
            }}>
            {d.getDate()}
          </button> : <span key={'e' + i} />)}
      </div>
      <div className="vs-calendar-actions">
        <button type="button" onClick={() => {
          onChange('');
          setOpen(false);
        }}>
          {en ? 'Clear' : 'Borrar'}
        </button>
        <button type="button" onClick={() => {
          const t = iso(new Date());
          if (!minDate || t >= minDate)
            onChange(t);
          setOpen(false);
        }}>
          {en ? 'Today' : 'Hoy'}
        </button>
      </div>
    </div>}
  </div>;
}
