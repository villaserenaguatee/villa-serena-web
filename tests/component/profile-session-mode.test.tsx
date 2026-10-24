import {fireEvent,render,screen,waitFor} from '@testing-library/react';
import {beforeEach,expect,test,vi} from 'vitest';
import Profile from '@/components/common/StaffProfileConnected';
import {operacion} from '@/lib/api/operaciones';
const auth=vi.hoisted(()=>({localDemo:true,user:{id:'42',staff:{id:42,nombre:'Session Employee',correo:'employee@example.test',rol:'RECEPCION',area:null as string|null}},logout:vi.fn()}));
vi.mock('@/hooks/useAuth',()=>({useAuth:()=>auth}));
vi.mock('@/lib/api/operaciones',()=>({operacion:vi.fn()}));
beforeEach(()=>{auth.localDemo=true;vi.mocked(operacion).mockReset();});
for(const [rol,area] of [['ADMIN',null],['RECEPCION',null],['ROOM_SERVICE',null],['MANTENIMIENTO_LIMPIEZA','LIMPIEZA'],['MANTENIMIENTO_LIMPIEZA','MANTENIMIENTO']] as const)test('local authenticated profile: '+rol+' '+area,async()=>{
 auth.user.staff.rol=rol;auth.user.staff.area=area;render(<Profile open onClose={()=>{}}/>);
 expect(await screen.findByText('Session Employee',{selector:'p'})).toBeVisible();expect(operacion).not.toHaveBeenCalled();
 fireEvent.click(screen.getByRole('button',{name:'Informaci\u00f3n personal'}));expect(screen.queryByRole('button',{name:'Enviar solicitud'})).toBeNull();
 fireEvent.click(screen.getByRole('button',{name:'Seguridad'}));fireEvent.click(screen.getByRole('button',{name:/Cambiar contrase/}));expect(screen.getByRole('dialog',{name:/Cambiar contrase/})).toBeVisible();fireEvent.click(screen.getByRole('button',{name:'Cancelar'}));
 expect(operacion).not.toHaveBeenCalled();
});
test('connected errors retain session identity and security without inventing employment records',async()=>{
 auth.localDemo=false;vi.mocked(operacion).mockRejectedValue(Error('Servicio no disponible'));render(<Profile open onClose={()=>{}}/>);
 expect(await screen.findByText('Session Employee',{selector:'p'})).toBeVisible();await screen.findByRole('alert');
 expect(operacion).toHaveBeenCalledWith('laboral/perfil','GET',undefined,expect.any(AbortSignal));
 fireEvent.click(screen.getByRole('button',{name:'Informaci\u00f3n personal'}));expect(screen.queryByRole('button',{name:'Enviar solicitud'})).toBeNull();
 fireEvent.click(screen.getByRole('button',{name:/Informaci.*laboral/}));expect(screen.queryByText('No hay registros del mes.')).toBeNull();
 fireEvent.click(screen.getByRole('button',{name:'Seguridad'}));expect(screen.getByRole('button',{name:/Cambiar contrase/})).toBeVisible();
 await waitFor(()=>expect(screen.getByRole('button',{name:/Cerrar sesi/})).toBeEnabled());
});

test('a mismatched backend employee is rejected without showing another persons information',async()=>{auth.localDemo=false;vi.mocked(operacion).mockResolvedValue({id:999,nombre:'Otra persona',correo:'otra@example.invalid',rol:'ADMIN',area:null,perfil:{salarioBase:9999}});render(<Profile open onClose={()=>{}}/>);expect(await screen.findByRole('alert')).toHaveTextContent('El servicio no confirmó los datos del usuario autenticado');expect(screen.queryByText('Otra persona')).toBeNull();expect(screen.queryByText('otra@example.invalid')).toBeNull();expect(screen.queryByText('9999')).toBeNull();expect(screen.getByText('Session Employee',{selector:'p'})).toBeVisible();});
test('the shared employee profile does not render for a guest session',()=>{Object.assign(auth.user,{role:'huesped'});try{render(<Profile open onClose={()=>{}}/>);expect(screen.queryByRole('dialog')).toBeNull();expect(operacion).not.toHaveBeenCalled();}finally{Reflect.deleteProperty(auth.user,'role');}});
