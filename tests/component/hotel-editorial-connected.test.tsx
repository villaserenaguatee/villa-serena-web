import {render,renderHook,screen,act,waitFor,fireEvent} from '@testing-library/react';
import {beforeEach,afterEach,expect,test,vi} from 'vitest';
import {useHotelEditorial} from '@/features/admin/pages/useHotelEditorial';
import {readEditorialDraft,saveEditorialDraft,publishEditorial,readPublishedEditorial} from '@/lib/editorial/client';
import {OperationError} from '@/lib/api/operaciones';
import {EDITORIAL_IDS,type EditorialDocument} from '@/lib/editorial/catalog';
import PublicHome from '@/features/public/PublicHome';
import PublicAbout from '@/features/public/PublicAbout';
vi.mock('@/lib/editorial/client',()=>({readEditorialDraft:vi.fn(),saveEditorialDraft:vi.fn(),publishEditorial:vi.fn(),readPublishedEditorial:vi.fn()}));
vi.mock('@/lib/usePublicCatalog',()=>({usePublicCatalog:vi.fn(()=>({rooms:[],loading:false,error:'',connected:true})),usePublicHotel:vi.fn(()=>null)}));
vi.mock('next/navigation',()=>({useRouter:()=>({back:vi.fn()})}));
vi.mock('@/components/public/ContactForm',()=>({default:()=>null}));
const empty=(idioma:'es'|'en'):EditorialDocument=>({idioma,revision:0,revisionPublicada:0,elementos:[]});
let stored:Record<'es'|'en',EditorialDocument>,published:Record<'es'|'en',EditorialDocument|null>;
beforeEach(()=>{
 vi.stubGlobal('ResizeObserver',class{observe(){}unobserve(){}disconnect(){}});
 vi.stubGlobal('matchMedia',()=>({matches:false,addEventListener:()=>{},removeEventListener:()=>{}}));
 stored={es:empty('es'),en:empty('en')};published={es:null,en:null};
 vi.mocked(readEditorialDraft).mockReset().mockImplementation(async idioma=>stored[idioma]);
 vi.mocked(saveEditorialDraft).mockReset().mockImplementation(async(idioma,revision,elementos)=>stored[idioma]={...stored[idioma],revision:revision+1,elementos});
 vi.mocked(publishEditorial).mockReset().mockImplementation(async(idioma,revision)=>{stored[idioma]={...stored[idioma],revisionPublicada:revision};published[idioma]=structuredClone(stored[idioma]);return stored[idioma];});
 vi.mocked(readPublishedEditorial).mockReset().mockImplementation(async idioma=>published[idioma]);
});
afterEach(()=>vi.unstubAllGlobals());
async function ready(){const h=renderHook(()=>useHotelEditorial(true));await waitFor(()=>expect(h.result.current.state.base).toBeDefined());return h;}
test('Spanish drafts survive reload without touching English; save never publishes and confirmation gates publication',async()=>{
 stored.en={...empty('en'),revision:5,elementos:[{id:'inicio.titulo',texto:'Existing English'}]};const previousEnglish=structuredClone(stored.en);
 const h=await ready();expect(readEditorialDraft).toHaveBeenCalledWith('es',expect.any(AbortSignal));act(()=>h.result.current.setElement({id:'inicio.titulo',texto:'Título ES'}));
 await waitFor(()=>expect(h.result.current.loading).toBe(false));await act(()=>h.result.current.save());expect(published.es).toBeNull();expect(publishEditorial).not.toHaveBeenCalled();
 await act(()=>h.result.current.publish());expect(publishEditorial).not.toHaveBeenCalled();
 h.unmount();const again=await ready();expect(again.result.current.state.elements[0].texto).toBe('Título ES');
 act(()=>again.result.current.setConfirmPublish(true));await act(async()=>{await Promise.all([again.result.current.publish(),again.result.current.publish()]);});expect(publishEditorial).toHaveBeenCalledTimes(1);expect(published.es?.elementos[0].texto).toBe('Título ES');expect(published.en).toBeNull();expect(stored.en).toEqual(previousEnglish);expect(saveEditorialDraft).not.toHaveBeenCalledWith('en',expect.anything(),expect.anything());
});
test('conflicts preserve local content until explicit recovery and failed publication never reports success',async()=>{
 const h=await ready();act(()=>h.result.current.setElement({id:'historia.titulo',texto:'No perder'}));
 vi.mocked(saveEditorialDraft).mockRejectedValueOnce(new OperationError('Otro administrador modificó el borrador.',409,{codigo:'CONTENIDO_CAMBIADO'}));await act(()=>h.result.current.save());expect(h.result.current.state.elements[0].texto).toBe('No perder');expect(h.result.current.state.conflict).toBe(true);
 stored.es={...empty('es'),revision:3,elementos:[{id:'historia.titulo',texto:'Versión actual'}]};await act(()=>h.result.current.consult());expect(h.result.current.state.elements[0].texto).toBe('No perder');act(()=>h.result.current.loadRemote());expect(h.result.current.state.elements[0].texto).toBe('Versión actual');
 vi.mocked(publishEditorial).mockRejectedValueOnce(new OperationError('No se pudo publicar.',503));act(()=>h.result.current.setConfirmPublish(true));await act(()=>h.result.current.publish());expect(published.es).toBeNull();expect(h.result.current.state.notice).toBe('');expect(h.result.current.state.elements[0].texto).toBe('Versión actual');
});
test('preview uses draft, public page reads only published endpoint and never loads English content',async()=>{
 const draft:EditorialDocument={...empty('es'),revision:1,elementos:[{id:'inicio.titulo',texto:'Borrador privado'}]};
 const preview=render(<PublicHome preview={{hotel:null,rooms:[],loading:false,error:'',mobile:false}} editorial={draft}/>);expect(screen.getByRole('heading',{name:'Borrador privado'})).toBeVisible();expect(readPublishedEditorial).not.toHaveBeenCalled();preview.unmount();
 const site=render(<PublicHome/>);await waitFor(()=>expect(readPublishedEditorial).toHaveBeenCalledWith('es',expect.any(AbortSignal)));expect(screen.queryByText('Borrador privado')).toBeNull();site.unmount();
 published.en={...empty('en'),revision:1,revisionPublicada:1,elementos:[{id:'inicio.titulo',texto:'Published English'}]};render(<PublicHome/>);await waitFor(()=>expect(readPublishedEditorial).toHaveBeenCalledWith('es',expect.any(AbortSignal)));expect(screen.queryByLabelText('Idioma del sitio')).toBeNull();expect(screen.queryByText('Published English')).toBeNull();expect(readPublishedEditorial).not.toHaveBeenCalledWith('en',expect.anything());
});
test('all canonical editorial ids bind to actual elements, while operational fields remain independent',()=>{
 const {container,unmount}=render(<PublicHome preview={{hotel:{nombre:'Hotel de prueba',descripcion:'Descripción',fotos:['https://assets.example.invalid/hotel/prueba.png'],ubicacion:{direccion:'Dirección'},contacto:{telefono:'55551234',correo:'hotel@example.invalid'},horaCheckIn:'15:00',horaCheckOut:'12:00'},rooms:[],loading:false,error:'',mobile:false}}/>);const ids=new Set(Array.from(container.querySelectorAll('[data-editorial-id]'),node=>node.getAttribute('data-editorial-id')));
 for(const name of ['Romántica','Descanso','Familiar','Negocios','Bienestar']){fireEvent.click(screen.getByRole('button',{name}));for(const node of container.querySelectorAll('[data-editorial-id]'))ids.add(node.getAttribute('data-editorial-id'));}
 unmount();const about=render(<PublicAbout preview/>);for(const node of about.container.querySelectorAll('[data-editorial-id]'))ids.add(node.getAttribute('data-editorial-id'));
 // Cover photos for stay preferences appear only when the catalog supplies matching offers.
 expect([...ids].sort()).toEqual(EDITORIAL_IDS.filter(id=>!/^estancias\..+\.imagen$/.test(id)).sort());
});

test('demo pages skip connected editorial requests while real pages still load publication',async()=>{
 const demo=render(<PublicHome loadPublished={false}/>);
 expect(readPublishedEditorial).not.toHaveBeenCalled();
 demo.unmount();render(<PublicHome/>);
 await waitFor(()=>expect(readPublishedEditorial).toHaveBeenCalledWith('es',expect.any(AbortSignal)));
});
