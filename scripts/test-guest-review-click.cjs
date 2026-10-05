const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const storage = new Map();
let states = [], cursor = 0, en = false, effects = [];
const hooks = {
  useState(initial) { const i = cursor++; if (!(i in states)) states[i] = typeof initial === 'function' ? initial() : initial;
    return [states[i], value => states[i] = typeof value === 'function' ? value(states[i]) : value]; },
  useEffect(fn) { effects.push(fn); },
};
const utils = new Proxy({ dinero: n => String(n), formatoPuntos: String, correoValido: () => true, CATEGORIAS_CARGO: [], puntosDeMonto: () => 0, montoDePuntos: () => 0 }, { get: (t, k) => t[k] ?? String(k) });
const moduleResult = { exports: {} };
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/features/huesped/pages/CuentaHuesped.tsx', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
}).outputText, {
  module: moduleResult, exports: moduleResult.exports,
  localStorage: { getItem: k => storage.get(k) ?? null, setItem: (k, v) => storage.set(k, v) },
  window: { dispatchEvent() {} }, Event: class {},
  require(name) {
    if (name === 'react') return hooks;
    if (name === 'react/jsx-runtime') return require(name);
    if (name.includes('PublicLanguageToggle')) return { usePublicLanguage: () => ({ en }) };
    if (name.includes('UiText')) return { UiText: 'UiText', useUiText: () => x => x };
    if (name === 'next-intl') return { useTranslations: () => x => x };
    if (name.includes('roomServiceSync')) return { filtrarCargosLegacyRestaurante: cargos => cargos };
    if (name.includes('huespedUtils')) return utils;
    if (name === '@/data/pms') return { formatoFecha: x => x, formatoFechaHora: x => x };
    return {};
  },
});
const props = {
  huesped: { id: 'hu-ana', nombre: 'Ana Morales', correo: 'guest@example.com' },
  reserva: { id: 'portal-RES-1201', codigo: 'RES-1201', huespedId: 'hu-ana', estado: 'finalizada',
    fechaEntrada: '2026-10-02', fechaSalida: '2026-10-05', checkOutEn: new Date().toISOString(), servicios: [], pagos: [] },
  habitacion: undefined, cargos: [], cuenta: { extras: 0, noches: 3, precioNoche: 420, alojamiento: 1260, descuento: 0, total: 1260, pagado: 1260, saldo: 0 },
  fiscales: { nombre: '', nit: '', correo: '' }, puntos: 0, estanciaCerrada: true,
};
function render(overrides = {}) { cursor = 0; effects = []; const tree = moduleResult.exports.default({ ...props, ...overrides }); for (const effect of effects) effect(); return tree; }
function nodes(element) {
  if (!element || typeof element !== 'object') return [];
  if (Array.isArray(element)) return element.flatMap(nodes);
  const children = typeof element.type === 'function' ? element.type(element.props) : element.props?.children;
  return [element, ...nodes(children)];
}
for (const english of [false, true]) {
  en = english; states = [];
  let tree = render();
  const shareLabel = english ? 'Share your experience' : 'Compartir tu experiencia';
  const closeLabel = english ? 'Close review' : 'Cerrar reseña';
  assert.equal(nodes(tree).some(n => n.props?.['aria-label'] === closeLabel), false);
  const button = nodes(tree).find(n => n.type === 'button' && n.props['aria-label'] === shareLabel);
  assert.ok(button); assert.equal(button.props.disabled, undefined);
  // Ejecutar el onClick real del button renderizado, no un setter de prueba.
  button.props.onClick({ type: 'click' });
  tree = render();
  const close = nodes(tree).find(n => n.type === 'button' && n.props['aria-label'] === closeLabel);
  assert.ok(close, 'El formulario/modal existente debe renderizarse tras el clic');
  assert.equal(nodes(tree).filter(n => n.type === 'textarea').length, 2);
  assert.equal(storage.size, 0, 'Abrir la rese?a no persiste ni altera datos');
  close.props.onClick({ type: 'click' });
  assert.equal(nodes(render()).some(n => n.props?.['aria-label'] === closeLabel), false);
}
states = []; en = false;
let consumed = false;
render({ abrirResena: true, onResenaAbierta: () => consumed = true });
assert.equal(consumed, true);
assert.ok(nodes(render()).some(n => n.props?.['aria-label'] === 'Cerrar reseña'));
states = [];
assert.equal(nodes(render({ estanciaCerrada: false })).some(n => n.props?.['aria-label'] === 'Compartir tu experiencia'), false);
assert.equal(props.reserva.id, 'portal-RES-1201'); assert.equal(props.reserva.estado, 'finalizada');
console.log('PASS: clic del button real abre formulario existente ES/EN, cierre funciona, apertura no persiste y guard de finalizacion conservado.');
