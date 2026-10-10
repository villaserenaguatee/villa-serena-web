import { statusBadge } from './statusStyle';

export default function ReservationTags({ state, label, room, category, origin }: {
  state: string; label: string; room?: string | null; category: string; origin?: string;
}) {
  return <div className="flex flex-wrap items-center gap-1.5">
    <span className={statusBadge(state)}>{label}</span>
    <span className="inline-flex rounded-md border border-[#C8D3DF] bg-[#EFF3F7] px-2 py-0.5 text-xs font-semibold text-[#435A70]">{room ? `Hab. ${room}` : 'Sin asignar'}</span>
    <span className="inline-flex rounded-md border border-[#E6DCC7] bg-[#F8F4EB] px-2 py-0.5 text-xs font-semibold text-[#6C5938]">{category}</span>
    {origin && <span className="inline-flex rounded-md border border-[#CED6E8] bg-[#F0F3FA] px-2 py-0.5 text-xs font-semibold text-[#405679]">{origin}</span>}
  </div>;
}
