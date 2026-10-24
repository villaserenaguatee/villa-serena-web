'use client';
import {useId,useRef,useState,type FormEvent} from 'react';
import {Eye,EyeOff} from 'lucide-react';
import {staffPassword} from '@/lib/auth/staff-client';
import type {Employee,PasswordInput} from '@/lib/auth/staff-contract';
import {validatePassword} from '@/lib/bff/auth/errors';

export default function StaffPasswordForm({mandatory=false,onSuccess,onCancel,onBusy}:{mandatory?:boolean;onSuccess:(employee:Employee)=>void;onCancel?:()=>void;onBusy?:(busy:boolean)=>void}){
 const id=useId(),lock=useRef(false),form=useRef<HTMLFormElement>(null);
 const [values,setValues]=useState<PasswordInput>({contrasenaActual:'',contrasenaNueva:'',confirmacion:''});
 const [visible,setVisible]=useState<Record<string,boolean>>({}),[errors,setErrors]=useState<Partial<Record<keyof PasswordInput,string>>>({}),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const fields:[keyof PasswordInput,string][]=[['contrasenaActual',mandatory?'Contraseña temporal':'Contraseña actual'],['contrasenaNueva','Nueva contraseña'],['confirmacion',mandatory?'Confirmar contraseña':'Confirmar nueva contraseña']];
 async function submit(event:FormEvent){
  event.preventDefault();if(lock.current)return;
  const next:typeof errors={};
  for(const [key,label] of fields)if(!values[key])next[key]=`Introduce ${label.toLowerCase()}.`;
  if(values.contrasenaNueva&&values.confirmacion){try{validatePassword(values);}catch(e){next[values.contrasenaNueva!==values.confirmacion?'confirmacion':'contrasenaNueva']=e instanceof Error?e.message:'Revisa la nueva contraseña.';}}
  setErrors(next);setError('');
  if(Object.keys(next).length){form.current?.querySelector<HTMLInputElement>(`[name="${Object.keys(next)[0]}"]`)?.focus();return;}
  lock.current=true;setBusy(true);onBusy?.(true);
  try{const employee=await staffPassword(values);setValues({contrasenaActual:'',contrasenaNueva:'',confirmacion:''});onSuccess(employee);}
  catch(e){setError(e instanceof Error?e.message:'No se pudo cambiar la contraseña. Intenta nuevamente.');}
  finally{lock.current=false;setBusy(false);onBusy?.(false);}
 }
 return <form ref={form} noValidate onSubmit={submit} className="space-y-3">
  {fields.map(([key,label])=><div key={key}><label htmlFor={`${id}-${key}`} className="text-sm font-medium">{label}</label><div className="relative mt-1"><input id={`${id}-${key}`} name={key} type={visible[key]?'text':'password'} autoComplete={key==='contrasenaActual'?'current-password':'new-password'} required maxLength={256} disabled={busy} aria-invalid={!!errors[key]} aria-describedby={errors[key]?`${id}-${key}-error`:key==='contrasenaNueva'?`${id}-requirements`:undefined} value={values[key]} onChange={e=>{setValues(v=>({...v,[key]:e.target.value}));setErrors(v=>({...v,[key]:undefined}));setError('');}} className="w-full rounded-lg border border-[#D9D5CC] bg-white py-2.5 pl-3 pr-11 outline-none focus:border-[#426D98] focus:ring-2 focus:ring-[#426D98]/20"/><button type="button" aria-label={`${visible[key]?'Ocultar':'Mostrar'} ${label.toLowerCase()}`} aria-pressed={!!visible[key]} onClick={()=>setVisible(v=>({...v,[key]:!v[key]}))} className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-lg text-[#536579] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#426D98]">{visible[key]?<EyeOff size={18}/>:<Eye size={18}/>}</button></div>{errors[key]&&<p id={`${id}-${key}-error`} role="alert" className="mt-1 text-xs text-red-800">{errors[key]}</p>}</div>)}
  <p id={`${id}-requirements`} className="sr-only">Usa al menos 8 caracteres, una letra y un número. La nueva contraseña debe ser distinta de la actual.</p>
  {error&&<p role="alert" className="text-sm text-red-800">{error}</p>}
  <div className="flex justify-end gap-2 pt-2">{onCancel&&<button type="button" disabled={busy} onClick={onCancel} className="rounded-lg border border-[#D9D5CC] px-4 py-2.5 text-sm disabled:opacity-50">Cancelar</button>}<button type="submit" disabled={busy} className={`${mandatory?'w-full ':''}rounded-lg bg-[#18345C] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50`}>{busy?'Guardando…':mandatory?'Guardar y continuar':'Guardar cambios'}</button></div>
 </form>;
}
