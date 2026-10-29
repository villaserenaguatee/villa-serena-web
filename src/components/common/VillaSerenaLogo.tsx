'use client';
import {useEditorialPhotos} from '@/features/public/EditorialContent';
import Image from 'next/image';
import Link from 'next/link';
import logo from '../../../public/villa-serena-logo.png';
type Props = {
  href?: string;
  light?: boolean;
  compact?: boolean;
  className?: string;
};
export default function VillaSerenaLogo({ href = '/', light = false, compact = false, className = '' }: Props) {
  const photos=useEditorialPhotos('identidad.logo.imagen',[]);
  const content = <span data-editorial-id="identidad.logo.imagen" className={`villa-logo-img-wrap ${light ? 'villa-logo-light' : ''} ${compact ? 'villa-logo-compact' : ''} ${className}`}>
    {photos[0]?<img src={photos[0]} alt="Villa Serena Hotel" width={230} height={150} className="villa-logo-image"/>:<Image src={logo} alt="Villa Serena Hotel" width={230} height={150} priority className="villa-logo-image" />}
  </span>;
  return href ? <Link href={href} className="villa-logo-link" aria-label="Villa Serena Hotel">
    {content}
  </Link> : content;
}
