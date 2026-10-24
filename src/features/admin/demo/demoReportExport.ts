import type {ReportExport} from '@/lib/pms/reportXlsx';
import type {AdminDemoData} from './adminDemoData';
export function demoReportExport(data:AdminDemoData):ReportExport{
 const income=data.income.reduce((n,r)=>n+Math.round(Number(r.monto)*100),0)/100,expenses=data.expenses.reduce((n,r)=>n+Math.round(Number(r.monto)*100),0)/100;
 const states=[...new Set(data.rooms.map(r=>String(r.estado)))];
 const payroll=data.employees.filter(e=>e.estado==='ACTIVO').map(e=>{const p=e.perfil as Record<string,unknown>;const n=(key:string)=>p[key]==null||p[key]===''?null:Number(p[key]);return [String(e.nombre),String(p.turno??'No registrado'),n('salarioBase'),n('bonosExtras'),n('descuentosNomina')];});
 return {title:'Reporte de desempeño — demostración',period:'Octubre 2026 — datos ilustrativos de la vista local',demo:true,sheets:[
 {name:'Resumen',headers:['Indicador ilustrativo','Valor'],rows:[['Ingresos de ejemplo (Q)',income],['Gastos de ejemplo (Q)',expenses],['Habitaciones de demostración',data.rooms.length],['Ocupación actual de la muestra',data.rooms.length?data.rooms.filter(r=>r.estado==='Ocupada').length/data.rooms.length:0]],cellFormats:{B9:'money',B10:'money',B12:'percent'},note:'Datos ficticios locales. No representa operaciones, cobros ni conciliación reales.'},
 {name:'Ingresos',chart:{title:'Ingresos de demostración por actividad',categoryColumn:0,valueColumn:1},headers:['Actividad ilustrativa','Monto (Q)'],rows:data.income.map(r=>[String(r.concepto),Number(r.monto)]),formats:{1:'money'},totals:['Total de ejemplo',income]},
 {name:'Gastos',chart:{title:'Gastos de demostración por concepto',categoryColumn:0,valueColumn:2},headers:['Concepto','Fecha','Monto (Q)'],rows:data.expenses.map(r=>[String(r.concepto),new Date(String(r.fecha)+'T12:00:00Z'),Number(r.monto)]),formats:{1:'date',2:'money'},totals:['Total de ejemplo','',expenses]},
 {name:'Ocupación',headers:['Estado actual de la muestra','Habitaciones'],rows:states.map(state=>[state,data.rooms.filter(r=>r.estado===state).length]),totals:['Total de demostración',data.rooms.length],note:'Estados actuales de la muestra; no ocupación histórica.'},
 {name:'Nómina',headers:['Empleado ficticio','Turno','Salario base (Q)','Bonos (Q)','Descuentos (Q)'],rows:payroll,formats:{2:'money',3:'money',4:'money'},note:'Datos laborales de ejemplo, no nómina calculada ni pagada.'}
 ]};
}
