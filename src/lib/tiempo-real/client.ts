import { Client, type StompSubscription } from '@stomp/stompjs';
export type Destino = '/topic/pedidos' | '/topic/solicitudes' | '/topic/habitaciones';
type Listener = { recibir: (value: unknown) => void; recargar: () => void; error?: (message: string) => void };
const destinos = new Set<Destino>(['/topic/pedidos', '/topic/solicitudes', '/topic/habitaciones']);

// Una instancia por pestaña; el hook mantiene vivos los callbacks sin reconectar.
export class TiempoReal {
  private listeners = new Map<Destino, Set<Listener>>();
  private subscriptions = new Map<Destino, StompSubscription>();
  private client?: Client;
  constructor(private url: string | undefined, private makeClient = (config: ConstructorParameters<typeof Client>[0]) => new Client(config), private request: typeof fetch = (input, init) => fetch(input, init)) {}
  subscribe(destino: Destino, listener: Listener) {
    if (!destinos.has(destino)) throw new Error('Destino de tiempo real no permitido.');
    const group = this.listeners.get(destino) ?? new Set<Listener>();
    group.add(listener); this.listeners.set(destino, group);
    this.start();
    if (this.client?.connected) this.attach(destino);
    return () => {
      group.delete(listener);
      if (!group.size) {
        this.listeners.delete(destino);
        this.subscriptions.get(destino)?.unsubscribe(); this.subscriptions.delete(destino);
      }
      if (!this.listeners.size && this.client) { const client = this.client; this.client = undefined; this.subscriptions.clear(); void client.deactivate({ force: true }); }
    };
  }
  private error(message: string) { for (const group of this.listeners.values()) for (const listener of group) listener.error?.(message); }
  private attach(destino: Destino) {
    if (!this.client?.connected || this.subscriptions.has(destino)) return;
    this.subscriptions.set(destino, this.client.subscribe(destino, message => {
      let value: unknown;
      try { value = JSON.parse(message.body); } catch { this.error('Se recibió un evento inválido.'); return; }
      for (const listener of this.listeners.get(destino) ?? []) listener.recibir(value);
    }));
  }
  private start() {
    if (this.client) return;
    if (!this.url || !/^wss?:\/\//.test(this.url)) { this.error('Falta configurar el servicio de tiempo real.'); return; }
    const client = this.makeClient({ brokerURL: this.url, reconnectDelay: 5000, connectionTimeout: 10000, heartbeatIncoming: 10000, heartbeatOutgoing: 10000,
      debug: () => {}, // CONNECT contiene el ticket: no registrar frames.
      beforeConnect: async () => {
        client.connectHeaders = {};
        try {
          const response = await this.request('/api/auth/ws-ticket', { method: 'POST', cache: 'no-store', signal: AbortSignal.timeout(10000) });
          const value = await response.json();
          if (!response.ok || typeof value.ticket !== 'string' || !value.ticket) throw new Error('No se pudo autorizar el tiempo real.');
          if (this.client === client && client.active) client.connectHeaders = { ticket: value.ticket };
        } catch {
          this.error('No se pudo autorizar el tiempo real. Se reintentará.');
          // beforeConnect se ejecuta también al reconectar. No conectar sin ticket.
          await client.deactivate({ force: true });
          setTimeout(() => { if (this.client === client && this.listeners.size) client.activate(); }, 5000);
        }
      },
      onConnect: () => {
        if (this.client !== client) return;
        this.subscriptions.clear();
        for (const destino of this.listeners.keys()) this.attach(destino);
        // También cubre el intervalo entre GET inicial y primera suscripción.
        for (const group of this.listeners.values()) for (const listener of group) listener.recargar();
      },
      onWebSocketClose: () => { if (this.client === client) this.subscriptions.clear(); },
      onStompError: () => this.error('No se pudo mantener la suscripción de tiempo real.'),
    });
    this.client = client; client.activate();
  }
}
