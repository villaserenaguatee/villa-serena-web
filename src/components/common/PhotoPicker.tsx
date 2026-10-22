'use client';
import { useId, useRef } from 'react';
import { Camera, Plus } from 'lucide-react';
import Image from 'next/image';
import { usePublicLanguage } from './PublicLanguageToggle';

/** Presentation only: callers retain file validation, permissions and storage. */
export default function PhotoPicker({ label, accept, preview, disabled = false, compact = false, removable = Boolean(preview), onSelect, onRemove }: {
  label: string; accept: string; preview?: string | null; disabled?: boolean; compact?: boolean;
  removable?: boolean; onSelect: (file: File) => void; onRemove?: () => void;
}) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const { en } = usePublicLanguage();
  return <div data-photo-picker className={compact ? 'shrink-0' : 'w-full min-w-0'}>
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
    {removable && onRemove && <div className="mt-1.5 flex flex-wrap gap-3 text-sm text-[#18345C]">
      {preview && <button type="button" disabled={disabled} onClick={() => input.current?.click()} className="underline underline-offset-2 disabled:opacity-50">{en ? 'Replace photo' : 'Reemplazar imagen'}</button>}
      <button type="button" disabled={disabled} onClick={onRemove} className="underline underline-offset-2 disabled:opacity-50">{en ? 'Remove photo' : 'Quitar imagen'}</button>
    </div>}
  </div>;
}
