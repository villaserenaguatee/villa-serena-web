import type { ComponentProps } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import CheckInWebScreen from '@/features/huesped/pages/CheckInWeb';
import DetalleReserva from '@/features/recepcion/pages/DetalleReserva';
import { enviarCheckInPortal, activarCheckInConHabitacionLista, rechazarCheckInPortal } from '@/store/portalCheckIn';
import { leerReservas } from '@/store/reservationStore';
import { document as evidence, guest, room, seedPortal, stay } from '../fixtures/portal-checkin';

beforeEach(() => seedPortal({ ...stay, acompanantes: [], checkInWeb: undefined }));
describe.each(['Pasaporte', 'DPI'] as const)('check-in web con %s', tipoDocumento => {
  function mount(onCompletar = vi.fn()) {
    const view = render(<CheckInWebScreen huesped={{ ...guest, tipoDocumento }} reserva={{ ...stay, acompanantes: [] }}
      habitacion={room} checkin={{ estado: 'disponible', documento: null, terminosAceptados: false, peticiones: [], notaPeticiones: '' }}
      estanciaCerrada={false} onCompletar={onCompletar} onGuardarOcupantes={vi.fn()}
      onIrHabitacion={vi.fn()} onContactarRecepcion={vi.fn()} />);
    return { ...view, user: userEvent.setup(), onCompletar };
  }
  async function next(user: ReturnType<typeof userEvent.setup>) {
    await user.click(screen.getByRole('button', { name: /^Continuar$/ }));
  }
  function uploads(container: HTMLElement) { return Array.from(container.querySelectorAll<HTMLInputElement>('input[type="file"]')); }
  test('archivos reales, ambos lados de DPI y términos habilitan envío persistente y recarga', async () => {
    const onCompletar = vi.fn(data => enviarCheckInPortal(stay.id, guest.id, data));
    const view = mount(onCompletar); await next(view.user);
    const inputs = uploads(view.container); expect(inputs).toHaveLength(tipoDocumento === 'DPI' ? 2 : 1);
    expect(screen.getByRole('button', { name: 'Continuar' })).toBeDisabled();
    for (const [index, input] of inputs.entries()) {
      await view.user.upload(input, new File([index === 0 ? 'hello' : 'reverse'], `${index}.png`, { type: 'image/png' }));
      await screen.findByText(`${index}.png`);
      if (tipoDocumento === 'DPI' && index === 0) expect(screen.getByRole('button', { name: 'Continuar' })).toBeDisabled();
    }
    await next(view.user); expect(screen.getByRole('button', { name: 'Continuar' })).toBeDisabled();
    await view.user.click(screen.getByRole('checkbox')); await next(view.user);
    await view.user.click(screen.getByRole('button', { name: 'Enviar check-in para revisión' }));
    expect(onCompletar).toHaveBeenCalledOnce();
    const data = onCompletar.mock.calls[0][0];
    expect(data.documentos).toHaveLength(inputs.length); expect(data.documento).toEqual(data.documentos[0]);
    expect(data.documentos[0]).toMatchObject({ nombre: '0.png', formato: 'PNG', pesoKb: 1,
      lado: tipoDocumento === 'DPI' ? 'frente' : 'unico', previewUrl: 'data:image/png;base64,aGVsbG8=' });
    if (tipoDocumento === 'DPI') expect(data.documentos[1]).toMatchObject({ lado: 'reverso', previewUrl: 'data:image/png;base64,cmV2ZXJzZQ==' });
    expect(leerReservas()).toHaveLength(1); expect(leerReservas()[0].checkInWeb?.documentos).toEqual(data.documentos);
    expect(leerReservas()[0].estado).toBe('confirmada'); view.unmount();
    const persisted = leerReservas()[0].checkInWeb!;
    render(<CheckInWebScreen huesped={{ ...guest, tipoDocumento }} reserva={leerReservas()[0]} habitacion={room}
      checkin={persisted} estanciaCerrada={false} onCompletar={onCompletar} onGuardarOcupantes={vi.fn()}
      onIrHabitacion={vi.fn()} onContactarRecepcion={vi.fn()} />);
    expect(screen.getByText('Recibimos tu check-in')).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Enviar check-in para revisión' })).not.toBeInTheDocument();
  });

  test('error de almacenamiento mantiene el formulario y permite reintentar sin anunciar éxito', async () => {
    const callback = vi.fn(data => enviarCheckInPortal(stay.id, guest.id, data)); const view = mount(callback);
    await next(view.user);
    for (const [index, input] of uploads(view.container).entries()) {
      await view.user.upload(input, new File(['hello'], `${index}.png`, { type: 'image/png' })); await screen.findByText(`${index}.png`);
    }
    await next(view.user); await view.user.click(screen.getByRole('checkbox')); await next(view.user);
    const before = localStorage.getItem('vs-reservas');
    const storage = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('QuotaExceededError', 'QuotaExceededError'); });
    const submit = screen.getByRole('button', { name: 'Enviar check-in para revisión' }); await view.user.click(submit);
    expect(screen.getByText(/No se pudieron guardar los documentos/)).toBeVisible();
    expect(screen.queryByText('Recibimos tu check-in')).not.toBeInTheDocument(); expect(submit).toBeEnabled();
    expect(localStorage.getItem('vs-reservas')).toBe(before);
    storage.mockRestore(); await view.user.click(submit); expect(callback).toHaveBeenCalledTimes(2);
    expect(leerReservas()[0].checkInWeb?.estado).toBe('pendiente');
  });

  test('extensión y tamaño inválidos dejan el siguiente paso bloqueado', async () => {
    const view = mount(); await next(view.user); const input = uploads(view.container)[0];
    const user = userEvent.setup({ applyAccept: false });
    await user.upload(input, new File(['hello'], 'documento.exe', { type: 'application/octet-stream' }));
    expect(screen.getByText(/Solo aceptamos imágenes/)).toBeVisible();
    await user.upload(input, new File([new Uint8Array(6 * 1024 * 1024)], 'grande.png', { type: 'image/png' }));
    expect(screen.getByText(/El archivo supera los 5 MB/)).toBeVisible();
    expect(screen.getByRole('button', { name: 'Continuar' })).toBeDisabled(); expect(view.onCompletar).not.toHaveBeenCalled();
  });
});

function receptionProps(): Extract<ComponentProps<typeof DetalleReserva>, { reserva: unknown }> {
  return {
    reserva: stay, huesped: guest, habitaciones: [room], reservas: [stay], solicitudes: [],
    onCerrar: vi.fn(), onAsignarHabitacion: vi.fn(), onCheckIn: vi.fn(), onValidarCheckInWeb: vi.fn(), onRechazarCheckInWeb: vi.fn(),
    onCheckOut: vi.fn(), onModificar: vi.fn(), onCancelar: vi.fn(), onAgregarAcompanante: vi.fn(), onQuitarAcompanante: vi.fn(),
    onAgregarServicio: vi.fn(), onQuitarServicio: vi.fn(), onRegistrarPago: vi.fn(), onAplicarDescuento: vi.fn(),
  };
}
test('botón de Recepción activa el ID exacto y espera la habitación libre y limpia', async () => {
  seedPortal(); const props = receptionProps();
  props.onValidarCheckInWeb = vi.fn(id => { void activarCheckInConHabitacionLista(id, 'portal'); });
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify([{ id: 101, numero: '101', ocupacion: 'LIBRE', condicion: 'LIMPIA' }]), {
    headers: { 'X-Villa-Serena-Mode': 'demo' },
  }));
  render(<DetalleReserva {...props} />); await userEvent.setup().click(screen.getByRole('button', { name: 'Activar' }));
  expect(props.onValidarCheckInWeb).toHaveBeenCalledExactlyOnceWith(stay.id);
  await waitFor(() => expect(leerReservas()[0].estado).toBe('en-curso'));
  expect(leerReservas()[0].checkInWeb?.documento).toEqual(evidence);
});
test('Recepción no permite activar un check-in sin habitación asignada', async () => {
  const props = receptionProps(); props.reserva = { ...stay, habitacionId: null };
  render(<DetalleReserva {...props} />); const button = screen.getByRole('button', { name: 'Activar' });
  expect(button).toBeDisabled(); await userEvent.setup().click(button); expect(props.onValidarCheckInWeb).not.toHaveBeenCalled();
});

test('rechazo desde Recepción exige motivo y conserva las evidencias para el reenvío', async () => {
  seedPortal(); const props = receptionProps();
  props.onRechazarCheckInWeb = vi.fn((id, reason) => { rechazarCheckInPortal(id, reason); });
  render(<DetalleReserva {...props} />); const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: 'Rechazar activación' }));
  const confirm = screen.getByRole('button', { name: 'Confirmar rechazo' }); expect(confirm).toBeDisabled();
  const reason = 'La imagen del documento no es legible';
  await user.click(screen.getByRole('button', { name: reason })); await user.click(confirm);
  expect(props.onRechazarCheckInWeb).toHaveBeenCalledExactlyOnceWith(stay.id, reason);
  expect(leerReservas()[0].checkInWeb).toMatchObject({ estado: 'rechazado', motivoRevision: reason, documentos: [evidence] });
  expect(leerReservas()[0].estado).toBe('confirmada'); expect(leerReservas()[0].habitacionId).toBe(room.id);
});
