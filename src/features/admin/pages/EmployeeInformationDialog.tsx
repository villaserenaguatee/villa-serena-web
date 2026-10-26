'use client';
import {useState} from 'react';
import Image from 'next/image';
import {Contact,BriefcaseBusiness,Pencil} from 'lucide-react';
import {operationalLabel} from '@/i18n/operationalLabels';
import c from './EmployeeInformationDialog.module.css';
import AdminPersonDialog from './AdminPersonDialog';

type Row=Record<string,unknown>;
const display=(value:unknown)=>value===undefined||value===null||value===''?'No registrado':String(value);
export default function EmployeeInformationDialog({employee,onClose,onEdit,canReadLabor=false}:{employee:Row;onClose:()=>void;onEdit?:()=>void;demo?:boolean;canReadLabor?:boolean}){
 const [section,setSection]=useState<'personal'|'laboral'>('personal');
 const name=typeof employee.nombre==='string'?employee.nombre:'No registrado',area=employee.rol?operationalLabel(employee.rol,false):'No registrada';
 const photo=typeof employee.foto==='string'&&/^(https?:\/\/|\/|blob:|data:image\/)/.test(employee.foto)?employee.foto:undefined;
 return <AdminPersonDialog compact wide title="Información del empleado" name={name} area={area} status={employee.estado} onClose={onClose} avatar={photo?<Image unoptimized src={photo} width={56} height={56} alt={`Fotografía de ${name}`} className="h-14 w-14 rounded-full object-cover"/>:undefined} navigation={<nav aria-label="Información del empleado" className="mt-3 space-y-1">{([['personal','Información personal',Contact],['laboral','Información laboral',BriefcaseBusiness]] as const).map(([id,label,Icon])=><button key={id} type="button" aria-current={section===id?'page':undefined} onClick={()=>setSection(id)} className={`flex w-full items-center gap-2 rounded-lg border px-2 py-1.5 text-left text-xs ${section===id?'border-[#E8DDBB] bg-white font-semibold':'border-transparent text-[#536579]'}`}><Icon size={15} className="shrink-0"/>{label}</button>)}</nav>}>
  <h2 className="mb-3 text-left text-sm font-semibold">{section==='personal'?'Información personal':'Información laboral'}</h2>
  <EmployeeInformationContent employee={employee} section={section} canReadLabor={canReadLabor} administrative/>

  {canReadLabor&&Boolean(employee.avisoLaboral)&&<p role="status" className="mt-3 text-sm">{String(employee.avisoLaboral)}</p>}
  {onEdit&&<div className="mt-4 flex justify-end"><button type="button" onClick={onEdit} className="inline-flex min-h-11 items-center gap-2 rounded-md border border-[#D8DFE5] px-3 py-2 text-sm"><Pencil size={15} aria-hidden="true"/>Editar empleado</button></div>}

 </AdminPersonDialog>;
}

export function EmployeeInformationContent({employee,section,canReadLabor=false,personalColumns=false,administrative=false}:{employee:Row;section:'personal'|'laboral';canReadLabor?:boolean;personalColumns?:boolean;administrative?:boolean}){
 const area=employee.rol?operationalLabel(employee.rol,false):'No registrada';
 const profile=(employee.perfil&&typeof employee.perfil==='object'?employee.perfil:{}) as Row;
 const field=(label:string,value:unknown)=><div key={label} className={`min-w-0 ${personalColumns?'text-left':'text-center'} ${personalColumns&&section==='personal'&&label==='Nombre completo'?'col-span-2':''}`}><dt className={`min-h-4 text-xs font-medium leading-4 ${personalColumns?'text-left text-[#64748B]':'text-center text-[#18345C]'}`}>{label}</dt><dd className="mt-0.5 break-words text-sm font-medium text-[#18345C]">{display(value)}</dd></div>;
 const status=employee.estado==='ACTIVO'||employee.estado==='INACTIVO'?<span className={`inline-block rounded-full px-2 py-1 text-xs font-semibold ${employee.estado==='ACTIVO'?'bg-green-50 text-green-800':'bg-red-50 text-red-800'}`}>{employee.estado}</span>:display(employee.estado);
 if(administrative){
  const item=(label:string,value:unknown)=><div key={label} className={c.field}><dt>{label}</dt><dd>{display(value)}</dd></div>;
  return section==='personal'?<dl className={c.grid}>{item('Nombre completo',employee.nombre)}{item('Correo personal',employee.correoPersonal)}{item('Correo laboral',employee.correo)}{item('Teléfono',employee.telefono)}</dl>:<><dl className={c.grid+' '+c.labor}>{item('Área',area)}<div className={c.field}><dt>Estado</dt><dd>{status}</dd></div>{item('Rol',employee.rol)}{canReadLabor&&<>{item('Turno',profile.turno)}{item('Fecha de contratación',profile.fechaContratacion)}{item('Asistencia',profile.asistencia)}{item('Salario base (Q)',profile.salarioBase)}{item('Bonos (Q)',profile.bonosExtras)}{item('Descuentos (Q)',profile.descuentosNomina)}</>}</dl>{Boolean(employee.area)&&<dl className={c.specialty}>{item('Especialidad',operationalLabel(employee.area,false))}</dl>}</>;
 }
 return <>  {section==='personal'?<dl className={`grid min-w-0 grid-cols-2 ${personalColumns?'max-w-sm gap-x-2 gap-y-1.5':'gap-x-3 gap-y-2'}`}>{field('Nombre completo',employee.nombre)}{personalColumns&&<div aria-hidden="true" className="col-span-2 border-t border-[#E5E0D8]"/>}{field('Correo laboral',employee.correo)}{field('Correo personal',employee.correoPersonal)}{!personalColumns&&<div aria-hidden="true" className="col-span-2 border-t border-[#E5E0D8]"/>}{field('Teléfono',employee.telefono)}{!personalColumns&&<div aria-hidden="true"/>}</dl>:<div className="space-y-2">
   <dl className={`grid min-w-0 grid-cols-3 gap-x-2 ${personalColumns?'gap-y-1.5':'gap-y-2'}`}>
    {field('Área',area)}<div className={`min-w-0 ${personalColumns?'text-left':'text-center'}`}><dt className={`min-h-4 text-xs font-medium leading-4 ${personalColumns?'text-left text-[#64748B]':'text-center text-[#18345C]'}`}>Estado</dt><dd className="mt-0.5 min-h-6">{status}</dd></div>{canReadLabor?field('Turno',profile.turno):<div aria-hidden="true"/>}
    {canReadLabor&&<>
     <div aria-hidden="true" className="col-span-3 border-t border-[#E5E0D8]"/>
     {field('Fecha de contratación',profile.fechaContratacion)}{field('Asistencia',profile.asistencia)}<div aria-hidden="true"/>
     <div aria-hidden="true" className="col-span-3 border-t border-[#E5E0D8]"/>
     {field('Salario base (Q)',profile.salarioBase)}{field('Bonos (Q)',profile.bonosExtras)}{field('Descuentos (Q)',profile.descuentosNomina)}
    </>}
   </dl>
   {Boolean(employee.area)&&<dl>{field('Especialidad',operationalLabel(employee.area,false))}</dl>}
  </div>}</>;
}
