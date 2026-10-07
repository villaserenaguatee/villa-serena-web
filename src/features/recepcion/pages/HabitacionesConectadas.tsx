'use client';
import HabitacionesRecepcion from './HabitacionesRecepcion';
export default function HabitacionesConectadas() {
  return <main className="min-h-screen"><a href="/panel" className="block bg-[#18345C] text-white p-3">Mi panel</a><HabitacionesRecepcion conectado habitaciones={[]} reservas={[]} huespedes={[]} onCambiarEstado={() => {}} onVerReserva={() => {}} /></main>;
}
