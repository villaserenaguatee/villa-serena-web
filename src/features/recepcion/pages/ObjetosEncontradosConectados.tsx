'use client';
import styles from './ObjetosRecepcion.module.css';
import { RefreshCw } from 'lucide-react';
import SelectPlaceholder from '@/components/common/SelectPlaceholder';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { getReservation, searchReservations, getRooms } from '@/lib/api/reception';
import type { ReservationDetail, ReservationSummary, RoomState } from '@/lib/bff/contracts/reception';
import { leerObjetosOlvidados } from '@/store/lostFoundEvents';
import type { ObjetoOlvidado } from '@/lib/pms/types';
import LostObjectImageField from '@/components/common/LostObjectImageField';
import ReceptionCloseButton from './ReceptionCloseButton';
import ReintentoObjetoIncierto from './ReintentoObjetoIncierto';

type Objeto = {id:number; descripcion:string; habitacionNumero:string; halladoEn:string; notaInterna:string; tieneFoto:boolean; estadoFisico:'EN_RESGUARDO'|'DEVUELTO'; devueltoEn:string|null;
  notificadoEn:string|null; estadoEnvio:'PENDIENTE'|'ENVIANDO'|'ENVIADO'|'FALLIDO'|'INCIERTO'|null;
  intentos:number|null; ultimoError:string|null; destinatario:string|null; revision:string|null; enviadoEn:string|null;reintentoControladoUsado:boolean};
type Preview = {revision:string; asunto:string; correo:string; nombreHuesped:string; codigoReserva:string; html:string};
const input='w-full min-w-0 rounded-md border border-[#E5E0D8] bg-white px-3 py-2 text-sm text-[#18345C]';
const primary='rounded-lg bg-[#18345C] px-4 py-2.5 font-semibold text-white disabled:opacity-40';
const secondary='rounded-lg border border-[#18345C] px-4 py-2 text-sm font-semibold text-[#18345C] disabled:opacity-40';
const fecha=(value:string|null)=>value?new Date(value).toLocaleString('es-GT',{dateStyle:'medium',timeStyle:'short'}):'';
async function api<T>(route='',body?:unknown):Promise<T>{
 const response=await fetch(`/api/objetos${route}`,{method:body===undefined?'GET':'POST',cache:'no-store',...(body===undefined?{}:{headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})});
 const value=await response.json();if(!response.ok)throw Error(value?.mensaje??'No se pudo completar la operación.');return value;
}
function readPhoto(file:File):Promise<string>{
 if(!['image/jpeg','image/png'].includes(file.type)||file.size>5*1024*1024)throw Error('Selecciona una fotografía JPEG o PNG de hasta 5 MiB.');
 return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(Error('No se pudo leer la fotografía.'));reader.readAsDataURL(file);});
}
export default function ObjetosEncontradosConectados(){
 const [rows,setRows]=useState<Objeto[]>([]),[active,setActive]=useState<Objeto|null>(null),[rooms,setRooms]=useState<RoomState[]>([]);
 const [error,setError]=useState(''),[busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[nuevo,setNuevo]=useState(false);
 const operationLock=useRef(false);
 const [devolucion,setDevolucion]=useState<Objeto|null>(null),[receptorConfirmado,setReceptorConfirmado]=useState(false);
 const [nombreFiltro,setNombreFiltro]=useState(''),[pisoFiltro,setPisoFiltro]=useState(''),[habitacionFiltro,setHabitacionFiltro]=useState('');
 const [filtro,setFiltro]=useState<'pendientes'|'devueltos'>('pendientes');
 const [selectedPhoto,setSelectedPhoto]=useState<File>();
 const [legacy,setLegacy]=useState<ObjetoOlvidado[]>([]),[foto,setFoto]=useState('');
 const [texto,setTexto]=useState(''),[results,setResults]=useState<ReservationSummary[]>([]),[selected,setSelected]=useState<ReservationDetail|null>(null);
 const [correo,setCorreo]=useState(''),[mensaje,setMensaje]=useState(''),[includePhoto,setIncludePhoto]=useState(false);
 const [confirmRecipient,setConfirmRecipient]=useState(false),[confirmMessage,setConfirmMessage]=useState(false),[preview,setPreview]=useState<Preview|null>(null);
 async function load(){const values=await api<Objeto[]>();setRows(values);setActive(current=>current?values.find(x=>x.id===current.id)??current:null);}
 async function run(work:()=>Promise<void>){if(operationLock.current)return;operationLock.current=true;setBusy(true);setError('');try{await work();}catch(e){setError(e instanceof Error?e.message:'No se pudo completar la operación.');}finally{operationLock.current=false;setBusy(false);}}
 useEffect(()=>{let alive=true;void Promise.all([api<Objeto[]>(),getRooms()]).then(([objects,roomList])=>{if(alive){setRows(objects);setRooms(roomList);}}).catch(e=>{if(alive)setError(e.message);}).finally(()=>{if(alive)setLoading(false);});setLegacy(leerObjetosOlvidados());return()=>{alive=false;};},[]);
 const pending=rows.some(o=>o.estadoEnvio==='PENDIENTE'||o.estadoEnvio==='ENVIANDO');
 useEffect(()=>{if(!pending)return;let alive=true;const timer=setInterval(()=>{void api<Objeto[]>().then(values=>{if(alive){setRows(values);setActive(current=>current?values.find(x=>x.id===current.id)??current:null);}}).catch(e=>{if(alive)setError(e.message);});},3000);return()=>{alive=false;clearInterval(timer);};},[pending]);
 function invalidate(){setPreview(null);setConfirmMessage(false);}
 function review(o:Objeto){setActive(o);setSelected(null);setResults([]);setTexto('');setCorreo('');setMensaje('');setIncludePhoto(false);setConfirmRecipient(false);invalidate();setError('');}
 async function create(event:FormEvent<HTMLFormElement>){event.preventDefault();const data=new FormData(event.currentTarget);await run(async()=>{
  const o=await api<Objeto>('',{descripcion:data.get('descripcion'),habitacionNumero:data.get('habitacion'),halladoEn:new Date(String(data.get('fecha'))).toISOString(),notaInterna:data.get('nota'),fotoBase64:foto||null});
  setNuevo(false);setFoto('');setSelectedPhoto(undefined);await load();review(o);
 });}
 return <div className="flex-1 overflow-y-auto bg-[#F8F6F0] text-[#18345C]">
  <header data-vs-page-header="recepcion" className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E0D8] bg-white px-4 py-5 sm:px-6"><div><h1 data-vs-page-title="recepcion" className="text-[30px] font-semibold">Objetos olvidados</h1><p className="mt-1 text-sm text-[#52677F]">Revisa y confirma el destinatario antes de enviar un aviso.</p></div><button className={primary} onClick={()=>{setFoto('');setSelectedPhoto(undefined);setNuevo(true);setError('');}}>Registrar objeto</button></header>
  {error&&<p role="alert" className="m-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
  {loading&&<p role="status" className="p-4">Consultando objetos…</p>}
  <div className="flex gap-2 px-4 pt-4"><button className={filtro==='pendientes'?primary:secondary} onClick={()=>setFiltro('pendientes')}>Por entregar</button><button className={filtro==='devueltos'?primary:secondary} onClick={()=>setFiltro('devueltos')}>Devueltos</button></div>
  <div className="flex flex-wrap items-end gap-3 px-4 pt-3 sm:px-6"><label className="text-sm">Nombre<input aria-label="Buscar objeto" className={input} value={nombreFiltro} onChange={e=>setNombreFiltro(e.target.value)}/></label><label className="text-sm">Piso<select aria-label="Piso" className={input} value={pisoFiltro} onChange={e=>{setPisoFiltro(e.target.value);setHabitacionFiltro('');}}><option value="">Todos</option>{[...new Set(rooms.map(r=>r.piso))].sort((a,b)=>a-b).map(p=><option key={p} value={p}>Piso {p}</option>)}</select></label><label className="text-sm">Habitación<select aria-label="Habitación" className={input} value={habitacionFiltro} onChange={e=>setHabitacionFiltro(e.target.value)}><option value="">Todas</option>{rooms.filter(r=>!pisoFiltro||String(r.piso)===pisoFiltro).map(r=><option key={r.id} value={r.numero}>{r.numero}</option>)}</select></label><button title="Limpiar filtros" aria-label="Limpiar filtros" className="h-10 rounded-lg border border-[#E5E0D8] bg-white px-3 text-[#18345C]" onClick={()=>{setNombreFiltro('');setPisoFiltro('');setHabitacionFiltro('');}}><RefreshCw size={17}/></button><button className={secondary} disabled={busy||loading} onClick={()=>void run(load)}>Actualizar</button></div>
  <main className={`${styles.list} grid grid-cols-1 gap-3 p-4 sm:p-6`}>{rows.filter(o=>filtro==='devueltos'?o.estadoFisico==='DEVUELTO':o.estadoFisico!=='DEVUELTO').filter(o=>o.descripcion.toLowerCase().includes(nombreFiltro.trim().toLowerCase())&&(!habitacionFiltro||o.habitacionNumero===habitacionFiltro)&&(!pisoFiltro||rooms.some(r=>r.numero===o.habitacionNumero&&String(r.piso)===pisoFiltro))).map(o=><article data-vs-card="recepcion" key={o.id} data-object-id={o.id} className={`${styles.card} flex min-w-0 rounded-xl border border-[#E5E0D8] bg-white p-3`}>
   <div className={`${styles.photo} shrink-0 overflow-hidden rounded-lg bg-[#F8F6F0]`}>{o.tieneFoto?<img src={'/api/objetos/'+o.id+'/foto'} alt={o.descripcion} className="h-full w-full object-cover"/>:<div className="flex h-full items-center justify-center text-center text-xs text-[#71839B]">Sin fotografía</div>}</div><div className={`${styles.content} flex-1 break-words`}>
   <div className="flex flex-wrap items-start justify-between gap-2"><h2 className="font-semibold">{o.descripcion}</h2><span className="rounded-md border border-[#F3D98B] bg-[#FFFBEF] px-2 py-1 text-xs">{o.estadoFisico==='DEVUELTO'?'DEVUELTO':'EN RESGUARDO'}</span></div>
   <p className="mt-1 text-sm text-[#52677F]">Habitación {o.habitacionNumero}{rooms.find(r=>r.numero===o.habitacionNumero) ? ' · Piso '+rooms.find(r=>r.numero===o.habitacionNumero)!.piso : ''} · {fecha(o.halladoEn)}</p>
   {o.notaInterna&&<p className="mt-1 text-sm">Nota interna: {o.notaInterna}</p>}

   {o.destinatario&&<p className="mt-1 break-all text-sm">Para: {o.destinatario}</p>}
   {o.estadoEnvio==='ENVIADO'&&<p className="mt-1 text-sm">Aceptado por el servidor de correo · {fecha(o.enviadoEn)}</p>}
   {o.ultimoError&&<p className="mt-1 text-sm text-red-800">{o.ultimoError}</p>}
   {o.estadoFisico==='DEVUELTO'&&<p className="mt-1 text-sm">Devuelto · {fecha(o.devueltoEn)}</p>}
   <div className={styles.actions}>
   {(o.estadoEnvio||o.estadoFisico!=='DEVUELTO')&&<button className={`${secondary} mt-3`} onClick={()=>review(o)}>{o.estadoEnvio?'Ver resultado':'Preparar aviso'}</button>}
   {o.estadoFisico!=='DEVUELTO'&&<button className={`${primary} ml-2 mt-3`} disabled={busy||o.estadoEnvio==='PENDIENTE'||o.estadoEnvio==='ENVIANDO'} onClick={()=>{setDevolucion(o);setReceptorConfirmado(false);}}>Marcar como devuelto</button>}
  </div></div></article>)}</main>
  {!loading&&!rows.length&&<p className="p-6 text-center text-sm text-[#52677F]">No hay objetos registrados en el servidor.</p>}
  {!!legacy.length&&<details className="m-4 rounded-xl border border-[#E5E0D8] bg-white p-4"><summary className="cursor-pointer font-semibold">Registros anteriores de este navegador ({legacy.length})</summary><p className="my-3 text-sm">Se conservan sin cambios. Su estado local no acredita que se haya enviado un correo.</p>{legacy.map(o=><div key={o.id} className="flex flex-wrap items-center justify-between gap-3 border-t py-3"><span>{o.descripcion} · Habitación {o.habitacionNumero}</span><button className={secondary} disabled={busy} onClick={()=>void run(async()=>{
    let prefix=localStorage.getItem('vs-objetos-importador');if(!prefix){prefix=crypto.randomUUID();localStorage.setItem('vs-objetos-importador',prefix);}
    const when=new Date(o.fechaHora);if(Number.isNaN(when.getTime()))throw Error('El registro anterior necesita una fecha completa antes de importarse. Conserva el original y registra el hallazgo con su fecha correcta.');
    let imported=await api<Objeto>('',{descripcion:o.descripcion,habitacionNumero:o.habitacionNumero,halladoEn:when.toISOString(),notaInterna:o.observaciones,referenciaLocal:`${prefix}:${o.id}`,fotoBase64:o.foto??null});if(o.estado==='devuelto')imported=await api<Objeto>(`/${imported.id}/devolver`,{});await load();if(imported.estadoFisico==='DEVUELTO')setFiltro('devueltos');else review(imported);
   })}>Importar sin borrar el original</button></div>)}</details>}
  {devolucion&&<div className="fixed inset-0 z-50 grid place-items-center bg-black/35 p-4"><section role="dialog" aria-modal="true" aria-label="Confirmar devolución" className="w-full max-w-md rounded-2xl bg-white p-5"><h2 className="text-xl font-semibold">Confirmar devolución</h2><p className="mt-3 break-words">¿Confirmas la devolución de {devolucion.descripcion}?</p><label className="mt-3 flex items-start gap-2 text-sm"><input type="checkbox" checked={receptorConfirmado} onChange={e=>setReceptorConfirmado(e.target.checked)}/>He verificado la identidad de la persona que recibe el objeto.</label>{error&&<p role="alert" className="mt-3 text-red-800">{error}</p>}<div className="mt-4 flex flex-wrap justify-end gap-3"><button disabled={busy} className={secondary} onClick={()=>setDevolucion(null)}>Cancelar</button><button disabled={busy||!receptorConfirmado} className={primary} onClick={()=>void run(async()=>{await api('/'+devolucion.id+'/devolver',{});await load();setDevolucion(null);setFiltro('devueltos');})}>Marcar como devuelto</button></div></section></div>}
  {nuevo&&<div className="fixed inset-0 z-50 overflow-y-auto bg-black/35 p-4"><section className="mx-auto max-w-xl rounded-2xl bg-white p-5"><header className="mb-4 flex items-center justify-between"><h2 className="text-2xl font-semibold">Registrar objeto encontrado</h2><ReceptionCloseButton disabled={busy} onClick={()=>setNuevo(false)}/></header><form data-vs-ui="compact" onSubmit={create} className="space-y-4">
   <label className="block text-sm">Descripción<input required maxLength={300} name="descripcion" className={input}/></label>
   <label className="block text-sm">Habitación<select required name="habitacion" defaultValue="" className={input}><SelectPlaceholder/>{rooms.map(r=><option key={r.id} value={r.numero}>{r.numero}</option>)}</select></label>
   <label className="block text-sm">Fecha y hora del hallazgo<input required type="datetime-local" name="fecha" className={input}/></label>
   <label className="block text-sm">Nota interna (no se envía)<textarea maxLength={500} name="nota" className={input}/></label>
   <LostObjectImageField label="Fotografía opcional" value={selectedPhoto} disabled={busy} onError={setError} onChange={file=>{setSelectedPhoto(file);setFoto('');if(file)void run(async()=>setFoto(await readPhoto(file)));}}/>
   {error&&<p role="alert" className="text-sm text-red-800">{error}</p>}
   <button className={primary} disabled={busy}>Guardar objeto</button>
  </form></section></div>}
  {active&&<div className="fixed inset-0 z-50 overflow-y-auto bg-black/35 p-4"><section className="mx-auto max-w-2xl rounded-2xl bg-white p-5"><header className="mb-4 flex items-center justify-between"><div><p className="text-xs uppercase tracking-widest text-[#B38719]">{active.descripcion}</p><h2 className="text-2xl font-semibold">Aviso al huésped</h2></div><ReceptionCloseButton disabled={busy} onClick={()=>setActive(null)}/></header>
   {active.estadoEnvio==='INCIERTO'&&!active.reintentoControladoUsado&&<ReintentoObjetoIncierto id={active.id} intentos={active.intentos??1} onResult={load}/>}
   {active.reintentoControladoUsado&&<p className="mb-4 rounded-lg bg-[#FFFBEF] p-3 text-sm">Ya se solicitó el único reintento controlado. Consulta su resultado; no se solicitará otro.</p>}
   {active.estadoEnvio?<div className="space-y-3"><p>Destinatario confirmado: <strong>{active.destinatario}</strong></p><p role="status">{active.estadoEnvio==='ENVIADO'?'Notificado · envío aceptado por el servidor de correo':active.estadoEnvio==='PENDIENTE'?'En cola; todavía no se ha confirmado el envío':active.estadoEnvio==='ENVIANDO'?'Enviando; todavía no se ha confirmado el resultado':active.estadoEnvio==='FALLIDO'?'Envío fallido; el servidor no lo aceptó':'Resultado incierto; no se reenviará automáticamente'}</p>{active.enviadoEn&&<p>{fecha(active.enviadoEn)}</p>}{active.ultimoError&&<p role="alert" className="text-red-800">{active.ultimoError}</p>}{active.estadoEnvio==='FALLIDO'&&active.estadoFisico!=='DEVUELTO'&&!active.reintentoControladoUsado&&<button disabled={busy} className={primary} onClick={()=>void run(async()=>{const value=await api<Objeto>(`/${active.id}/reintentar`,{revision:active.revision,intentos:active.intentos});setActive(value);await load();})}>Reintentar el mismo aviso</button>}<p className="text-sm text-[#52677F]">La aceptación por el servidor de correo no confirma recepción en la bandeja ni lectura del mensaje.</p></div>:<div className="space-y-4">
   <h3 className="font-semibold">1. Seleccionar reserva y huésped</h3><form data-vs-ui="compact" className="flex flex-wrap gap-2" onSubmit={e=>{e.preventDefault();void run(async()=>{setSelected(null);setConfirmRecipient(false);invalidate();const query=new URLSearchParams();query.set(/^VS-/i.test(texto.trim())?'codigo':'texto',texto.trim());setResults((await searchReservations(query)).contenido);});}}><label className="min-w-0 flex-1 text-sm">Nombre del huésped o código de reserva<input required value={texto} className={input} onChange={e=>setTexto(e.target.value)}/></label><button className={secondary} disabled={busy}>Buscar reserva</button></form>
   <p className="text-xs text-[#52677F]">Selecciona la estancia correcta, incluso si ya finalizó. La habitación no determina a quién se envía.</p>
   {results.map(r=><button key={r.codigo} className={`${secondary} block w-full text-left`} disabled={busy} onClick={()=>void run(async()=>{const detail=await getReservation(r.codigo);setSelected(detail);setCorreo(detail.huesped.correo);setConfirmRecipient(false);invalidate();})}>{r.huespedPrincipal.nombreCompleto} · {r.codigo} · {r.entrada} → {r.salida}</button>)}
   {selected&&<div className="space-y-3 rounded-xl bg-[#F8F6F0] p-4"><p>Huésped: <strong>{selected.huesped.nombreCompleto}</strong></p><p>Reserva: {selected.codigo} · {selected.entrada} → {selected.salida}</p><label className="block text-sm">Correo destinatario<input type="email" required className={input} value={correo} onChange={e=>{setCorreo(e.target.value);setConfirmRecipient(false);invalidate();}}/></label><label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={confirmRecipient} onChange={e=>{setConfirmRecipient(e.target.checked);invalidate();}}/>He confirmado el huésped, su reserva y el correo registrado.</label></div>}
   <h3 className="font-semibold">2. Revisar mensaje y fotografía</h3><label className="block text-sm">Mensaje adicional para el huésped (opcional)<textarea maxLength={1000} value={mensaje} className={input} onChange={e=>{setMensaje(e.target.value);invalidate();}}/></label>
   {active.tieneFoto&&<><img src={`/api/objetos/${active.id}/foto`} alt="Objeto encontrado" className="max-h-52 w-full rounded-lg object-contain"/><label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={includePhoto} onChange={e=>{setIncludePhoto(e.target.checked);invalidate();}}/>Incluir esta fotografía en el correo al destinatario confirmado</label></>}
   <button disabled={busy||!selected||!confirmRecipient} className={secondary} onClick={()=>void run(async()=>{if(!selected)return;setPreview(await api<Preview>(`/${active.id}/previsualizar`,{codigoReserva:selected.codigo,huespedId:selected.huesped.id,correo,incluirFoto:includePhoto,mensaje}));setConfirmMessage(false);})}>Revisar correo antes de enviar</button>
   {preview&&<div className="space-y-3 border-t pt-4"><p className="break-all text-sm"><strong>Para:</strong> {preview.nombreHuesped} · {preview.correo}</p><p className="text-sm"><strong>Asunto:</strong> {preview.asunto}</p><iframe title="Correo que recibirá el huésped" sandbox="allow-same-origin" srcDoc={preview.html} className="h-[800px] w-full rounded-lg border border-[#E5E0D8]"/><label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={confirmMessage} onChange={e=>setConfirmMessage(e.target.checked)}/>He revisado el destinatario, el mensaje y la fotografía incluida.</label><button className={primary} disabled={busy||!confirmRecipient||!confirmMessage} onClick={()=>void run(async()=>{const value=await api<Objeto>(`/${active.id}/enviar`,{revision:preview.revision,destinatarioConfirmado:true,mensajeConfirmado:true});setActive(value);await load();})}>Enviar aviso al huésped</button></div>}
   {error&&<p role="alert" className="text-sm text-red-800">{error}</p>}
  </div>}</section></div>}
 </div>;
}
