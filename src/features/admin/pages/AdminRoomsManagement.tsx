'use client';
import { useState } from 'react';
import ApprovedRoomMapConnected from './ApprovedRoomMapConnected';
import CatalogosAdmin from './CatalogosAdmin';

export default function AdminRoomsManagement() {
  const [view, setView] = useState('habitaciones');
  const [busy, setBusy] = useState(false);
  return <div className="flex min-h-0 min-w-0 flex-1 flex-col text-[#18345C]">
    <nav aria-label="Gestión de habitaciones" className="flex shrink-0 gap-2 overflow-x-auto border-b border-[#E5E0D8] bg-white p-3">
      {Object.entries({ habitaciones: 'Habitaciones físicas', tipos: 'Categorías de habitación', mapa: 'Mapa de habitaciones' }).map(([key, label]) =>
        <button key={key} type="button" disabled={busy} aria-current={view === key ? 'page' : undefined} onClick={() => setView(key)}
          className={`whitespace-nowrap rounded-md border px-3 py-2 ${view === key ? 'border-[#18345C] bg-[#18345C] text-white' : 'border-[#E5E0D8] bg-white'}`}>{label}</button>)}
    </nav>
    {view === 'mapa' ? <ApprovedRoomMapConnected /> : <CatalogosAdmin key={view} initial={view} resources={[view]} roomManagement onBusyChange={setBusy} />}
  </div>;
}
