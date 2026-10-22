import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import EstanciaChat from '@/components/common/EstanciaChat';
// Isolated HTTP responses: these checks do not prove a live Spring connection.
afterEach(() => vi.unstubAllGlobals());
for (const staff of [false, true]) {
  test(`approved ${staff ? 'reception' : 'guest'} presentation preserves receiving and sending through its existing route`, async () => {
    const url = staff ? '/api/estancias/VS-TEST01/chat' : '/api/app/reservas/VS-TEST01/chat';
    const rows = [{ id: 1, autor: staff ? 'HUESPED' : 'RECEPCION', texto: 'Mensaje recibido', creadoEn: '2026-10-21T12:00:00Z', version: 1, puedeModificar: false }];
    const fetcher = vi.fn(async (path: string, init?: RequestInit) => {
      expect(path).toBe(url);
      if (init?.method === 'POST') {
        const body = JSON.parse(init.body as string);
        expect(body.texto).toBe('Respuesta');
        expect(body.clave).toMatch(/^[\da-f-]{36}$/);
        rows.push({ id: 2, autor: staff ? 'RECEPCION' : 'HUESPED', texto: body.texto, creadoEn: '2026-10-21T12:01:00Z', version: 1, puedeModificar: false });
        return new Response(JSON.stringify({ id: 2 }), { status: 200 });
      }
      return new Response(JSON.stringify(rows), { status: 200 });
    });
    vi.stubGlobal('fetch', fetcher);
    render(<EstanciaChat approved staff={staff} code="VS-TEST01" guestName="Huesped" />);
    await screen.findByText('Mensaje recibido');
    expect(screen.queryByRole('button', { name: 'Opciones del mensaje' })).toBeNull();
    const field = screen.getByRole('textbox');
    fireEvent.change(field, { target: { value: 'Respuesta' } });
    if (staff) fireEvent.submit(field.closest('form')!);
    else fireEvent.keyDown(field, { key: 'Enter' });
    await screen.findByText('Respuesta');
    await waitFor(() => expect(field).toHaveValue(''));
    expect(fetcher.mock.calls.filter(([, init]) => init?.method === 'POST')).toHaveLength(1);
  });
}
