const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const storage = new Map();
const events = new Map();
const localStorage = { getItem: k => storage.get(k) ?? null, setItem: (k, v) => storage.set(k, v), removeItem: k => storage.delete(k) };
const window = { dispatchEvent: e => { for (const fn of events.get(e.type) ?? []) fn(e); } };
class Event { constructor(type) { this.type = type; } }
class CustomEvent extends Event { constructor(type, options) { super(type); this.detail = options?.detail; } }
function runtime() {
  const cache = new Map();
  function load(file) {
    file = path.resolve(file);
    if (cache.has(file)) return cache.get(file).exports;
    const module = { exports: {} }; cache.set(file, module);
    const source = fs.readFileSync(file, 'utf8');
    const context = { module, exports: module.exports, window, localStorage, Event, CustomEvent, console,
      crypto: require('node:crypto').webcrypto,
      require: name => {
        if (!name.startsWith('.') && !name.startsWith('@/')) return require(name);
        const root = name.startsWith('@/') ? path.resolve('src', name.slice(2)) : path.resolve(path.dirname(file), name);
        const resolved = [root + '.ts', root + '.tsx', root + '/index.ts'].find(fs.existsSync);
        assert.ok(resolved, name); return load(resolved);
      } };
    vm.runInNewContext(ts.transpileModule(source, { compilerOptions: {
      target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX,
    } }).outputText, context, { filename: file });
    return module.exports;
  }
  return load;
}
const source = fs.readFileSync('src/features/huesped/pages/HuespedApp.tsx', 'utf8');
const ast = ts.createSourceFile('app.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let selector, guard;
function visit(n) {
  if (ts.isFunctionDeclaration(n) && n.name?.text === 'seleccionarEstanciaHuesped') selector = n;
  if (ts.isIfStatement(n) && n.expression.getText(ast).startsWith('dependeHabitacion &&')) guard = n.expression.getText(ast);
  ts.forEachChild(n, visit);
}
visit(ast);
const selected = {}; vm.createContext(selected);
vm.runInContext(ts.transpileModule(selector.getText(ast).replace(/^export /, ''), { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText, selected);
const pending = { id: 'portal-RES-1201', codigo: 'RES-1201', huespedId: 'hu-ana', estado: 'pendiente', habitacionId: null,
  fechaEntrada: runtime()('src/data/pms.ts').fechaHoyISO(), fechaSalida: runtime()('src/data/pms.ts').fechaRelativaISO(3), tipoHabitacion: 'Standard', personas: 1, servicios: [], pagos: [], creadoEn: '2026-10-01T10:00:00Z' };
const ended = { ...pending, id: 're-7', codigo: 'VS-2026-00995', estado: 'finalizada', checkOutEn: '2026-08-06T10:45:00Z' };
const room = { id: 'integration-room', numero: '999', piso: 1, tipo: 'Standard', capacidad: 2, precioNoche: 420, estado: 'disponible' };
localStorage.setItem('vs-reservas', JSON.stringify([pending, ended]));
localStorage.setItem('vs-huespedes', JSON.stringify([{ id: 'hu-ana', nombre: 'Ana Morales' }]));
localStorage.setItem('vs-habitaciones', JSON.stringify([room]));
const guestBefore = localStorage.getItem('vs-huespedes');
// Guardar cambios debe persistir antes de cualquier efecto de React.
const receptionSource = fs.readFileSync('src/features/recepcion/pages/RecepcionApp.tsx', 'utf8');
const receptionAst = ts.createSourceFile('reception.tsx', receptionSource, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let modify;
function findModify(n) { if (ts.isFunctionDeclaration(n) && n.name?.text === 'modificarReserva') modify = n; ts.forEachChild(n, findModify); }
findModify(receptionAst);
const preLoad = runtime(); const preStore = preLoad('src/store/reservationStore.ts');
const changesContext = { leerReservas: preStore.leerReservas, upsertReserva: preStore.upsertReserva,
  setReservas() {}, libera() {}, reservaHabitacionSiLibre() {} };
vm.createContext(changesContext);
vm.runInContext(ts.transpileModule(modify.getText(receptionAst), { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText, changesContext);
changesContext.modificarReserva(pending.id, { fechaEntrada: pending.fechaEntrada, fechaSalida: pending.fechaSalida, personas: 1, adultos: 1, ninos: 0, habitacionId: room.id });
assert.equal(JSON.parse(localStorage.getItem('vs-reservas'))[0].habitacionId, room.id);
assert.equal(runtime()('src/store/reservationStore.ts').leerReservas()[0].estado, 'confirmada');
// Restaurar solo el fixture simulado para probar por separado la seleccion del Resumen.
localStorage.setItem('vs-reservas', JSON.stringify([pending, ended]));

let load = runtime(); let store = load('src/store/reservationStore.ts');
const assignment = load('src/store/reservationAssignment.ts');
assert.ok(fs.readFileSync('src/features/recepcion/pages/RecepcionApp.tsx', 'utf8').includes('asignarHabitacionReserva(reservaId, habitacionId)'));
let portal;
events.set(store.RESERVAS_EVENT, [() => portal = selected.seleccionarEstanciaHuesped(store.leerReservas(), 'hu-ana')]);
portal = selected.seleccionarEstanciaHuesped(store.leerReservas(), 'hu-ana');
assert.equal(portal.id, pending.id); assert.equal(portal.habitacionId, null);
assert.equal(store.completarCheckInReserva(pending.id, 'recepcion'), undefined);
assert.equal(assignment.asignarHabitacionReserva(pending.id, 'missing'), undefined);
let reservation = assignment.asignarHabitacionReserva(pending.id, room.id);
const persistedAssigned = JSON.parse(localStorage.getItem('vs-reservas')).find(r => r.id === pending.id);
assert.deepEqual(persistedAssigned, { ...pending, habitacionId: room.id, estado: 'confirmada' });
load = runtime(); store = load('src/store/reservationStore.ts');
reservation = store.leerReservas().find(r => r.id === pending.id);
assert.equal(reservation.habitacionId, room.id);
assert.equal(reservation.estado, 'confirmada');
assert.equal(reservation.estado, 'confirmada'); assert.equal(reservation.habitacionId, room.id);
assert.equal(reservation.checkInEn, undefined); assert.equal(portal.habitacionId, room.id);
assert.equal(load('src/store/roomStore.ts').leerHabitaciones()[0].estado, 'reservada');
function blocked(r, section) {
  return vm.runInNewContext(guard, { dependeHabitacion: ['restaurante','servicios','habitacion','checkin'].includes(section),
    requiereEstanciaActiva: ['restaurante','servicios'].includes(section),
    habitacion: r.habitacionId ? room : undefined, reserva: r });
}
assert.equal(blocked(pending, 'checkin'), true);
assert.equal(blocked(reservation, 'checkin'), false);
assert.equal(blocked(reservation, 'restaurante'), true);
assert.equal(blocked(reservation, 'habitacion'), false);
reservation = store.completarCheckInReserva(pending.id, 'recepcion');
assert.equal(reservation.estado, 'en-curso'); assert.ok(Number.isFinite(Date.parse(reservation.checkInEn)));
assert.equal(portal.estado, 'en-curso'); assert.equal(store.completarCheckInReserva(pending.id, 'recepcion'), undefined);
assert.equal(load('src/store/roomStore.ts').leerHabitaciones()[0].estado, 'ocupada');
load = runtime(); store = load('src/store/reservationStore.ts');
portal = selected.seleccionarEstanciaHuesped(store.leerReservas(), 'hu-ana');
assert.equal(portal.id, pending.id); assert.equal(portal.habitacionId, room.id);
for (const section of ['restaurante','servicios','habitacion','checkin']) assert.equal(blocked(portal, section), false);
const checkout = store.completarCheckOutReserva(pending.id, 'recepcion');
assert.equal(checkout.estado, 'finalizada'); assert.ok(checkout.checkOutEn);
assert.equal(load('src/store/roomStore.ts').leerHabitaciones()[0].estado, 'en-limpieza');
const after = localStorage.getItem('vs-reservas'); load = runtime(); store = load('src/store/reservationStore.ts');
assert.equal(store.leerReservas().find(r => r.id === pending.id).checkOutEn, checkout.checkOutEn);
assert.equal(store.leerReservas().find(r => r.id === pending.id).estado, 'finalizada');
assert.equal(store.completarCheckOutReserva(pending.id, 'recepcion'), undefined);
assert.equal(localStorage.getItem('vs-reservas'), after);
assert.equal(store.leerReservas().length, 2); assert.equal(localStorage.getItem('vs-huespedes'), guestBefore);
assert.deepEqual(JSON.parse(localStorage.getItem('vs-reservas'))[1], ended);
console.log('PASS: asignacion real, eventos, check-in, reconstruccion, guards, check-out e idempotencia; sin duplicados ni cambios a huesped/historial.');
