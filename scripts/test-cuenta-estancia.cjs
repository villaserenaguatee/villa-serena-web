const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const moduleResult = { exports: {} };
const storage = new Map();
const context = {
  module: moduleResult, exports: moduleResult.exports,
  require: name => name === '@/data/pms'
    ? { nochesEntre: (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000) }
    : { leerTarifas: () => ({ Standard: 420 }) },
};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/pms/cuentaEstancia.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText, context);
const calcular = moduleResult.exports.calcularCuentaEstancia;
const base = { id: 'stay', codigo: 'TEST', huespedId: 'guest', habitacionId: null,
  estado: 'pendiente', tipoHabitacion: 'Standard', fechaEntrada: '2026-10-02', fechaSalida: '2026-10-05',
  servicios: [], pagos: [], descuento: 0 };
function test(servicios, pagos, expected) {
  const reserva = { ...base, servicios, pagos };
  const before = JSON.stringify(reserva);
  storage.set('vs-reservas', before);
  for (let reload = 0; reload < 2; reload++) {
    const cuenta = calcular(JSON.parse(storage.get('vs-reservas')), null);
    assert.equal(cuenta.alojamiento, 1260);
    assert.equal(cuenta.anticipo, 1260);
    assert.equal(cuenta.saldo, expected);
  }
  assert.equal(JSON.stringify(reserva), before);
  assert.equal(storage.get('vs-reservas'), before);
}
const servicio = [{ id: 'service', cantidad: 1, precioUnitario: 200 }];
test([], [], 0);
test(servicio, [], 200);
test(servicio, [{ id: 'payment', destino: 'consumos', monto: 50 }], 150);
test(servicio, [{ id: 'booking', destino: 'alojamiento', monto: 1260 }], 200);
test(servicio, [{ id: 'legacy-booking', monto: 1260 }, { id: 'portal-consumption', monto: 50 }], 200);
test(servicio, [{ id: 'legacy-total', monto: 1310 }], 200);
test(servicio, [{ id: 'ambiguous', monto: 50 }], 200);
assert.equal(calcular({ ...base, pagos: [{ id: 'ambiguous', monto: 50 }] }, null).pagosSinClasificar, 50);
// Ejercitar el selector real con reservas equivalentes a las descritas por el usuario.
const appSource = fs.readFileSync('src/features/huesped/pages/HuespedApp.tsx', 'utf8');
const ast = ts.createSourceFile('app.tsx', appSource, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let selector;
function visit(node) {
  if (ts.isFunctionDeclaration(node) && node.name?.text === 'seleccionarEstanciaHuesped') selector = node;
  ts.forEachChild(node, visit);
}
visit(ast);
const selectionContext = {};
vm.createContext(selectionContext);
vm.runInContext(ts.transpileModule(selector.getText(ast).replace(/^export /, ''), {
  compilerOptions: { target: ts.ScriptTarget.ES2022 },
}).outputText, selectionContext);
const pending = { ...base };
const ended = { ...base, id: 'ended', codigo: 'ENDED', estado: 'finalizada', habitacionId: 'room' };
assert.equal(selectionContext.seleccionarEstanciaHuesped([ended, pending], 'guest').id, pending.id);
const active = { ...base, id: 'active', codigo: 'ACTIVE', estado: 'en-curso', habitacionId: 'room' };
assert.equal(selectionContext.seleccionarEstanciaHuesped([pending, active, ended], 'guest').id, active.id);
assert.ok(appSource.includes("const dependeHabitacion = ['restaurante', 'servicios', 'habitacion', 'checkin'].includes(seccion)"));
console.log('PASS: 7 escenarios financieros, recarga sin mutaciones, selector y guard de habitacion conservado.');
