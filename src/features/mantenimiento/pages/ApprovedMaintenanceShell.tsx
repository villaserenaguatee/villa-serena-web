'use client';
// Presentation recovered from e216d53. Data/actions remain in MantenimientoConectado.
import type {ReactNode} from 'react';
import type {SeccionMant} from '@/lib/pms/types';
const SECCIONES: {
  id: SeccionMant;
  label: string;
  corto: string;
}[] = [
    { id: 'panel', label: 'Panel del área', corto: 'Panel' },
    { id: 'incidencias', label: 'Incidencias recibidas', corto: 'Incid.' },
    { id: 'ordenes', label: 'Tareas de mantenimiento', corto: 'Tareas' },
    { id: 'preventivo', label: 'Mantenimiento preventivo', corto: 'Prevent.' },
    { id: 'activos', label: 'Activos y equipos', corto: 'Activos' },
  ];
function SeccionIcon({ id, size = 18 }: {
  id: SeccionMant;
  size?: number;
}) {
  const p = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.75,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  switch (id) {
    case 'panel':
      return <svg {...p}>
        <path d="M3 3v18h18" />
        <rect x="7" y="12" width="3" height="6" />
        <rect x="12" y="8" width="3" height="10" />
        <rect x="17" y="4" width="3" height="14" />
      </svg>;
    case 'incidencias':
      return <svg {...p}>
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>;
    case 'ordenes':
      return <svg {...p}>
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76Z" />
      </svg>;
    case 'preventivo':
      return <svg {...p}>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>;
    case 'activos':
      return <svg {...p}>
        <path d="M20 7 12 3 4 7l8 4 8-4Z" />
        <path d="M4 7v10l8 4 8-4V7" />
        <path d="M12 11v10" />
      </svg>;
  }
}

export default function ApprovedMaintenanceShell({section,onSection,onProfile,name,incidenciasPendientes=0,ordenesAtrasadas=0,children}:{section:SeccionMant;onSection:(s:SeccionMant)=>void;onProfile:()=>void;name:string;incidenciasPendientes?:number;ordenesAtrasadas?:number;children:ReactNode}){
 const seccion=section,setSeccion=onSection,contenido=children;
 const initials=name.split(/\s+/).filter(Boolean).map(s=>s[0]).slice(0,2).join('');
 return <div data-approved-reference="e216d53-maintenance" className="w-full h-dvh min-h-0 flex flex-col overflow-hidden" style={{fontFamily:'"Afacad", "Segoe UI", Arial, sans-serif'}}>    <div className="flex-1 flex overflow-hidden">

      <nav className="hidden lg:flex fixed inset-y-0 left-0 z-40 flex-col w-56 h-[100dvh]" style={{ backgroundColor: '#102747' }}>
        <div className="px-5 pt-5 pb-5 border-b shrink-0 text-center" style={{ borderColor: '#1d3a5f' }}>
          <img src="/villa-serena-logo.png" alt="Villa Serena Hotel" className="mx-auto mb-2 w-32 max-h-24 object-contain" />
          <p className="text-white text-xl font-bold leading-tight" style={{ letterSpacing: '0.02em' }}>Villa Serena</p>
          <p className="text-xs mt-1" style={{ color: '#AEBCC1', letterSpacing: '0.06em' }}>Mantenimiento</p>
        </div>

        <div className="vs-scroll-clean flex-1 py-3 overflow-y-auto">
          {SECCIONES.map(s => {
            const active = seccion === s.id;
            const badge = s.id === 'incidencias' ? incidenciasPendientes : s.id === 'ordenes' ? ordenesAtrasadas : 0;
            return (<button
              key={s.id}
              onClick={() => setSeccion(s.id)}
              className="w-full flex items-center gap-3 px-5 py-3 text-left transition-colors relative"
              style={{ color: active ? '#FFFFFF' : '#AEBCC1', backgroundColor: active ? '#18345C' : 'transparent' }}>
              {active && <span className="absolute left-0 top-0 h-full w-0.5" style={{ backgroundColor: '#D8B94E' }} />}
              <span className="w-5 h-5 shrink-0 grid place-items-center" style={{ color: active ? '#D8B94E' : '#AEBCC1' }} aria-hidden="true">
                <SeccionIcon id={s.id} />
              </span>
              <span className="text-sm font-medium flex-1">
                {s.label}
              </span>
              {badge > 0 && (<span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center" style={{ backgroundColor: '#D8B94E', color: '#102747' }}>
                {badge}
              </span>)}
            </button>);
          })}
        </div>

        <div className="px-4 py-4 border-t shrink-0" style={{ borderColor: '#1d3a5f' }}>
          <button
            onClick={() => onProfile()}
            className="w-full flex items-center gap-3 rounded-lg p-2 text-left hover:bg-[#18345C] transition-colors"
            title="Abrir mi perfil">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-sm font-bold"
              style={{ backgroundColor: '#D8B94E', color: '#102747' }}>{initials}</div>
            <div className="min-w-0 flex-1">
              <p className="text-white text-xs font-semibold truncate">
                {name}
              </p>
              <p className="text-[10px] truncate" style={{ color: '#AEBCC1' }}>Encargado de mantenimiento</p>
              <p className="text-[9px] mt-0.5" style={{ color: '#D8B94E' }}>Perfil</p>
            </div>
          </button>
        </div>
      </nav>

      <div className="flex-1 lg:ml-56 flex flex-col overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 shrink-0" style={{ backgroundColor: '#102747' }}>
          <p className="lg:hidden text-white text-lg font-bold">Villa Serena</p>
          <span className="lg:hidden text-[#AEBCC1] text-xs">·</span>
          <p className="text-[#AEBCC1] text-xs font-medium truncate flex-1">
            {SECCIONES.find(s => s.id === seccion)?.label}
          </p>
          <div className="lg:hidden flex gap-1.5">
            <button type="button" onClick={onProfile} className="rounded-md border border-[#52677F] px-3 py-1.5 text-xs text-white">Perfil</button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden relative">
          {contenido}
        </div>

        <div className="lg:hidden flex shrink-0 border-t overflow-x-auto" style={{ backgroundColor: '#102747', borderColor: '#1d3a5f' }}>
          {SECCIONES.map(s => {
            const active = seccion === s.id;
            const badge = s.id === 'incidencias' ? incidenciasPendientes : s.id === 'ordenes' ? ordenesAtrasadas : 0;
            return (<button
              key={s.id}
              onClick={() => setSeccion(s.id)}
              className="flex-1 min-w-[64px] flex flex-col items-center justify-center py-2 gap-0.5 relative transition-colors"
              style={{ color: active ? '#D8B94E' : '#AEBCC1' }}>
              {active && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5" style={{ backgroundColor: '#D8B94E' }} />}
              <span className="relative">
                <SeccionIcon id={s.id} size={20} />
                {badge > 0 && (<span
                  className="absolute -top-1 -right-2 text-[8px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: '#D8B94E', color: '#102747' }}>
                  {badge}
                </span>)}
              </span>
              <span className="text-[9px] font-medium leading-tight truncate max-w-full px-0.5">
                {s.corto}
              </span>
            </button>);
          })}
        </div>
      </div>
    </div>

</div>;
}
