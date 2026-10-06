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
    const context = { module, exports: module.exports, window, localStorage, Event, CustomEvent, console, setTimeout,
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

const document = { nombre: 'pasaporte.png', formato: 'PNG', pesoKb: 1, lado: 'unico', previewUrl: 'data:image/png;base64,aGVsbG8=' };
const guest = { id: 'hu-ana', nombre: 'Ana', correo: 'anamorales@gmail.com', tipoDocumento: 'Pasaporte', documento: 'ABC123' };
const room = { id: 'room', numero: '101', estado: 'reservada', capacidad: 2 };
const reservation = { id: 'reservation', codigo: 'PORTAL-1', huespedId: guest.id, habitacionId: room.id,
  estado: 'confirmada', fechaEntrada: '2026-10-03', fechaSalida: '2026-10-05', personas: 1,
  pagos: [{ id: 'payment', monto: 100 }], servicios: [{ id: 'service' }], acompanantes: [{ nombre: 'Luis' }],
  actividadPortal: [{ id: 'activity' }],
  checkInWeb: { estado: 'pendiente', documento: document, documentos: [document], terminosAceptados: true,
    enviadoEn: '2026-10-03T10:00:00Z', peticiones: [], notaPeticiones: '' } };
function seed(r = reservation, h = room, g = guest) {
  storage.clear();
  localStorage.setItem('vs-reservas', JSON.stringify([r]));
  localStorage.setItem('vs-huespedes', JSON.stringify([g]));
  localStorage.setItem('vs-habitaciones', JSON.stringify([h]));
  return runtime()('src/store/reservationStore.ts');
}
let store = seed();
let portal;
events.set(store.RESERVAS_EVENT, [() => portal = selected.seleccionarEstanciaHuesped(store.leerReservas(), guest.id)]);
assert.equal(store.errorActivacionCheckInPortal(reservation.id), undefined);
assert.equal(store.completarCheckInReserva(reservation.id, 'portal').estado, 'en-curso');
assert.equal(JSON.parse(localStorage.getItem('vs-habitaciones'))[0].estado, 'ocupada');
assert.equal(portal.id, reservation.id);
assert.equal(portal.estado, 'en-curso');
store = runtime()('src/store/reservationStore.ts');
const reloaded = store.leerReservas();
assert.equal(reloaded.length, 1);
assert.equal(reloaded[0].estado, 'en-curso');
assert.equal(reloaded[0].habitacionId, room.id);
assert.equal(store.checkInWebPendiente(reloaded[0]), false);
assert.equal(store.completarCheckInReserva(reservation.id, 'portal'), undefined);
for (const field of ['pagos', 'servicios', 'acompanantes', 'actividadPortal']) {
  assert.equal(JSON.stringify(reloaded[0][field]), JSON.stringify(reservation[field]));
}
assert.equal(reloaded[0].checkInWeb.documento.previewUrl, document.previewUrl);
assert.equal(localStorage.getItem('vs-huespedes'), JSON.stringify([guest]));
for (const [r, message] of [
  [{ ...reservation, habitacionId: null }, /asigna una habitación/],
  [{ ...reservation, checkInWeb: undefined }, /check-in enviado/],
  [{ ...reservation, checkInWeb: { ...reservation.checkInWeb, terminosAceptados: false } }, /términos/],
  [{ ...reservation, checkInWeb: { ...reservation.checkInWeb, documentos: [{ ...document, previewUrl: undefined }] } }, /evidencias/],
  [{ ...reservation, checkInWeb: { ...reservation.checkInWeb, estado: 'rechazado' } }, /check-in enviado/],
]) {
  store = seed(r);
  const before = localStorage.getItem('vs-reservas');
  assert.match(store.errorActivacionCheckInPortal(r.id), message);
  assert.equal(store.completarCheckInReserva(r.id, 'portal'), undefined);
  assert.equal(localStorage.getItem('vs-reservas'), before);
  assert.equal(JSON.parse(localStorage.getItem('vs-habitaciones'))[0].estado, 'reservada');
}
store = seed(reservation, { ...room, estado: 'mantenimiento' });
assert.match(store.errorActivacionCheckInPortal(reservation.id), /mantenimiento/);
store = seed(reservation, room, { ...guest, tipoDocumento: 'DPI' });
assert.match(store.errorActivacionCheckInPortal(reservation.id), /evidencias/);
store = seed({ ...reservation, checkInWeb: { ...reservation.checkInWeb, documentos: [
  { ...document, lado: 'frente' }, { ...document, lado: 'reverso' },
] } }, room, { ...guest, tipoDocumento: 'DPI' });
assert.equal(store.completarCheckInReserva(reservation.id, 'portal').estado, 'en-curso');
store = seed();
const receptionAst = ts.createSourceFile('reception.tsx', fs.readFileSync('src/features/recepcion/pages/RecepcionApp.tsx', 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let activate, reject, reconcileRooms;
function findActivate(n) {
  if (ts.isFunctionDeclaration(n) && n.name?.text === 'validarCheckInWeb') activate = n;
  if (ts.isFunctionDeclaration(n) && n.name?.text === 'rechazarCheckInWeb') reject = n;
  if (ts.isArrowFunction(n) && ts.isCallExpression(n.parent) && n.parent.expression.getText(receptionAst) === 'setHabitaciones' && n.getText(receptionAst).includes('const asignadas =')) reconcileRooms = n;
  ts.forEachChild(n, findActivate);
}
findActivate(receptionAst);
let receptionReservations, receptionRooms;
const handler = { errorActivacionCheckInPortal: store.errorActivacionCheckInPortal,
  completarCheckInReserva: store.completarCheckInReserva, leerReservas: store.leerReservas,
  leerHabitaciones: runtime()('src/store/roomStore.ts').leerHabitaciones, aplicarTarifasHabitaciones: x => x,
  setReservas: x => receptionReservations = x, setHabitaciones: x => receptionRooms = x,
  window: { alert: message => assert.fail(message) } };
vm.createContext(handler);
vm.runInContext(ts.transpileModule(activate.getText(receptionAst), { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText, handler);
handler.validarCheckInWeb(reservation.id);
assert.equal(receptionReservations[0].estado, 'en-curso');
assert.equal(receptionRooms[0].estado, 'ocupada');
assert.match(fs.readFileSync('src/features/recepcion/pages/DetalleReserva.tsx', 'utf8'), /onClick=\{\(\) => onValidarCheckInWeb\(reserva.id\)\}/);

const reconcile = { reservas: [{ ...reservation, id: 'future' }, { ...reservation, estado: 'en-curso' }] };
vm.createContext(reconcile);
vm.runInContext('reconcile = ' + ts.transpileModule(reconcileRooms.getText(receptionAst), { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText, reconcile);
assert.equal(reconcile.reconcile([room])[0].estado, 'ocupada');

store = seed();
const rejection = { leerReservas: store.leerReservas, upsertReserva: store.upsertReserva,
  huespedes: [guest], ahoraISO: () => '2026-10-03T12:00:00Z', setReservas() {} };
vm.createContext(rejection);
vm.runInContext(ts.transpileModule(reject.getText(receptionAst), { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText, rejection);
rejection.rechazarCheckInWeb(reservation.id, 'Documento ilegible');
const rejected = store.leerReservas()[0];
assert.equal(rejected.estado, 'confirmada');
assert.equal(rejected.habitacionId, room.id);
assert.equal(rejected.checkInWeb.estado, 'rechazado');
assert.equal(JSON.stringify(rejected.checkInWeb.documentos), JSON.stringify(reservation.checkInWeb.documentos));
assert.equal(store.completarCheckInReserva(reservation.id, 'portal'), undefined);

const uploadAst = ts.createSourceFile('checkin.tsx', fs.readFileSync('src/features/huesped/pages/CheckInWeb.tsx', 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let receive;
function findReceive(n) {
  if (ts.isFunctionDeclaration(n) && n.name?.text === 'recibirArchivo') receive = n;
  ts.forEachChild(n, findReceive);
}
findReceive(uploadAst);
let uploaded;
const upload = { FORMATOS: { png: 'PNG' }, PESO_MAXIMO_KB: 5120,
  setErrorArchivo: x => assert.equal(x, ''), setArchivo() {}, setDocumentoFrente() {}, setDocumentoReverso() {},
  setDocumentoUnico: x => uploaded = x,
  FileReader: class { readAsDataURL(file) { this.result = document.previewUrl; this.onload(); } } };
vm.createContext(upload);
vm.runInContext(ts.transpileModule(receive.getText(uploadAst), { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText, upload);
upload.recibirArchivo([{ name: document.nombre, size: 1024 }], 'unico');
assert.equal(JSON.parse(JSON.stringify(uploaded)).previewUrl, document.previewUrl);

const guestAppAst = ts.createSourceFile('guest.tsx', fs.readFileSync('src/features/huesped/pages/HuespedApp.tsx', 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let submitDocuments;
function findSubmit(n) {
  if (ts.isFunctionDeclaration(n) && n.name?.text === 'completarCheckIn') submitDocuments = n;
  ts.forEachChild(n, findSubmit);
}
findSubmit(guestAppAst);
store = seed({ ...reservation, checkInWeb: { ...reservation.checkInWeb, estado: 'rechazado' } });
const dpiDocuments = [{ ...document, lado: 'frente' }, { ...document, nombre: 'reverso.png', lado: 'reverso', previewUrl: 'data:image/png;base64,cmV2ZXJzbw==' }];
let updatedPortal;
const submission = { leerReservas: store.leerReservas, upsertReserva: store.upsertReserva,
  reserva: reservation, huesped: guest, ahoraISO: () => '2026-10-03T13:00:00Z',
  setReserva: value => updatedPortal = value, mostrarAviso() {} };
vm.createContext(submission);
vm.runInContext(ts.transpileModule(submitDocuments.getText(guestAppAst), { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText, submission);
submission.completarCheckIn({ documento: dpiDocuments[0], documentos: dpiDocuments, peticiones: [], notaPeticiones: '' });
assert.equal(updatedPortal.checkInWeb.estado, 'pendiente');
assert.equal(JSON.stringify(runtime()('src/store/reservationStore.ts').leerReservas()[0].checkInWeb.documentos), JSON.stringify(dpiDocuments));
assert.equal(store.leerReservas().length, 1);
store = seed({ ...reservation, checkInWeb: { ...reservation.checkInWeb, estado: 'rechazado' } });
updatedPortal = undefined;
submission.upsertReserva = () => { throw new Error('QuotaExceededError'); };
assert.throws(() => submission.completarCheckIn({ documento: dpiDocuments[0], documentos: dpiDocuments, peticiones: [], notaPeticiones: '' }), /Quota/);
assert.equal(updatedPortal, undefined);
assert.equal(store.leerReservas()[0].checkInWeb.estado, 'rechazado');
async function verifyGuestAccess() {
  store = seed();
  const load = runtime();
  const access = load('src/store/guestAccountAccess.ts');
  const auth = load('src/lib/auth/local-auth.ts');
  access.guardarAccesoPostCheckout(guest.correo, '2026-01-01T10:00:00Z');
  assert.equal(access.cuentaHuespedExpirada(guest.correo), true);
  assert.equal(store.completarCheckInReserva(reservation.id, 'portal').estado, 'en-curso');
  assert.equal(access.cuentaHuespedExpirada(guest.correo), false);
  assert.equal(access.leerAccesoPostCheckout(guest.correo), null);
  const account = await auth.loginLocal(guest.correo, 'demo123');
  assert.equal(account.guestId, guest.id);
  assert.equal(account.role, 'huesped');
  assert.equal(selected.seleccionarEstanciaHuesped(store.leerReservas(), account.guestId).id, reservation.id);
  store = seed();
  access.guardarAccesoPostCheckout('otro@example.com', '2026-01-01T10:00:00Z');
  const otherAccess = localStorage.getItem(access.GUEST_ACCESS_KEY);
  assert.equal(store.completarCheckInReserva(reservation.id, 'portal').estado, 'en-curso');
  assert.equal(localStorage.getItem(access.GUEST_ACCESS_KEY), otherAccess);
  store = seed({ ...reservation, habitacionId: null });
  access.guardarAccesoPostCheckout(guest.correo, '2026-01-01T10:00:00Z');
  assert.equal(store.completarCheckInReserva(reservation.id, 'portal'), undefined);
  assert.equal(access.cuentaHuespedExpirada(guest.correo), true);
  console.log('PASS: casos de activación del portal, handler de Recepción, carga persistente, acceso/login del huésped, evidencias, términos, DPI, preservación de datos e idempotencia.');
}
async function verifyReception() {
  await verifyGuestAccess();
  const load = runtime();
  const dates = load('src/data/pms.ts');
  const today = dates.fechaHoyISO();
  const departure = dates.fechaRelativaISO(2);
  const current = { ...reservation, fechaEntrada: today, fechaSalida: departure, checkInWeb: undefined };
  for (const state of ['en-limpieza', 'mantenimiento', 'ocupada']) {
    store = seed(current, { ...room, estado: state });
    const before = localStorage.getItem('vs-reservas');
    assert.match(store.errorCheckInRecepcion(current.id), /libre y limpia/);
    assert.equal(store.completarCheckInReserva(current.id, 'recepcion'), undefined);
    assert.equal(localStorage.getItem('vs-reservas'), before);
  }
  for (const invalid of [{ ...current, fechaEntrada: dates.fechaRelativaISO(1) }, { ...current, fechaSalida: today }]) {
    store = seed(invalid);
    assert.match(store.errorCheckInRecepcion(invalid.id), /entrada/);
    assert.equal(store.completarCheckInReserva(invalid.id, 'recepcion'), undefined);
  }
  store = seed(current);
  assert.equal(store.errorCheckInRecepcion(current.id), undefined);
  assert.equal(store.completarCheckInReserva(current.id, 'recepcion').estado, 'en-curso');
  assert.equal(JSON.stringify(store.leerReservas()[0].acompanantes), JSON.stringify(current.acompanantes));
  storage.clear();
  const demoRoom = { id: 'demo-room', numero: '999', piso: 1, tipo: 'Standard', capacidad: 2, precioNoche: 420, estado: 'disponible' };
  localStorage.setItem('vs-huespedes', JSON.stringify([guest]));
  localStorage.setItem('vs-habitaciones', JSON.stringify([demoRoom]));
  localStorage.setItem('vs-reservas', '[]');
  const create = runtime()('src/store/receptionReservation.ts').crearReservaRecepcionDemo;
  const input = { huespedId: guest.id, tipoHabitacion: demoRoom.tipo, fechaEntrada: today, fechaSalida: departure, personas: 2, habitacionId: null };
  const created = create(input);
  assert.equal(created.estado, 'confirmada');
  assert.equal(created.habitacionId, null);
  assert.equal(created.pagos.length, 0);
  assert.equal(JSON.parse(localStorage.getItem('vs-reservas'))[0].id, created.id);
  assert.throws(() => create(input), /disponibilidad/);
  assert.equal(JSON.parse(localStorage.getItem('vs-reservas')).length, 1);
  const afterReload = runtime()('src/store/receptionReservation.ts').crearReservaRecepcionDemo({ ...input,
    fechaEntrada: dates.fechaRelativaISO(10), fechaSalida: dates.fechaRelativaISO(12) });
  assert.notEqual(afterReload.codigo, created.codigo);
  assert.equal(JSON.parse(localStorage.getItem('vs-reservas')).length, 2);
  assert.equal(JSON.parse(localStorage.getItem('vs-reservas')).find(r => r.id === created.id).codigo, created.codigo);
  localStorage.setItem('vs-reservas', '[]');
  assert.throws(() => create({ ...input, habitacionId: 'missing' }), /disponible/);
  localStorage.setItem('vs-habitaciones', JSON.stringify([{ ...demoRoom, estado: 'mantenimiento' }]));
  assert.throws(() => create(input), /disponibilidad/);
  console.log('PASS: reserva confirmada sin habitación ni pagos, persistencia inmediata, cupo revalidado, check-in de hoy, rechazo por fechas y habitación no lista, adicionales conservados.');
}
verifyReception().catch(error => { console.error(error); process.exitCode = 1; });
