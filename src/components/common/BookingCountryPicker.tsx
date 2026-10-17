"use client";
import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
export default function BookingCountryPicker({ label, value, options, onChange, en, compact = false }: { label: string; value: string; options: { value: string; label: string; search?: string }[]; onChange: (value: string) => void; en: boolean; compact?: boolean }) {
  const [open, setOpen] = useState(false), [search, setSearch] = useState('');
  const root = useRef<HTMLDivElement>(null), trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (!open) return; const close = (e: PointerEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); }; document.addEventListener('pointerdown', close); return () => document.removeEventListener('pointerdown', close); }, [open]);
  const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase(en ? 'en' : 'es');
  const selected = options.find(o => o.value === value);
  return <div ref={root} className={'booking-country-picker' + (compact ? ' compact' : '')} onKeyDown={e => { if (e.key === 'Escape') { setOpen(false); trigger.current?.focus(); } }}>
    <button ref={trigger} type="button" className="booking-country-trigger" aria-label={label} aria-expanded={open} aria-haspopup="dialog" onClick={() => { setSearch(''); setOpen(!open); }}><span>{compact ? value : selected?.label || (en ? 'Select country' : 'Selecciona el país')}</span><ChevronDown size={16} /></button>
    {open && <div role="dialog" aria-label={label} className="booking-country-menu"><div className="booking-country-search"><Search size={16} /><input autoFocus aria-label={en ? 'Search country or code' : 'Buscar país o prefijo'} placeholder={en ? 'Search country or code' : 'Buscar país o prefijo'} value={search} onChange={e => setSearch(e.target.value)} /></div><div className="booking-country-options">{options.filter(o => normalize(o.label + ' ' + o.value + ' ' + (o.search || '')).includes(normalize(search.trim()))).map(o => <button type="button" key={o.value + o.label} aria-pressed={o.value === value} onClick={() => { onChange(o.value); setOpen(false); trigger.current?.focus(); }}>{o.label}</button>)}</div></div>}
  </div>;
}
