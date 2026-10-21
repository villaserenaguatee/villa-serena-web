import { render, screen, waitFor, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, test, vi } from 'vitest';
import AdminRoomsManagement from '@/features/admin/pages/AdminRoomsManagement';
import CatalogosAdmin from '@/features/admin/pages/CatalogosAdmin';
import { operacion, OperationError } from '@/lib/api/operaciones';

vi.mock('@/lib/api/operaciones', async original => ({ ...await original<typeof import('@/lib/api/operaciones')>(), operacion: vi.fn() }));
vi.mock('@/lib/usePublicCatalog', () => ({ usePublicCatalog: () => ({ rooms: [], error: '', loading: false, connected: true }) }));
vi.mock('@/features/admin/pages/ApprovedRoomMapConnected', () => ({ default: () => <p>Mapa existente</p> }));
const call = vi.mocked(operacion);
const type = { id: 3, version: 4, nombre: 'Estándar', descripcion: 'Descripción existente', capacidad: 2, precioBase: 420, ajusteFinSemanaPct: 0, estado: 'ACTIVO' };
const rooms = [
  { id: 11, version: 2, numero: '101', piso: 1, tipoHabitacionId: 3, estado: 'ACTIVO', ocupacion: 'OCUPADA', condicion: 'LIMPIA' },
  { id: 12, version: 0, numero: '102', piso: 1, tipoHabitacionId: 3, estado: 'INACTIVO', ocupacion: 'LIBRE', condicion: 'LIMPIA' },
];
beforeEach(() => {
  call.mockReset();
  call.mockImplementation(async (path, method) => {
    if (method === 'POST') return { id: 20, version: 1 };
    if (path === 'admin/catalogos/tipos') return [type];
    if (path === 'admin/catalogos/habitaciones') return rooms;
    throw Error('Unexpected operation ' + path);
  });
});
const posts = () => call.mock.calls.filter(([, method]) => method === 'POST');
async function openNew(resource = 'habitaciones') {
  render(<CatalogosAdmin initial={resource} resources={[resource]} roomManagement />);
  await waitFor(() => expect(screen.getByRole('button', { name: 'Nuevo registro' })).toBeEnabled());
  await userEvent.click(screen.getByRole('button', { name: 'Nuevo registro' }));
  return screen.getByRole('dialog');
}

test('rooms, categories and existing map are accessible without mixing personnel or seasons', async () => {
  render(<AdminRoomsManagement />);
  await screen.findByText('Habitación 101');
  expect(screen.getByText(/2 de 2 habitaciones físicas registradas/)).toHaveTextContent('1 activas');
  await userEvent.click(screen.getByRole('button', { name: 'Categorías de habitación' }));
  await screen.findByText('Estándar');
  expect(await screen.findByText('Habitaciones físicas: 2 · 1 activas')).toBeVisible();
  expect(screen.queryByRole('button', { name: 'Personal' })).toBeNull();
  await userEvent.click(screen.getByRole('button', { name: 'Mapa de habitaciones' }));
  expect(screen.getByText('Mapa existente')).toBeVisible();
});

test('search and status filter change displayed records without changing the physical total', async () => {
  render(<CatalogosAdmin initial="habitaciones" resources={['habitaciones']} roomManagement />);
  await screen.findByText('Habitación 101');
  await userEvent.type(screen.getByRole('searchbox'), '102');
  expect(screen.queryByText('Habitación 101')).toBeNull();
  expect(screen.getByText(/1 de 2 habitaciones/)).toBeVisible();
  await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Estado' }), 'ACTIVO');
  expect(screen.queryByText('Habitación 102')).toBeNull();
  expect(screen.getByText(/0 de 2 habitaciones/)).toBeVisible();
});

test('room creation uses the existing endpoint and only permitted fields', async () => {
  const dialog = await openNew();
  await userEvent.type(within(dialog).getByLabelText('Número de habitación'), ' 103 ');
  await userEvent.selectOptions(within(dialog).getByLabelText('Categoría de habitación'), '3');
  await userEvent.click(within(dialog).getByRole('button', { name: 'Guardar' }));
  await waitFor(() => expect(posts()).toHaveLength(1));
  const [path, , body] = posts()[0];
  expect(path).toBe('admin/catalogos/habitaciones');
  expect(body).toEqual({ clave: expect.any(String), id: null, version: 0, datos: { numero: '103', piso: 1, tipoHabitacionId: 3, estado: 'ACTIVO' } });
});

test('room update preserves identifier and version and never sends occupancy or manual capacity', async () => {
  render(<CatalogosAdmin initial="habitaciones" resources={['habitaciones']} roomManagement />);
  const card = (await screen.findByText('Habitación 101')).closest('article')!;
  await userEvent.click(within(card).getByRole('button', { name: 'Editar' }));
  const dialog = screen.getByRole('dialog');
  fireEvent.change(within(dialog).getByLabelText('Piso'), { target: { value: '2' } });
  await userEvent.click(within(dialog).getByRole('button', { name: 'Guardar' }));
  await waitFor(() => expect(posts()).toHaveLength(1));
  expect(posts()[0][2]).toMatchObject({ id: 11, version: 2, datos: { numero: '101', piso: 2, tipoHabitacionId: 3, estado: 'ACTIVO' } });
  expect(Object.keys((posts()[0][2] as { datos: object }).datos).sort()).toEqual(['estado', 'numero', 'piso', 'tipoHabitacionId']);
});

test('repeated submissions share one in-flight write and navigation is disabled until it ends', async () => {
  let release!: (value: unknown) => void;
  call.mockImplementation(async (path, method) => {
    if (method === 'POST') return new Promise(resolve => { release = resolve; });
    return path.endsWith('/tipos') ? [type] : rooms;
  });
  render(<AdminRoomsManagement />);
  await screen.findByText('Habitación 101');
  await userEvent.click(within(screen.getByText('Habitación 101').closest('article')!).getByRole('button', { name: 'Editar' }));
  const dialog = screen.getByRole('dialog');
  fireEvent.submit(dialog); fireEvent.submit(dialog);
  await waitFor(() => expect(posts()).toHaveLength(1));
  expect(screen.getByRole('button', { name: 'Categorías de habitación' })).toBeDisabled();
  release({ id: 11, version: 3 });
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  await waitFor(() => expect(screen.getByRole('button', { name: 'Categorías de habitación' })).toBeEnabled());
});

test('invalid fields retain values, focus the first error, and do not submit', async () => {
  const dialog = await openNew();
  fireEvent.change(within(dialog).getByLabelText('Número de habitación'), { target: { value: '   ' } });
  fireEvent.change(within(dialog).getByLabelText('Piso'), { target: { value: '0' } });
  await userEvent.click(within(dialog).getByRole('button', { name: 'Guardar' }));
  const number = within(dialog).getByLabelText('Número de habitación');
  expect(number).toHaveValue('   ');
  expect(number).toHaveAttribute('aria-invalid', 'true');
  await waitFor(() => expect(number).toHaveFocus());
  expect(posts()).toHaveLength(0);
});

test('unimplemented content stays disabled and cannot enter the category request', async () => {
  const dialog = await openNew('tipos');
  expect(within(dialog).getByLabelText('Fotografía principal y galería')).toBeDisabled();
  expect(within(dialog).getByLabelText('Superficie (m²)')).toBeDisabled();
  expect(within(dialog).getByLabelText('Publicación de la oferta')).toBeDisabled();
  expect(within(dialog).getByLabelText('Fotografía principal y galería')).toHaveAttribute('accept', 'image/jpeg,image/png');
  expect(within(dialog).getByLabelText('Fotografía principal y galería')).toHaveAttribute('multiple');
  expect(within(dialog).getByText('Seleccionar imágenes')).toBeVisible();
  await userEvent.type(within(dialog).getByLabelText('Nombre'), ' Nueva categoría ');
  await userEvent.type(within(dialog).getByLabelText('Descripción'), ' Descripción manual ');
  await userEvent.type(within(dialog).getByLabelText('Precio base (Q)'), '420');
  await userEvent.click(within(dialog).getByRole('button', { name: 'Guardar' }));
  await waitFor(() => expect(posts()).toHaveLength(1));
  expect(posts()[0][0]).toBe('admin/catalogos/tipos');
  expect((posts()[0][2] as { datos: object }).datos).toEqual({ nombre: 'Nueva categoría', descripcion: 'Descripción manual', capacidad: 1, precioBase: 420, ajusteFinSemanaPct: 0, estado: 'ACTIVO' });
});

test('new category price starts empty and rejects empty, zero and negative values', async () => {
  const dialog = await openNew('tipos');
  const price = within(dialog).getByLabelText('Precio base (Q)');
  expect(price).toHaveValue(null);
  expect(price).toBeRequired();
  await userEvent.type(within(dialog).getByLabelText('Nombre'), 'Categoría');
  await userEvent.type(within(dialog).getByLabelText('Descripción'), 'Descripción');
  for (const value of ['', '0', '-5']) {
    fireEvent.change(price, { target: { value } });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Guardar' }));
    expect(price).toHaveAttribute('aria-invalid', 'true');
    expect(price).toHaveAccessibleDescription('Ingrese un importe válido con hasta dos decimales');
    expect(posts()).toHaveLength(0);
  }
});

test('editing a category shows its registered price and consistent category naming', async () => {
  render(<AdminRoomsManagement />);
  await screen.findByText('Habitación 101');
  await userEvent.click(screen.getByRole('button', { name: 'Categorías de habitación' }));
  await userEvent.click(await screen.findByRole('button', { name: 'Editar' }));
  const dialog = screen.getByRole('dialog');
  expect(within(dialog).getByRole('heading', { name: 'Editar · Categorías de habitación' })).toBeVisible();
  expect(within(dialog).getByLabelText('Precio base (Q)')).toHaveValue(420);
  expect(screen.queryByText('Tipos de habitación')).toBeNull();
  expect(screen.queryByText('Categorías y contenido')).toBeNull();
  await userEvent.click(within(dialog).getByRole('button', { name: 'Cancelar' }));
  expect(posts()).toHaveLength(0);
});

test('inventory count failure does not block category editing or pretend there are zero rooms', async () => {
  call.mockImplementation(async path => { if (path === 'admin/catalogos/tipos') return [type]; throw new OperationError('Sin conexión', 502); });
  render(<CatalogosAdmin initial="tipos" resources={['tipos']} roomManagement />);
  expect(await screen.findByText('Habitaciones físicas: No disponible')).toBeVisible();
  expect(screen.getByRole('button', { name: 'Nuevo registro' })).toBeEnabled();
});

test('load failure blocks creation without demo fallback; rejected update keeps the form and error', async () => {
  call.mockRejectedValue(new OperationError('No se pudo contactar al servidor', 502));
  const view = render(<CatalogosAdmin initial="habitaciones" resources={['habitaciones']} roomManagement />);
  await screen.findByRole('alert');
  expect(screen.getByRole('button', { name: 'Nuevo registro' })).toBeDisabled();
  expect(screen.queryByText('Habitación 101')).toBeNull();
  view.unmount();
  call.mockImplementation(async (path, method) => { if (method === 'POST') throw new OperationError('La habitación tiene reservas activas.', 409); return path.endsWith('/tipos') ? [type] : rooms; });
  render(<CatalogosAdmin initial="habitaciones" resources={['habitaciones']} roomManagement />);
  await screen.findByText('Habitación 101');
  await userEvent.click(within(screen.getByText('Habitación 101').closest('article')!).getByRole('button', { name: 'Editar' }));
  await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Guardar' }));
  expect(await within(screen.getByRole('dialog')).findByRole('alert')).toHaveTextContent('reservas activas');
  expect(screen.getByRole('dialog')).toBeVisible();
});
