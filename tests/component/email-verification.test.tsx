import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';
import EmailVerificationFlow, { type EmailVerificationService } from '@/components/common/EmailVerificationFlow';

const labels = {
  ES: { code: 'Código de verificación', verify: 'Verificar correo', resend: 'Reenviar', change: 'Cambiar correo', back: 'Volver', sent: 'El proveedor aceptó el envío. Revisa tu bandeja de entrada.' },
  EN: { code: 'Verification code', verify: 'Verify email', resend: 'Resend', change: 'Change email', back: 'Back', sent: 'The provider accepted the send request. Check your inbox.' },
};

describe.each(['ES', 'EN'] as const)('verificación de correo %s', lang => {
  const text = labels[lang];
  function mount(servicio?: EmailVerificationService, verificado = false) {
    localStorage.setItem('villa-serena-lang', lang);
    const onCambiar = vi.fn(), onVolver = vi.fn(), onVerificado = vi.fn();
    render(<EmailVerificationFlow correo="new@example.com" servicio={servicio} verificado={verificado}
      onCambiar={onCambiar} onVolver={onVolver} onVerificado={onVerificado} />);
    return { user: userEvent.setup(), onCambiar, onVolver, onVerificado };
  }
  const state = (value: string) => expect(screen.getByRole(['error', 'invalido', 'expirado'].includes(value) ? 'alert' : 'status')).toHaveAttribute('data-state', value);

  test('sin proveedor: inválido, error y reenvío sin confirmación falsa', async () => {
    const { user, onVerificado } = mount();
    state('pendiente');
    await user.click(screen.getByRole('button', { name: text.verify })); state('invalido');
    await user.type(screen.getByLabelText(text.code), '123456');
    await user.click(screen.getByRole('button', { name: text.verify })); state('error');
    await user.click(screen.getByRole('button', { name: text.resend })); state('error');
    expect(screen.queryByText(text.sent)).not.toBeInTheDocument();
    expect(onVerificado).not.toHaveBeenCalled();
  });
  test.each(['invalido', 'expirado', 'verificado'] as const)('proveedor devuelve %s tras procesar', async outcome => {
    let resolve!: (value: typeof outcome) => void;
    const verificar = vi.fn(() => new Promise<typeof outcome>(done => { resolve = done; }));
    const { user, onVerificado } = mount({ reenviar: vi.fn(), verificar });
    await user.type(screen.getByLabelText(text.code), '123456');
    await user.click(screen.getByRole('button', { name: text.verify })); state('verificando');
    expect(screen.getByRole('button', { name: text.verify })).toBeDisabled();
    expect(screen.getByRole('button', { name: text.resend })).toBeDisabled();
    expect(verificar).toHaveBeenCalledExactlyOnceWith('new@example.com', '123456');
    await act(async () => resolve(outcome)); state(outcome);
    expect(onVerificado).toHaveBeenCalledTimes(outcome === 'verificado' ? 1 : 0);
    if (outcome === 'verificado') expect(screen.queryByLabelText(text.code)).not.toBeInTheDocument();
  });
  test('error del proveedor, reenvío aceptado, cambiar correo y volver', async () => {
    const reenviar = vi.fn().mockResolvedValue(undefined);
    const { user, onVerificado, onCambiar, onVolver } = mount({ reenviar, verificar: vi.fn().mockRejectedValue(new Error('provider failure')) });
    await user.type(screen.getByLabelText(text.code), '123456');
    await user.click(screen.getByRole('button', { name: text.verify })); state('error');
    expect(onVerificado).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: text.resend }));
    expect(screen.getByText(text.sent)).toBeInTheDocument();
    expect(screen.getAllByRole('status').some(element => element.dataset.state === 'pendiente')).toBe(true);
    expect(reenviar).toHaveBeenCalledExactlyOnceWith('new@example.com');
    await user.click(screen.getByRole('button', { name: text.change }));
    await user.click(screen.getByRole('button', { name: text.back }));
    expect(onCambiar).toHaveBeenCalledOnce(); expect(onVolver).toHaveBeenCalledOnce();
  });
  test('correo previamente verificado no dispara otra confirmación', () => {
    const { onVerificado } = mount(undefined, true); state('verificado');
    expect(onVerificado).not.toHaveBeenCalled();
  });
});
