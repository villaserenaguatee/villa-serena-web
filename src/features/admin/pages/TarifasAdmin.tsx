'use client';
import {useState} from 'react';
import {usePublicLanguage} from '@/components/common/PublicLanguageToggle';
import CatalogosAdmin from './CatalogosAdmin';
import TemporadasAdmin from './TemporadasAdmin';
import RoomCatalogContent from './RoomCatalogContent';
export default function TarifasAdmin(){
 const [tab,setTab]=useState('base');const {en}=usePublicLanguage();
 return <div className="flex min-h-0 min-w-0 flex-1 flex-col"><nav aria-label={en?'Rates and offers':'Tarifas y ofertas'} className="flex shrink-0 gap-2 overflow-x-auto border-b bg-white p-3">{[['base',en?'Base rates':'Tarifas base'],['temporadas',en?'Seasons':'Temporadas'],['ofertas',en?'Offers':'Ofertas']].map(([id,label])=><button key={id} onClick={()=>setTab(id)} aria-current={tab===id?'page':undefined} className={`whitespace-nowrap rounded-md border px-3 py-2 ${tab===id?'bg-[#18345C] text-white':''}`}>{label}</button>)}</nav>{tab==='base'?<CatalogosAdmin initial="tipos" resources={['tipos']} roomManagement/>:tab==='temporadas'?<TemporadasAdmin/>:<main className="flex-1 overflow-auto bg-[#F8F6F0] p-4 sm:p-6"><h1 className="text-[32px] font-semibold text-[#18345C]">{en?'Offers':'Ofertas'}</h1><RoomCatalogContent/></main>}</div>;
}
