import {render,screen,fireEvent,waitFor,within} from '@testing-library/react';
import {beforeEach,expect,test,vi} from 'vitest';
import {operacion} from '@/lib/api/operaciones';
import ReportesConectados from '@/features/admin/pages/ReportesConectados';
import IndicadoresAdmin from '@/features/admin/pages/IndicadoresAdmin';
import type {Indicadores} from '@/features/admin/pages/indicadoresValidation';
vi.mock('@/lib/api/operaciones',async original=>({...await original<typeof import('@/lib/api/operaciones')>(),operacion:vi.fn()}));
vi.mock('@/components/common/PublicLanguageToggle',()=>({usePublicLanguage:()=>({en:false})}));
const call=vi.mocked(operacion);
const data:Indicadores={inicio:'2026-10-01',fin:'2026-10-31',ocupacionHoy:{fecha:'2026-10-22',habitacionesOcupadas:2,habitacionesActivas:8,porcentaje:25},ingresos:1200,reservasPorCanal:[{canal:'DIRECTO_WEB',cantidad:3},{canal:'RECEPCION',cantidad:2},{canal:'BOOKING',cantidad:1},{canal:'EXPEDIA',cantidad:0}]};
beforeEach(()=>{call.mockReset().mockImplementation(async path=>path.startsWith('admin/indicadores')?data:{desde:'2026-10-01',hasta:'2026-10-31',reservas:[],pagos:[],ocupacionActual:[]});});
test('three official indicators use real denominator and approved-income total; existing tables/export survive',async()=>{
 render(<ReportesConectados/>);const panel=await screen.findByRole('region',{name:'Indicadores principales'});
 expect(within(panel).getByText('25.00 %')).toBeVisible();expect(within(panel).getByText('2 / 8 habitaciones activas')).toBeVisible();expect(within(panel).getByText('Q 1,200.00')).toBeVisible();expect(within(panel).getByText('6')).toBeVisible();
 expect(within(panel).getByText(/Booking: 1/)).toBeVisible();expect(panel.children).toHaveLength(3);
 expect(screen.getByRole('heading',{name:'Reservas registradas'})).toBeVisible();expect(screen.getByRole('button',{name:'Exportar Excel'})).toBeEnabled();
 const request=call.mock.calls.find(([path])=>path.startsWith('admin/indicadores'))![0];const query=new URLSearchParams(request.split('?')[1]);expect(query.get('inicio')).toMatch(/-01$/);expect(query.get('fin')).toBeTruthy();expect(query.has('desde')).toBe(false);
});
test('invalid date range shows an inline error and does not issue either request',async()=>{
 render(<ReportesConectados/>);await screen.findByRole('region',{name:'Indicadores principales'});const count=call.mock.calls.length;
 fireEvent.change(screen.getByLabelText('Desde'),{target:{value:'2026-10-20'}});fireEvent.change(screen.getByLabelText('Hasta'),{target:{value:'2026-10-10'}});
 fireEvent.submit(screen.getByRole('button',{name:'Consultar'}).closest('form')!);
 expect(screen.getByRole('alert')).toHaveTextContent(/la fecha final no puede ser anterior/i);expect(call).toHaveBeenCalledTimes(count);
 fireEvent.change(screen.getByLabelText('Hasta'),{target:{value:'2026-10-25'}});fireEvent.submit(screen.getByRole('button',{name:'Consultar'}).closest('form')!);
 await waitFor(()=>expect(call.mock.calls.some(([path])=>path==='admin/indicadores?inicio=2026-10-20&fin=2026-10-25')).toBe(true));
});
test('zero official values show zero, never an invented denominator',async()=>{
 call.mockResolvedValue({...data,ingresos:0,ocupacionHoy:{...data.ocupacionHoy,habitacionesOcupadas:0,habitacionesActivas:0,porcentaje:0},reservasPorCanal:[]});
 render(<IndicadoresAdmin inicio={data.inicio} fin={data.fin}/>);expect(await screen.findByText('0.00 %')).toBeVisible();expect(screen.getByText('0 / 0 habitaciones activas')).toBeVisible();expect(screen.getByText('Q 0.00')).toBeVisible();expect(screen.queryByRole('alert')).toBeNull();
});
test('official endpoint failure cannot be replaced by legacy counts; retry can recover',async()=>{
 call.mockImplementation(async path=>{if(path.startsWith('admin/indicadores'))throw Error('Indicadores no disponibles');return {reservas:[],pagos:[],ocupacionActual:[{ocupacion:'OCUPADA',cantidad:5}]};});
 const view=render(<IndicadoresAdmin inicio={data.inicio} fin={data.fin}/>);expect(await screen.findByRole('alert')).toHaveTextContent('Indicadores no disponibles');expect(screen.queryByRole('region',{name:'Indicadores principales'})).toBeNull();
 call.mockResolvedValue(data);view.rerender(<IndicadoresAdmin inicio={data.inicio} fin={data.fin} reload={1}/>);expect(await screen.findByRole('region',{name:'Indicadores principales'})).toBeVisible();
});
test('missing active-room count is an error, not a guessed percentage',async()=>{
 call.mockResolvedValue({...data,ocupacionHoy:{habitacionesOcupadas:2,porcentaje:25}});render(<IndicadoresAdmin inicio={data.inicio} fin={data.fin}/>);expect(await screen.findByRole('alert')).toHaveTextContent('habitaciones activas');expect(screen.queryByText('25.00 %')).toBeNull();
});
