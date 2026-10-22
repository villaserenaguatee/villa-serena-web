'use client';
import {ADMIN_DEMO_UNAVAILABLE,isAdminDemoUnavailable} from './adminAvailability';
import {FormOperationProvider} from '@/components/common/FormOperationFeedback';
import {useEffect,useRef,useState} from 'react';
import {operacion} from '@/lib/api/operaciones';
import type {Insumo,MovimientoInsumo,CompraHotel,GastoHotel,Activo,ActivoHotel} from '@/lib/pms/types';
import AmenidadesAdmin from './AmenidadesAdmin';
import CatalogosAdmin from './CatalogosAdmin';
import AdminRoomsManagement from './AdminRoomsManagement';
import ReportesConectados from './ReportesConectados';
import LaboralAdmin from './LaboralAdmin';
import ComprasInventario from './ComprasInventario';import FinanzasActivos from './FinanzasActivos';import ConsultaAdmin from './ConsultaAdmin';
type V={id:string;version?:number};
export default function GestionAdmin({seccion,personalInitial='catalogo'}:{seccion:string;personalInitial?:string}){
 const [insumos,setInsumos]=useState<(Insumo&V)[]>([]),[movimientos,setMovimientos]=useState<(MovimientoInsumo&V)[]>([]),[compras,setCompras]=useState<(CompraHotel&V)[]>([]),[gastos,setGastos]=useState<(GastoHotel&V)[]>([]),[activos,setActivos]=useState<(Activo&V)[]>([]),[unavailable,setUnavailable]=useState(false),[error,setError]=useState(''),[busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[reload,setReload]=useState(0);const lock=useRef(false),attempts=useRef(new Map<string,string>());
 useEffect(()=>{if(!['inventario','finanzas'].includes(seccion))return;const c=new AbortController();setLoading(true);setError('');setUnavailable(false);Promise.all([operacion<(Insumo&V)[]>('gestion/insumos','GET',undefined,c.signal),operacion<(MovimientoInsumo&V)[]>('gestion/movimientos','GET',undefined,c.signal),operacion<(CompraHotel&V)[]>('gestion/compras','GET',undefined,c.signal),operacion<(GastoHotel&V)[]>('gestion/gastos','GET',undefined,c.signal),operacion<(Activo&V)[]>('gestion/activos','GET',undefined,c.signal)]).then(([i,m,c,g,a])=>{setInsumos(i);setMovimientos(m);setCompras(c);setGastos(g);setActivos(a);}).catch(e=>{if(!c.signal.aborted){setUnavailable(isAdminDemoUnavailable(e));setError(isAdminDemoUnavailable(e)?ADMIN_DEMO_UNAVAILABLE:e.message);}}).finally(()=>{if(!c.signal.aborted)setLoading(false);});return()=>c.abort();},[seccion,reload]);
 async function save(tipo:string,datos:object){if(lock.current||unavailable)return false;lock.current=true;setBusy(true);setError('');const key=tipo+JSON.stringify(datos);const id=attempts.current.get(key)??crypto.randomUUID();attempts.current.set(key,id);try{await operacion(`gestion/${tipo}`,'POST',{id,version:0,datos});attempts.current.delete(key);setReload(n=>n+1);return true;}catch(e){setError(e instanceof Error?e.message:'No se pudo guardar.');return false;}finally{lock.current=false;setBusy(false);}}
 const financeAssets:ActivoHotel[]=activos.map(a=>({id:a.id,codigo:a.codigo??'',nombre:a.nombre,categoria:a.categoria,ubicacion:a.ubicacion,fechaCompra:a.instaladoEn,costo:a.costo??0,estado:a.estado==='en-reparacion'?'en reparación':a.estado==='fuera-servicio'?'fuera de servicio':'operativo',vinculadoMantenimiento:true}));
 if(unavailable&&['inventario','finanzas'].includes(seccion))return <section className="flex-1 overflow-auto bg-[#F8F6F0] p-4 sm:p-6 text-[#18345C]"><h1 className="text-[32px] font-semibold">{seccion==='inventario'?'Inventario y compras':'Finanzas'}</h1><p role="status" className="mt-4 rounded-md border bg-white p-3">{ADMIN_DEMO_UNAVAILABLE}</p></section>;
 if(seccion==='amenidades')return <AmenidadesAdmin/>;
 if(seccion==='panel')return <AdminRoomsManagement/>;
 if(seccion==='reportes')return <ReportesConectados/>;
 if(seccion==='personal')return <LaboralAdmin initial={personalInitial}/>;
 if(seccion==='tarifas')return <CatalogosAdmin initial="tipos"/>;
 if(!['inventario','finanzas'].includes(seccion))return <ConsultaAdmin seccion={seccion}/>;
 return <FormOperationProvider value={{error,busy}}><div className="min-w-0 w-full flex min-h-0 flex-1 flex-col">{error&&<p role="alert" className="bg-red-50 p-3 text-red-800">{error}</p>}{busy&&<p role="status" className="p-3">Guardando…</p>}{loading?<p role="status" className="p-4">Consultando datos del hotel…</p>:<div className={`min-w-0 w-full flex min-h-0 flex-1 flex-col ${busy?'pointer-events-none opacity-70':''}`}>{seccion==='inventario'?<ComprasInventario insumos={insumos} movimientos={movimientos} compras={compras} onAgregarInsumo={i=>save('insumos',i)} onRegistrarMovimiento={(insumoId,tipo,cantidad,motivo)=>save('movimientos',{insumoId,tipo,cantidad,motivo})} onRegistrarCompra={c=>save('compras',c)}/>:<FinanzasActivos nominaConectada={<LaboralAdmin initial="nomina"/>} pagosConectados={<ConsultaAdmin seccion="finanzas"/>} reportesConectados={<ReportesConectados/>} soloOperaciones empleados={[]} reservas={[]} compras={compras} gastos={gastos} activos={financeAssets} onAgregarGasto={g=>save('gastos',g)} onAgregarActivo={a=>save('activos',{...a,estado:a.estado==='en reparación'?'en-reparacion':a.estado==='fuera de servicio'?'fuera-servicio':'operativo',instaladoEn:a.fechaCompra,marcaModelo:''})}/>}</div>}</div></FormOperationProvider>;
}
