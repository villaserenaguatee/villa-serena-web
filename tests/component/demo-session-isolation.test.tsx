import {render,screen,waitFor} from '@testing-library/react';
import {beforeEach,expect,test,vi} from 'vitest';
import {AuthProvider} from '@/app/providers/AuthProvider';
import {useAuth} from '@/hooks/useAuth';
const mocks=vi.hoisted(()=>({request:vi.fn(),restore:vi.fn(),login:vi.fn()}));
vi.mock('@/lib/auth/staff-client',()=>({staffRequest:mocks.request,staffLogin:vi.fn()}));
vi.mock('@/lib/auth/local-auth',()=>({reconstruirSesion:mocks.restore,loginLocal:mocks.login}));
function Probe(){const {user,loading}=useAuth();return <p>{loading?'loading':user?.name??'anonymous'}</p>;}
beforeEach(()=>{localStorage.clear();mocks.request.mockReset().mockRejectedValue(new Error('offline'));mocks.restore.mockReset().mockReturnValue({role:'huesped',name:'Demo Guest'});localStorage.setItem('villa-serena-session','{}');});
test('a real connection failure never restores a local demo identity',async()=>{
 render(<AuthProvider><Probe/></AuthProvider>);await screen.findByText('anonymous');expect(mocks.restore).not.toHaveBeenCalled();expect(localStorage.getItem('villa-serena-session')).toBeNull();
});
test('explicit local demo retains its local guest identity',async()=>{
 render(<AuthProvider localDemo><Probe/></AuthProvider>);await screen.findByText('Demo Guest');expect(mocks.restore).toHaveBeenCalled();
});
test('a real employee session takes precedence over a stale demo identity',async()=>{
 mocks.request.mockResolvedValue({id:42,nombre:'Real Employee',correo:'staff@example.test',rol:'ADMIN',area:null,debeCambiarContrasena:false});
 render(<AuthProvider><Probe/></AuthProvider>);await waitFor(()=>expect(screen.getByText('Real Employee')).toBeTruthy());expect(mocks.restore).not.toHaveBeenCalled();
});
