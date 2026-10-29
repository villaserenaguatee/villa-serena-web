'use client';
import {useEffect,useId,useState,type ReactNode} from 'react';
import PersonalFields from './PersonalFields';
import type {PersonalDraft,PersonalErrors} from './personalValidation';

export default function EmployeeFormSections({draft,errors,onChange,lockIdentity,securityAction}:{draft:PersonalDraft;errors:PersonalErrors;onChange:(key:string,value:unknown)=>void;lockIdentity:boolean;securityAction:ReactNode}){
 const [tab,setTab]=useState('personal'),id=useId();
 const editing=Boolean(draft.id),laborAvailable=draft.laborDisponible!==false;
 useEffect(()=>{if(Object.keys(errors).length)setTab(Object.keys(errors).some(key=>key.startsWith('perfil.'))?'laboral':'personal');},[errors]);
 const personal=<PersonalFields section="personal" serverPassword draft={draft} errors={errors} onChange={onChange} lockRoleAndState={lockIdentity}/>;
 const access=<PersonalFields section="laboral" employmentEditable={false} serverPassword draft={draft} errors={errors} onChange={onChange} lockRoleAndState={lockIdentity}/>;
 if(!editing)return <div className="space-y-4"><fieldset className="grid min-w-0 gap-3 sm:grid-cols-2"><legend className="mb-2 font-semibold">Datos personales</legend>{personal}</fieldset><fieldset className="grid min-w-0 gap-3 border-t border-[#E5E0D8] pt-3 sm:grid-cols-2"><legend className="mb-2 font-semibold">Acceso al sistema</legend>{access}</fieldset><p className="text-sm text-[#536579]">El backend genera una contraseña temporal para la cuenta nueva. Los datos laborales se completan después.</p></div>;
 const tabs=[['personal','Datos personales'],['laboral','Datos laborales'],['seguridad','Seguridad']];
 return <div className="min-w-0"><nav role="tablist" aria-label="Edición del empleado" className="mb-4 flex gap-3 overflow-x-auto border-b border-[#E5E0D8]">{tabs.map(([key,label],index)=><button key={key} type="button" role="tab" id={id+'-'+key} aria-selected={tab===key} aria-controls={id+'-panel-'+key} tabIndex={tab===key?0:-1} onClick={()=>setTab(key)} onKeyDown={event=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?2:(index+(event.key==='ArrowRight'?1:2))%3;setTab(tabs[next][0]);document.getElementById(id+'-'+tabs[next][0])?.focus();}}} className={`shrink-0 border-b-2 pb-2 text-sm ${tab===key?'border-[#D8B94E] font-semibold text-[#18345C]':'border-transparent text-[#536579]'}`}>{label}</button>)}</nav>
  <section role="tabpanel" id={id+'-panel-personal'} aria-labelledby={id+'-personal'} hidden={tab!=='personal'}><div className="grid min-w-0 gap-3 sm:grid-cols-2">{personal}{access}</div></section>
  <section role="tabpanel" id={id+'-panel-laboral'} aria-labelledby={id+'-laboral'} hidden={tab!=='laboral'}><div className="grid min-w-0 gap-3 sm:grid-cols-2">{laborAvailable?<PersonalFields section="employment" serverPassword draft={draft} errors={errors} onChange={onChange}/>:<p className="text-sm">No se pudieron consultar los datos laborales. Actualiza la lista para reintentar.</p>}</div></section>
  <section role="tabpanel" id={id+'-panel-seguridad'} aria-labelledby={id+'-seguridad'} hidden={tab!=='seguridad'}><p className="text-sm text-[#536579]">Correo laboral utilizado para iniciar sesión</p><p className="mt-1 break-words text-sm font-medium text-[#18345C]">{String(draft.correo??'')}</p><div className="mt-4">{securityAction}</div></section>
 </div>;
}
