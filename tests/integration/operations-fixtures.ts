import { test as base, expect, type BrowserContext, type WebSocketRoute } from '@playwright/test';
import type { OperationsOptions, OperationsRole, OperationsSnapshot } from './operations-api';
export { expect };
export { viewports } from '../e2e/reception-fixtures';
export { expectNoOverflow } from '../e2e/public-fixtures';

async function control(path: string, method = 'GET', body?: unknown): Promise<OperationsSnapshot> {
  const token = process.env.ISSUE48_OPERATIONS_MOCK_TOKEN;
  if (!token) throw new Error('Missing operations mock control token');
  const response = await fetch(`http://127.0.0.1:3049/__test/${path}`, { method, signal: AbortSignal.timeout(5000), headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  if (!response.ok) throw new Error(`Operations mock control ${path}: ${response.status}`);
  return response.json() as Promise<OperationsSnapshot>;
}
type Mock = { state: () => Promise<OperationsSnapshot>; configure: (options: Partial<OperationsOptions>) => Promise<void> };
type Realtime = { subscribed: (destination: string) => Promise<void>; emit: (destination: string, value: unknown) => void; reconnect: () => Promise<void>; tickets: string[] };

export const test = base.extend<{ mock: Mock; realtime: Realtime; browserErrors: void }>({
  mock: [async ({}, use) => {
    await control('reset', 'POST');
    await use({ state: () => control('state'), configure: async options => { await control('configure', 'POST', options); } });
    expect((await control('state')).errors).toEqual([]);
  }, { auto: true }],
  browserErrors: [async ({ page }, use) => {
    const errors: string[] = [];
    const record = (error: Error) => errors.push(`${page.url()}: ${error.message}`);
    page.on('pageerror', record); await use(); page.off('pageerror', record); expect(errors).toEqual([]);
  }, { auto: true }],
  realtime: async ({ page }, use) => {
    const sockets = new Set<{ route: WebSocketRoute; subscriptions: Map<string, string> }>();
    const tickets: string[] = [], errors: string[] = [];
    await page.routeWebSocket('ws://127.0.0.1:3049/ws', route => {
      const socket = { route, subscriptions: new Map<string, string>() }; sockets.add(socket);
      route.onClose(() => sockets.delete(socket));
      route.onMessage(message => {
        try {
          const raw = String(message);
          if (raw.startsWith('CONNECT\n') || raw.startsWith('STOMP\n')) {
            const ticket = raw.match(/\nticket:([^\n]+)/)?.[1];
            expect(ticket).toMatch(/^ticket-\d+$/); expect(raw).not.toContain('Bearer'); expect(raw).not.toContain('prueba-');
            tickets.push(ticket!); route.send('CONNECTED\nversion:1.2\nheart-beat:0,0\n\n\0');
          }
          if (raw.startsWith('SUBSCRIBE\n')) {
            const id = raw.match(/\nid:([^\n]+)/)?.[1], destination = raw.match(/\ndestination:([^\n]+)/)?.[1];
            expect(id).toBeTruthy(); expect(destination).toBeTruthy(); socket.subscriptions.set(id!, destination!);
          }
          if (raw.startsWith('UNSUBSCRIBE\n')) socket.subscriptions.delete(raw.match(/\nid:([^\n]+)/)?.[1] ?? '');
        } catch (error) { errors.push(error instanceof Error ? error.message : String(error)); }
      });
    });
    let sequence = 0;
    await use({
      tickets,
      subscribed: async destination => { await expect.poll(() => [...sockets].some(socket => [...socket.subscriptions.values()].includes(destination))).toBe(true); },
      emit: (destination, value) => {
        let sent = 0;
        for (const socket of sockets) for (const [id, path] of socket.subscriptions) if (path === destination) {
          socket.route.send(`MESSAGE\nsubscription:${id}\nmessage-id:issue48-${++sequence}\ndestination:${destination}\n\n${JSON.stringify(value)}\0`); sent++;
        }
        expect(sent, `Suscripción activa a ${destination}`).toBeGreaterThan(0);
      },
      reconnect: async () => {
        const count = tickets.length;
        for (const socket of [...sockets]) socket.route.close();
        await expect.poll(() => tickets.length).toBeGreaterThan(count);
        expect(new Set(tickets).size).toBe(tickets.length);
      },
    });
    await page.close(); sockets.clear(); expect(errors).toEqual([]);
  },
});

export async function login(context: BrowserContext, baseURL: string, role: OperationsRole) {
  const response = await context.request.post('/api/auth/login', { headers: { Origin: baseURL }, data: { correo: `${role}@example.test`, contrasena: 'clave-de-prueba' } });
  expect(response.status()).toBe(200);
}
