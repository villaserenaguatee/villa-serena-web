'use client';
import type {ReactNode} from 'react';
import {Pencil} from 'lucide-react';
import {operationalLabel} from '@/i18n/operationalLabels';
import {usePublicLanguage} from '@/components/common/PublicLanguageToggle';
import type {EmployeeRow} from './employeeClient';

export default function EmployeeTable({rows,loading,onInformation,onEdit,stateControl}:{rows:EmployeeRow[];loading:boolean;onInformation:(row:EmployeeRow)=>void;onEdit:(row:EmployeeRow)=>void;stateControl:(row:EmployeeRow)=>ReactNode}) {
  const {en}=usePublicLanguage();
  return <div className="max-w-full overflow-x-auto rounded-b-xl border border-[#E0E3E7] bg-white">
    <table className="w-full min-w-[760px] border-collapse text-left text-sm">
      <caption className="sr-only">Empleados registrados</caption>
      <thead className="border-b border-[#E7EBEF] bg-[#FAFBFC] text-xs  tracking-wide text-[#536579]"><tr>{['Nombre','Correo','Área','Especialidad','Estado','Acciones'].map(label=><th scope="col" key={label} className="px-4 py-3 font-semibold">{label}</th>)}</tr></thead>
      <tbody>{loading?<tr><td colSpan={6} className="p-5" role="status">Consultando…</td></tr>:rows.map(row=><tr key={row.id} className="border-b border-[#EDF0F2] last:border-0 hover:bg-[#FCFCFA]">
        <td className="px-4 py-3"><button type="button" onClick={()=>onInformation(row)} className="flex items-center gap-3 text-left font-semibold hover:underline"><span aria-hidden="true" className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#EDF2F6] text-xs text-[#426483]">{String(row.nombre??'').trim().split(/\s+/).map(word=>word[0]).slice(0,2).join('')}</span>{String(row.nombre??'')}</button></td>
        <td className="px-4 py-3">{String(row.correo??'—')}</td><td className="px-4 py-3">{operationalLabel(row.rol,en)}</td><td className="px-4 py-3">{row.area?operationalLabel(row.area,en):'No aplica'}</td>
        <td className="px-4 py-3">{stateControl(row)}</td>
        <td className="px-4 py-3"><button type="button" aria-label="Editar empleado" onClick={()=>onEdit(row)} className="inline-flex items-center gap-2 whitespace-nowrap rounded-md border border-[#D8DFE5] bg-white px-3 py-2 hover:bg-[#F1F5F8]"><Pencil size={15} aria-hidden="true"/>Editar</button></td>
      </tr>)}</tbody>
    </table>
  </div>;
}
