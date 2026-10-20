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
 expect(await screen.findByRole('heading',{name:'Session Employee'})).toBeVisible();expect(operacion).not.toHaveBeenCalled();
 fireEvent.click(screen.getByRole('button',{name:'Datos de contacto'}));expect(screen.queryByRole('button',{name:'Enviar solicitud'})).toBeNull();
 fireEvent.click(screen.getByRole('button',{name:'Seguridad'}));expect(screen.getByRole('link',{name:/Cambiar contrase/})).toHaveAttribute('href','/panel/cambiar-contrasena');
 fireEvent.click(screen.getByRole('button',{name:'Actualizar perfil'}));expect(operacion).not.toHaveBeenCalled();
});
test('connected errors retain session identity and security without inventing employment records',async()=>{
 auth.localDemo=false;vi.mocked(operacion).mockRejectedValue(Error('Servicio no disponible'));render(<Profile open onClose={()=>{}}/>);
 expect(await screen.findByRole('heading',{name:'Session Employee'})).toBeVisible();await screen.findByRole('alert');
 expect(operacion).toHaveBeenCalledWith('laboral/perfil','GET',undefined,expect.any(AbortSignal));
 fireEvent.click(screen.getByRole('button',{name:'Datos de contacto'}));expect(screen.queryByRole('button',{name:'Enviar solicitud'})).toBeNull();
 fireEvent.click(screen.getByRole('button',{name:/Informaci.*laboral/}));expect(screen.queryByText('No hay registros del mes.')).toBeNull();
 fireEvent.click(screen.getByRole('button',{name:'Seguridad'}));expect(screen.getByRole('link',{name:/Cambiar contrase/})).toBeVisible();
 await waitFor(()=>expect(screen.getByRole('button',{name:/Cerrar sesi/})).toBeEnabled());
});
