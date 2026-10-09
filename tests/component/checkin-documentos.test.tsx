import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import DocumentosCheckIn from '@/features/recepcion/pages/DocumentosCheckIn';
import type { DocumentoCargado, Reserva } from '@/lib/pms/types';

const front: DocumentoCargado = { nombre: 'frente.png', formato: 'PNG', pesoKb: 1, lado: 'frente', previewUrl: 'data:image/png;base64,cmVhbC1mcm9udA==' };
const back: DocumentoCargado = { ...front, nombre: 'reverso.png', lado: 'reverso', previewUrl: 'data:image/png;base64,cmVhbC1iYWNr' };
const checkIn = (documents: DocumentoCargado[] = [front, back]): NonNullable<Reserva['checkInWeb']> => ({
  estado: 'pendiente', documento: documents[0], documentos: documents, terminosAceptados: true,
  peticiones: [], notaPeticiones: '', enviadoEn: '2026-10-02T10:00:00Z',
});
const viewer = () => screen.getByRole('dialog', { name: 'Visor del documento de identidad' });

test('DPI persistente: visor, zoom, arrastre, navegación, Escape, foco y scroll', async () => {
  const saved = JSON.stringify(checkIn());
  render(<DocumentosCheckIn checkInWeb={JSON.parse(saved)} tipoDocumento="DPI" />);
  expect(screen.getAllByRole('img').map(image => image.getAttribute('src'))).toEqual([front.previewUrl, back.previewUrl]);
  const user = userEvent.setup(), opener = screen.getByRole('button', { name: 'Ver Frente del DPI' });
  const overflow = document.body.style.overflow;
  await user.click(opener);
  const dialog = viewer();
  expect(dialog).toHaveAttribute('aria-modal', 'true'); expect(dialog).toHaveFocus();
  expect(document.body.style.overflow).toBe('hidden');
  expect(within(dialog).getByRole('img')).toHaveAttribute('src', front.previewUrl);
  await user.click(within(dialog).getByRole('button', { name: 'Acercar imagen' }));
  const image = within(dialog).getByRole('img'), canvas = image.parentElement!, area = canvas.parentElement!;
  expect(canvas).toHaveStyle({ width: '150%', height: '150%' });
  expect(image).toHaveClass('object-contain');
  // jsdom no calcula layout ni implementa estas APIs; se fijan solo en el nodo real.
  area.scrollLeft = 40; area.scrollTop = 30;
  const capture = vi.fn(); Object.defineProperty(area, 'setPointerCapture', { value: capture });
  const scrollTo = vi.fn((x: number, y: number) => { area.scrollLeft = x; area.scrollTop = y; });
  Object.defineProperty(area, 'scrollTo', { value: scrollTo });
  const pointer = (type: string, x: number, y: number) => fireEvent(area, Object.assign(new Event(type, { bubbles: true }), { clientX: x, clientY: y, pointerId: 1 }));
  pointer('pointerdown', 50, 60); pointer('pointermove', 20, 10); pointer('pointerup', 20, 10);
  expect(capture).toHaveBeenCalledWith(1); expect(area.scrollLeft).toBe(70); expect(area.scrollTop).toBe(80);
  await user.click(within(dialog).getByRole('button', { name: 'Alejar imagen' }));
  expect(canvas).toHaveStyle({ width: '100%', height: '100%' });
  await user.click(within(dialog).getByRole('button', { name: 'Siguiente' }));
  expect(within(dialog).getByRole('img')).toHaveAttribute('src', back.previewUrl);
  expect(within(dialog).getByRole('img').parentElement).toHaveStyle({ width: '100%' });
  expect(scrollTo).toHaveBeenCalledWith(0, 0); expect(area.scrollLeft).toBe(0);
  await user.click(within(dialog).getByRole('button', { name: 'Anterior' }));
  expect(within(dialog).getByRole('img')).toHaveAttribute('src', front.previewUrl);
  within(dialog).getByRole('button', { name: 'Siguiente' }).focus(); await user.tab();
  expect(within(dialog).getByRole('button', { name: 'Acercar imagen' })).toHaveFocus();
  await user.keyboard('{Escape}');
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(document.body.style.overflow).toBe(overflow); expect(opener).toHaveFocus();
  await user.click(screen.getByRole('button', { name: 'Ver Reverso del DPI' }));
  await user.click(within(viewer()).getByRole('button', { name: 'Cerrar visor' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(JSON.stringify(checkIn())).toBe(saved);
});

test('una imagen fallida permite solicitar su reenvío sin ocultar la otra', async () => {
  const resend = vi.fn();
  render(<DocumentosCheckIn checkInWeb={checkIn()} tipoDocumento="DPI" onSolicitarReenvio={resend} />);
  fireEvent.error(screen.getByRole('img', { name: 'Reverso del DPI' }));
  expect(screen.getAllByRole('img')).toHaveLength(1);
  expect(screen.getByRole('img', { name: 'Frente del DPI' })).toHaveAttribute('src', front.previewUrl);
  expect(screen.getAllByRole('button', { name: 'Solicitar reenvío' })).toHaveLength(1);
  await userEvent.setup().click(screen.getByRole('button', { name: 'Solicitar reenvío' }));
  expect(resend).toHaveBeenCalledExactlyOnceWith('Vuelve a enviar Reverso del DPI (reverso.png): el archivo no está disponible.');
  expect(screen.queryByText('JPG')).not.toBeInTheDocument();
});

test('pasaporte único abre/cierra el visor y deshabilita navegación', async () => {
  const passport: DocumentoCargado = { ...front, nombre: 'pasaporte.png', lado: 'unico' };
  render(<DocumentosCheckIn checkInWeb={checkIn([passport])} tipoDocumento="Pasaporte" />);
  expect(screen.getAllByRole('img')).toHaveLength(1);
  const user = userEvent.setup(); await user.click(screen.getByRole('button', { name: 'Ver Pasaporte' }));
  expect(within(viewer()).getByRole('img', { name: 'Pasaporte' })).toHaveAttribute('src', passport.previewUrl);
  expect(within(viewer()).getByRole('button', { name: 'Anterior' })).toBeDisabled();
  expect(within(viewer()).getByRole('button', { name: 'Siguiente' })).toBeDisabled();
  await user.click(within(viewer()).getByRole('button', { name: 'Cerrar visor' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

test('acepta el documento legacy sin array de fotografías', () => {
  render(<DocumentosCheckIn checkInWeb={{ ...checkIn(), documentos: undefined }} tipoDocumento="DPI" />);
  expect(screen.getAllByRole('img')).toHaveLength(1);
  expect(screen.getByRole('img')).toHaveAttribute('src', front.previewUrl);
});
