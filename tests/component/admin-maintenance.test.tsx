import {render,screen,fireEvent,waitFor,within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {beforeEach,expect,test,vi} from 'vitest';
import SupervisionMantenimiento from '@/features/admin/pages/SupervisionMantenimiento';
import {operacion} from '@/lib/api/operaciones';
import type {components} from '@/lib/api/schema';
vi.mock('@/hooks/useAuth',()=>({useAuth:()=>session}));
vi.mock('@/lib/api/operaciones',async original=>({...await original<typeof import('@/lib/api/operaciones')>(),operacion:vi.fn()}));
vi.mock('@/components/common/PublicLanguageToggle',()=>({usePublicLanguage:()=>({en:false})}));
let session:{user:{staff:{rol:string}}|null;loading:boolean};
const call=vi.mocked(operacion);
const item=(id:number,estado:components['schemas']['EstadoIncidencia'],date:string):components['schemas']['IncidenciaResumen']=>({id,estado,habitacion:{id,numero:String(100+id),piso:1},descripcion:`Daño ${id}`,impideUso:id===1,habitacionOcupada:false,reportadaPor:{id:7,nombre:'Reportante'},reportadaEn:date,tecnicoACargo:estado==='REPORTADA'?null:{id:8,nombre:'Técnica'},resueltaEn:estado==='RESUELTA'?date:null,fotoUrl:null});
const rows=[item(1,'RESUELTA','2026-10-20T15:00:00Z'),item(2,'REPORTADA','2026-10-18T15:00:00Z'),item(3,'EN_PROCESO','2026-10-19T15:00:00Z')];
beforeEach(()=>{session={user:{staff:{rol:'ADMIN'}},loading:false};call.mockReset().mockImplementation(async path=>path==='incidencias'?rows:{...rows[0],solucion:'Pieza reparada',historial:[{estadoAnterior:'EN_PROCESO',estadoNuevo:'RESUELTA',responsable:'Técnica',fechaHora:'2026-10-20T15:00:00Z',motivo:'Cambio de pieza'}]});});
test('active incidents come first, newest first; room/state/technician filters combine without mutation',async()=>{
 render(<SupervisionMantenimiento/>);await screen.findByText('Daño 1');
 expect(screen.getAllByRole('article').map(a=>within(a).getByText(/^Daño/).textContent)).toEqual(['Daño 3','Daño 2','Daño 1']);
 fireEvent.change(screen.getByRole('combobox',{name:'Estado'}),{target:{value:'RESUELTA'}});expect(screen.getAllByRole('article')).toHaveLength(1);
 fireEvent.change(screen.getByRole('combobox',{name:'Habitación'}),{target:{value:'2'}});expect(screen.getByText('Sin incidencias')).toBeVisible();
 fireEvent.change(screen.getByRole('combobox',{name:'Estado'}),{target:{value:''}});fireEvent.change(screen.getByRole('combobox',{name:'Habitación'}),{target:{value:''}});
 fireEvent.change(screen.getByRole('combobox',{name:'Técnico'}),{target:{value:'8'}});expect(screen.getAllByRole('article')).toHaveLength(2);
 expect(call.mock.calls.every(([,method])=>method==='GET')).toBe(true);expect(call).toHaveBeenCalledTimes(1);
});
test('detail shows solution and responsible history, closes by keyboard and provides no state-changing actions',async()=>{
 render(<SupervisionMantenimiento/>);const description=await screen.findByText('Daño 1');await userEvent.click(within(description.closest('article')!).getByRole('button',{name:'Ver detalle'}));
 const dialog=screen.getByRole('dialog',{name:'Detalle de incidencia'});expect(await within(dialog).findByText('Pieza reparada',{exact:false})).toBeVisible();expect(within(dialog).getByText('Cambio de pieza')).toBeVisible();
 expect(screen.queryByRole('button',{name:/Tomar|Resolver|Reportar daño/})).toBeNull();expect(call.mock.calls[1].slice(0,2)).toEqual(['incidencias/1','GET']);
 await userEvent.keyboard('{Escape}');expect(screen.queryByRole('dialog')).toBeNull();expect(call.mock.calls.every(([,method])=>method==='GET')).toBe(true);
});
test.each(['RECEPCION','ROOM_SERVICE','MANTENIMIENTO_LIMPIEZA',null])('role %s cannot load administrative supervision',async role=>{
 session={user:role?{staff:{rol:role}}:null,loading:false};render(<SupervisionMantenimiento/>);expect(screen.getByRole('alert')).toHaveTextContent('Acceso denegado');expect(call).not.toHaveBeenCalled();
});
test('loading, empty and error are distinct; refresh retries without demo records',async()=>{
 let resolve!:(value:unknown)=>void;call.mockImplementationOnce(()=>new Promise(r=>{resolve=r;}));render(<SupervisionMantenimiento/>);expect(screen.getByRole('status')).toHaveTextContent('Consultando incidencias');resolve([]);
 expect(await screen.findByText('Sin incidencias')).toBeVisible();call.mockRejectedValueOnce(new Error('Servicio no disponible'));await userEvent.click(screen.getByRole('button',{name:'Actualizar'}));expect(await screen.findByRole('alert')).toHaveTextContent('Servicio no disponible');expect(screen.queryByText('Sin incidencias')).toBeNull();
 await userEvent.click(screen.getByRole('button',{name:'Actualizar'}));expect(await screen.findByText('Daño 1')).toBeVisible();
});
test('detail error is reported without fabricating history and can be retried',async()=>{
 render(<SupervisionMantenimiento/>);await screen.findByText('Daño 1');call.mockRejectedValueOnce(new Error('No disponible'));
 await userEvent.click(screen.getAllByRole('button',{name:'Ver detalle'})[0]);const dialog=screen.getByRole('dialog');expect(await within(dialog).findByRole('alert')).toHaveTextContent('No disponible');
 await userEvent.click(within(dialog).getByRole('button',{name:'Reintentar'}));await waitFor(()=>expect(within(dialog).getByText('Pieza reparada',{exact:false})).toBeVisible());
});
