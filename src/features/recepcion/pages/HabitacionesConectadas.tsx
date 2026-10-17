'use client';
import Link from 'next/link';
import HabitacionesRecepcion from './HabitacionesRecepcion';
export default function HabitacionesConectadas() {
  return <main className="min-h-screen"><Link href="/panel" className="block bg-[#18345C] text-white p-3">Mi panel</Link><HabitacionesRecepcion conectado habitaciones={[]} reservas={[]} huespedes={[]} onCambiarEstado={() => {}} onVerReserva={() => {}} /></main>;
}
