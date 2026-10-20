'use client';
import type {ReactNode} from 'react';
import {Cabecera} from './huespedUtils';
import {FOTO_HERO_GENERAL} from './ServiciosHuesped';
/** Approved presentation only: no operational stores or synthetic data. */
export function GuestPage({title,subtitle,children,actions}:{title:string;subtitle:string;children:ReactNode;actions?:ReactNode}){
 return <main data-guest-approved className="min-w-0 flex-1 overflow-y-auto bg-[#F8F6F0] text-[#18345C]" style={{fontFamily:'"Afacad", "Segoe UI", Arial, sans-serif'}}><Cabecera titulo={title} subtitulo={subtitle}>{actions}</Cabecera><div className="mx-auto max-w-6xl space-y-4 px-4 py-4 sm:px-6 sm:py-5">{children}</div></main>;
}
export function GuestHero({eyebrow,title,description,photo=FOTO_HERO_GENERAL}:{eyebrow:string;title:string;description:string;photo?:string}){
 return <section className="relative overflow-hidden rounded-xl border border-[#E5E0D8] bg-[#18345C] shadow-sm"><img src={photo} alt="Villa Serena" className="absolute inset-0 h-full w-full object-cover"/><div className="absolute inset-0 bg-gradient-to-r from-[#102747]/95 via-[#102747]/65 to-[#102747]/15"/><div className="relative z-10 flex min-h-[170px] flex-col justify-center px-5 py-6 text-white sm:min-h-[190px] sm:p-7"><p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#F1D57A]">{eyebrow}</p><h2 className="mt-2 max-w-2xl text-2xl font-semibold sm:text-3xl">{title}</h2><p className="mt-2 max-w-xl text-sm leading-relaxed text-white/90 sm:text-base">{description}</p></div></section>;
}
export const guestInput='mt-1 block min-h-[44px] w-full min-w-0 rounded-md border border-[#D9E0E5] bg-white px-3 py-2 text-[15px] text-[#18345C] focus:border-[#B59A52] focus:outline-none focus:ring-2 focus:ring-[#B59A52]/20';
export const guestButton='inline-flex min-h-[44px] items-center justify-center gap-2 rounded-md bg-[#18345C] px-4 py-2.5 text-[15px] font-semibold text-white transition-colors hover:bg-[#102747] disabled:cursor-not-allowed disabled:opacity-45';
