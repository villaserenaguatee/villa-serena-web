import type {Reserva} from './pms/types';
export function reservationOptionLabel(reservation:Pick<Reserva,'codigo'|'fechaEntrada'|'estado'>,en=false) {
 const states:Record<Reserva['estado'],[string,string]>={pendiente:['Pendiente','Pending'],confirmada:['Confirmada','Confirmed'],'en-curso':['En curso','In progress'],finalizada:['Finalizada','Completed'],cancelada:['Cancelada','Cancelled']};
 const date=new Date(`${reservation.fechaEntrada}T12:00:00`);
 const arrival=Number.isNaN(date.getTime())?reservation.fechaEntrada:date.toLocaleDateString(en?'en-US':'es-GT',{day:'numeric',month:'long',year:'numeric'});
 return `${en?'Reservation':'Reserva'} ${reservation.codigo} · ${en?'Arrival':'Llegada'} ${arrival} · ${states[reservation.estado]?.[en?1:0]??reservation.estado}`;
}
