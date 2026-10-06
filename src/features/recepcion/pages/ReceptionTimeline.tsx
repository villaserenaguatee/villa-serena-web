'use client';
import { useEffect, useRef, useState } from 'react';
import type { Reserva, Huesped, HabitacionHotel } from '@/lib/pms/types';
import { RESERVA_META } from './recUtils';
const COLORS = { pendiente: '#78450A', confirmada: '#1E40AF', 'en-curso': '#166534', finalizada: '#475569', cancelada: '#991B1B' };
type Props = { date: string; view: 'week' | 'month'; reservas: Reserva[]; huespedes: Huesped[]; habitaciones: HabitacionHotel[]; onSelect: (r: Reserva) => void };
export default function ReceptionTimeline({ date, view, reservas, huespedes, habitaciones, onSelect }: Props) {
  const target = useRef<HTMLDivElement>(null);
  const callback = useRef(onSelect);
  callback.current = onSelect;
  const [error, setError] = useState('');
  useEffect(() => {
    let cancelled = false;
    let cleanup: (() => void) | undefined;
    setError('');
    // Sin el plugin de arrastre ni selección. Carga solo en el navegador.
    import('@event-calendar/core').then(({ createCalendar, destroyCalendar, ResourceTimeline }) => {
      if (cancelled || !target.current) return;
      const types = [...new Set(habitaciones.map(h => h.tipo))];
      const calendar = createCalendar(target.current, [ResourceTimeline], {
        view: view === 'month' ? 'resourceTimelineMonth' : 'resourceTimelineWeek',
        date, locale: 'es-GT', firstDay: 1, height: '500px',
        headerToolbar: { start: '', center: '', end: '' },
        editable: false, eventStartEditable: false, eventDurationEditable: false, selectable: false,
        slotWidth: 50, views: { resourceTimelineWeek: { slotDuration: { days: 1 }, slotLabelFormat: { day: 'numeric', weekday: 'short' } } },
        resources: [{ id: 'unassigned', title: 'Sin asignar' }, ...types.map(type => ({ id: `type-${type}`, title: type,
          children: habitaciones.filter(h => h.tipo === type).sort((a, b) => a.numero.localeCompare(b.numero)).map(h => ({ id: h.id, title: `Habitación ${h.numero}` })) }))],
        events: reservas.filter(r => r.estado !== 'cancelada').map(r => ({ id: r.id, start: r.fechaEntrada, end: r.fechaSalida,
          allDay: true, resourceIds: [r.habitacionId ?? 'unassigned'], backgroundColor: COLORS[r.estado], textColor: '#ffffff',
          title: `${r.origenReserva === 'publica' ? '🌐 Web' : '🏨 Recepción'} · ${huespedes.find(h => h.id === r.huespedId)?.nombre ?? 'Huésped'} · ${r.codigo}` })),
        eventClick: info => { const r = reservas.find(r => r.id === String(info.event.id)); if (r) callback.current(r); },
        eventDidMount: info => {
          const r = reservas.find(r => r.id === String(info.event.id));
          if (!r) return;
          info.el.setAttribute('role', 'button');
          info.el.setAttribute('tabindex', '0');
          info.el.setAttribute('aria-label', `${r.codigo}, ${RESERVA_META[r.estado].label}`);
          info.el.addEventListener('keydown', event => {
            if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); callback.current(r); }
          });
        },
      });
      cleanup = () => { void destroyCalendar(calendar); };
    }).catch(() => { if (!cancelled) setError('No se pudo abrir el calendario. Vuelve a abrir la vista del día.'); });
    return () => { cancelled = true; cleanup?.(); };
  }, [date, view, reservas, huespedes, habitaciones]);
  return <>{error && <p role="alert">{error}</p>}<div ref={target} /></>;
}
