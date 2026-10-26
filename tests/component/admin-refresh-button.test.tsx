import {render,screen,fireEvent,waitFor} from '@testing-library/react';
import {expect,test,vi,beforeEach} from 'vitest';
import AdminRefreshButton from '@/features/admin/pages/AdminRefreshButton';
import ConsultaAdmin from '@/features/admin/pages/ConsultaAdmin';
import {operacion} from '@/lib/api/operaciones';
vi.mock('@/lib/api/operaciones',async original=>({...await original<typeof import('@/lib/api/operaciones')>(),operacion:vi.fn()}));
const call=vi.mocked(operacion);
beforeEach(()=>call.mockReset());
test('compact refresh exposes its tooltip and accessible name without submitting forms',()=>{
 const click=vi.fn(),submit=vi.fn();render(<form onSubmit={submit}><AdminRefreshButton loading={false} onClick={click}/></form>);
 const button=screen.getByRole('button',{name:'Actualizar'});expect(button).toHaveAttribute('title','Actualizar');expect(button).toHaveAttribute('type','button');expect(button).toHaveClass('h-11','w-11');fireEvent.click(button);expect(click).toHaveBeenCalledOnce();expect(submit).not.toHaveBeenCalled();
});
test('loading rotates the icon and blocks repeated requests; saving can independently disable it',()=>{
 const click=vi.fn();const {rerender}=render(<AdminRefreshButton loading onClick={click}/>);const button=screen.getByRole('button',{name:'Actualizar'});
 expect(button).toBeDisabled();expect(button).toHaveAttribute('aria-busy','true');expect(button.querySelector('svg')).toHaveClass('animate-spin');fireEvent.click(button);expect(click).not.toHaveBeenCalled();
 rerender(<AdminRefreshButton loading={false} disabled onClick={click}/>);expect(button).toBeDisabled();expect(button.querySelector('svg')).not.toHaveClass('animate-spin');
 rerender(<AdminRefreshButton loading={false} onClick={click}/>);expect(button).toBeEnabled();
});
test('connected query keeps its existing GET and refresh lifecycle, including recovery after an error',async()=>{
 call.mockResolvedValueOnce([]);let fail:(reason:Error)=>void=()=>{};call.mockImplementationOnce(()=>new Promise((_,reject)=>{fail=reject;}));
 render(<ConsultaAdmin seccion="finanzas"/>);const button=screen.getByRole('button',{name:'Actualizar'});await waitFor(()=>expect(button).toBeEnabled());fireEvent.click(button);
 await waitFor(()=>expect(button).toBeDisabled());expect(button).toHaveAttribute('aria-busy','true');fireEvent.click(button);expect(call).toHaveBeenCalledTimes(2);
 fail(Error('Servicio temporalmente no disponible'));expect(await screen.findByRole('alert')).toHaveTextContent('Servicio temporalmente no disponible');await waitFor(()=>expect(button).toBeEnabled());
 expect(button).toHaveAttribute('aria-busy','false');expect(call.mock.calls.every(([path,method])=>path==='admin/consulta/finanzas'&&method==='GET')).toBe(true);
});
