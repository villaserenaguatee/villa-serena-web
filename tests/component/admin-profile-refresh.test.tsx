import {render,screen,fireEvent,waitFor} from '@testing-library/react';
import {beforeEach,expect,test,vi} from 'vitest';
import Profile from '@/components/common/EmployeeProfileModal';
import {operacion} from '@/lib/api/operaciones';
const auth=vi.hoisted(()=>({localDemo:false,user:{id:'42',name:'Persona',email:'fixture@example.invalid',role:'admin',staff:{id:42,nombre:'Persona',correo:'fixture@example.invalid',rol:'ADMIN',area:null}},logout:vi.fn()}));
vi.mock('@/hooks/useAuth',()=>({useAuth:()=>auth}));
vi.mock('@/lib/api/operaciones',()=>({operacion:vi.fn()}));
beforeEach(()=>{auth.user.role='admin';vi.mocked(operacion).mockReset().mockRejectedValue(Error('Servicio no disponible'));});
test('admin profile retries using the same compact refresh and retains loading state',async()=>{
 render(<Profile open onClose={()=>{}}/>);await screen.findByRole('alert');const button=screen.getByRole('button',{name:'Actualizar'});expect(button).toHaveAttribute('title','Actualizar');expect(button).toBeEnabled();
 vi.mocked(operacion).mockImplementationOnce(()=>new Promise(()=>{}));fireEvent.click(button);await waitFor(()=>expect(screen.getByRole('button',{name:'Actualizar'})).toBeDisabled());expect(screen.getByRole('button',{name:'Actualizar'})).toHaveAttribute('aria-busy','true');expect(operacion).toHaveBeenCalledTimes(2);
});
test('other employee profiles retain their existing retry control',async()=>{
 auth.user.role='recepcion';render(<Profile open onClose={()=>{}}/>);await screen.findByRole('alert');expect(screen.getByRole('button',{name:'Actualizar perfil'})).toBeEnabled();expect(screen.queryByRole('button',{name:'Actualizar'})).toBeNull();
});
