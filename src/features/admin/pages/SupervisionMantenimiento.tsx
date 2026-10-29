'use client';
import AdminRefreshButton from './AdminRefreshButton';
import Image from 'next/image';
import {useEffect,useState} from 'react';
import {useAuth} from '@/hooks/useAuth';
import {usePublicLanguage} from '@/components/common/PublicLanguageToggle';
import {operationalLabel} from '@/i18n/operationalLabels';
import {operacion} from '@/lib/api/operaciones';
import type {components} from '@/lib/api/schema';
import ReceptionActionDialog from '@/features/recepcion/pages/ReceptionActionDialog';
type Incident=components['schemas']['IncidenciaResumen'];
type Detail=components['schemas']['IncidenciaDetalle'];
const control='mt-1 block w-full rounded-md border border-[#E5E0D8] bg-white p-2';
export default function SupervisionMantenimiento(){
 const {user,loading:sessionLoading}=useAuth(),{en}=usePublicLanguage(),allowed=user?.staff?.rol==='ADMIN';
 const ui=(es:string,english:string)=>en?english:es;
 const date=(value:string|null)=>value?new Intl.DateTimeFormat(en?'en-US':'es-GT',{dateStyle:'medium',timeStyle:'short',timeZone:'America/Guatemala'}).format(new Date(value)):'—';
 const [rows,setRows]=useState<Incident[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState(''),[reload,setReload]=useState(0);
 const [state,setState]=useState(''),[room,setRoom]=useState(''),[technician,setTechnician]=useState('');
 const [selected,setSelected]=useState<number|null>(null),[detail,setDetail]=useState<Detail|null>(null),[detailError,setDetailError]=useState('');
 useEffect(()=>{if(!allowed)return;const c=new AbortController();setLoading(true);setError('');setRows([]);
 operacion<Incident[]>('incidencias','GET',undefined,c.signal).then(data=>{if(!c.signal.aborted)setRows(data);}).catch(e=>{if(!c.signal.aborted)setError(e instanceof Error?e.message:'No se pudo consultar.');}).finally(()=>{if(!c.signal.aborted)setLoading(false);});return()=>c.abort();},[allowed,reload]);
 useEffect(()=>{setDetail(null);setDetailError('');if(!allowed||selected===null)return;const c=new AbortController();
 operacion<Detail>(`incidencias/${selected}`,'GET',undefined,c.signal).then(data=>{if(!c.signal.aborted)setDetail(data);}).catch(e=>{if(!c.signal.aborted)setDetailError(e instanceof Error?e.message:'No se pudo consultar.');});return()=>c.abort();},[allowed,selected,reload]);
 if(sessionLoading)return <p role="status" className="p-4">{ui('Consultando sesión…','Loading session…')}</p>;
 if(!allowed)return <p role="alert" className="p-4">{ui('Acceso denegado','Access denied')}</p>;
 const rooms=Array.from(new Map(rows.map(i=>[i.habitacion.id,i.habitacion])).values()).sort((a,b)=>a.numero.localeCompare(b.numero,undefined,{numeric:true}));
 const technicians=Array.from(new Map(rows.flatMap(i=>i.tecnicoACargo?[[i.tecnicoACargo.id,i.tecnicoACargo] as const]:[])).values());
 const visible=rows.filter(i=>(!state||i.estado===state)&&(!room||String(i.habitacion.id)===room)&&(!technician||String(i.tecnicoACargo?.id)===technician)).sort((a,b)=>Number(a.estado==='RESUELTA')-Number(b.estado==='RESUELTA')||Date.parse(b.reportadaEn)-Date.parse(a.reportadaEn));
 return <main className="min-w-0 flex-1 overflow-auto bg-[#F8F6F0] p-4 text-[#18345C] sm:p-6">
  <header className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-[32px] font-semibold">{ui('Supervisión de mantenimiento','Maintenance overview')}</h1><p className="text-sm text-[#536579]">{ui('Consulta de incidencias · Solo lectura','Incident overview · Read only')}</p></div><AdminRefreshButton loading={loading} disabled={loading} onClick={()=>setReload(n=>n+1)}/></header>
  <div data-admin-toolbar className="mb-4 grid gap-3 sm:grid-cols-3"><label>{ui('Estado','Status')}<select className={control} value={state} onChange={e=>setState(e.target.value)}><option value="">{ui('Todos','All')}</option>{['REPORTADA','EN_PROCESO','RESUELTA'].map(value=><option key={value} value={value}>{operationalLabel(value,en)}</option>)}</select></label><label>{ui('Habitación','Room')}<select className={control} value={room} onChange={e=>setRoom(e.target.value)}><option value="">{ui('Todas','All')}</option>{rooms.map(r=><option key={r.id} value={r.id}>{r.numero}</option>)}</select></label><label>{ui('Técnico','Technician')}<select className={control} value={technician} onChange={e=>setTechnician(e.target.value)}><option value="">{ui('Todos','All')}</option>{technicians.map(t=><option key={t.id} value={t.id}>{t.nombre}</option>)}</select></label></div>
  {loading?<p role="status">{ui('Consultando incidencias…','Loading incidents…')}</p>:error?<p role="alert" className="text-red-800">{error}</p>:!visible.length?<p role="status">{ui('Sin incidencias','No incidents')}</p>:<div className="grid gap-3 md:grid-cols-2">{visible.map(i=><article key={i.id} className="min-w-0 rounded-xl border border-[#E5E0D8] bg-white p-4"><h2 className="font-semibold">{ui('Habitación','Room')} {i.habitacion.numero} · {operationalLabel(i.estado,en)}</h2><p className="mt-2 whitespace-pre-wrap break-words">{i.descripcion}</p><dl className="mt-3 space-y-1 text-sm"><div><dt className="inline">{ui('Impide el uso','Blocks use')}: </dt><dd className="inline">{i.impideUso?ui('Sí','Yes'):ui('No','No')}</dd></div><div><dt className="inline">{ui('Reportada por','Reported by')}: </dt><dd className="inline">{i.reportadaPor.nombre} · {date(i.reportadaEn)}</dd></div><div><dt className="inline">{ui('Técnico','Technician')}: </dt><dd className="inline">{i.tecnicoACargo?.nombre??ui('Sin asignar','Unassigned')}</dd></div><div><dt className="inline">{ui('Resolución','Resolved')}: </dt><dd className="inline">{date(i.resueltaEn)}</dd></div></dl><button onClick={()=>setSelected(i.id)} className="mt-3 rounded-md border px-3 py-2">{ui('Ver detalle','View details')}</button></article>)}</div>}
  {selected!==null&&<ReceptionActionDialog title={ui('Detalle de incidencia','Incident details')} onClose={()=>setSelected(null)}>{detailError?<><p role="alert" className="text-red-800">{detailError}</p><button className="mt-3 rounded-md border px-3 py-2" onClick={()=>setReload(n=>n+1)}>{ui('Reintentar','Retry')}</button></>:!detail?<p role="status">{ui('Consultando…','Loading…')}</p>:<div className="space-y-3"><p className="whitespace-pre-wrap break-words">{detail.descripcion}</p>{detail.fotoUrl&&<Image src={detail.fotoUrl} unoptimized width={400} height={280} className="h-auto max-h-64 w-full rounded-lg object-contain" alt={ui('Fotografía de la incidencia','Incident photograph')}/>}<p><strong>{ui('Solución','Solution')}: </strong>{detail.solucion??ui('Sin resolver','Unresolved')}</p><h4 className="font-semibold">{ui('Historial','History')}</h4>{detail.historial.length?<ol className="space-y-2 text-sm">{detail.historial.map((h,index)=><li key={index} className="border-l-2 border-[#D8B94E] pl-3">{operationalLabel(h.estadoNuevo,en)} · {date(h.fechaHora)}<br/>{h.responsable}{h.motivo&&<p className="whitespace-pre-wrap">{h.motivo}</p>}</li>)}</ol>:<p>{ui('Sin cambios registrados','No recorded changes')}</p>}</div>}</ReceptionActionDialog>}
 </main>;
}
