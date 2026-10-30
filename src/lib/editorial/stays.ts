import type {EditorialElement,EditorialId} from './catalog';
import type {CatalogRoom} from '@/lib/usePublicCatalog';
export const STAY_SLOTS=[
 {id:'romantica',editorialId:'estancias.romantica',name:'Romántica',description:'Ambientes íntimos para disfrutar una estancia especial en pareja.'},
 {id:'descanso',editorialId:'estancias.descanso',name:'Descanso',description:'Opciones serenas y cómodas para desconectarte y descansar.'},
 {id:'familiar',editorialId:'estancias.familiar',name:'Familiar',description:'Habitaciones con capacidad y comodidad para compartir en familia.'},
 {id:'negocios',editorialId:'estancias.negocios',name:'Negocios',description:'Espacios prácticos y tranquilos para combinar descanso y trabajo.'},
 {id:'bienestar',editorialId:'estancias.bienestar',name:'Bienestar',description:'Habitaciones con ambientes tranquilos, terrazas o vistas que acompañan una visita de descanso.'},
] as const;
export type StayId=typeof STAY_SLOTS[number]['id'];
export function staySlot(id:string){return STAY_SLOTS.find(slot=>slot.id===id||slot.editorialId===id);}
export function resolveStay(id:StayId,elements:EditorialElement[],rooms:CatalogRoom[]){const slot=STAY_SLOTS.find(slot=>slot.id===id)!;const element=elements.find(element=>element.id===slot.editorialId);const legacy=rooms.filter(room=>room.preferences.includes(slot.name)).slice(0,3);const slugs=element?.ofertaSlugs??legacy.map(room=>room.slug);return {name:element?.nombre??slot.name,description:element?.texto??slot.description,slugs,recommended:slugs.flatMap(slug=>{const room=rooms.find(room=>room.slug===slug);return room?[room]:[];}),configured:element?.ofertaSlugs!==undefined,editorialId:slot.editorialId as EditorialId};}
export function stayValidation(element:EditorialElement){if(!staySlot(element.id))return '';if(element.nombre!==undefined&&(!element.nombre.trim()||element.nombre.length>80||/[<>\u0000-\u001f]/.test(element.nombre)))return 'Introduce un nombre válido de hasta 80 caracteres.';if(element.ofertaSlugs&&(element.ofertaSlugs.length>3||new Set(element.ofertaSlugs).size!==element.ofertaSlugs.length||element.ofertaSlugs.some(slug=>!slug.trim()||slug.length>100)))return 'Selecciona hasta tres habitaciones diferentes.';return '';}
