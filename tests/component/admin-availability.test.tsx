import {render,screen,waitFor,fireEvent} from '@testing-library/react';
import {beforeEach,expect,test,vi} from 'vitest';
import {operacion,OperationError} from '@/lib/api/operaciones';
import CatalogosAdmin from '@/features/admin/pages/CatalogosAdmin';
import ApprovedRoomMapConnected from '@/features/admin/pages/ApprovedRoomMapConnected';
import ReportesConectados from '@/features/admin/pages/ReportesConectados';
import GestionAdmin from '@/features/admin/pages/GestionAdmin';
import LaboralAdmin from '@/features/admin/pages/LaboralAdmin';
vi.mock('@/lib/api/operaciones',async original=>({...await original<typeof import('@/lib/api/operaciones')>(),operacion:vi.fn()}));
vi.mock('@/lib/usePublicCatalog',()=>({usePublicCatalog:()=>({rooms:[]})}));
const call=vi.mocked(operacion);
beforeEach(()=>{call.mockReset();call.mockRejectedValue(new OperationError('Unsupported demo',501,{codigo:'SIMULACION_NO_DISPONIBLE'}));});
for(const resource of ['tipos','habitaciones','personal','temporadas'])test(`unavailable ${resource} cannot open a create form`,async()=>{
 render(<CatalogosAdmin initial={resource}/>);await screen.findByText(/Modo demostración/);expect(screen.getByRole('button',{name:'Nuevo registro'})).toBeDisabled();expect(screen.queryByRole('dialog')).toBeNull();
});
test('unavailable room map and reports have clear messages and disabled data actions',async()=>{
 const view=render(<ApprovedRoomMapConnected/>);await screen.findByText(/Modo demostración/);expect(screen.getByRole('button',{name:'Volver a consultar'})).toBeDisabled();view.unmount();
 render(<ReportesConectados/>);await screen.findByText(/Modo demostración/);expect(screen.getByRole('button',{name:'Consultar'})).toBeEnabled();expect(screen.getByRole('button',{name:'Exportar CSV'})).toBeDisabled();const before=call.mock.calls.length;fireEvent.click(screen.getByRole('button',{name:'Consultar'}));await waitFor(()=>expect(call.mock.calls.length).toBeGreaterThan(before));expect(call.mock.calls.some(([path])=>path.startsWith('admin/indicadores?'))).toBe(true);expect(call.mock.calls.every(([,method])=>method==='GET')).toBe(true);await waitFor(()=>expect(screen.getByRole('button',{name:'Consultar'})).toBeEnabled());expect(screen.getByRole('button',{name:'Exportar CSV'})).toBeDisabled();
});
for(const section of ['inventario','finanzas'])test(`${section} does not expose write forms after unavailable data`,async()=>{
 render(<GestionAdmin seccion={section}/>);await screen.findByText(/Modo demostración/);expect(screen.queryByRole('button',{name:/Agregar|Registrar|Guardar/})).toBeNull();expect(call.mock.calls.every(([,method])=>method==='GET')).toBe(true);
});
test('unavailable labor operations do not expose attendance or payroll writes',async()=>{
 render(<LaboralAdmin initial="asistencia"/>);await screen.findByText(/Modo demostración/);expect(screen.queryByRole('button',{name:'Guardar asistencia'})).toBeNull();
});
test('successful backend results retain normal report and catalog actions',async()=>{
 call.mockImplementation(async path=>path.startsWith('admin/reportes')?{desde:'2026-10-01',hasta:'2026-10-19',reservas:[],pagos:[],ocupacionActual:[]}:[]);
 const view=render(<ReportesConectados/>);await waitFor(()=>expect(screen.getByRole('button',{name:'Exportar CSV'})).toBeEnabled());expect(screen.getByRole('button',{name:'Consultar'})).toBeEnabled();view.unmount();
 render(<CatalogosAdmin initial="tipos"/>);await waitFor(()=>expect(screen.getByRole('button',{name:'Nuevo registro'})).toBeEnabled());expect(screen.queryByText(/Modo demostración/)).toBeNull();
});
