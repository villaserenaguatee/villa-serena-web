const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

const components = new Map();
let current, effects = [], handlers = {}, restored = 0;
const hooks = {
  useState(initial) {
    const state = current;
    const index = state.cursor++;
    if (!(index in state.values)) state.values[index] = typeof initial === 'function' ? initial() : initial;
    return [state.values[index], value => {
      state.values[index] = typeof value === 'function' ? value(state.values[index]) : value;
    }];
  },
  useRef(initial) {
    const state = current;
    const index = state.cursor++;
    if (!(index in state.values)) state.values[index] = { current: initial };
    return state.values[index];
  },
  useEffect(fn) { effects.push(fn); },
};
class HTMLElement { focus() { restored++; } }
const document = { body: { style: { overflow: 'auto' } }, activeElement: new HTMLElement(),
  addEventListener: (name, fn) => handlers[name] = fn,
  removeEventListener: name => delete handlers[name] };
const result = { exports: {} };
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/features/recepcion/pages/DocumentosCheckIn.tsx', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
}).outputText, { module: result, exports: result.exports, document, HTMLElement,
  require(name) {
    if (name === 'react') return hooks;
    if (name === 'react-dom') return { createPortal: element => element };
    if (name === './ReceptionCloseButton') {
      const close = { exports: {} };
      vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/features/recepcion/pages/ReceptionCloseButton.tsx', 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
      }).outputText, { module: close, exports: close.exports, require });
      return close.exports;
    }
    return require(name);
  } });
const Gallery = result.exports.default;
const front = { nombre: 'frente.png', formato: 'PNG', pesoKb: 1, lado: 'frente', previewUrl: 'data:image/png;base64,cmVhbC1mcm9udA==' };
const back = { ...front, nombre: 'reverso.png', lado: 'reverso', previewUrl: 'data:image/png;base64,cmVhbC1iYWNr' };
let props = { tipoDocumento: 'DPI', checkInWeb: { documento: front, documentos: [front, back] } };
function walk(node, key = 'root') {
  if (!node || typeof node !== 'object') return [];
  if (Array.isArray(node)) return node.flatMap((child, index) => walk(child, `${key}/${child?.key ?? index}`));
  let children;
  if (typeof node.type === 'function') {
    const state = components.get(key) ?? { values: [] };
    components.set(key, state);
    state.cursor = 0;
    current = state;
    children = node.type(node.props);
  } else children = node.props?.children;
  return [node, ...walk(children, `${key}/children`)];
}
function render() {
  effects = [];
  return walk({ type: Gallery, props });
}
function text(node) {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(text).join('');
  return text(node?.props?.children ?? '');
}
function click(label) {
  const button = render().find(n => n.type === 'button' && (n.props['aria-label'] === label || text(n) === label));
  assert.ok(button, label);
  assert.ok(!button.props.disabled, label);
  button.props.onClick();
}
let tree = render();
assert.deepEqual(tree.filter(n => n.type === 'img').map(n => n.props.src), [front.previewUrl, back.previewUrl]);
assert.ok(tree.some(n => text(n) === 'Frente del DPI'));
assert.ok(tree.some(n => text(n) === 'Reverso del DPI'));
click('Ver Frente del DPI');
tree = render();
assert.ok(tree.some(n => n.props?.role === 'dialog' && n.props['aria-modal']));
assert.equal(tree.filter(n => n.type === 'img').at(-1).props.src, front.previewUrl);
const area = tree.find(n => n.props?.onPointerDown);
const viewport = { scrollLeft: 40, scrollTop: 30, setPointerCapture() {}, scrollTo(x, y) { this.scrollLeft = x; this.scrollTop = y; } };
area.props.ref.current = viewport;
const dialog = tree.find(n => n.props?.role === 'dialog');
dialog.props.ref.current = { focus() {}, querySelectorAll: () => [] };
const cleanup = effects[0]();
assert.equal(document.body.style.overflow, 'hidden');
click('Acercar imagen');
tree = render();
assert.ok(tree.some(n => n.props?.style?.width === '150%' && n.props.style.height === '150%'));
assert.match(tree.filter(n => n.type === 'img').at(-1).props.className, /object-contain/);
const enlarged = tree.find(n => n.props?.onPointerDown);
enlarged.props.onPointerDown({ currentTarget: viewport, clientX: 50, clientY: 60, pointerId: 1, preventDefault() {} });
enlarged.props.onPointerMove({ currentTarget: viewport, clientX: 20, clientY: 10 });
assert.equal(viewport.scrollLeft, 70);
assert.equal(viewport.scrollTop, 80);
enlarged.props.onPointerUp();
click('Alejar imagen');
assert.ok(render().some(n => n.props?.style?.width === '100%'));
click('Siguiente');
tree = render();
assert.equal(tree.filter(n => n.type === 'img').at(-1).props.src, back.previewUrl);
assert.ok(tree.some(n => n.props?.style?.width === '100%'));
assert.equal(viewport.scrollLeft, 0);
click('Anterior');
handlers.keydown({ key: 'Escape', preventDefault() {}, stopPropagation() {} });
assert.equal(render().some(n => n.props?.role === 'dialog'), false);
cleanup();
assert.equal(document.body.style.overflow, 'auto');
assert.ok(restored > 0);
components.clear();
click('Ver Reverso del DPI');
click('Cerrar');
assert.equal(render().some(n => n.props?.role === 'dialog'), false);

components.clear();
let requested;
props = { ...props, onSolicitarReenvio: reason => requested = reason };
tree = render();
tree.find(n => n.type === 'img' && n.props.src === back.previewUrl).props.onError();
tree = render();
assert.deepEqual(tree.filter(n => n.type === 'img').map(n => n.props.src), [front.previewUrl]);
assert.equal(tree.filter(n => n.type === 'button' && text(n) === 'Solicitar reenvío').length, 1);
click('Solicitar reenvío');
assert.match(requested, /Reverso del DPI.*reverso.png/);
assert.equal(tree.some(n => text(n) === 'JPG'), false);

components.clear();
const passport = { ...front, nombre: 'pasaporte.png', lado: 'unico' };
props = { tipoDocumento: 'Pasaporte', checkInWeb: { documento: passport, documentos: [passport] } };
tree = render();
assert.equal(tree.filter(n => n.type === 'img').length, 1);
assert.ok(tree.some(n => text(n) === 'Pasaporte'));
click('Ver Pasaporte');
click('Cerrar');
components.clear();
props = { tipoDocumento: 'DPI', checkInWeb: { documento: front } };
assert.equal(render().filter(n => n.type === 'img').length, 1);

// Reconstruir la evidencia desde JSON conserva todos los contenidos y lados.
components.clear();
props = JSON.parse(JSON.stringify({ tipoDocumento: 'DPI', checkInWeb: { documento: front, documentos: [front, back] } }));
assert.deepEqual(render().filter(n => n.type === 'img').map(n => n.props.src), [front.previewUrl, back.previewUrl]);
console.log('PASS: miniaturas DPI/pasaporte, fotografías persistentes, visor, proporciones, zoom, arrastre, navegación, X/Escape, foco y reenvío individual sin ocultar imágenes disponibles.');
