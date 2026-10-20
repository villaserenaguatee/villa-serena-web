'use client';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { usePublicLanguage } from './PublicLanguageToggle';
type Props = {
  value: string;
  onChange: (value: string) => void;
  min?: string;
  className?: string;
  rangeStart?: string;
  rangeEnd?: string;
  rangeEdge?: 'arrival' | 'departure';
  minExclusive?: boolean;
};
const pad = (n: number) => String(n).padStart(2, '0');
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export default function BilingualDateInput({ value, onChange, min, className = '', rangeStart = '', rangeEnd = '', rangeEdge, minExclusive = false }: Props) {
  const { en } = usePublicLanguage();
  const calendar = useRef<HTMLDivElement>(null);
  const [above,setAbove]=useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const [preview,setPreview]=useState('');
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
  useLayoutEffect(()=>{
    if(!open||!rangeEdge)return;
    const position=()=>{if(trigger.current&&calendar.current){const anchor=trigger.current.getBoundingClientRect(),height=calendar.current.offsetHeight;setAbove(anchor.bottom+height+8>window.innerHeight-8 && anchor.top>=height+8);}};
    position();window.addEventListener('resize',position);return()=>window.removeEventListener('resize',position);
  },[open,view,rangeEdge]);
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
  const unavailable=(date:string)=>date<minDate || Boolean(minExclusive&&min&&date<=min);
  const start=rangeEdge==='arrival'&&preview?preview:rangeStart;
  const end=rangeEdge==='departure'&&preview?preview:rangeEnd;
  const hasRange=Boolean(start&&end&&end>start);
  useEffect(()=>{
    if(!open)return;
    const escape=(event:KeyboardEvent)=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();setOpen(false);setPreview('');trigger.current?.focus();}};
    document.addEventListener('keydown',escape);return()=>document.removeEventListener('keydown',escape);
  },[open]);
  return <div className={`vs-date ${rangeEdge?'vs-date-range':''} ${className}`} data-range-edge={rangeEdge} ref={box}>
    <button type="button" ref={trigger} className="vs-date-trigger" aria-expanded={open} aria-haspopup="dialog" onClick={() => {setPreview('');if(!open)setView(new Date((value||rangeStart||minDate)+'T12:00:00'));setOpen(!open);}}>
      <span>
        {label}
      </span>
      <CalendarDays size={17} />
    </button>
    {open && <div ref={calendar} data-placement={above?"above":"below"} className="vs-calendar" role="dialog" aria-label={en ? 'Calendar' : 'Calendario'}>
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
      <div className={rangeEdge?"vs-days vs-days-range":"vs-days"} onMouseLeave={()=>setPreview('')} onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node|null))setPreview('');}}>
        {days.map((d,
          i) => d ? <button
            type="button"
            key={iso(d)}
            disabled={unavailable(iso(d))}
            data-date={iso(d)}
            title={d.toLocaleDateString(locale,{day:"numeric",month:"long",year:"numeric"})}
            aria-pressed={rangeEdge?iso(d)===start||iso(d)===end:value===iso(d)}
            className={rangeEdge?[
              iso(d)===start?'range-start':'',iso(d)===end?'range-end':'',
              hasRange&&iso(d)>start&&iso(d)<end?'in-range':'',hasRange?'range-connected':'',
            ].filter(Boolean).join(' '):value===iso(d)?'selected':''}
            onMouseEnter={()=>{if(rangeEdge&&!unavailable(iso(d)))setPreview(iso(d));}}
            onFocus={()=>{if(rangeEdge&&!unavailable(iso(d)))setPreview(iso(d));}}
            onClick={() => {
              if(unavailable(iso(d)))return;
              onChange(iso(d));
              setPreview('');
              setOpen(false);
            }}>
            <span className="vs-day-number">{d.getDate()}</span>
          </button> : <span key={'e' + i} />)}
      </div>
      <div className="vs-calendar-actions">
        <button type="button" onClick={() => {
          onChange('');
          setOpen(false);
        }}>
          {en ? 'Clear' : 'Borrar'}
        </button>
        <button type="button" disabled={unavailable(today)} onClick={() => {
          const t = iso(new Date());
          if (!unavailable(t))
            onChange(t);
          setOpen(false);
        }}>
          {en ? 'Today' : 'Hoy'}
        </button>
      </div>
    </div>}
  </div>;
}
