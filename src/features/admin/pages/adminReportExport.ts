import type {ReportExport,ReportSheet} from '@/lib/pms/reportXlsx';
import {reportRangeValid} from './indicadoresValidation';
export type ReportRow=Record<string,string|number>;
export type ConnectedReport={desde:string;hasta:string;reservas:ReportRow[];pagos:ReportRow[];ocupacionActual:ReportRow[]};
const number=(v:unknown)=>{const n=typeof v==='number'||typeof v==='string'&&v.trim()?Number(v):NaN;if(!Number.isFinite(n)||n<0)throw Error('El API devolvió un importe o cantidad inválidos.');return n;};
const count=(v:unknown)=>{const n=number(v);if(!Number.isInteger(n))throw Error('El API devolvió una cantidad inválida.');return n;};
const sumMoney=(rows:ReportRow[])=>rows.reduce((total,r)=>total+Math.round(number(r.importe)*100),0)/100;
export function validateConnectedReport(value:ConnectedReport,desde:string,hasta:string):ConnectedReport{
 if(!value||value.desde!==desde||value.hasta!==hasta||!reportRangeValid(value.desde,value.hasta)||!Array.isArray(value.reservas)||!Array.isArray(value.pagos)||!Array.isArray(value.ocupacionActual))throw Error('El API no confirmó el período y los datos del reporte.');
 for(const key of ['reservas','pagos','ocupacionActual'] as const)for(const row of value[key]){if(!row||typeof row!=='object')throw Error('El API devolvió un reporte inválido.');count(row.cantidad);if(key!=='ocupacionActual'){number(row.importe);if(typeof row.estado!=='string'||typeof row[key==='reservas'?'canal':'metodo']!=='string')throw Error('El API devolvió un reporte inválido.');}else if(typeof row.ocupacion!=='string'||typeof row.condicion!=='string')throw Error('El API devolvió una ocupación inválida.');}
 return value;
}
export function connectedReportExport(data:ConnectedReport):ReportExport{
 validateConnectedReport(data,data.desde,data.hasta);
 const approved=data.pagos.filter(r=>r.estado==='APROBADO'),active=data.ocupacionActual.reduce((s,r)=>s+count(r.cantidad),0),occupied=data.ocupacionActual.filter(r=>r.ocupacion==='OCUPADA').reduce((s,r)=>s+count(r.cantidad),0);
 const summary:ReportSheet={name:'Resumen',cellFormats:{B9:'money',B12:'percent'},headers:['Indicador','Valor'],rows:[['Ingresos: pagos aprobados (Q)',sumMoney(approved)],['Reservas registradas',data.reservas.reduce((s,r)=>s+count(r.cantidad),0)],['Habitaciones activas actuales',active],['Ocupación actual',active?occupied/active:'Sin habitaciones activas'],['Gastos','No disponibles en este reporte del API'],['Nómina','No disponible en este reporte del API']],note:'Los ingresos incluyen únicamente APROBADO. La ocupación es actual, fuera del período consultado. Los importes de reservas no equivalen a dinero cobrado.'};
 const sheets:ReportSheet[]=[summary,{name:'Ingresos',headers:['Estado de pago','Método','Cantidad','Importe (Q)'],rows:data.pagos.map(r=>[r.estado,r.metodo,count(r.cantidad),number(r.importe)]),formats:{3:'money'},totals:['Total aprobado (ingresos)','',approved.reduce((s,r)=>s+count(r.cantidad),0),sumMoney(approved)],note:'Detalle por fecha de registro. Solo APROBADO se suma como ingreso; otros estados se conservan para consulta.'},{name:'Reservas',headers:['Estado','Canal','Cantidad','Importe reservado (Q)'],rows:data.reservas.map(r=>[r.estado,r.canal,count(r.cantidad),number(r.importe)]),formats:{3:'money'},note:'Valor de reservas agrupado por estado y canal; no representa ingresos cobrados.'},{name:'Ocupación',headers:['Ocupación actual','Condición','Habitaciones'],rows:data.ocupacionActual.map(r=>[r.ocupacion,r.condicion,count(r.cantidad)]),totals:['Total habitaciones activas','',active],note:'Fotografía actual de habitaciones activas. No es ocupación histórica del período seleccionado.'}];
 if(!data.reservas.length&&!data.pagos.length&&!data.ocupacionActual.length)summary.note='Sin datos registrados. '+summary.note;
 for(const sheet of sheets)if(!sheet.rows.length)sheet.note='Sin datos registrados. '+(sheet.note??'');
 return {title:'Reporte de desempeño',period:`${data.desde} a ${data.hasta}`,sheets};
}
