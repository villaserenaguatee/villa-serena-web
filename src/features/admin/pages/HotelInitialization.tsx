'use client';
import {useEffect,useRef,useState,type ReactNode} from 'react';
import type {components} from '@/lib/api/schema';
import {operacion,OperationError} from '@/lib/api/operaciones';
import {validBookingEmail} from '@/lib/guestValidation';
import {validGuatemalaNit} from '@/lib/pms/nit';
import ReceptionActionDialog from '@/features/recepcion/pages/ReceptionActionDialog';

type Hotel=components['schemas']['HotelAdmin'];
type Input=components['schemas']['InicializarHotelPeticion'];
const fields=[['nombre','Nombre del hotel',150],['descripcion','Descripción',4000],['direccion','Dirección',255],['telefono','Teléfono',30],['correo','Correo de contacto',150],['nombreComercial','Nombre comercial',150],['razonSocial','Razón social',150],['nit','NIT del hotel',20],['direccionFiscal','Dirección fiscal',255]] as const;
const empty:Input={nombre:'',descripcion:'',direccion:'',telefono:'',correo:'',nombreComercial:'',razonSocial:'',nit:'',direccionFiscal:''};
const missing=(error:unknown)=>error instanceof OperationError&&error.status===404&&(error.data as {codigo?:string}|undefined)?.codigo==='HOTEL_NO_CONFIGURADO';
export function validHotelConfiguration(value:unknown):value is Hotel{
 if(!value||typeof value!=='object')return false;
 const hotel=value as Hotel;
 return fields.every(([key])=>typeof hotel[key]==='string'&&hotel[key].trim())&&hotel.horaCheckIn==='15:00'&&hotel.horaCheckOut==='12:00'&&typeof hotel.politicaCancelacion==='string'&&Array.isArray(hotel.fotos)&&hotel.fotos.every(photo=>typeof photo.clave==='string'&&Boolean(photo.clave)&&Number.isInteger(photo.orden)&&photo.orden>=0);
}
function message(error:unknown){
 if(error instanceof OperationError){if(error.status===401)return 'La sesión venció. Inicia sesión nuevamente.';if(error.status===403)return 'Tu cuenta no tiene permiso para inicializar el hotel.';if(error.status===409)return 'HOTEL_YA_CONFIGURADO: ya existe una configuración diferente. Consulta los datos actuales; no se sobrescribieron.';if(error.status>=500)return 'No se pudo confirmar la operación. Conservamos los datos para reintentar o consultar.';}
 return error instanceof Error?error.message:'No se pudo completar la operación.';
}

/** Compatible con la pantalla conectada y con el editor: no depende de su estado interno. */
export default function HotelInitialization({children}:{children:ReactNode}){
 const [state,setState]=useState<'loading'|'ready'|'missing'|'error'>('loading'),[error,setError]=useState(''),[open,setOpen]=useState(false),[reload,setReload]=useState(0),[generation,setGeneration]=useState(0),[notice,setNotice]=useState('');
 useEffect(()=>{const abort=new AbortController();setState('loading');setError('');operacion<Hotel>('admin/hotel','GET',undefined,abort.signal).then(value=>{if(abort.signal.aborted)return;if(!validHotelConfiguration(value))throw Error('El servicio devolvió una configuración incompleta. No se habilitó la inicialización.');setState('ready');}).catch(reason=>{if(abort.signal.aborted)return;if(missing(reason))setState('missing');else{setState('error');setError(message(reason));}});return()=>abort.abort();},[reload]);
 function consult(){setReload(value=>value+1);setGeneration(value=>value+1);}
 return <div className="flex min-h-0 min-w-0 flex-1 flex-col">
  {state==='missing'&&<section aria-label="Configuración inicial del hotel" className="m-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#E8DDBB] bg-[#FCF7E7] p-4 text-[#18345C]"><div><h2 className="font-semibold">El hotel aún no está configurado</h2><p className="text-sm">HOTEL_NO_CONFIGURADO · Revisa los datos aprobados del hotel antes de inicializarlo. La vista previa sigue disponible.</p></div><button type="button" onClick={()=>setOpen(true)} className="min-h-11 rounded-md bg-[#18345C] px-4 py-2 text-white">Inicializar hotel</button></section>}
  {state==='error'&&<p role="alert" className="m-4 rounded-lg border bg-white p-3 text-sm text-red-800">{error}<button type="button" onClick={consult} className="ml-2 rounded border px-3 py-2 text-[#18345C]">Volver a consultar</button></p>}
  {notice&&<p role="status" className="mx-4 mt-3 rounded-lg bg-green-50 p-3 text-sm text-green-800">{notice}</p>}
  <div key={generation} className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</div>
  {open&&<HotelInitializationForm onClose={()=>setOpen(false)} onConfigured={()=>{setOpen(false);setState('ready');setNotice('Configuración del hotel verificada. Ya puedes consultar y editar sus datos.');setGeneration(value=>value+1);}} onConsult={()=>{setOpen(false);consult();}}/>}
 </div>;
}

export function HotelInitializationForm({onClose,onConfigured,onConsult}:{onClose:()=>void;onConfigured:()=>void;onConsult:()=>void}){
 const [draft,setDraft]=useState<Input>(empty),[errors,setErrors]=useState<Record<string,string>>({}),[review,setReview]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[conflict,setConflict]=useState(false);
 const lock=useRef(false);
 useEffect(()=>{if(!Object.values(draft).some(Boolean))return;const warn=(event:BeforeUnloadEvent)=>event.preventDefault();window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[draft]);
 function validate(){const errors:Record<string,string>={};for(const [key,,max]of fields)if(!draft[key].trim())errors[key]='Complete este campo';else if(draft[key].trim().length>max)errors[key]=`Máximo ${max} caracteres`;if(!validBookingEmail(draft.correo.trim()))errors.correo='Ingrese un correo electrónico válido';if(!validGuatemalaNit(draft.nit))errors.nit='Ingrese un NIT válido con dígito verificador';setErrors(errors);return Object.keys(errors).length===0;}
 async function initialize(){if(lock.current||!validate())return;lock.current=true;setBusy(true);setError('');setConflict(false);try{
  const body=Object.fromEntries(fields.map(([key])=>[key,draft[key].trim()])) as Input;
  const created=await operacion<Hotel>('admin/hotel/inicializacion','POST',body);
  if(!validHotelConfiguration(created))throw Error('El servicio no confirmó una configuración válida. Conservamos los datos.');
  const current=await operacion<Hotel>('admin/hotel','GET');
  if(!validHotelConfiguration(current))throw Error('No se pudo verificar la configuración guardada. Conservamos los datos.');
  onConfigured();
 }catch(reason){setError(message(reason));setConflict(reason instanceof OperationError&&reason.status===409);}finally{lock.current=false;setBusy(false);}}
 return <ReceptionActionDialog title={review?'Confirmar inicialización':'Inicializar hotel'} busy={busy} onClose={()=>{if(!lock.current)onClose();}}>
  <p className="mb-4 text-sm text-[#536579]">Introduce únicamente datos reales aprobados. Esta operación no modifica fotografías, facturas ni series de facturación.</p>
  <form noValidate onSubmit={event=>{event.preventDefault();if(review)void initialize();else if(validate())setReview(true);}}>
   {review?<dl className="grid gap-3 text-sm sm:grid-cols-2">{fields.map(([key,label])=><div key={key} className="min-w-0"><dt className="text-xs text-[#64748B]">{label}</dt><dd className="break-words text-[#18345C]">{draft[key]}</dd></div>)}</dl>:<div className="grid gap-3 sm:grid-cols-2">{fields.map(([key,label,max])=><div key={key} className={key==='descripcion'?'sm:col-span-2':''}><label htmlFor={'hotel-init-'+key} className="text-sm font-medium">{label} *</label>{key==='descripcion'?<textarea id={'hotel-init-'+key} value={draft[key]} required maxLength={max} disabled={busy} aria-invalid={Boolean(errors[key])} aria-describedby={errors[key]?'hotel-init-error-'+key:undefined} onChange={event=>setDraft(value=>({...value,[key]:event.target.value}))} className="mt-1 w-full rounded-md border border-[#D8DFE5] p-2"/>:<input id={'hotel-init-'+key} type={key==='correo'?'email':key==='telefono'?'tel':'text'} value={draft[key]} required maxLength={max} disabled={busy} aria-invalid={Boolean(errors[key])} aria-describedby={errors[key]?'hotel-init-error-'+key:undefined} onChange={event=>setDraft(value=>({...value,[key]:event.target.value}))} className="mt-1 w-full rounded-md border border-[#D8DFE5] p-2"/>}{errors[key]&&<small id={'hotel-init-error-'+key} role="alert" className="text-red-800">{errors[key]}</small>}</div>)}</div>}
   {error&&<p role="alert" className="mt-3 text-sm text-red-800">{error}</p>}
   {conflict&&<button type="button" disabled={busy} onClick={onConsult} className="mt-2 min-h-11 rounded-md border px-3 py-2 text-sm">Consultar configuración actual</button>}
   <footer className="mt-4 flex flex-wrap justify-end gap-3"><button type="button" disabled={busy} onClick={()=>review?setReview(false):onClose()} className="min-h-11 rounded-md border px-3 py-2">{review?'Volver a editar':'Cancelar'}</button><button disabled={busy} className="min-h-11 rounded-md bg-[#18345C] px-3 py-2 text-white">{busy?'Verificando…':review?'Confirmar inicialización':'Revisar datos'}</button></footer>
  </form>
 </ReceptionActionDialog>;
}
