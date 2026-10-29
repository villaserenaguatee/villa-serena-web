import {render,screen,within,fireEvent} from '@testing-library/react';
import {beforeEach,expect,test,vi} from 'vitest';
import PublicHome from '@/features/public/PublicHome';
import {usePublicCatalog,usePublicHotel} from '@/lib/usePublicCatalog';
vi.mock('@/lib/usePublicCatalog',()=>({usePublicCatalog:vi.fn(()=>({rooms:[],loading:false,error:'',connected:true})),usePublicHotel:vi.fn(()=>null)}));
vi.mock('@/components/public/ContactForm',()=>({default:()=>null}));
const hotel={nombre:'Hotel del contrato',descripcion:'Descripción administrada',fotos:['https://assets.example.invalid/hotel/uno.png'],ubicacion:{direccion:'Dirección administrada'},contacto:{correo:'contacto@example.invalid',telefono:'+50255551234'},horaCheckIn:'15:00' as const,horaCheckOut:'12:00' as const};
beforeEach(()=>{vi.mocked(usePublicCatalog).mockClear();vi.mocked(usePublicHotel).mockClear();});
test('the real public page reuses hotel photos in hero, gallery and about, plus live contact fields',()=>{
 const {container}=render(<PublicHome preview={{hotel,rooms:[],loading:false,error:'',mobile:false}}/>);
 expect(container.querySelector('#inicio')).toHaveStyle({backgroundImage:expect.stringContaining('hotel/uno.png')});expect(container.querySelector('#galeria-hotel img')).toHaveAttribute('src',hotel.fotos[0]);expect(container.querySelector('#nosotros img')).toHaveAttribute('src',hotel.fotos[0]);expect(screen.getByText(hotel.descripcion)).toBeVisible();
 expect(container.querySelector('#contacto a[href="mailto:contacto@example.invalid"]')).not.toBeNull();expect(container.querySelector('footer.hotel-footer a[href="mailto:contacto@example.invalid"]')).not.toBeNull();expect(screen.getAllByText(hotel.ubicacion.direccion)).toHaveLength(2);expect(usePublicCatalog).toHaveBeenCalledWith(false);expect(usePublicHotel).toHaveBeenCalledWith(false);
});
test('missing real photos do not substitute illustrative hotel images',()=>{
 const {container}=render(<PublicHome preview={{hotel:{...hotel,fotos:[]},rooms:[],loading:false,error:'',mobile:true}}/>);expect(container.querySelector('#galeria-hotel')).toBeNull();expect(container.querySelector('#inicio')?.getAttribute('style')).not.toContain('url(');expect(screen.getByText('Sin fotografía del hotel disponible.')).toBeVisible();
});

test('service cards retain photos, descriptions and information actions without illustrative captions',()=>{
 const {container}=render(<PublicHome preview={{hotel,rooms:[],loading:false,error:'',mobile:false}}/>);
 const cards=container.querySelectorAll('#servicios .service-card');
 expect(cards).toHaveLength(4);
 expect(container.querySelector('#servicios small')).toBeNull();
 for(const card of cards){
  const title=within(card as HTMLElement).getByRole('heading');
  expect(['Spa','Gimnasio','Piscina','Restaurante']).toContain(title.textContent);
  expect(card.firstElementChild?.tagName).toBe('IMG');
  expect(within(card as HTMLElement).getByRole('img')).toHaveAttribute('alt',title.textContent);
  expect(card.querySelector('p')?.textContent?.trim()).toBeTruthy();
  fireEvent.click(within(card as HTMLElement).getByRole('button'));
  expect(container.querySelector('.service-info-modal')).not.toBeNull();
  fireEvent.click(container.querySelector('.service-info-modal .booking-modal-close') as HTMLElement);
  expect(container.querySelector('.service-info-modal')).toBeNull();
 }
});
