'use client';
import {useState} from 'react';
import {usePublicLanguage} from '@/components/common/PublicLanguageToggle';
import CatalogosAdmin from './CatalogosAdmin';
import TemporadasAdmin from './TemporadasAdmin';
import RoomCatalogContent from './RoomCatalogContent';
export default function TarifasAdmin(){
 const [tab,setTab]=useState('base');const {en}=usePublicLanguage();
 const navigation=<nav aria-label={en?'Rates and offers':'Tarifas y ofertas'} role="tablist" className="flex shrink-0 gap-6 overflow-x-auto border-b border-[#DCE2E7] mb-5">{[['base',en?'Base rates':'Tarifas base'],['temporadas',en?'Seasons':'Temporadas'],['ofertas',en?'Offers':'Ofertas']].map(([id,label])=><button key={id} onClick={()=>setTab(id)} role="tab" aria-selected={tab===id} className={`whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium transition-colors ${tab===id?'border-[#C7A957] text-[#102747]':'border-transparent text-[#536579] hover:text-[#102747]'}`}>{label}</button>)}</nav>;
 return <div className="flex min-h-0 min-w-0 flex-1 flex-col">{tab!=='base'&&navigation}{tab==='base'?<CatalogosAdmin initial="tipos" resources={['tipos']} navigation={navigation} roomManagement/>:tab==='temporadas'?<TemporadasAdmin/>:<main className="flex-1 overflow-auto bg-[#F8F6F0] p-4 sm:p-6"><h1 className="text-[32px] font-semibold text-[#18345C]">{en?'Offers':'Ofertas'}</h1><RoomCatalogContent/></main>}</div>;
}
