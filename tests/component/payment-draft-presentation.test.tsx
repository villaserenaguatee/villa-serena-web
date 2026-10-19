import {render,screen} from '@testing-library/react';
import {renderToString} from 'react-dom/server';
import {beforeEach,expect,test,vi} from 'vitest';
import Pago from '@/app/(public)/reservar/pago/page';
const query=new URLSearchParams('draft=draft-one');
vi.mock('next/navigation',()=>({useRouter:()=>({push:vi.fn(),back:vi.fn(),replace:vi.fn()}),useSearchParams:()=>query}));
vi.mock('next-intl',()=>({useTranslations:()=>(s:string)=>s}));
vi.mock('@/i18n/UiText',()=>({useUiText:()=>(s:string)=>s,UiText:({text}:{text:string})=><>{text}</>}));
vi.mock('@/components/common/VillaSerenaLogo',()=>({default:()=> <span>Villa Serena</span>}));
vi.mock('@/lib/usePublicCatalog',()=>({usePublicCatalog:()=>({rooms:[{slug:'habitacion-estandar',name:'Habitación Estándar',type:'Estándar',capacity:2,price:420}]}),usePublicQuotes:()=>({quotes:[{ofertaSlug:'habitacion-estandar',total:840}],loading:false,error:''})}));
vi.mock('@/lib/bookingEmail',()=>({bookingEmail:vi.fn().mockResolvedValue({verificado:true})}));
vi.mock('@/lib/publicStripeBooking',()=>({prepareStripeBooking:vi.fn()}));
beforeEach(()=>sessionStorage.clear());
function seed(createdAt=Date.now()){sessionStorage.setItem('vs-public-booking-draft',JSON.stringify({id:'draft-one',createdAt,params:'slug=habitacion-estandar&llegada=2026-11-16&salida=2026-11-18&adultos=2&ninos=0&correo=visual%40example.test'}));}
test('initial server render does not claim that the draft expired',()=>{seed();expect(renderToString(<Pago/>)).not.toContain('Tus datos no están disponibles o vencieron');});
test('valid draft has no expiry error; discard is absent and terms are structured',async()=>{
 seed();const {container}=render(<Pago/>);await screen.findByText('Reembolso total');
 expect(screen.queryByText(/Tus datos no están disponibles o vencieron/)).toBeNull();
 expect(container.querySelector('.checkout-form .booking-draft-actions')).toBeNull();
 expect(screen.queryByRole('button',{name:/Descartar/})).toBeNull();
 expect(screen.queryByRole('dialog')).toBeNull();
 expect(screen.getByRole('heading',{name:'Cancelaciones y reembolsos'})).toBeVisible();expect(screen.getByText('Sin reembolso')).toBeVisible();
});
test('missing or expired draft shows a separate error after local validation',()=>{
 seed(Date.now()-3*60*60*1000);const {container}=render(<Pago/>);
 expect(screen.getByText(/Tus datos no están disponibles o vencieron/)).toHaveClass('payment-draft-error');
 expect(container.querySelector('.payment-cancellation .payment-draft-error')).toBeNull();
});