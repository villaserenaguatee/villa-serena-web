import {render,screen,fireEvent,waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {beforeEach,afterEach,test,expect,vi} from 'vitest';
import PasswordRecovery from '@/components/public/PasswordRecovery';
vi.mock('@/components/common/VillaSerenaLogo',()=>({default:()=> <a href="/">Villa Serena</a>}));
const request=vi.fn<typeof fetch>();
beforeEach(()=>{request.mockReset();vi.stubGlobal('fetch',request);history.replaceState(null,'','/restablecer-contrasena#token='+'a'.repeat(43));});
afterEach(()=>{vi.unstubAllGlobals();history.replaceState(null,'','/');});
async function fields(){const first=await screen.findByLabelText('Nueva contraseña');const second=screen.getByLabelText('Confirmar contraseña');await userEvent.type(first,'Fixture-new-123');await userEvent.type(second,'Fixture-new-123');return {first,second};}
test('missing token cannot submit; only navigation is available',async()=>{
 history.replaceState(null,'','/restablecer-contrasena');render(<PasswordRecovery/>);expect(await screen.findByRole('alert')).toHaveTextContent('Abre el enlace completo');expect(screen.queryByRole('button',{name:'Guardar contraseña'})).toBeNull();expect(request).not.toHaveBeenCalled();expect(screen.getByRole('link',{name:'Volver'})).toHaveAttribute('href','/login');
});
test('mismatch rejects locally and simulated expired/altered link is not presented as success',async()=>{
 request.mockResolvedValue(new Response(null,{status:400}));render(<PasswordRecovery/>);const {first,second}=await fields();fireEvent.change(second,{target:{value:'Different-123'}});fireEvent.submit(first.closest('form')!);expect(await screen.findByRole('alert')).toHaveTextContent('Ambas contraseñas deben coincidir');expect(request).not.toHaveBeenCalled();
 fireEvent.change(second,{target:{value:'Fixture-new-123'}});await userEvent.click(screen.getByRole('button',{name:'Guardar contraseña'}));await waitFor(()=>expect(screen.getByRole('alert')).toHaveTextContent('El enlace no es válido'));expect(first).toHaveValue('Fixture-new-123');expect(location.hash).toBe('');
});
test('5xx is an unavailable service, not an expired link',async()=>{
 request.mockResolvedValue(new Response(null,{status:503}));render(<PasswordRecovery/>);await fields();await userEvent.click(screen.getByRole('button',{name:'Guardar contraseña'}));expect(await screen.findByRole('alert')).toHaveTextContent('El servicio de recuperación no está disponible');
});
test('controlled success clears credentials and offers sign in; no real password changes',async()=>{
 request.mockResolvedValue(new Response(null,{status:204}));render(<PasswordRecovery/>);const {first}=await fields();fireEvent.submit(first.closest('form')!);fireEvent.submit(first.closest('form')!);await screen.findByText(/Tu contraseña se actualizó/);expect(request).toHaveBeenCalledTimes(1);expect(screen.queryByLabelText('Nueva contraseña')).toBeNull();expect(screen.getByRole('link',{name:'Iniciar sesión'})).toHaveAttribute('href','/login');
});
