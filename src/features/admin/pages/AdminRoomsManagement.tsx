'use client';
import { useState } from 'react';
import ApprovedRoomMapConnected from './ApprovedRoomMapConnected';
import CatalogosAdmin from './CatalogosAdmin';

export default function AdminRoomsManagement() {
  const [view, setView] = useState('habitaciones');
  const [editRoom,setEditRoom]=useState<number>();
  const [busy, setBusy] = useState(false);
  return <div className="flex min-h-0 min-w-0 flex-1 flex-col text-[#18345C]">
    <nav aria-label="Gestión de habitaciones" role="tablist" className="flex shrink-0 gap-6 overflow-x-auto border-b border-[#DCE2E7] bg-white px-6">
      {Object.entries({ habitaciones: 'Habitaciones físicas', tipos: 'Categorías de habitación', mapa: 'Mapa de habitaciones' }).map(([key, label]) =>
        <button key={key} type="button" disabled={busy} aria-current={view === key ? 'page' : undefined} onClick={() => setView(key)}
          role="tab" aria-selected={view === key} className={`whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium transition-colors ${view === key ? 'border-[#C7A957] text-[#102747]' : 'border-transparent text-[#536579] hover:text-[#102747]'}`}>{label}</button>)}
    </nav>
    {view === 'mapa' ? <ApprovedRoomMapConnected onEdit={id=>{setEditRoom(Number(id));setView('habitaciones');}} /> : <CatalogosAdmin initialEditId={view==='habitaciones'?editRoom:undefined} onInitialEditHandled={()=>setEditRoom(undefined)} key={view} initial={view} resources={[view]} roomManagement onBusyChange={setBusy} />}
  </div>;
}
