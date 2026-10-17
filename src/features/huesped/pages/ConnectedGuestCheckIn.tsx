'use client';
import CheckInWebScreen from './CheckInWeb';
import EstanciaDocumentos from '@/components/common/EstanciaDocumentos';
import type {Reserva,Huesped,HabitacionHotel} from '@/lib/pms/types';
export default function ConnectedGuestCheckIn({reserva,huesped,habitacion,blockedReason}:{reserva:Reserva;huesped:Huesped;habitacion?:HabitacionHotel;blockedReason:string}){return <CheckInWebScreen huesped={huesped} reserva={reserva} habitacion={habitacion} checkin={{estado:'disponible',documento:null,terminosAceptados:false,peticiones:[],notaPeticiones:''}} estanciaCerrada={reserva.estado==='finalizada'||reserva.estado==='cancelada'} onCompletar={()=>{}} onGuardarOcupantes={()=>{}} onIrHabitacion={()=>window.location.assign('/portal?codigo='+reserva.codigo+'&seccion=habitacion')} onContactarRecepcion={()=>window.location.assign('/portal?codigo='+reserva.codigo+'&seccion=chat')} connectedDocuments={<EstanciaDocumentos code={reserva.codigo} blockedReason={blockedReason} portal/>}/>;}
