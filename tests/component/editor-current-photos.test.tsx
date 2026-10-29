import {render,screen,fireEvent} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {expect,test,vi} from 'vitest';
import EditorialPhotoPanel from '@/features/admin/pages/EditorialPhotoPanel';
import {visiblePhotoUrls} from '@/features/admin/pages/editorPhotoSelection';
import type {HotelEditorial} from '@/features/admin/pages/useHotelEditorial';
import type {EditorialId} from '@/lib/editorial/catalog';

function editor(elements:HotelEditorial['state']['elements']=[],fotografias:Record<string,string>={}){
 return {state:{base:{revision:1},elements},document:{fotografias},setPhotos:vi.fn(),busy:false,loading:false} as unknown as HotelEditorial;
}
for(const url of ['/images/hotel.jpg','https://images.example.invalid/spa.jpg'])test('muestra la fotografía actual '+url+' sin crear un borrador',async()=>{
 const editorial=editor();render(<EditorialPhotoPanel editorial={editorial} element={{editorialId:'servicios.spa.imagen',label:'Spa',value:'',photoUrls:[url]}} photos={[]} disabled={false}/>);
 expect(screen.getByRole('img',{name:'Fotografía 1'})).toHaveAttribute('src',url);
 expect(screen.queryByText(/No hay fotografías|Referencia guardada|sin vista previa/)).toBeNull();
 expect(editorial.setPhotos).not.toHaveBeenCalled();
 await userEvent.click(screen.getByRole('button',{name:'Ampliar fotografía 1'}));expect(screen.getByRole('img',{name:'Fotografía ampliada'})).toHaveAttribute('src',url);
});
test('una referencia anterior conserva su URL y no duplica la fotografía visible',()=>{
 const clave='hotel/anterior.png',url='https://images.example.invalid/anterior.png';const editorial=editor([{id:'nosotros.imagen',fotoClave:clave}]);
 render(<EditorialPhotoPanel editorial={editorial} element={{editorialId:'nosotros.imagen',label:'Nosotros',value:'',photoUrls:[url]}} photos={[{clave,url,principal:false}]} disabled={false}/>);
 expect(screen.getAllByRole('img')).toHaveLength(1);expect(screen.getByRole('img')).toHaveAttribute('src',url);
 expect(screen.queryByText(/sin vista previa/)).toBeNull();
});
for(const elements of [[],[{id:'servicios.spa.imagen' as EditorialId,fotoClaves:[]}]])test('sección realmente vacía muestra solo Agregar como acción',()=>{
 render(<EditorialPhotoPanel editorial={editor(elements)} element={{editorialId:'servicios.spa.imagen',label:'Spa',value:'',photoUrls:[]}} photos={[{clave:'hotel/otra.png',url:'/otra.png',principal:false}]} disabled={false}/>);
 expect(screen.queryByText('No hay fotografías registradas.')).toBeNull();expect(screen.queryByRole('combobox')).toBeNull();
 expect(screen.getAllByRole('button')).toHaveLength(1);expect(screen.getByRole('button',{name:'Agregar más fotografías'})).toBeEnabled();
});
test('reemplazar y quitar una imagen heredada conservan los controles y requieren acción explícita',async()=>{
 const editorial=editor();render(<EditorialPhotoPanel editorial={editorial} element={{editorialId:'servicios.spa.imagen',label:'Spa',value:'/spa.jpg'}} photos={[]} disabled={false}/>);
 const file=new File(['png'],'nueva.png',{type:'image/png'});fireEvent.change(screen.getByLabelText('Reemplazar fotografía 1'),{target:{files:[file]}});
 expect(editorial.setPhotos).toHaveBeenCalledWith('servicios.spa.imagen',[{file,principal:false}]);
 vi.mocked(editorial.setPhotos).mockClear();await userEvent.click(screen.getByRole('button',{name:'Eliminar fotografía 1'}));expect(editorial.setPhotos).not.toHaveBeenCalled();
 await userEvent.click(screen.getByRole('button',{name:'Quitar fotografía'}));expect(editorial.setPhotos).toHaveBeenCalledWith('servicios.spa.imagen',[]);
});
test('la selección recoge imágenes locales, URL externas y fondos, sin duplicados',()=>{
 const node=document.createElement('section');node.style.backgroundImage='url("https://images.example.invalid/fondo.jpg")';
 node.innerHTML='<img src="/hotel.jpg"><img src="/hotel.jpg"><img src="https://images.example.invalid/otra.jpg">';document.body.append(node);
 expect(visiblePhotoUrls(node)).toEqual([new URL('/hotel.jpg',location.href).href,'https://images.example.invalid/otra.jpg','https://images.example.invalid/fondo.jpg']);node.remove();
 expect(visiblePhotoUrls(null)).toEqual([]);
});
