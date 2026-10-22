import {render,screen} from '@testing-library/react';
import {expect,test,vi} from 'vitest';
import ReceptionDetailBff from '@/features/recepcion/pages/ReceptionDetailBff';
import {getReservation,getRooms} from '@/lib/api/reception';
import type {ReservationDetail} from '@/lib/bff/contracts/reception';
vi.mock('@/lib/api/reception',()=>({getReservation:vi.fn(),getRooms:vi.fn()}));
vi.mock('@/components/common/EstanciaDocumentos',()=>({default:()=>null}));
test.each(['18:30',null,undefined])('authorized detail displays arrival %s without inventing a default',async hora=>{
  const detail:ReservationDetail={identificadorExterno:null,creadaEn:'2026-10-01T12:00:00Z',codigo:'VS-ABC123',estado:'FINALIZADA',canal:'RECEPCION',entrada:'2026-10-10',salida:'2026-10-12',noches:2,numeroHuespedes:2,total:840,saldoPendiente:0,tipoHabitacion:{id:1,nombre:'Standard'},habitacion:null,huesped:{id:1,nombreCompleto:'Ana Pérez',correo:'ana@example.invalid',telefono:'+502 55551234',tipoDocumento:'DPI',numeroDocumento:'0012345678901',nacionalidad:null},huespedesAdicionales:[],historial:[],horaEstimadaLlegada:hora??null};
  if(hora===undefined) Reflect.deleteProperty(detail,'horaEstimadaLlegada');
  vi.mocked(getReservation).mockResolvedValue(detail); vi.mocked(getRooms).mockResolvedValue([]);
  render(<ReceptionDetailBff conectado codigo={detail.codigo} onCerrar={vi.fn()} onExistingAction={vi.fn()}/>);
  expect(await screen.findByText(hora??'No indicada')).toBeVisible();
  expect(screen.getByText('Hora estimada de llegada')).toBeVisible();
  expect(screen.queryByText('15:00')).not.toBeInTheDocument();
});
