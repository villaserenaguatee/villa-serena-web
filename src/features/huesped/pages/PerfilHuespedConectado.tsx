'use client';
import PerfilHuesped from './PerfilHuesped';
import type {Huesped} from '@/lib/pms/types';
export default function PerfilHuespedConectado({huesped,onClose,onLogout}:{huesped:Huesped;onClose:()=>void;onLogout:()=>void}){return <PerfilHuesped connected={huesped} huespedId={huesped.id} nombre={huesped.nombre} correo={huesped.correo} telefono={huesped.telefono} documento={huesped.documento} onVolver={onClose} onCerrarSesion={onLogout}/>;}
