import assert from 'node:assert/strict';
import type { components } from '../../src/lib/api/schema';
import type { PedidoRS, IncidenciaAPI } from '../../src/lib/api/operaciones';
import type { RoomState } from '../../src/lib/bff/contracts/reception';
type Schema = components['schemas'];
export type OperationsRole = 'recepcion' | 'roomservice' | 'mantenimiento' | 'limpieza';
const employees: Record<OperationsRole, Pick<Schema['EmpleadoSesion'], 'id' | 'rol' | 'area'>> = {
  recepcion: { id: 2, rol: 'RECEPCION', area: null }, roomservice: { id: 4, rol: 'ROOM_SERVICE', area: null },
  mantenimiento: { id: 5, rol: 'MANTENIMIENTO_LIMPIEZA', area: 'MANTENIMIENTO' }, limpieza: { id: 3, rol: 'MANTENIMIENTO_LIMPIEZA', area: 'LIMPIEZA' },
};
export type OperationsOptions = { conflict: boolean; roomCondition: RoomState['condicion']; technicianId: number | null };

export function createOperationsApi() {
  const initialRoom = (): RoomState => ({ id: 4, numero: '204', piso: 2, tipoHabitacion: { id: 1, nombre: 'Standard' }, ocupacion: 'LIBRE', condicion: 'LIMPIA', llegaHoy: false, saleHoy: false, incidenciaPendiente: false, incidenciaBloqueante: null });
  let room = initialRoom();
  const roomRef = () => ({ id: room.id, numero: room.numero, piso: room.piso });
  const initialOrder = (): PedidoRS => ({ id: 12, creadoEn: '2026-10-07T15:00:00Z', estado: 'NUEVO', items: [{ itemId: 21, nombre: 'Café', cantidad: 2, precioUnitario: 25, subtotal: 50 }], notas: 'Sin azúcar', total: 50, motivoCancelacion: null, habitacion: roomRef(), nombreHuesped: 'Ana de prueba', historial: [{ estadoAnterior: null, estadoNuevo: 'NUEVO', responsable: 'Huésped', fechaHora: '2026-10-07T15:00:00Z', motivo: null }] });
  const initialIncident = (): IncidenciaAPI => ({ id: 1, habitacion: roomRef(), descripcion: 'Fuga de prueba', impideUso: true, habitacionOcupada: false, estado: 'REPORTADA', reportadaPor: { id: 2, nombre: 'Recepción' }, reportadaEn: '2026-10-07T14:00:00Z', tecnicoACargo: null, resueltaEn: null, fotoUrl: null });
  let order = initialOrder(), incidents = [initialIncident()];
  let tickets = 0, uploads = 0, reports = 0, menuAvailable = true, conflict = false;
  let errors: string[] = [];
  let calls: { method: string; path: string; body?: unknown }[] = [];
  const snapshot = () => structuredClone({ room, order, incidents, tickets, uploads, reports, menuAvailable, errors, calls });
  const reset = () => { room = initialRoom(); order = initialOrder(); incidents = [initialIncident()]; tickets = 0; uploads = 0; reports = 0; menuAvailable = true; conflict = false; errors = []; calls = []; };
  const configure = (options: Partial<OperationsOptions>) => {
    if (options.conflict !== undefined) conflict = options.conflict;
    if (options.roomCondition) room.condicion = options.roomCondition;
    if (options.technicianId !== undefined) incidents[0].tecnicoACargo = options.technicianId === null ? null : { id: options.technicianId, nombre: options.technicianId === 5 ? 'Técnico de prueba' : 'Otro técnico' };
  };
  const employee = (name: string): Schema['EmpleadoSesion'] => {
    assert.ok(Object.hasOwn(employees, name), `Empleado de prueba desconocido: ${name}`);
    return { ...employees[name as OperationsRole], nombre: name, correo: `${name}@example.test`, debeCambiarContrasena: false };
  };
  async function dispatch({ method, path, authorization, body }: { method: string; path: string; authorization?: string; body?: unknown }): Promise<{ status: number; body: unknown }> {
    const send = (body: unknown, status = 200) => ({ status, body: structuredClone(body) });
    try {
      if (path === '/api/v1/auth/login' && method === 'POST') {
        const value = body as Schema['LoginPeticion']; assert.equal(value.contrasena, 'clave-de-prueba');
        const name = value.correo.split('@')[0];
        return send({ accessToken: `prueba-${name}`, refreshToken: `refresh-${name}`, tipoToken: 'Bearer', expiraEn: 900, empleado: employee(name) });
      }
      assert.ok(authorization?.startsWith('Bearer prueba-'), 'La petición requiere token de prueba');
      const name = authorization!.slice('Bearer prueba-'.length); employee(name);
      if (path === '/api/v1/auth/yo' && method === 'GET') return send(employee(name));
      if (path === '/api/v1/auth/ws-ticket' && method === 'POST') return send({ ticket: `ticket-${++tickets}`, expiraEn: new Date(Date.now() + 60000).toISOString(), accessToken: 'campo-que-no-debe-salir' });
      calls.push({ method, path, ...(body === undefined ? {} : { body: Buffer.isBuffer(body) ? { bytes: body.length } : structuredClone(body) }) });
      if (path === '/api/v1/habitaciones' && method === 'GET') { assert.equal(name, 'recepcion'); return send([room]); }
      if (path.startsWith('/api/v1/room-service/')) {
        assert.equal(name, 'roomservice');
        if (path.endsWith('/pedidos') && method === 'GET') return send(['ENTREGADO', 'CANCELADO'].includes(order.estado) ? [] : [order]);
        if (path.endsWith('/pedidos/12') && method === 'GET') return send(order);
        if (path.endsWith('/pedidos/12/avanzar') && method === 'POST') {
          const value = body as { estadoEsperado: string; nuevoEstado: PedidoRS['estado'] };
          if (conflict) { conflict = false; return send({ mensaje: 'Otro empleado cambió el pedido' }, 409); }
          assert.equal(value.estadoEsperado, order.estado); order.estado = value.nuevoEstado; return send(order);
        }
        if (path.endsWith('/pedidos/12/cancelar') && method === 'POST') {
          const value = body as { motivo: string }; assert.ok(value.motivo.trim()); order.estado = 'CANCELADO'; order.motivoCancelacion = value.motivo; return send(order);
        }
        if (path.endsWith('/menu') && method === 'GET') return send({ categorias: [{ id: 1, nombre: 'Bebidas' }], items: [{ id: 21, categoriaId: 1, nombre: 'Café', descripcion: 'De prueba', precio: 25, fotoUrl: null, disponibilidad: menuAvailable ? 'DISPONIBLE' : 'AGOTADO' }] });
        if (path.endsWith('/items/21/agotar') && method === 'POST') { menuAvailable = false; return send({}); }
      }
      if (path === '/api/v1/archivos/imagenes' && method === 'POST') {
        assert.equal(name, 'recepcion'); assert.ok(Buffer.isBuffer(body)); assert.ok(body.includes(Buffer.from('INCIDENCIA')));
        uploads++; return send({ clave: 'incidencias/prueba.png' }, 201);
      }
      if (path === '/api/v1/incidencias') {
        if (method === 'GET') { assert.equal(name, 'mantenimiento'); return send(incidents.filter(item => item.estado !== 'RESUELTA')); }
        if (method === 'POST') {
          assert.equal(name, 'recepcion'); const value = body as { habitacionId: number; fotoClave: string; descripcion: string; impideUso: boolean };
          assert.equal(value.habitacionId, 4); assert.equal(value.fotoClave, 'incidencias/prueba.png'); reports++;
          const incident = { ...initialIncident(), id: 2, descripcion: value.descripcion, impideUso: value.impideUso }; incidents.push(incident); return send(incident, 201);
        }
      }
      const match = path.match(/^\/api\/v1\/incidencias\/(\d+)\/(tomar|resolver)$/);
      if (match && method === 'POST') {
        assert.equal(name, 'mantenimiento'); const incident = incidents.find(item => item.id === Number(match[1])); assert.ok(incident);
        if (match[2] === 'tomar') { incident.estado = 'EN_PROCESO'; incident.tecnicoACargo = { id: 5, nombre: 'Técnico de prueba' }; }
        else { assert.equal(incident.tecnicoACargo?.id, 5); assert.ok((body as { solucion: string }).solucion.trim()); incident.estado = 'RESUELTA'; }
        return send(incident);
      }
      throw new Error(`Ruta de operaciones no prevista: ${method} ${path}`);
    } catch (error) { const message = error instanceof Error ? error.message : String(error); errors.push(message); return send({ mensaje: message }, 500); }
  }
  return { dispatch, snapshot, configure, reset };
}
export type OperationsSnapshot = ReturnType<ReturnType<typeof createOperationsApi>['snapshot']>;
