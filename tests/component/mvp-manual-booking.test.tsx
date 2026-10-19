import {render, screen, fireEvent} from '@testing-library/react';
import {expect, test, vi} from 'vitest';
import Datos from '@/app/(public)/reservar/datos/page';
import ScopedI18nProvider from '@/i18n/ScopedI18nProvider';
import TranslatedChatText from '@/components/common/TranslatedChatText';
import PublicLanguageToggle from '@/components/common/PublicLanguageToggle';

// Isolated presentation fixtures, not evidence of API connectivity or real availability.
vi.mock('next/navigation', () => ({useRouter: () => ({push: vi.fn(),replace: vi.fn(),back: vi.fn()}), useSearchParams: () => new URLSearchParams('slug=fixture-room&llegada=2027-11-16&salida=2027-11-18&adultos=2&ninos=0')}));
vi.mock('@/lib/usePublicCatalog', () => ({
  usePublicCatalog: () => ({rooms:[{slug:'fixture-room',name:'Habitación de componente',type:'Estándar',capacity:2,price:420,image:'/logo.png',apiTypeId:1}],connected:true,loading:false,error:''}),
  usePublicQuotes: () => ({quotes:[{ofertaSlug:'fixture-room',total:840}],loading:false,error:''}),
}));
vi.mock('@/lib/publicAvailability', () => ({usePublicAvailability: () => undefined,availableRoom: () => undefined,validGuests: () => true}));

test('manual form keeps names and email, constrains typed/pasted DPI, and has no social/passport controls', () => {
  render(<ScopedI18nProvider><Datos /></ScopedI18nProvider>);
  expect(screen.getByLabelText('Nombre')).toBeRequired();
  expect(screen.getByLabelText('Apellidos')).toBeRequired();
  expect(screen.getByLabelText('Correo electrónico')).toHaveAttribute('type','email');
  const document = screen.getByRole('textbox',{name:'Número de documento'});
  fireEvent.change(document,{target:{value:'001234567890123ABC'}});
  expect(document).toHaveValue('0012345678901');
  expect(document).toHaveAttribute('maxlength','13');
  expect(document).toHaveAttribute('pattern','[0-9]{13}');
  expect(screen.queryByRole('button',{name:/Google|Facebook/i})).not.toBeInTheDocument();
  expect(screen.queryByRole('option',{name:/Pasaporte/i})).not.toBeInTheDocument();
  expect(screen.queryByText('País emisor del pasaporte')).not.toBeInTheDocument();
  expect(screen.queryByLabelText('Nacionalidad')).not.toBeInTheDocument();
});

test('previous EN preference does not enable translations; chat shows original without provider calls', () => {
  localStorage.setItem('villa-serena-lang','EN');
  const fetch = vi.spyOn(globalThis,'fetch');
  render(<ScopedI18nProvider><PublicLanguageToggle /><TranslatedChatText text="Good morning" received /></ScopedI18nProvider>);
  expect(screen.getByText('Good morning')).toBeInTheDocument();
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
  expect(fetch).not.toHaveBeenCalled();
});
