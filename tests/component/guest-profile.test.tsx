import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import PerfilHuesped from '@/features/huesped/pages/PerfilHuesped';
import { leerHuespedes } from '@/store/guestStore';
import { leerTarjetas } from '@/store/paymentStore';
import { payment, reservation } from '../fixtures/reservation';

const guest = {
  id: 'guest-test', nombre: 'Guest Test', telefono: '55555555', correo: 'old@example.com',
  nacionalidad: 'Guatemala', documento: '123', tipoDocumento: 'DPI', creadoEn: '2026-10-01',
  documentoVerificado: true, correoVerificacion: { correo: 'old@example.com', estado: 'verificado' },
};
const history = JSON.stringify([reservation({ estado: 'finalizada', pagos: [payment({ monto: 50 })] })]);
beforeEach(() => {
  localStorage.setItem('vs-huespedes', JSON.stringify([guest]));
  localStorage.setItem('vs-reservas', history);
});

describe.each(['ES', 'EN'] as const)('perfil del huésped %s', lang => {
  const en = lang === 'EN';
  const tr = (es: string, english: string) => en ? english : es;
  function mount() {
    localStorage.setItem('villa-serena-lang', lang);
    const onVolver = vi.fn(), onTelefono = vi.fn();
    const view = render(<PerfilHuesped huespedId={guest.id} nombre={guest.nombre}
      telefono={guest.telefono} correo={guest.correo} onVolver={onVolver} onTelefono={onTelefono} />);
    return { ...view, onVolver, onTelefono, user: userEvent.setup() };
  }
  async function open(user: ReturnType<typeof userEvent.setup>, es: string, english: string) {
    await user.click(screen.getByRole('button', { name: new RegExp(`^${tr(es, english)}`) }));
    return screen.getByRole('dialog');
  }
  async function close(user: ReturnType<typeof userEvent.setup>) {
    await user.click(within(screen.getByRole('dialog')).getAllByRole('button', { name: tr('Cerrar', 'Close') })[0]);
  }
  function unchangedHistory() {
    expect(localStorage.getItem('vs-reservas')).toBe(history);
  }
  function noSecrets(...values: string[]) {
    const stored = Object.values({ ...localStorage }).join('\n');
    for (const value of values) expect(stored).not.toContain(value);
    unchangedHistory();
  }

  test('identidad y correo son de solo lectura; solo cambia el teléfono y persiste al remontar', async () => {
    const view = mount();
    const personal = await open(view.user, 'Información personal', 'Personal information');
    const fields = within(personal).getAllByRole('textbox');
    expect(fields).toHaveLength(4);
    for (const input of fields) expect(input).toHaveAttribute('readonly');
    expect(within(personal).getByLabelText(tr('Nombre completo', 'Full name'))).toHaveValue(guest.nombre);
    expect(personal.querySelector('select, button[type="submit"]')).toBeNull();
    expect(leerHuespedes()).toEqual([guest]);
    await close(view.user);
    await open(view.user, 'Datos de contacto', 'Contact details');
    expect(screen.getByLabelText(tr('Correo electrónico', 'Email'))).toHaveAttribute('readonly');
    const phone = screen.getByLabelText(tr('Teléfono', 'Phone'));
    await view.user.clear(phone); await view.user.type(phone, 'bad');
    await view.user.click(screen.getByRole('button', { name: tr('Guardar cambios', 'Save changes') }));
    expect(screen.getByRole('alert')).toBeVisible(); expect(leerHuespedes()).toEqual([guest]);
    await view.user.clear(phone); await view.user.type(phone, '+502 1234 5678');
    await view.user.click(screen.getByRole('button', { name: tr('Guardar cambios', 'Save changes') }));
    expect(screen.getByRole('status')).toBeVisible();
    expect(leerHuespedes()).toEqual([{ ...guest, telefono: '+502 1234 5678' }]);
    expect(view.onTelefono).toHaveBeenCalledExactlyOnceWith('+502 1234 5678');
    view.unmount();
    const reload = mount(); await open(reload.user, 'Datos de contacto', 'Contact details');
    expect(screen.getByLabelText(tr('Teléfono', 'Phone'))).toHaveValue('+502 1234 5678');
    unchangedHistory();
  });

  test('privacidad informa derechos y enlaces sin formulario ni escritura', async () => {
    const { user } = mount(); const before = { ...localStorage };
    const dialog = await open(user, 'Privacidad', 'Privacy');
    expect(within(dialog).getByRole('heading', { name: tr('Política de privacidad', 'Privacy policy') })).toBeVisible();
    expect(dialog).toHaveTextContent(tr('Derechos del huésped', 'Guest rights'));
    expect(within(dialog).getByRole('link', { name: /privacidad|privacy/i })).toHaveAttribute('href', '/privacidad');
    expect(within(dialog).getByRole('link', { name: 'villaserenagt@gmail.com' })).toHaveAttribute('href', 'mailto:villaserenagt@gmail.com');
    expect(dialog.querySelector('input, select, button[type="submit"]')).toBeNull();
    expect({ ...localStorage }).toEqual(before);
  });

  test('contraseña valida vacío y confirmación, limpia secretos y no afirma haberla cambiado', async () => {
    const { user } = mount(); await open(user, 'Seguridad', 'Security');
    const submit = screen.getByRole('button', { name: tr('Confirmar', 'Confirm') });
    await user.click(submit); expect(screen.getByRole('alert')).toBeVisible();
    const actual = screen.getByLabelText(tr('Contraseña actual', 'Current password'));
    const next = screen.getByLabelText(tr('Nueva contraseña', 'New password'));
    const confirm = screen.getByLabelText(tr('Confirmar contraseña', 'Confirm password'));
    await user.type(actual, 'CurrentSecret123'); await user.type(next, 'NewSecret123');
    await user.type(confirm, 'Mismatch123'); await user.click(submit);
    expect(screen.getByRole('alert')).toBeVisible();
    await user.clear(confirm); await user.type(confirm, 'NewSecret123'); await user.click(submit);
    expect(screen.getByRole('status')).toHaveTextContent(tr('Tu contraseña no ha cambiado', 'Your password has not changed'));
    for (const input of [actual, next, confirm]) expect(input).toHaveValue('');
    expect(leerHuespedes()).toEqual([guest]); noSecrets('CurrentSecret123', 'NewSecret123', 'Mismatch123');
  });

  test('tarjeta inválida no guarda; válida solo guarda metadatos, limpia PAN/CVV y permite recarga/eliminación', async () => {
    // A random UUID could contain the test CVV and falsely look like a secret leak.
    vi.spyOn(crypto, 'randomUUID').mockReturnValue('00000000-0000-4000-8000-000000000001');
    const view = mount(); await open(view.user, 'Métodos de pago', 'Payment methods');
    const number = screen.getByLabelText(tr('Número de tarjeta', 'Card number'));
    const cvv = screen.getByLabelText('CVV/CVC');
    await view.user.clear(screen.getByLabelText(tr('Nombre del titular', 'Cardholder name')));
    await view.user.type(screen.getByLabelText(tr('Nombre del titular', 'Cardholder name')), 'Updated Guest');
    await view.user.type(number, '12'); await view.user.type(cvv, '987');
    await view.user.type(screen.getByLabelText(tr('Vencimiento MM/AA', 'Expiry MM/YY')), '1299');
    const save = screen.getByRole('button', { name: tr('Guardar método de pago', 'Save payment method') });
    await view.user.click(save); expect(screen.getAllByRole('alert').length).toBeGreaterThan(0);
    expect(leerTarjetas(guest.id)).toEqual([]);
    await view.user.clear(number); await view.user.type(number, '4242424242424242'); await view.user.click(save);
    expect(leerTarjetas(guest.id)).toEqual([{
      id: expect.any(String), huespedId: guest.id, marca: 'Visa', ultimos4: '4242',
      titular: 'Updated Guest', vencimiento: '12/99', principal: true, demo: true,
    }]);
    expect(number).toHaveValue(''); expect(cvv).toHaveValue(''); noSecrets('4242424242424242', '4242 4242 4242 4242', '987');
    view.unmount(); const reload = mount(); const dialog = await open(reload.user, 'Métodos de pago', 'Payment methods');
    expect(dialog).toHaveTextContent('4242'); expect(dialog.querySelector('.visual-card')).not.toBeNull();
    expect(dialog.textContent).not.toMatch(/demo|tokeniz|backend|\bPAN\b|referencia interna/i);
    expect(screen.getByLabelText(tr('Número de tarjeta', 'Card number'))).toHaveValue('');
    expect(screen.getByLabelText('CVV/CVC')).toHaveValue('');
    await reload.user.click(screen.getByRole('button', { name: tr('Eliminar método de pago', 'Remove payment method') }));
    expect(leerTarjetas(guest.id)).toEqual([]); expect(leerHuespedes()).toEqual([guest]); unchangedHistory();
  });

  test('modal usa foco real, atrapa Tab y cierra con Escape, X y fondo', async () => {
    const { user, onVolver } = mount();
    const profileClose = screen.getByRole('button', { name: tr('Cerrar perfil', 'Close profile') });
    expect(profileClose).toHaveFocus();
    const dialog = await open(user, 'Información personal', 'Personal information');
    expect(screen.getByLabelText(tr('Nombre completo', 'Full name'))).toHaveFocus();
    const buttons = within(dialog).getAllByRole('button', { name: tr('Cerrar', 'Close') });
    buttons.at(-1)!.focus(); await user.tab(); expect(buttons[0]).toHaveFocus();
    await user.tab({ shift: true }); expect(buttons.at(-1)).toHaveFocus();
    await user.keyboard('{Escape}'); expect(screen.getByRole('dialog')).toHaveAccessibleName(tr('Perfil', 'Profile'));
    expect(screen.getByRole('dialog')).toContainElement(document.activeElement as HTMLElement);
    expect(onVolver).not.toHaveBeenCalled();
    await open(user, 'Información personal', 'Personal information'); await close(user);
    const reopened = await open(user, 'Información personal', 'Personal information');
    await user.click(reopened.parentElement!);
    expect(screen.getByRole('dialog')).toHaveAccessibleName(tr('Perfil', 'Profile'));
    await user.keyboard('{Escape}'); expect(onVolver).toHaveBeenCalledOnce();
    unchangedHistory();
  });
});
