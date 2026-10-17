'use client';
import { passportCountries } from '@/lib/guestValidation';
import { usePublicLanguage } from './PublicLanguageToggle';
export default function PassportIssuerSelect({ value, onChange, className }: { value: string; onChange: (value: string) => void; className?: string }) {
  const { en } = usePublicLanguage(), names = new Intl.DisplayNames([en ? 'en' : 'es'], { type: 'region' });
  return <select required aria-label={en ? 'Passport issuing country' : 'País emisor del pasaporte'} value={value} onChange={e => onChange(e.target.value)} className={className}>
    <option value="">{en ? 'Select country' : 'Selecciona el país'}</option>
    {passportCountries.map(code => <option key={code} value={code}>{names.of(code)}</option>)}
  </select>;
}
