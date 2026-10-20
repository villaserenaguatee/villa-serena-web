'use client';
import {usePublicLanguage} from '@/components/common/PublicLanguageToggle';
import {operationalLabel} from '@/i18n/operationalLabels';
// Card layout recovered from Personal.tsx, e216d53. Values come only from the current API row.
export default function ApprovedEmployeeCard({row,onEdit}:{row:Record<string,unknown>;onEdit:()=>void}){
 const {en}=usePublicLanguage();const profile=(row.perfil??{}) as Record<string,unknown>;
 const name=String(row.nombre??''),active=row.estado==='ACTIVO';
 return <button type="button" onClick={onEdit} className={`group flex min-w-0 items-center gap-4 rounded-xl border bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-[#B38719] hover:shadow-md ${active?'border-[#E5E0D8]':'border-[#E5E0D8] opacity-60'}`}>
  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#F8F6F0] text-xl font-semibold text-[#18345C]" aria-hidden="true">{name.split(/\s+/).filter(Boolean).map(p=>p[0]).slice(0,2).join('')}</div>
  <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="truncate text-[17px] font-semibold text-[#18345C]">{name}</h2><span className={`rounded-md border px-2 py-0.5 text-xs ${active?'border-green-200 bg-green-50 text-green-800':'border-red-200 bg-red-50 text-red-700'}`}>{operationalLabel(row.estado,en)}</span></div>
   <p className="mt-1 text-sm font-medium text-[#52677F]">{operationalLabel(row.rol,en)}{row.area?` · ${operationalLabel(row.area,en)}`:''}{profile.turno?` · ${operationalLabel(profile.turno,en)}`:''}</p><p className="mt-2 truncate text-xs text-[#93A3B3]">{String(row.correo??'')}</p>
   {Boolean(profile.asistencia)&&<p className="mt-3 text-xs text-[#71839B]">{operationalLabel(profile.asistencia,en)}</p>}
  </div><span className="text-xl text-[#AEBCC1] transition group-hover:translate-x-1 group-hover:text-[#B38719]" aria-hidden="true">›</span>
 </button>;
}
