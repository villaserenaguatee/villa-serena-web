'use client';
import { useId, useRef } from 'react';
import { Camera, Plus, ImagePlus, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { usePublicLanguage } from './PublicLanguageToggle';

/** Presentation only: callers retain file validation, permissions and storage. */
export default function PhotoPicker({ label, accept, preview, disabled = false, compact = false, removable = Boolean(preview), actionStyle = 'links', onSelect, onRemove }: {
  label: string; accept: string; preview?: string | null; disabled?: boolean; compact?: boolean;
  removable?: boolean; actionStyle?: 'links' | 'buttons' | 'icons'; onSelect: (file: File) => void; onRemove?: () => void;
}) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const { en } = usePublicLanguage();
  const actionClass = actionStyle === 'icons' ? 'grid h-10 w-10 place-items-center rounded-md border border-[#D8DFE5] bg-white text-[#18345C] shadow-sm hover:bg-[#F8F6F0] focus-visible:ring-2 focus-visible:ring-[#18345C] disabled:opacity-50' : actionStyle === 'buttons'
    ? 'inline-flex min-h-10 items-center gap-2 rounded-md border border-[#E5E0D8] bg-white px-3 py-2 text-sm font-medium text-[#18345C] transition-colors hover:bg-[#F8F6F0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#18345C] focus-visible:ring-offset-2 disabled:opacity-50'
    : 'underline underline-offset-2 disabled:opacity-50';
  return <div data-photo-picker className={`${compact ? 'shrink-0' : 'w-full min-w-0'} ${actionStyle === 'icons' ? 'relative' : ''}`}>
    <label htmlFor={id} className={`relative flex items-center justify-center overflow-hidden rounded-lg border border-[#AEBCC1] bg-[#F2F4F5] text-[#18345C] focus-within:ring-2 focus-within:ring-[#18345C] focus-within:ring-offset-2 ${compact ? 'h-11 w-11' : 'h-28 w-full'} ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:border-[#18345C]'}`}>
      <input ref={input} id={id} aria-label={label} type="file" accept={accept} disabled={disabled} className="sr-only" onChange={event => {
        const file = event.currentTarget.files?.[0];
        event.currentTarget.value = '';
        if (file) onSelect(file);
      }} />
      {preview ? <Image unoptimized loading="eager" width={480} height={224} src={preview} alt={en ? 'Selected photograph' : 'Fotografía seleccionada'} className="h-full w-full object-contain" /> : <span aria-hidden="true" className="relative inline-flex">
        <Camera size={compact ? 21 : 30} strokeWidth={1.6} />
        <span className="absolute -bottom-1 -right-2 grid h-4 w-4 place-items-center rounded-full bg-[#F3D98B] text-[#18345C]"><Plus size={12} strokeWidth={2.5} /></span>
      </span>}
    </label>
    {removable && onRemove && <div className={actionStyle === "icons" ? "absolute bottom-2 right-2 flex gap-2" : "mt-1.5 flex flex-wrap gap-3 text-sm text-[#18345C]"}>
      {preview && <button type="button" disabled={disabled} onClick={() => input.current?.click()} aria-label={actionStyle === 'icons' ? (en ? 'Replace photo' : 'Reemplazar imagen') : undefined} className={actionClass}>{actionStyle === 'icons' ? <ImagePlus size={19} aria-hidden="true"/> : <>{actionStyle === 'buttons' && <ImagePlus size={16} aria-hidden="true"/>}{en ? 'Replace photo' : 'Reemplazar imagen'}</>}</button>}
      <button type="button" disabled={disabled} onClick={onRemove} aria-label={actionStyle === 'icons' ? (en ? 'Remove photo' : 'Quitar imagen') : undefined} className={actionClass}>{actionStyle === 'icons' ? <Trash2 size={19} aria-hidden="true"/> : <>{actionStyle === 'buttons' && <Trash2 size={16} aria-hidden="true"/>}{en ? 'Remove photo' : 'Quitar imagen'}</>}</button>
    </div>}
  </div>;
}
