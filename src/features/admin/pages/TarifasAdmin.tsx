'use client';
import {useState} from 'react';
import CatalogosAdmin from './CatalogosAdmin';
import TemporadasAdmin from './TemporadasAdmin';
import OfertasAdmin from './OfertasAdmin';
export default function TarifasAdmin(){
 const [tab,setTab]=useState('base');
 const navigation=<nav aria-label="Tarifas y ofertas" role="tablist" className="mb-5 grid shrink-0 grid-cols-3 border-b border-[#DCE2E7] sm:flex sm:gap-6">{[['base','Tarifas base'],['temporadas','Temporadas'],['ofertas','Ofertas']].map(([id,label])=><button key={id} onClick={()=>setTab(id)} role="tab" aria-selected={tab===id} className={`min-w-0 border-b-2 px-1 py-3 text-sm font-medium transition-colors ${tab===id?'border-[#C7A957] text-[#102747]':'border-transparent text-[#536579] hover:text-[#102747]'}`}>{label}</button>)}</nav>;
 return <div className="flex min-h-0 min-w-0 flex-1 flex-col">{tab==='base'?<CatalogosAdmin initial="tipos" resources={['tipos']} title="Tarifas base" navigation={navigation} roomManagement/>:tab==='temporadas'?<TemporadasAdmin navigation={navigation}/>:<OfertasAdmin navigation={navigation}/>}</div>;
}
