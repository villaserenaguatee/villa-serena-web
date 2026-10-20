'use client';
import type {MenuRS} from '@/lib/api/operaciones';
import type {CategoriaMenu,ItemMenu} from '@/lib/pms/types';
import {useContentTranslation} from '@/lib/translation/useContentTranslation';
import MenuCatalogo from './MenuCatalogo';
export default function MenuOperativo({menu,busy,agotar}:{menu:MenuRS;busy:boolean;agotar:(id:number)=>void}){
 const tr=useContentTranslation([...menu.categorias.map(c=>c.nombre),...menu.items.flatMap(i=>[i.nombre,i.descripcion??''])],'menu-item');
 const categories=menu.categorias.map(c=>tr.text(c.nombre) as CategoriaMenu);
 const items:ItemMenu[]=menu.items.map(item=>({id:String(item.id),nombre:tr.text(item.nombre),descripcion:tr.text(item.descripcion??''),precio:item.precio,categoria:tr.text(menu.categorias.find(c=>c.id===item.categoriaId)?.nombre??'') as CategoriaMenu,disponible:item.disponibilidad==='DISPONIBLE',foto:item.fotoUrl??undefined}));
 return <div className="flex min-h-0 flex-1 flex-col">{tr.loading&&<p role="status" className="bg-white px-4 py-2 text-sm">{tr.en?'Translating menu… Original content is shown.':'Traduciendo menú… Se muestra el contenido original.'}</p>}{tr.failed&&<p role="status" className="bg-white px-4 py-2 text-sm">{tr.en?'Translation unavailable. Original content is shown.':'No se pudo traducir. Se muestra el contenido original.'} <button onClick={tr.retry} className="rounded-md border px-2 py-1">{tr.en?'Retry':'Reintentar'}</button></p>}<MenuCatalogo menu={items} categoriasReales={categories} busy={busy} permiteReactivar={false} mostrarPrecios onMarcarAgotado={id=>agotar(Number(id))} onReactivar={()=>{}}/></div>;
}
