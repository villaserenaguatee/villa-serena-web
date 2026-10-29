import AdminInfo from './AdminInfo';
import type {ReactNode} from 'react';

export default function AdminMetric({label,value,detail,detailAsInfo=false}:{label:string;value:ReactNode;detail:string;detailAsInfo?:boolean}) {
  return <article className="relative min-w-0 rounded-xl border border-[#E0E3E7] bg-white px-3 py-3 sm:px-5 sm:py-4 before:absolute before:left-0 before:top-5 before:h-6 before:w-[3px] before:rounded-r before:bg-[#C7A957]">
    <h2 className="text-sm font-normal text-[#536579]">{label}{detailAsInfo&&detail&&<AdminInfo label={label}>{detail}</AdminInfo>}</h2>
    <p className="mt-1 text-[24px] sm:text-[28px] font-semibold leading-tight text-[#102747]">{value}</p>
    {!detailAsInfo&&detail&&<p className="mt-2 text-sm text-[#66768A]">{detail}</p>}
  </article>;
}
