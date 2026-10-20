import type {ReactNode} from 'react';
export default function CompactFilter<T extends string>({label,value,onChange,children}:{label:string;value:T;onChange:(value:T)=>void;children:ReactNode}) {
 return <label className="flex min-w-0 flex-col gap-1 text-sm font-medium text-[#18345C]">{label}<select aria-label={label} value={value} onChange={event=>onChange(event.target.value as T)} className="min-h-10 w-full min-w-0 rounded-lg border border-[#DCD7CD] bg-white px-3 py-2 text-sm">{children}</select></label>;
}
