import {render,fireEvent,waitFor} from '@testing-library/react';
import {expect,test,vi} from 'vitest';
import PublicWebsitePreview from '@/features/admin/pages/PublicWebsitePreview';
vi.mock('@/features/public/PublicHome',()=>({default:()=> <section data-site-section="servicios"><img data-editorial-id="servicios.spa.imagen" src="/spa.jpg" alt="Spa"/></section>}));
vi.mock('@/features/public/PublicAbout',()=>({default:()=>null}));
test('seleccionar desde el panel o la vista previa devuelve la imagen actual sin escrituras',async()=>{
 vi.stubGlobal('ResizeObserver',class{observe(){}disconnect(){}});
 const onSelect=vi.fn();const view=render(<PublicWebsitePreview route="/" selected="servicios" element={{editorialId:'servicios.spa.imagen',label:'Spa',value:''}} mobile={false} preview={{hotel:null,rooms:[],loading:false,error:'',mobile:false}} onSelect={onSelect}/>);
 const iframe=view.container.querySelector('iframe')!;vi.spyOn(iframe.contentWindow!,'scrollTo').mockImplementation(()=>{});fireEvent.load(iframe);
 await waitFor(()=>expect(onSelect).toHaveBeenCalledWith('servicios',expect.objectContaining({photoUrls:[new URL('/spa.jpg',location.href).href]})));
 onSelect.mockClear();fireEvent.click(iframe.contentDocument!.querySelector('img')!);
 expect(onSelect).toHaveBeenCalledWith('servicios',expect.objectContaining({editorialId:'servicios.spa.imagen',photoUrls:[new URL('/spa.jpg',location.href).href]}));
 view.unmount();vi.unstubAllGlobals();
});
