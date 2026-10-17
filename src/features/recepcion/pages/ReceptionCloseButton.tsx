import type { ButtonHTMLAttributes } from 'react';
import { X } from 'lucide-react';

export default function ReceptionCloseButton({ className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} type="button" aria-label="Cerrar" className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-[#18345C] hover:bg-[#F8F6F0] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#18345C] ${className}`}>
    <X size={20} aria-hidden="true" />
  </button>;
}
