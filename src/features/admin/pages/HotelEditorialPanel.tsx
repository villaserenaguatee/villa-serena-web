'use client';
import StayEditorialPanel from './StayEditorialPanel';
import {staySlot} from '@/lib/editorial/stays';
import type {CatalogRoom} from '@/lib/usePublicCatalog';
import EditorialPhotoPanel from './EditorialPhotoPanel';
import type {HotelEditorial} from './useHotelEditorial';
import type {SelectedSiteElement} from './PublicWebsitePreview';
import type {CatalogPhotoDraft} from './catalogPhotoClient';
import {EDITORIAL_DESTINATIONS,EDITORIAL_DESTINATION_LABELS,EDITORIAL_DEFAULT_DESTINATIONS,editorialLabel} from '@/lib/editorial/catalog';
import ReceptionActionDialog from '@/features/recepcion/pages/ReceptionActionDialog';
import c from './HotelWebsiteEditor.module.css';

export function EditorialActions({editorial,disabled=false}:{editorial:HotelEditorial;disabled?:boolean}){
 return <><button type="button" className={c.button} disabled={disabled||!editorial.canSave} onClick={()=>void editorial.save()}>{editorial.busy?'Procesando…':'Guardar borrador'}</button><button type="button" className={c.button+' '+c.save} disabled={disabled||!editorial.canPublish} onClick={()=>editorial.setConfirmPublish(true)}>Publicar cambios</button></>;
}
export function EditorialMessages({editorial}:{editorial:HotelEditorial}){
 return <>{editorial.loading&&<p role="status" className={c.status}>Consultando borrador…</p>}{editorial.state.error&&<p role="alert" className={c.status+' '+c.error}>{editorial.state.error}</p>}{editorial.state.notice&&<p role="status" className={c.status+' '+c.success}>{editorial.state.notice}</p>}{editorial.dirty&&<p role="status" className={c.status}>Hay cambios sin guardar.</p>}{editorial.dirty&&editorial.validation&&<p role="alert" className={c.status+' '+c.error}>{editorial.validation}</p>}{editorial.state.conflict&&<button type="button" className={c.button} disabled={editorial.busy} onClick={()=>void editorial.consult()}>Consultar borrador actual</button>}{!editorial.state.base&&!editorial.loading&&editorial.state.error&&<button type="button" className={c.button} onClick={editorial.retry}>Volver a consultar contenido</button>}
 {editorial.confirmPublish&&<ReceptionActionDialog title="Publicar cambios" busy={editorial.busy} onClose={()=>{if(!editorial.busy)editorial.setConfirmPublish(false);}}><p>¿Deseas publicar estos cambios?</p>{editorial.state.error&&<p role="alert" className="mt-3 text-sm text-red-800">{editorial.state.error}</p>}<footer className="mt-4 flex flex-wrap justify-end gap-3"><button type="button" className={c.button} disabled={editorial.busy} onClick={()=>editorial.setConfirmPublish(false)}>Cancelar</button><button type="button" className={c.button+' '+c.save} disabled={editorial.busy} onClick={()=>void editorial.publish()}>{editorial.busy?'Publicando…':'Confirmar publicación'}</button></footer></ReceptionActionDialog>}
 {editorial.state.remote&&<ReceptionActionDialog title="Revisar borrador actual" onClose={editorial.closeReview}><p>¿Descartar tus cambios y cargar el borrador actual?</p><footer className="mt-4 flex flex-wrap justify-end gap-3"><button type="button" className={c.button} onClick={editorial.closeReview}>Conservar mis cambios</button><button type="button" className={c.button+' '+c.save} onClick={editorial.loadRemote}>Cargar borrador actual</button></footer></ReceptionActionDialog>}</>;
}
export default function HotelEditorialPanel({editorial,element,photos,disabled,rooms=[]}:{editorial:HotelEditorial;element:SelectedSiteElement;photos:CatalogPhotoDraft[];disabled:boolean;rooms?:CatalogRoom[]}){
 const id=element.editorialId;if(!id)return null;
 if(staySlot(id))return <StayEditorialPanel id={id} editorial={editorial} rooms={rooms} disabled={disabled}/>;
 if(id.endsWith('.imagen')||id.endsWith('.imagenes'))return <EditorialPhotoPanel editorial={editorial} element={element} photos={photos} disabled={disabled}/>;
 const current=editorial.state.elements.find(item=>item.id===id),image=id.endsWith('.imagen'),button=id.endsWith('.boton');
 const fieldId='editorial-'+id.replaceAll('.','-'),value=current?.texto??element.value;
 const blocked=disabled||editorial.busy||editorial.loading||!editorial.state.base;
 const candidate=current?.destino??element.destino;
 const destination=EDITORIAL_DESTINATIONS.find(path=>path===candidate)??EDITORIAL_DEFAULT_DESTINATIONS[id];
 const changeText=(texto:string)=>editorial.setElement({id,...current,texto,...(button?{destino:destination}:{})});
 return <div className={c.controls}>{image?<label htmlFor={fieldId}>Fotografía<select id={fieldId} disabled={blocked} value={current?.fotoClave??''} onChange={event=>editorial.setElement({id,fotoClave:event.target.value})}><option value="" disabled hidden>Seleccionar</option>{photos.filter(photo=>photo.clave&&!photo.file).map((photo,index)=><option key={photo.clave} value={photo.clave}>Fotografía {index+1}</option>)}</select></label>:<><label htmlFor={fieldId}>{button?'Texto del botón':editorialLabel(id)}{id.endsWith('.descripcion')||id.startsWith('estancias.')&&!/\.(titulo|subtitulo)$/.test(id)?<textarea id={fieldId} value={value} maxLength={4000} disabled={blocked} onChange={event=>changeText(event.target.value)}/>:<input id={fieldId} value={value} maxLength={200} disabled={blocked} onChange={event=>changeText(event.target.value)}/>}</label>{button&&<label htmlFor={fieldId+'-destino'}>Destino<select id={fieldId+'-destino'} disabled={blocked} value={destination??''} onChange={event=>editorial.setElement({id,...current,texto:value,destino:event.target.value as typeof EDITORIAL_DESTINATIONS[number]})}><option value="" disabled hidden>Seleccionar</option>{EDITORIAL_DESTINATIONS.map(path=><option key={path} value={path}>{EDITORIAL_DESTINATION_LABELS[path]}</option>)}</select></label>}{button&&destination&&<a className={c.button} href={destination} target="_blank" rel="noopener noreferrer">Abrir destino</a>}</>}{current&&<button type="button" className={c.button} disabled={blocked} onClick={()=>editorial.resetElement(id)}>Usar contenido anterior</button>}</div>;
}
