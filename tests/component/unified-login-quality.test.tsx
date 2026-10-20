import {render,screen,fireEvent,waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {beforeEach,afterEach,expect,test,vi} from 'vitest';
import UnifiedLogin from '@/components/public/UnifiedLogin';
vi.mock('next/navigation',()=>({useSearchParams:()=>new URLSearchParams()}));
vi.mock('@/components/common/VillaSerenaLogo',()=>({default:()=> <a href="/">Villa Serena</a>}));
const fetchMock=vi.fn<typeof fetch>();
beforeEach(()=>{sessionStorage.clear();fetchMock.mockReset();vi.stubGlobal('fetch',fetchMock);});
afterEach(()=>vi.unstubAllGlobals());
const email=()=>screen.getByRole('textbox',{name:'Correo electrónico'});
const credential=()=>screen.getByLabelText('Contraseña o código de acceso',{exact:true});
async function fill(){await userEvent.type(email(),'employee@example.test');await userEvent.type(credential(),'123456');}
const response=(status:number,data:unknown={})=>new Response(JSON.stringify(data),{status});

test('empty, whitespace and incomplete email reject locally with inline errors and focus',async()=>{
 render(<UnifiedLogin/>);await userEvent.click(screen.getByRole('button',{name:'Iniciar sesión'}));expect(fetchMock).not.toHaveBeenCalled();expect(email()).toHaveAccessibleDescription('Complete este campo');expect(email()).toHaveFocus();
 for(const value of ['   ','a@','a@b','a b@example.test']){fireEvent.change(email(),{target:{value}});await userEvent.click(screen.getByRole('button',{name:'Iniciar sesión'}));expect(email()).toHaveAttribute('aria-invalid','true');}
 expect(fetchMock).not.toHaveBeenCalled();
});
test('numeric password is sent unchanged; rejected or expired credential remains generic',async()=>{
 fetchMock.mockResolvedValue(response(401));render(<UnifiedLogin/>);await fill();await userEvent.click(screen.getByRole('button',{name:'Iniciar sesión'}));
 await screen.findByRole('alert');expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({correo:'employee@example.test',credencial:'123456'});expect(email()).toHaveValue('employee@example.test');expect(credential()).toHaveValue('123456');
 expect(screen.getByRole('alert')).toHaveTextContent('No se pudo iniciar sesión');
});
test('concurrent submits share one attempt; connection and 5xx retries keep its key',async()=>{
 let reject!:(error:Error)=>void;fetchMock.mockImplementationOnce(()=>new Promise((_,r)=>{reject=r;}));render(<UnifiedLogin/>);await fill();const form=credential().closest('form')!;fireEvent.submit(form);fireEvent.submit(form);expect(fetchMock).toHaveBeenCalledTimes(1);reject(new TypeError('offline'));await screen.findByText('No se pudo conectar. Intenta nuevamente.');
 fetchMock.mockResolvedValueOnce(response(503));fireEvent.submit(form);await screen.findByText(/El servicio de acceso no está disponible/);
 const keys=fetchMock.mock.calls.map(([,init])=>(init?.headers as Record<string,string>)['Idempotency-Key']);expect(keys[0]).toBe(keys[1]);expect(sessionStorage.getItem('vs-login-request')).not.toContain('123456');
});
test('visibility is keyboard accessible and resets when opening a secondary panel',async()=>{
 render(<UnifiedLogin/>);await fill();const show=screen.getByRole('button',{name:'Mostrar credencial'});show.focus();await userEvent.keyboard('{Enter}');expect(credential()).toHaveAttribute('type','text');expect(screen.getByRole('button',{name:'Ocultar credencial'})).toHaveAttribute('aria-pressed','true');
 await userEvent.click(screen.getByRole('button',{name:'¿Olvidaste tu contraseña?'}));expect(email()).toHaveFocus();await userEvent.click(screen.getByRole('button',{name:'Volver a iniciar sesión'}));expect(credential()).toHaveAttribute('type','password');expect(email()).toHaveValue('employee@example.test');
});
test('restoring a saved panel never overwrites its email with the initial empty render',async()=>{
 sessionStorage.setItem('vs-login-request',JSON.stringify({email:'saved@example.test',panel:'recovery',expires:Date.now()+60000}));render(<UnifiedLogin/>);await screen.findByRole('heading',{name:'Recuperar contraseña'});await waitFor(()=>expect(email()).toHaveValue('saved@example.test'));expect(JSON.parse(sessionStorage.getItem('vs-login-request')!).email).toBe('saved@example.test');
});
test('corrupt or expired UI state is discarded without persisting credentials',async()=>{
 sessionStorage.setItem('vs-login-request','broken');render(<UnifiedLogin/>);expect(email()).toHaveValue('');expect(JSON.parse(sessionStorage.getItem('vs-login-request')!).panel).toBe('login');expect(fetchMock).not.toHaveBeenCalled();
});
test('expired UI state and malformed countdowns cannot trap the user',async()=>{
 sessionStorage.setItem('vs-login-request',JSON.stringify({email:'old@example.test',panel:'code',expires:Date.now()-1}));const view=render(<UnifiedLogin/>);expect(email()).toHaveValue('');view.unmount();
 sessionStorage.setItem('vs-login-request',JSON.stringify({email:'guest@example.test',panel:'code',expires:Date.now()+60000,codeUntil:'Infinity'}));render(<UnifiedLogin/>);await screen.findByRole('heading',{name:'Código de acceso'});expect(screen.getByRole('button',{name:'Enviar código'})).toBeEnabled();expect(fetchMock).not.toHaveBeenCalled();
});
for(const panel of ['code','recovery'])test(`${panel}: generic acceptance, no duplicate request and wait survives remount`,async()=>{
 fetchMock.mockResolvedValue(response(202));const view=render(<UnifiedLogin/>);await userEvent.type(email(),'guest@example.test');await userEvent.click(screen.getByRole('button',{name:panel==='code'?'Obtén tu código de acceso':'¿Olvidaste tu contraseña?'}));const send=screen.getByRole('button',{name:panel==='code'?'Enviar código':'Enviar enlace'});await userEvent.dblClick(send);await waitFor(()=>expect(fetchMock).toHaveBeenCalledTimes(1));expect(send).toBeDisabled();expect(screen.getByText(/Si el correo/)).toBeVisible();view.unmount();render(<UnifiedLogin/>);await waitFor(()=>expect(screen.getByRole('button',{name:panel==='code'?'Enviar código':'Enviar enlace'})).toBeDisabled());expect(email()).toHaveValue('guest@example.test');
});
test('an unauthorized redirect destination is refused without navigating',async()=>{
 fetchMock.mockResolvedValue(response(200,{destino:'https://untrusted.example/'}));render(<UnifiedLogin/>);await fill();await userEvent.click(screen.getByRole('button',{name:'Iniciar sesión'}));expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo confirmar el acceso');
});
test('a timed-out login releases the form, preserves input and reports a connection problem',async()=>{
 fetchMock.mockRejectedValue(new DOMException('Timed out','TimeoutError'));render(<UnifiedLogin/>);await fill();await userEvent.click(screen.getByRole('button',{name:'Iniciar sesión'}));expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo conectar');expect(credential()).toHaveValue('123456');expect(screen.getByRole('button',{name:'Iniciar sesión'})).toBeEnabled();expect(fetchMock.mock.calls[0][1]?.signal).toBeInstanceOf(AbortSignal);
});

test('request rate limit uses real Retry-After, stays generic and survives reload',async()=>{
 fetchMock.mockResolvedValue(new Response('{}',{status:429,headers:{'Retry-After':'900'}}));const view=render(<UnifiedLogin/>);await userEvent.type(email(),'guest@example.test');await userEvent.click(screen.getByRole('button',{name:'Obtén tu código de acceso'}));await userEvent.click(screen.getByRole('button',{name:'Enviar código'}));
 expect(await screen.findByRole('alert')).toHaveTextContent('Demasiadas solicitudes');expect(screen.getByText(/900s/)).toBeVisible();view.unmount();render(<UnifiedLogin/>);await screen.findByRole('heading',{name:'Código de acceso'});expect(screen.getByRole('button',{name:'Enviar código'})).toBeDisabled();expect(screen.getByText(/90[0]?s|899s/)).toBeVisible();
});
test('login throttle is distinct from invalid credentials without disclosing an account',async()=>{
 fetchMock.mockResolvedValue(new Response('{}',{status:429,headers:{'Retry-After':'120'}}));render(<UnifiedLogin/>);await fill();await userEvent.click(screen.getByRole('button',{name:'Iniciar sesión'}));expect(await screen.findByRole('alert')).toHaveTextContent('Demasiados intentos');expect(screen.getByRole('button',{name:'Iniciar sesión'})).toBeDisabled();expect(credential()).toHaveValue('123456');
});
