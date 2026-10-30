"use client";
import { money } from '@/data/publicRooms';
import { useUiText } from '@/i18n/UiText';
import { usePublicLanguage } from '@/components/common/PublicLanguageToggle';
type Props = { image?: string; name: string; category?: string; arrival: string; departure: string; adults: number; childCount: number; nights: number; nightlyPrice?: number; total: number; note?: string };
export default function BookingSummaryCard(p: Props) {
 const ui=useUiText(),{en}=usePublicLanguage();
 return <aside className="booking-summary-card">
  <h2>{en?'Your booking':ui('Tu reserva')}</h2>
  {p.image&&<img src={p.image} alt={ui(p.name)}/>}
  <h3>{ui(p.name)}</h3>
  {p.category&&p.category.trim().toLocaleLowerCase()!==p.name.trim().toLocaleLowerCase()&&<p>{ui(p.category)}</p>}
  {p.note&&<p role="note">{p.note}</p>}
  <div className="summary-dates">
   {[[en?'Arrival':'Llegada',p.arrival],[en?'Departure':'Salida',p.departure],[en?'Adults':'Adultos',p.adults],[en?'Children':'Niños',p.childCount],[en?'Nights':'Noches',p.nights],[en?'Price per night':'Precio por noche',p.nightlyPrice===undefined?'—':money(p.nightlyPrice)]].map(([label,value])=><span key={label}><small>{label}</small><b>{value}</b></span>)}
  </div>
  <div className="summary-total"><span>Total</span><b>{money(p.total)}</b></div>
 </aside>;
}
