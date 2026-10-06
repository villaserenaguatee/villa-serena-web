import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import ts from 'typescript';
const require = createRequire(import.meta.url);
const EmailFlow = () => null, Logo = () => null;
function nodes(node: any): any[] {
  if (!node || typeof node !== 'object') return [];
  if (Array.isArray(node)) return node.flatMap(nodes);
  return [node, ...nodes(node.props?.children)];
}
function harness(file: string, imports: Record<string, unknown>, entry = "default", props = {}) {
  const hooks: any[] = [], effects: (() => void)[] = [];
  let cursor = 0;
  const react = {
    useState(initial: any) {
      const index = cursor++;
      if (!(index in hooks)) hooks[index] = typeof initial === 'function' ? initial() : initial;
      return [hooks[index], (value: any) => { hooks[index] = typeof value === 'function' ? value(hooks[index]) : value; }];
    },
    useRef(initial: any) { const index = cursor++; if (!(index in hooks)) hooks[index] = { current: initial }; return hooks[index]; },
    useEffect(callback: () => void, deps: unknown[]) {
      const index = cursor++, previous = hooks[index];
      if (!previous || deps.some((value, i) => value !== previous[i])) { hooks[index] = deps; effects.push(callback); }
    },
  };
  const output = { exports: {} as any };
  const source = readFileSync(file, 'utf8') + (entry === 'default' ? '' : `\nexport { ${entry} };`);
  vm.runInNewContext(ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, { module: output, exports: output.exports, URLSearchParams, AbortController,
    window: { addEventListener() {}, removeEventListener() {} },
    require: (name: string) => name === 'react' ? react : name === 'react/jsx-runtime' ? require(name) : imports[name] ?? (() => null) });
  return { render() { cursor = 0; return nodes(output.exports[entry](props)); }, flush() { for (const effect of effects.splice(0)) effect(); } };
}
const tick = () => new Promise<void>(resolve => setImmediate(resolve));

test('public email flow uses draft identity with an existing verified guest session, in both languages', () => {
  for (const en of [false, true]) {
    const pushed: string[] = [], saved: string[][] = [];
    const page = harness('src/app/(public)/reservar/verificar/page.tsx', {
      'next/navigation': { useRouter: () => ({ push: (url: string) => pushed.push(url) }), useSearchParams: () => new URLSearchParams('draft=public-attempt&slug=test') },
      'next-intl': { useTranslations: () => (key: string) => key },
      '@/components/common/VillaSerenaLogo': { default: Logo },
      '@/components/common/EmailVerificationFlow': { default: EmailFlow },
      '@/components/common/PublicLanguageToggle': { usePublicLanguage: () => ({ en }) },
      '@/features/huesped/hooks/useCurrentGuest': { useCurrentGuest: () => ({ correo: 'session@example.test', correoVerificacion: { correo: 'session@example.test', estado: 'verificado' } }) },
      '@/lib/bookingDraft': { readBookingDraft: () => ({ params: 'correo=booking@example.test' }), updateDraftEmail: (...args: string[]) => saved.push(args), BookingAttemptPendingError: class extends Error {} },
    });
    page.render(); page.flush();
    let view = page.render(), flow = view.find(n => n.type === EmailFlow);
    assert.equal(flow.props.correo, 'booking@example.test'); assert.equal(flow.props.verificado, false);
    view.find(n => n.type === 'button' && n.props.children === (en ? 'Continue to booking (email pending)' : 'Continuar a la reserva (correo pendiente)')).props.onClick();
    assert.equal(pushed.pop(), '/reservar/pago?draft=public-attempt&slug=test');
    flow.props.onCambiar(); view = page.render();
    view.find(n => n.type === 'input').props.onChange({ target: { value: 'changed@example.test' } });
    page.render().find(n => n.type === 'form').props.onSubmit({ preventDefault() {} });
    assert.deepEqual(saved, [['public-attempt', 'changed@example.test']]);
    assert.equal(page.render().find(n => n.type === EmailFlow).props.correo, 'changed@example.test');
    page.render().find(n => n.type === EmailFlow).props.onVolver();
    assert.equal(pushed.pop(), '/reservar/datos?draft=public-attempt&slug=test');
  }
});
test('expired public draft cannot borrow the signed-in guest email or continue', () => {
  const page = harness('src/app/(public)/reservar/verificar/page.tsx', {
    'next/navigation': { useRouter: () => ({ push() {} }), useSearchParams: () => new URLSearchParams('draft=expired') },
    'next-intl': { useTranslations: () => (key: string) => key },
    '@/components/common/PublicLanguageToggle': { usePublicLanguage: () => ({ en: false }) },
    '@/features/huesped/hooks/useCurrentGuest': { useCurrentGuest: () => ({ correo: 'session@example.test' }) },
    '@/lib/bookingDraft': { readBookingDraft: () => null, BookingAttemptPendingError: class extends Error {} },
  });
  page.render(); page.flush(); const view = page.render();
  assert.ok(view.some(n => n.props?.role === 'alert')); assert.ok(!view.some(n => n.type === EmailFlow));
  assert.ok(!view.some(n => n.type === 'button' && String(n.props.children).includes('Continuar')));
});
test('profile verification without a public draft preserves session verification and return to portal', () => {
  const pushed: string[] = [];
  const page = harness('src/app/(public)/reservar/verificar/page.tsx', {
    'next/navigation': { useRouter: () => ({ push: (url: string) => pushed.push(url) }), useSearchParams: () => new URLSearchParams() },
    'next-intl': { useTranslations: () => (key: string) => key },
    '@/components/common/EmailVerificationFlow': { default: EmailFlow },
    '@/components/common/PublicLanguageToggle': { usePublicLanguage: () => ({ en: false }) },
    '@/features/huesped/hooks/useCurrentGuest': { useCurrentGuest: () => ({ correo: 'session@example.test', correoVerificacion: { correo: 'session@example.test', estado: 'verificado' } }) },
    '@/lib/bookingDraft': { readBookingDraft: () => null, BookingAttemptPendingError: class extends Error {} },
  });
  page.render(); page.flush(); const flow = page.render().find(n => n.type === EmailFlow);
  assert.equal(flow.props.verificado, true); assert.equal(flow.props.correo, 'session@example.test');
  flow.props.onVolver(); assert.equal(pushed.pop(), '/huesped');
});
test('failed status query retries GET and failed copy recovery reports error without new creation', async () => {
  let calls = 0, recoveryCalls = 0;
  const result = { mode: 'demo', code: 'RES-TEST', status: 'confirmed', paymentMethod: 'hotel', paymentStatus: 'unpaid', total: 840 };
  const viewPage = harness('src/app/(public)/reservar/confirmacion/page.tsx', {
    'next/navigation': { useRouter: () => ({ push() {} }), useSearchParams: () => new URLSearchParams('code=RES-TEST&draft=draft') },
    'next-intl': { useTranslations: () => (key: string) => key },
    '@/i18n/UiText': { UiText: () => null }, '@/components/common/VillaSerenaLogo': { default: Logo },
    'lucide-react': { CheckCircle2: () => null },
    '@/components/common/PublicLanguageToggle': { usePublicLanguage: () => ({ en: false }) },
    '@/store/reservationStore': { leerReservas: () => [], RESERVAS_EVENT: 'res' },
    '@/store/guestStore': { leerHuespedes: () => [], HUESPEDES_EVENT: 'guests' },
    '@/store/roomStore': { leerHabitaciones: () => [], HABITACIONES_EVENT: 'rooms' },
    '@/lib/publicBooking': {
      getBookingResult: async () => { calls++; if (calls === 1) throw Error('network'); return result; },
      recoverBookingCopy: async () => { recoveryCalls++; throw Error('quota'); },
    },
  }, 'BffConfirmation', { code: 'RES-TEST' });
  viewPage.render(); viewPage.flush(); await tick();
  assert.ok(viewPage.render().some(n => n.props?.children === 'resultUnavailable'));
  viewPage.render().find(n => n.type === 'button' && n.props.children === 'Reintentar consulta').props.onClick();
  viewPage.render(); viewPage.flush(); await tick(); assert.equal(calls, 2);
  const retry = viewPage.render().find(n => n.type === 'button' && n.props.children === 'Reintentar copia local');
  retry.props.onClick(); retry.props.onClick(); await tick();
  assert.equal(recoveryCalls, 1); assert.ok(viewPage.render().some(n => n.props?.role === 'alert' && n.props.children === 'copyUnavailable'));
  assert.ok(viewPage.render().some(n => n.props?.children === 'RES-TEST'));
});
