import assert from 'node:assert/strict';
import type { components } from '../../src/lib/api/schema';

type Schema = components['schemas'];
export const accountCode = 'VS-ABC123';
const date = '2026-10-08T16:00:00Z';
const charge = (id: number, tipo: Schema['CargoCuentaRecepcion']['tipo'], concepto: string, monto: number, estado: Schema['EstadoCargo'] = 'VIGENTE'): Schema['CargoCuentaRecepcion'] => ({
  id, tipo, concepto, monto, cantidad: 1, precioUnitario: monto, fechaHora: date, estado,
  motivoAnulacion: estado === 'ANULADO' ? 'Duplicado' : null, responsable: 'Recepción de prueba', anuladoPor: estado === 'ANULADO' ? 'Ana' : null,
});
export function initialAccount(): Schema['CuentaRecepcion'] {
  return {
    codigoReserva: accountCode, estadoReserva: 'EN_ESTADIA', estadoCuenta: 'ABIERTA', nombreHuesped: 'Ana Morales',
    detalleNoches: [{ fecha: '2026-10-07', precio: 600, temporada: null, finDeSemana: false }],
    totalCargosVigentes: 725, totalPagosAprobados: 600, saldo: 125, facturaId: null,
    cargos: [charge(1, 'ALOJAMIENTO', 'Alojamiento', 600), charge(2, 'SERVICIO', 'Restaurante', 125), charge(3, 'SERVICIO', 'Lavandería', 50, 'ANULADO')],
    pagos: [
      { id: 1, fechaHora: date, metodo: 'STRIPE', monto: 600, estado: 'APROBADO', referencia: null, responsable: 'Stripe' },
      { id: 2, fechaHora: date, metodo: 'STRIPE', monto: 50, estado: 'FALLIDO', referencia: null, responsable: 'Stripe' },
    ],
  };
}
export type MockOptions = { block: boolean; fail: boolean; unavailable: boolean; paid: boolean; checkoutDelayMs: number };
export type AccountSnapshot = {
  account: Schema['CuentaRecepcion']; invoice: Schema['FacturaDetalle'] | null;
  checkoutCalls: number; calls: { method: string; path: string; body?: unknown }[]; errors: string[];
};
export type MockRequest = { method: string; path: string; authorization?: string; body?: unknown };

// This fake transport models the original script's contract; it is not Spring.
export function createAccountApi() {
  let account = initialAccount();
  let invoice: Schema['FacturaDetalle'] | null = null;
  let checkoutCalls = 0;
  let calls: AccountSnapshot['calls'] = [];
  let errors: string[] = [];
  let options: MockOptions = { block: false, fail: false, unavailable: false, paid: false, checkoutDelayMs: 0 };
  const snapshot = (): AccountSnapshot => structuredClone({ account, invoice, checkoutCalls, calls, errors });
  const configure = (patch: Partial<MockOptions>) => {
    options = { ...options, ...patch };
    if (patch.paid) {
      account.pagos = [{ ...account.pagos[0], monto: 725 }];
      account.totalPagosAprobados = 725; account.saldo = 0;
    }
  };
  const reset = () => {
    account = initialAccount(); invoice = null; checkoutCalls = 0; calls = []; errors = [];
    options = { block: false, fail: false, unavailable: false, paid: false, checkoutDelayMs: 0 };
  };
  function totals() {
    account.totalCargosVigentes = account.cargos.filter(item => item.estado === 'VIGENTE').reduce((sum, item) => sum + item.monto, 0);
    account.saldo = account.totalCargosVigentes - account.totalPagosAprobados;
  }
  async function dispatch(request: MockRequest): Promise<{ status: number; body: unknown }> {
    const { method, path, authorization, body } = request;
    const send = (body: unknown, status = 200) => ({ status, body });
    const employee = (rol: 'RECEPCION' | 'ADMIN'): Schema['EmpleadoSesion'] => ({ id: 2, nombre: 'Recepción de prueba', correo: `${rol.toLowerCase()}@example.test`, rol, area: null, debeCambiarContrasena: false });
    try {
      if (path === '/api/v1/auth/login' && method === 'POST') {
        const input = body as Schema['LoginPeticion'];
        assert.equal(input.contrasena, 'de-prueba');
        assert.ok(['recepcion@example.test', 'admin@example.test'].includes(input.correo));
        const role = input.correo.startsWith('admin') ? 'ADMIN' : 'RECEPCION';
        return send({ accessToken: role, refreshToken: `refresh-${role}`, tipoToken: 'Bearer', expiraEn: 900, empleado: employee(role) });
      }
      if (path === '/api/v1/auth/yo' && method === 'GET') {
        assert.ok(['Bearer RECEPCION', 'Bearer ADMIN'].includes(authorization ?? ''));
        return send(employee(authorization === 'Bearer ADMIN' ? 'ADMIN' : 'RECEPCION'));
      }
      assert.equal(authorization, 'Bearer RECEPCION');
      calls.push(structuredClone({ method, path, ...(body === undefined ? {} : { body }) }));
      if (path === `/api/v1/cuentas/${accountCode}` && method === 'GET') {
        return options.unavailable ? send({ codigo: 'API_NO_DISPONIBLE', mensaje: 'Cuenta no disponible en el API de prueba.' }, 503) : send(structuredClone(account));
      }
      if (path === `/api/v1/cuentas/${accountCode}/cargos` && method === 'POST') {
        const value = body as Schema['AgregarCargoPeticion'];
        assert.ok(value.concepto && value.cantidad > 0 && value.precioUnitario > 0);
        const added = { ...charge(4, 'SERVICIO', value.concepto, value.cantidad * value.precioUnitario), cantidad: value.cantidad, precioUnitario: value.precioUnitario };
        account.cargos.push(added); totals(); return send(added, 201);
      }
      if (path === `/api/v1/cuentas/${accountCode}/cargos/4/anular` && method === 'POST') {
        const value = body as { motivo: string };
        assert.ok(value.motivo);
        const added = account.cargos.find(item => item.id === 4); assert.ok(added);
        Object.assign(added, { estado: 'ANULADO', motivoAnulacion: value.motivo, anuladoPor: 'Ana' });
        totals(); return send(added);
      }
      if (path === `/api/v1/checkout/${accountCode}` && method === 'GET') {
        return send({ codigoReserva: accountCode, saldo: account.saldo, nombreCompradorSugerido: 'Ana Morales', pedidoEnCamino: options.block, pedidosACancelar: [12], puedeConfirmar: !options.block, motivosBloqueo: options.block ? ['Pedido en camino'] : [] } satisfies Schema['VistaCheckout']);
      }
      if (path === `/api/v1/checkout/${accountCode}` && method === 'POST') {
        checkoutCalls++;
        const value = body as Schema['CheckoutRecepcionPeticion'];
        assert.deepEqual(value.comprador, { nit: 'CF', nombreComprador: 'Ana Morales' });
        assert.equal(options.block, false, 'No se debe enviar un check-out bloqueado');
        if (account.saldo > 0) assert.deepEqual(value.pago, { metodo: 'EFECTIVO', referencia: 'REC-12' });
        else assert.equal(value.pago, undefined);
        if (options.checkoutDelayMs) await new Promise(resolve => setTimeout(resolve, options.checkoutDelayMs));
        if (options.fail) return send({ codigo: 'FACTURA_ERROR', mensaje: 'No se pudo emitir la factura; no se cobró el pago.' }, 409);
        if (account.saldo > 0) account.pagos.push({ id: 3, fechaHora: date, metodo: value.pago!.metodo, monto: account.saldo, estado: 'APROBADO', referencia: value.pago!.referencia ?? null, responsable: 'Recepción' });
        account.totalPagosAprobados = account.totalCargosVigentes;
        Object.assign(account, { saldo: 0, estadoCuenta: 'CERRADA', estadoReserva: 'FINALIZADA', facturaId: 1 });
        invoice = {
          id: 1, estado: 'EMITIDA', serie: 'VS-A', numero: 1, emitidaEn: date, codigoReserva: accountCode,
          hotel: { nombre: 'Hotel de prueba', nombreComercial: 'Hotel del API', razonSocial: 'Empresa del API', nit: '1234567-9', direccionFiscal: 'Dirección fiscal de prueba', correo: 'hotel@example.test', telefono: '55550000' },
          comprador: value.comprador, cargos: account.cargos.filter(item => item.estado === 'VIGENTE'), pagos: account.pagos.filter(item => item.estado === 'APROBADO'),
          total: account.totalCargosVigentes, leyendaIva: 'IVA incluido', leyendaLegal: 'Factura de demostración — no válida ante la SAT',
        };
        return send(structuredClone({ codigoReserva: accountCode, estadoReserva: 'FINALIZADA', estadoCuenta: 'CERRADA', saldo: 0, factura: invoice }));
      }
      if (path === '/api/v1/facturas/1' && method === 'GET') return invoice ? send(structuredClone(invoice)) : send({ mensaje: 'Todavía no existe una factura emitida para esta cuenta.' }, 404);
      throw new Error(`Petición no prevista en el mock: ${method} ${path}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(message); return send({ mensaje: message }, 500);
    }
  }
  return { dispatch, snapshot, configure, reset };
}
