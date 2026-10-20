'use client';
import type {ReactNode} from 'react';
import type {Habitacion} from '@/lib/pms/types';
// Drawer header and dimensions recovered verbatim from e216d53; actions supplied by the real adapter.
export default function ApprovedCleaningDetail({hab,onClose,children}:{hab:Habitacion;onClose:()=>void;children:ReactNode}){
 const cfg=hab.condicionReal==='LIMPIA'?{text:'#15803D',bg:'#ECFDF3',border:'#86EFAC',label:'Limpia'}:hab.condicionReal==='EN_LIMPIEZA'?{text:'#1D4ED8',bg:'#EFF6FF',border:'#93C5FD',label:'En limpieza'}:hab.condicionReal==='FUERA_DE_SERVICIO'?{text:'#991B1B',bg:'#FEF2F2',border:'#FCA5A5',label:'Fuera de servicio'}:{text:'#9A6700',bg:'#FFF9E8',border:'#F3D98B',label:'Pendiente'};
 const obtenerTipoHabitacion=(tipo:string)=>tipo;
 return (<div className="absolute inset-0 z-20 flex items-stretch justify-end">
    <div className="absolute inset-0 bg-black/25" onClick={onClose} />

    <div data-vs-ui="compact" data-vs-drawer="compact" className="
          relative
          z-10
          w-full
          sm:max-w-lg
          bg-[#F8F6F0]
          shadow-2xl
          flex
          flex-col
          overflow-hidden
        ">

      <div className="relative h-36 sm:h-40 shrink-0 overflow-hidden">
        {hab.foto&&<img src={hab.foto} alt={`Habitación ${hab.numero}`} className="w-full h-full object-cover"/>}

        <div className="absolute inset-0 bg-gradient-to-t from-[#102747]/90 via-[#18345C]/20 to-transparent" />

        <button
          onClick={onClose} aria-label="Cerrar detalle"
          className="
              absolute
              top-3
              right-3
              w-9
              h-9
              bg-white/25
              backdrop-blur-sm
              rounded-full
              flex
              items-center
              justify-center
              hover:bg-white/40
              transition-colors
            ">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="absolute bottom-4 left-4">
          <div className="flex items-center gap-2 text-white">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 7v10" />
              <path d="M21 10v7" />
              <path d="M3 13h18" />
              <path d="M5 13V9.5A1.5 1.5 0 0 1 6.5 8h3A1.5 1.5 0 0 1 11 9.5V13" />
              <path d="M11 13v-2a2 2 0 0 1 2-2h5a3 3 0 0 1 3 3v1" />
            </svg>

            <p className="text-2xl sm:text-3xl font-bold leading-none">
              {hab.numero}
            </p>
          </div>

          <p className="text-white/85 text-sm mt-1 ml-8">
            {obtenerTipoHabitacion(hab.tipo)}
          </p>
        </div>

        <div className="absolute bottom-4 right-4">
          <span
            className="text-[10px] font-semibold px-2.5 py-1 rounded-md uppercase tracking-wide border"
            style={{
              color: cfg.text,
              backgroundColor: cfg.bg,
              borderColor: cfg.border,
            }}>
            {cfg.label}
          </span>
        </div>
      </div>

<div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4">{children}</div></div></div>);
}
