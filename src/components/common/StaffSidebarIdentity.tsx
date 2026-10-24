'use client';
import {ArrowUpRight} from 'lucide-react';
import {useAuth} from '@/hooks/useAuth';
import {operationalLabel} from '@/i18n/operationalLabels';
export default function StaffSidebarIdentity(){const {user}=useAuth();const name=user?.staff?.nombre??user?.name??'Personal',initials=name.trim().split(/\s+/).filter(Boolean).map(p=>p[0]).slice(0,2).join('').toUpperCase();return <><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#D8B94E] text-sm font-bold text-[#102747]" aria-hidden="true">{initials}</span><span className="min-w-0 flex-1"><span className="block whitespace-normal break-words text-xs font-semibold leading-tight text-white">{name}</span>{user?.staff&&<span className="block text-[10px] text-[#AEBCC1]">{operationalLabel(user.staff.rol,false)}</span>}<span className="flex items-center gap-1 text-sm leading-5 text-[#D8B94E]">Mi perfil <ArrowUpRight size={12}/></span></span></>;}
