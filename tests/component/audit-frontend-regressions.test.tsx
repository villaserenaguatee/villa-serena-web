import {render,screen,within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {beforeEach,expect,test,vi} from 'vitest';
import {presentarPedido} from '@/features/roomservice/useRoomService';
import DetallePedido from '@/features/roomservice/pages/DetallePedido';
import ReceptionTimeline from '@/features/recepcion/pages/ReceptionTimeline';
import CuentaHuespedConectada from '@/features/huesped/pages/CuentaHuespedConectada';
import {guestAccountCall,type GuestAccount} from '@/lib/api/guestAccount';
import type {PedidoRS} from '@/lib/api/operaciones';
import {fechaHoyISO} from '@/data/pms';
import {nextCalendarDay} from '@/features/recepcion/calendarSelection';

vi.mock('next/navigation',()=>({useRouter:()=>({refresh:vi.fn()})}));
vi.mock('@/lib/api/guestAccount',()=>({guestAccountCall:vi.fn()}));
vi.mock('@/features/huesped/pages/FacturaHuesped',()=>({default:()=>null}));
const order={id:1,creadoEn:'2026-10-22T14:00:00Z',estado:'ENTREGADO',items:[],notas:null,total:0,motivoCancelacion:null,habitacion:{id:1,numero:'101',piso:1},nombreHuesped:'Ana',historial:[{estadoAnterior:'EN_CAMINO',estadoNuevo:'ENTREGADO',responsable:'María López',fechaHora:'2026-10-22T14:30:00Z',motivo:'Entregado en puerta'}]} as PedidoRS;
beforeEach(()=>vi.mocked(guestAccountCall).mockResolvedValue({puedeConfirmar:true,nombreCompradorSugerido:'Ana',pedidosACancelar:[],motivosBloqueo:[]}));
test('Room Service preserves the API history and renders date, Guatemala time, author and reason',()=>{
 const p=presentarPedido(order);expect(p.historial[0]).toMatchObject({responsable:'María López',fechaHora:'2026-10-22T14:30:00Z',motivo:'Entregado en puerta'});
 render(<DetallePedido pedido={p} onCerrar={vi.fn()} onAvanzarEstado={vi.fn()} onCancelar={vi.fn()} conectado/>);
 expect(screen.getByText('Responsable: María López')).toBeVisible();expect(screen.getByText(/22 de octubre de 2026/)).toHaveTextContent(/8:30|08:30/);expect(screen.getByText('Motivo: Entregado en puerta')).toBeVisible();
});
test('missing historical optional values never invent an author or date',()=>{
 const p=presentarPedido({...order,historial:[]});p.historial=[{estado:'entregado',fechaHora:''}];
 render(<DetallePedido pedido={p} onCerrar={vi.fn()} onAvanzarEstado={vi.fn()} onCancelar={vi.fn()}/>);
 expect(screen.getByText('Fecha no disponible')).toBeVisible();expect(screen.queryByText(/Responsable:/)).not.toBeInTheDocument();
});
test('free nights support keyboard selection and pass an exclusive departure without changing reservation opening',async()=>{
 const first=fechaHoyISO(),last=nextCalendarDay(first),create=vi.fn();
 render(<ReceptionTimeline days={[first,last]} groupByFloor reservas={[]} huespedes={[]} habitaciones={[{id:'hh-101',numero:'101',piso:1,tipo:'Deluxe',tipoId:3}]} onSelect={vi.fn()} onCreate={create}/>);
 const start=screen.getByRole('button',{name:`Seleccionar noche ${first}, habitación 101`});start.focus();await userEvent.keyboard('{Enter}');
 await userEvent.click(screen.getByRole('button',{name:`Seleccionar noche ${last}, habitación 101`}));
 expect(start).toHaveAttribute('aria-pressed','true');await userEvent.click(screen.getByRole('button',{name:'Reservar selección'}));
 expect(create).toHaveBeenCalledWith({entrada:first,salida:nextCalendarDay(last),habitacionId:'hh-101',tipo:'Deluxe',tipoHabitacionId:3});
 await userEvent.click(screen.getByRole('button',{name:'Limpiar selección'}));expect(screen.getByRole('button',{name:'Reservar selección'})).toBeDisabled();
});
test('occupied nights keep opening the existing reservation and a range cannot cross it',async()=>{
 const first=fechaHoyISO(),occupied=nextCalendarDay(first),last=nextCalendarDay(occupied),open=vi.fn(),create=vi.fn();
 const reservation={id:'r1',codigo:'VS-ABC123',habitacionId:'hh-101',huespedId:'g1',estado:'confirmada',fechaEntrada:occupied,fechaSalida:last} as import('@/lib/pms/types').Reserva;
 render(<ReceptionTimeline days={[first,occupied,last]} groupByFloor reservas={[reservation]} huespedes={[]} habitaciones={[{id:'hh-101',numero:'101',piso:1,tipo:'Standard'}]} onSelect={open} onCreate={create}/>);
 expect(screen.queryByRole('button',{name:`Seleccionar noche ${occupied}, habitación 101`})).not.toBeInTheDocument();
 await userEvent.click(screen.getByRole('button',{name:/VS-ABC123/}));expect(open).toHaveBeenCalledWith(reservation);
 await userEvent.click(screen.getByRole('button',{name:`Seleccionar noche ${first}, habitación 101`}));await userEvent.click(screen.getByRole('button',{name:`Seleccionar noche ${last}, habitación 101`}));
 expect(screen.getByRole('alert')).toHaveTextContent('fechas ocupadas');expect(create).not.toHaveBeenCalled();
});
const account={codigoReserva:'VS-ABC123',estadoReserva:'EN_ESTADIA',estadoCuenta:'ABIERTA',saldo:0,cargos:[],pagos:[],detalleNoches:[],totalCargosVigentes:0,totalPagosAprobados:0} as unknown as GuestAccount;
test.each(['CF','cf','12345679','6K'])('checkout accepts CF or a valid check digit: %s',async nit=>{
 render(<CuentaHuespedConectada account={account} onReload={vi.fn()}/>);
 await userEvent.click(await screen.findByRole('button',{name:'Revisar check-out'}));
 const dialog=screen.getByRole('dialog'),input=within(dialog).getByRole('textbox',{name:'NIT o CF'});
 await userEvent.clear(input);await userEvent.type(input,nit);
 expect(within(dialog).getByRole('button',{name:'Confirmar salida'})).toBeEnabled();
 await userEvent.click(within(dialog).getByRole('button',{name:'Confirmar salida'}));expect(guestAccountCall).toHaveBeenCalledWith('VS-ABC123','checkout',expect.objectContaining({comprador:{nit:nit.toUpperCase(),nombreComprador:'Ana'}}));
});
test.each(['','12345678','ABC','0000'])('invalid NIT %s does not submit checkout',async nit=>{
 render(<CuentaHuespedConectada account={account} onReload={vi.fn()}/>);await userEvent.click(await screen.findByRole('button',{name:'Revisar check-out'}));
 const dialog=screen.getByRole('dialog'),input=within(dialog).getByRole('textbox',{name:'NIT o CF'});await userEvent.clear(input);if(nit)await userEvent.type(input,nit);
 expect(within(dialog).getByRole('alert')).toHaveTextContent('dígito verificador');expect(within(dialog).getByRole('button',{name:'Confirmar salida'})).toBeDisabled();
 expect(vi.mocked(guestAccountCall).mock.calls.every(call=>call[2]===undefined||call[2] instanceof AbortSignal)).toBe(true);
});
