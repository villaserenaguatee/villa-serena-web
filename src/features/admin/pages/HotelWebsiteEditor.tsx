'use client';
import {useCallback,useEffect,useMemo,useState} from 'react';
import {Monitor,Smartphone,ExternalLink,ArrowLeft,LayoutTemplate,Building2} from 'lucide-react';
import {usePublicCatalog,usePublicHotel} from '@/lib/usePublicCatalog';
import type {components} from '@/lib/api/schema';
import {useHotelConfiguration,HotelGalleryRecovery,type HotelConfiguration} from './HotelAdmin';
import HotelDataPolicies from './HotelDataPolicies';
import AdminRefreshButton from './AdminRefreshButton';
import PublicWebsitePreview,{type SelectedSiteElement} from './PublicWebsitePreview';
import c from './HotelWebsiteEditor.module.css';
import {useHotelEditorial,type HotelEditorial} from './useHotelEditorial';
import HotelEditorialPanel,{EditorialActions,EditorialMessages} from './HotelEditorialPanel';
import {staySlot,resolveStay} from '@/lib/editorial/stays';
import {editorialLabel,sectionEditorialIds,sectionElementLabel} from '@/lib/editorial/catalog';

export const HOTEL_SITE_SECTIONS=[
 {id:'inicio',label:'Inicio',route:'/'},
 {id:'habitaciones',label:'Habitaciones',route:'/'},
 {id:'estancias',label:'Tipos de estancia',route:'/'},
 {id:'servicios',label:'Servicios',route:'/'},
 {id:'nosotros',label:'Acerca de nosotros',route:'/'},
 {id:'nosotros-page',label:'Página Nosotros',route:'/nosotros'},
 {id:'historia',label:'Nuestra historia',route:'/nosotros'},
 {id:'mision-vision',label:'Misión y visión',route:'/nosotros'},
 {id:'valores',label:'Valores',route:'/nosotros'},
 {id:'por-que',label:'¿Por qué elegirnos?',route:'/'},
 {id:'galeria-hotel',label:'Galería',route:'/'},
 {id:'contacto',label:'Contacto',route:'/'},
 {id:'ayuda',label:'Ayuda',route:'/'},
 {id:'pie',label:'Pie de página',route:'/'},
] as const;
const SECTION_GROUPS=[['Inicio','inicio'],['Habitaciones','habitaciones'],['Tipos de estancia','estancias'],['Servicios','servicios'],['Nosotros','nosotros','nosotros-page','historia','mision-vision','valores'],['¿Por qué elegirnos?','por-que'],['Galería','galeria-hotel'],['Contacto y ayuda','contacto','ayuda'],['Pie de página','pie']];
type SectionId=typeof HOTEL_SITE_SECTIONS[number]['id'];
type View='home'|'editor'|'internal';
export default function HotelConfigurationPage(){
 const controller=useHotelConfiguration(),editorial=useHotelEditorial(controller.ready),[view,setView]=useState<View>('home');
 useEffect(()=>{const requested=new URLSearchParams(window.location.search).get('vista');if(requested==='editor')setView('editor');else if(requested==='internal'||requested==='full')setView('internal');},[]);
 useEffect(()=>{if(!controller.dirty)return;const warn=(event:BeforeUnloadEvent)=>{event.preventDefault();};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[controller.dirty]);
 function navigate(next:View){setView(next);const url=new URL(window.location.href);if(next==='home')url.searchParams.delete('vista');else url.searchParams.set('vista',next);window.history.replaceState(window.history.state,'',url.pathname+url.search);}
 if(view==='editor')return <HotelWebsiteEditor controller={controller} editorial={editorial} onBack={()=>navigate('home')}/>;
 return <div className={c.editor}>{view==='home'?<><header className={c.header}><div><h1>Configuración del hotel</h1></div><AdminRefreshButton loading={controller.loading} disabled={controller.busy} onClick={controller.refresh}/></header><div className={c.choices}><button type="button" aria-label="Editor de la página web" className={c.choice} onClick={()=>navigate('editor')}><LayoutTemplate size={26}/><strong>Editor de la página web</strong><span>Selecciona secciones de la página real, revisa los cambios y guarda únicamente el contenido respaldado por el API.</span></button><button type="button" aria-label="Datos y políticas del hotel" className={c.choice} onClick={()=>navigate('internal')}><Building2 size={26}/><strong>Datos y políticas del hotel</strong><span>Identificación fiscal, facturación, horarios, reservas y documentos públicos.</span></button></div>{controller.error&&<p role="alert" className={c.status+' '+c.error}>{controller.error}</p>}</>:<><div className={c.internalNav}><button className={c.button} onClick={()=>navigate('home')}><ArrowLeft size={15}/>Configuración del hotel</button><button className={c.button} onClick={()=>navigate('editor')}>Editor de la página web</button></div><HotelDataPolicies controller={controller}/></>}</div>;
}

export function HotelWebsiteEditor({controller,editorial,onBack}:{controller:HotelConfiguration;editorial:HotelEditorial;onBack:()=>void}){
 const [selected,setSelected]=useState<SectionId>('inicio'),[mobile,setMobile]=useState(false),[element,setElement]=useState<SelectedSiteElement>();
 const catalog=usePublicCatalog(),publicHotel=usePublicHotel();
 const {draft,photos,ready,busy,loading,hotel}=controller;
 const [photoUrls,setPhotoUrls]=useState<string[]>([]);
 useEffect(()=>{const temporary:string[]=[];const urls=photos.map(photo=>{if(photo.file){const url=URL.createObjectURL(photo.file);temporary.push(url);return url;}return photo.url??'';});setPhotoUrls(urls);return()=>temporary.forEach(url=>URL.revokeObjectURL(url));},[photos]);
 const previewHotel=useMemo<components['schemas']['Hotel']|null>(()=>ready?{nombre:draft.nombre,descripcion:draft.descripcion,fotos:photoUrls.filter(Boolean),ubicacion:{direccion:draft.direccion},contacto:{telefono:draft.telefono,correo:draft.correo},horaCheckIn:hotel?.horaCheckIn??'15:00',horaCheckOut:hotel?.horaCheckOut??'12:00'}:publicHotel,[ready,draft,photoUrls,hotel,publicHotel]);
 const section=HOTEL_SITE_SECTIONS.find(item=>item.id===selected)!;
 const select=useCallback((id:string,next?:SelectedSiteElement)=>{if(next?.field==='fotos')next={...next,field:undefined,editorialId:id==='galeria-hotel'?'galeria-hotel.imagenes':id==='nosotros'?'nosotros.imagen':'inicio.imagenes'};if(HOTEL_SITE_SECTIONS.some(item=>item.id===id)){setSelected(id as SectionId);setElement(next?.editorialId?next:undefined);}},[]);
 return <div className={c.editor}><header className={c.header}><div><button type="button" className={c.button} onClick={onBack}><ArrowLeft size={15}/>Volver</button><h1>Editor de la página web</h1></div><div className={c.actions}><div className={c.mode} aria-label="Tamaño de vista previa"><button type="button" aria-pressed={!mobile} onClick={()=>setMobile(false)}><Monitor size={15}/>Escritorio</button><button type="button" aria-pressed={mobile} onClick={()=>setMobile(true)}><Smartphone size={15}/>Móvil</button></div><a className={c.button} href={section.route} target="_blank" rel="noopener noreferrer"><ExternalLink size={14}/>Ver sitio actual</a><div className={c.editorialActions}><EditorialActions editorial={editorial} disabled={busy}/></div></div></header>
 <nav className={c.tabs} aria-label="Secciones de la página web">{SECTION_GROUPS.map(([label,...ids])=><button type="button" key={label} aria-current={ids.includes(selected)?'page':undefined} onClick={()=>select(ids[0])}>{label}</button>)}</nav>
 {SECTION_GROUPS.filter(group=>group.slice(1).includes(selected)&&group.length>2).map(([label,...ids])=><nav key={label} className={c.tabs} aria-label={label}>{ids.map(id=><button type="button" key={id} aria-current={selected===id?'page':undefined} onClick={()=>select(id)}>{HOTEL_SITE_SECTIONS.find(item=>item.id===id)?.label}</button>)}</nav>)}

 {loading&&<p role="status" className={c.status}>Consultando configuración del hotel…</p>}{controller.error&&<p role="alert" className={c.status+' '+c.error}>{controller.conflict||controller.error.includes('HOTEL_NO_CONFIGURADO')?controller.error:ready?'No se pudieron guardar los cambios. Conservamos la información introducida.':'No se pudo cargar la configuración del hotel. Puedes revisar la vista previa.'}</p>}{controller.notice&&<p role="status" className={c.status+' '+c.success}>{controller.notice}</p>}{controller.progress&&<p role="status" className={c.status}>{controller.progress}</p>}{!loading&&!ready&&<p className={c.status}>La configuración del hotel todavía no está disponible. El guardado permanece deshabilitado.</p>}
 <HotelGalleryRecovery controller={controller}/><EditorialMessages editorial={editorial}/><div className={c.body}><div className={c.preview}><PublicWebsitePreview route={section.route} selected={selected} element={element} mobile={mobile} editorial={editorial.document?{...editorial.document,fotografias:{...editorial.document.fotografias,...Object.fromEntries(photos.filter(photo=>photo.clave&&photo.url&&!photo.file).map(photo=>[photo.clave!,photo.url!]))}}:undefined} preview={{hotel:previewHotel,rooms:catalog.rooms,loading:catalog.loading,error:catalog.error,mobile,stayId:element?.editorialId?staySlot(element.editorialId)?.id:undefined}} onSelect={select}/></div>
 <aside data-site-editor-panel className={c.panel} aria-label="Controles de la sección"><header className={c.panelHead}><h2>{element?.editorialId?(staySlot(element.editorialId)?resolveStay(staySlot(element.editorialId)!.id,editorial.state.elements,catalog.rooms).name:editorialLabel(element.editorialId)):element?element.label:section.label}</h2>{!element&&<p>Selecciona un texto o una fotografía en la vista previa.</p>}</header>
 <details open><summary>Elementos de la sección</summary><div className={c.controls} aria-label="Elementos de contenido">{sectionEditorialIds(selected).map(id=><button type="button" className={c.button} key={id} aria-pressed={element?.editorialId===id} onClick={()=>setElement({editorialId:id,label:sectionElementLabel(id),value:''})}>{staySlot(id)?resolveStay(staySlot(id)!.id,editorial.state.elements,catalog.rooms).name:id==='estancias.descripcion'?'Descripción general':sectionElementLabel(id)}</button>)}</div></details>
 {element?.editorialId&&(element.editorialId.endsWith('.imagen')||element.editorialId.endsWith('.imagenes'))&&!hotel?.editorFotografico?<p className={c.note}>Esta versión del API todavía no admite borradores fotográficos por sección. No se modificaron las fotografías publicadas.</p>:element?.editorialId&&<HotelEditorialPanel editorial={editorial} element={element} photos={photos} rooms={catalog.rooms} disabled={!ready||busy} catalogLoading={catalog.loading} catalogError={catalog.error}/>}
 </aside></div></div>;
}
