import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import PhotoPicker from '@/components/common/PhotoPicker';

test('camera field exposes an accessible input and preserves caller formats without uploading', async () => {
  const select = vi.fn();
  render(<PhotoPicker label="Foto" accept="image/jpeg,image/png,image/webp" onSelect={select} />);
  const input = screen.getByLabelText('Foto');
  expect(input).toHaveAttribute('accept', 'image/jpeg,image/png,image/webp');
  expect(screen.queryByText(/Upload|Choose file|Subir imagen/i)).toBeNull();
  const file = new File(['photo'], 'image.webp', { type: 'image/webp' });
  await userEvent.upload(input, file);
  expect(select).toHaveBeenCalledExactlyOnceWith(file);
  // Clearing the native value allows selecting the same file again.
  await userEvent.upload(input, file);
  expect(select).toHaveBeenCalledTimes(2);
});

test('preview, replace and remove remain accessible; disabled controls preserve permissions', async () => {
  const select = vi.fn(), remove = vi.fn();
  const props = { label: 'Foto', accept: 'image/png', preview: '/photo.png', onSelect: select, onRemove: remove };
  const view = render(<PhotoPicker {...props} />);
  expect(screen.getByRole('img')).toHaveAttribute('src', '/photo.png');
  const choose = vi.spyOn(screen.getByLabelText('Foto'), 'click');
  await userEvent.click(screen.getByRole('button', { name: 'Reemplazar imagen' }));
  expect(choose).toHaveBeenCalledOnce();
  await userEvent.click(screen.getByRole('button', { name: 'Quitar imagen' }));
  expect(remove).toHaveBeenCalledOnce();
  view.rerender(<PhotoPicker {...props} disabled />);
  expect(screen.getByLabelText('Foto')).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Reemplazar imagen' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Quitar imagen' })).toBeDisabled();
});
