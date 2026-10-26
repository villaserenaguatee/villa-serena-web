'use client';
import {Search} from 'lucide-react';
import type {InputHTMLAttributes} from 'react';

export default function AdminSearchInput({className='',...props}:InputHTMLAttributes<HTMLInputElement>){
 return <span data-admin-search className="relative mt-1 block min-w-0 w-full"><Search aria-hidden="true" size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#536579]"/><input {...props} className={`block h-10 w-full min-w-0 rounded-md border border-[#D8DFE5] bg-white py-2 pl-9 pr-3 text-sm text-[#18345C] placeholder:text-[#71839B] focus:border-[#18345C] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#426D98] disabled:cursor-not-allowed disabled:opacity-50 max-sm:min-h-11 ${className}`}/></span>;
}
