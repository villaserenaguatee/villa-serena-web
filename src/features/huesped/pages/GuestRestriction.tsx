'use client';
import {LockKeyhole} from 'lucide-react';
export function GuestRestriction({reason}:{reason:string}) {
 return <p role="note" className="my-3 flex items-start gap-2 rounded-lg border border-[#E5E0D8] bg-[#F8F6F0] p-3 text-sm text-[#52677F]"><LockKeyhole size={17} className="mt-0.5 shrink-0"/><span>{reason}</span></p>;
}
export function LockedGuestButton({label,reason,compact=false}:{label:string;reason:string;compact?:boolean}) {
 return <div><button type="button" disabled aria-disabled="true" title={reason} className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-[#18345C] px-4 py-2 text-white opacity-50"><LockKeyhole size={16}/>{label}</button>{!compact&&<GuestRestriction reason={reason}/>}</div>;
}
