// Display only: never change API values, names, free text or identifiers.
const labels: Record<string, readonly [string,string]> = {
 PENDIENTE:['Pendiente','Pending'],EN_PROCESO:['En proceso','In progress'],ATENDIDA:['Atendida','Completed'],CANCELADA:['Cancelada','Cancelled'],
 LIMPIEZA:['Limpieza','Housekeeping'],ARTICULOS:['Artículos','Supplies'],
 PENDIENTE_PAGO:['Pendiente de pago','Awaiting payment'],CONFIRMADA:['Confirmada','Confirmed'],EN_ESTADIA:['En estancia','Checked in'],FINALIZADA:['Finalizada','Completed'],NO_SHOW:['No presentada','No-show'],
 APROBADO:['Aprobado','Approved'],RECHAZADO:['Rechazado','Declined'],FALLIDO:['Fallido','Failed'],EXPIRADA:['Vencida','Expired'],
 PRESENTE:['Presente','Present'],AUSENTE:['Ausente','Absent'],DESCANSO:['Descanso','Day off'],APROBADA:['Aprobada','Approved'],RECHAZADA:['Rechazada','Rejected'],
 LIBRE:['Libre','Vacant'],OCUPADA:['Ocupada','Occupied'],LIMPIA:['Limpia','Clean'],SUCIA:['Sucia','Dirty'],EN_LIMPIEZA:['En limpieza','Being cleaned'],BLOQUEADA:['Bloqueada','Blocked'],
 DIRECTO:['Directo','Direct'],DIRECTO_WEB:['Web directa','Direct website'],CANAL:['Canal','Booking channel'],WEB:['Web','Website'],RECEPCION:['Recepción','Reception'],STRIPE:['Stripe','Stripe'],EFECTIVO:['Efectivo','Cash'],TARJETA:['Tarjeta','Card'],TRANSFERENCIA:['Transferencia','Bank transfer'],
 NOMBRE:['Nombre','Name'],CORREO:['Correo electrónico','Email address'],TELEFONO:['Teléfono','Phone'],
 MANANA:['Mañana','Morning'],TARDE:['Tarde','Afternoon'],NOCHE:['Noche','Night'],
 ACTIVO:['Activo','Active'],INACTIVO:['Inactivo','Inactive'],ADMIN:['Administración','Administration'],ROOM_SERVICE:['Room Service','Room Service'],MANTENIMIENTO_LIMPIEZA:['Mantenimiento y Limpieza','Maintenance and Housekeeping'],MANTENIMIENTO:['Mantenimiento','Maintenance'],AMBAS:['Ambas áreas','Both departments'],ACEPTADO:['Aceptado','Accepted'],REPORTADA:['Reportada','Reported'],RESUELTA:['Resuelta','Resolved'],
};
export function operationalLabel(value:unknown,en:boolean):string {
 const raw=String(value??'');const key=raw.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
 return labels[key]?.[en?1:0]??raw;
}
export function localizedNumber(value:number,en:boolean){return value.toLocaleString(en?'en-US':'es-GT',{minimumFractionDigits:2,maximumFractionDigits:2});}
export function localizedDate(value:unknown,en:boolean,monthOnly=false){
 const raw=String(value??'');const part=raw.slice(0,monthOnly?7:10);
 if(!(monthOnly?/^\d{4}-\d{2}$/:/^\d{4}-\d{2}-\d{2}$/).test(part))return raw;
 const date=new Date(part+(monthOnly?'-01':'')+'T12:00:00Z');if(!Number.isFinite(date.getTime()))return raw;
 return new Intl.DateTimeFormat(en?'en-US':'es-GT',{timeZone:'UTC',year:'numeric',month:'long',...(monthOnly?{}:{day:'numeric'})}).format(date);
}
