import {render, screen, fireEvent} from '@testing-library/react';
import {expect, test, vi} from 'vitest';
import userEvent from '@testing-library/user-event';
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

test('optional arrival stays local HH:mm when reviewing and returning to edit', async () => {
  const user=userEvent.setup();
  render(<ScopedI18nProvider><Datos /></ScopedI18nProvider>);
  fireEvent.change(screen.getByLabelText('Nombre'),{target:{value:'Ana'}});
  fireEvent.change(screen.getByLabelText('Apellidos'),{target:{value:'Pérez'}});
  fireEvent.change(screen.getByRole('textbox',{name:'Número de documento'}),{target:{value:'0012345678901'}});
  fireEvent.change(screen.getByRole('textbox',{name:'Teléfono'}),{target:{value:'55551234'}});
  fireEvent.change(screen.getByLabelText('Correo electrónico'),{target:{value:'ana@example.invalid'}});
  fireEvent.change(screen.getByLabelText('Hora estimada de llegada (opcional)'),{target:{value:'18:30'}});
  await user.click(screen.getByRole('button',{name:/Revisar datos/i}));
  expect(screen.getByText('18:30')).toBeVisible();
  await user.click(screen.getByRole('button',{name:'Editar'}));
  expect(screen.getByLabelText('Hora estimada de llegada (opcional)')).toHaveValue('18:30');
});

test('review shows all required errors, focuses the first and keeps incomplete values', async () => {
  const user = userEvent.setup();
  render(<ScopedI18nProvider><Datos /></ScopedI18nProvider>);
  expect(screen.queryByText('Complete este campo')).not.toBeInTheDocument();
  const form = screen.getByRole('button',{name:/Revisar datos/i}).closest('form')!;
  fireEvent.change(form.querySelector('input[name="hora"]')!,{target:{value:''}});
  await user.click(screen.getByRole('button',{name:/Revisar datos/i}));
  expect(screen.getAllByText('Complete este campo')).toHaveLength(5);
  expect(screen.getByLabelText('Hora estimada de llegada (opcional)')).not.toBeRequired();
  expect(screen.getByLabelText('Hora estimada de llegada (opcional)')).toHaveValue('');
  expect(screen.getByLabelText('Nombre')).toHaveFocus();
  fireEvent.change(screen.getByLabelText('Nombre'),{target:{value:'Ana'}});
  fireEvent.change(screen.getByLabelText('Apellidos'),{target:{value:'Pérez'}});
  const dpi = form.querySelector('input[name="documento"]')!;
  const email = form.querySelector('input[name="correo"]')!;
  const phone = form.querySelector('input[name="tel"]')!;
  fireEvent.change(dpi,{target:{value:'0012'}});
  fireEvent.change(email,{target:{value:'correo@'}});
  fireEvent.change(phone,{target:{value:'0123'}});
  fireEvent.submit(form);
  expect(dpi).toHaveFocus();
  expect(screen.getByText('Ingrese los 13 dígitos del DPI')).toBeInTheDocument();
  expect(screen.getByText('Ingrese los 8 dígitos del teléfono')).toBeInTheDocument();
  expect(screen.getByText('Ingrese un correo electrónico válido')).toBeInTheDocument();
  expect(dpi).toHaveValue('0012');expect(email).toHaveValue('correo@');expect(phone).toHaveValue('0123');
  fireEvent.change(dpi,{target:{value:'0012345678901'}});
  fireEvent.submit(form);expect(email).toHaveFocus();
  fireEvent.change(email,{target:{value:'manual@example.test'}});
  fireEvent.submit(form);expect(phone).toHaveFocus();
});

test('email format blocks incomplete addresses before review without restricting providers', async () => {
  const user=userEvent.setup();
  render(<ScopedI18nProvider><Datos /></ScopedI18nProvider>);
  fireEvent.change(screen.getByLabelText('Nombre'),{target:{value:'Ana'}});
  fireEvent.change(screen.getByLabelText('Apellidos'),{target:{value:'Pérez'}});
  fireEvent.change(screen.getByRole('textbox',{name:'Número de documento'}),{target:{value:'0012345678901'}});
  fireEvent.change(screen.getByRole('textbox',{name:'Teléfono'}),{target:{value:'55551234'}});
  const email=screen.getByLabelText('Correo electrónico');
  for(const value of ['ana','ana@','@hotel.com','ana@hotel','ana@@hotel.com','ana @hotel.com','ana..perez@hotel.com','ana@-hotel.com','ana@hotel..com']) {
    fireEvent.change(email,{target:{value}});
    await user.click(screen.getByRole('button',{name:/Revisar datos/i}));
    expect(screen.getByText('Ingrese un correo electrónico válido')).toBeInTheDocument();
    expect(screen.getByRole('heading',{name:'Introduce tus datos'})).toBeInTheDocument();
    expect(email).toHaveFocus();
  }
  fireEvent.change(email,{target:{value:'ana+reserva@mi-hotel.com.gt'}});
  await user.click(screen.getByRole('button',{name:/Revisar datos/i}));
  expect(await screen.findByRole('heading',{name:'Revisa tus datos'})).toBeInTheDocument();
});

test('previous EN preference does not enable translations; chat shows original without provider calls', () => {
  localStorage.setItem('villa-serena-lang','EN');
  const fetch = vi.spyOn(globalThis,'fetch');
  render(<ScopedI18nProvider><PublicLanguageToggle /><TranslatedChatText text="Good morning" received /></ScopedI18nProvider>);
  expect(screen.getByText('Good morning')).toBeInTheDocument();
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
  expect(fetch).not.toHaveBeenCalled();
});

test('booking phone has fixed +502, accepts exactly eight digits and sanitizes typing and paste', async () => {
  const user = userEvent.setup();
  render(<ScopedI18nProvider><Datos /></ScopedI18nProvider>);
  const phone = screen.getByRole('textbox',{name:'Teléfono'}) as HTMLInputElement;
  expect(screen.getByText('+502')).toBeInTheDocument();
  expect(screen.queryByRole('button',{name:/prefijo|country code/i})).not.toBeInTheDocument();
  expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  await user.type(phone,'abc1234567');
  expect(phone).toHaveValue('1234567');
  expect(phone.checkValidity()).toBe(false);
  await user.type(phone,'89abc');
  expect(phone).toHaveValue('12345678');
  expect(phone.checkValidity()).toBe(true);
  await user.clear(phone);
  await user.paste('ab00123456789xyz');
  expect(phone).toHaveValue('00123456');
  expect(phone.checkValidity()).toBe(true);
  expect(phone).toHaveAttribute('maxlength','8');
  expect(phone).toHaveAttribute('pattern','[0-9]{8}');
});

test('name input blocks typed/pasted digits, preserves valid characters and reports blank fields before review', async () => {
  const user = userEvent.setup();
  render(<ScopedI18nProvider><Datos /></ScopedI18nProvider>);
  const name=screen.getByRole('textbox',{name:'Nombre'});
  const surname=screen.getByRole('textbox',{name:'Apellidos'});
  await user.type(name,'Ana123');
  await user.click(surname);await user.paste('O’Neill@');
  expect(name).toHaveValue('Ana');expect(surname).toHaveValue('O’Neill');
  expect(screen.queryByText('Usa solo letras, espacios, guiones y apóstrofos.')).not.toBeInTheDocument();
  fireEvent.change(screen.getByRole('textbox',{name:'Número de documento'}),{target:{value:'0012345678901'}});
  fireEvent.change(screen.getByRole('textbox',{name:'Teléfono'}),{target:{value:'55551234'}});
  fireEvent.change(screen.getByRole('textbox',{name:'Correo electrónico'}),{target:{value:'manual@example.test'}});
  const form=screen.getByRole('button',{name:/Revisar datos/i}).closest('form')!;
  await user.clear(name);await user.type(name,'   ');await user.clear(surname);
  fireEvent.submit(form);
  expect(screen.getByRole('heading',{name:'Introduce tus datos'})).toBeInTheDocument();
  expect(screen.getAllByText('Complete este campo')).toHaveLength(2);
  expect(name).toHaveFocus();
  expect(name).toHaveValue('   ');expect(surname).toHaveValue('');
  await user.clear(name);await user.type(name,'María José12');
  await user.click(surname);await user.paste('D’Ávila-Smith9');
  expect(name).toHaveValue('María José');expect(surname).toHaveValue('D’Ávila-Smith');
  // Editing a selection in the middle keeps the surrounding characters and order.
  (name as HTMLInputElement).focus();(name as HTMLInputElement).setSelectionRange(6,10);
  await user.paste('Ñúñez78');
  expect(name).toHaveValue('María Ñúñez');
  expect(name).toHaveAttribute('aria-invalid','false');expect(surname).toHaveAttribute('aria-invalid','false');
  fireEvent.submit(form);
  expect(await screen.findByRole('heading',{name:'Revisa tus datos'})).toBeInTheDocument();
});
