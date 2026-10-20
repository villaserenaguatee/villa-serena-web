export default function Kpi({ valor, label, detalle, destacado }: {
  valor: string;
  label: string;
  detalle?: string;
  destacado?: boolean;
}) {
  return (<div className={`rounded-xl px-4 py-3.5 border ${destacado ? 'bg-[#18345C] border-[#18345C]' : 'bg-white border-[#E5E0D8]'}`}>
    <p className={`text-[24px] font-bold leading-none ${destacado ? 'text-white' : 'text-[#18345C]'}`}>
      {valor}
    </p>
    <p className={`text-[11px] mt-1.5 ${destacado ? 'text-[#AEBCC1]' : 'text-[#6B7280]'}`}>
      {label}
    </p>
    {detalle && <p className={`mt-1 text-[10px] ${destacado ? 'text-white/55' : 'text-[#AEBCC1]'}`}>
      {detalle}
    </p>}
  </div>);
}
