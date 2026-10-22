'use client';
import {useEffect,useState} from 'react';
import {operacion} from '@/lib/api/operaciones';
import {usePublicLanguage} from '@/components/common/PublicLanguageToggle';
import {localizedNumber,operationalLabel} from '@/i18n/operationalLabels';
import Kpi from './ApprovedReportKpi';
import {occupancyPercentage,type Indicadores} from './indicadoresValidation';
export default function IndicadoresAdmin({inicio,fin,reload=0}:{inicio:string;fin:string;reload?:number}){
 const {en}=usePublicLanguage();const ui=(es:string,english:string)=>en?english:es;
 const [data,setData]=useState<Indicadores>(),[loading,setLoading]=useState(true),[error,setError]=useState('');
 useEffect(()=>{const c=new AbortController();setData(undefined);setLoading(true);setError('');
 operacion<Indicadores>(`admin/indicadores?${new URLSearchParams({inicio,fin})}`,'GET',undefined,c.signal).then(value=>{
  occupancyPercentage(value);
  if(!Number.isFinite(value.ingresos)||value.ingresos<0||!Array.isArray(value.reservasPorCanal)||value.reservasPorCanal.some(r=>!['DIRECTO_WEB','RECEPCION','BOOKING','EXPEDIA'].includes(r.canal)||!Number.isInteger(r.cantidad)||r.cantidad<0))throw Error('Los indicadores recibidos no son válidos.');
  if(!c.signal.aborted)setData(value);
 }).catch(e=>{if(!c.signal.aborted)setError(e instanceof Error?e.message:'No se pudo consultar.');}).finally(()=>{if(!c.signal.aborted)setLoading(false);});return()=>c.abort();},[inicio,fin,reload]);
 if(loading)return <p role="status" className="mb-4">{ui('Consultando indicadores…','Loading indicators…')}</p>;
 if(error)return <p role="alert" className="mb-4 text-red-800">{error}</p>;
 if(!data)return null;
 const channels=['DIRECTO_WEB','RECEPCION','BOOKING','EXPEDIA'];
 return <section aria-label={ui('Indicadores principales','Key indicators')} className="mb-6 grid gap-3 sm:grid-cols-3">
  <Kpi destacado valor={localizedNumber(occupancyPercentage(data),en)+' %'} label={ui('Ocupación de hoy','Occupancy today')} detalle={`${data.ocupacionHoy.habitacionesOcupadas} / ${data.ocupacionHoy.habitacionesActivas} ${ui('habitaciones activas','active rooms')}`}/>
  <Kpi valor={'Q '+localizedNumber(data.ingresos,en)} label={ui('Ingresos del período','Income for the period')} detalle={ui('Únicamente pagos aprobados','Approved payments only')}/>
  <Kpi destacado valor={String(data.reservasPorCanal.reduce((n,r)=>n+r.cantidad,0))} label={ui('Reservas por canal','Reservations by channel')} detalle={channels.map(c=>`${c==='BOOKING'?'Booking':c==='EXPEDIA'?'Expedia':operationalLabel(c,en)}: ${data.reservasPorCanal.filter(r=>r.canal===c).reduce((n,r)=>n+r.cantidad,0)}`).join(' · ')}/>
 </section>;
}
