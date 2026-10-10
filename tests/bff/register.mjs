// Node 24 strips TypeScript itself; these hooks only resolve the app's @/ alias
// and extensionless TS imports used by Next. JSX is not loaded as a module.
import { registerHooks } from 'node:module';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = new URL('../../', import.meta.url);
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === 'next/server') return nextResolve('next/server.js', context);
    // Next enforces this boundary in builds; the Node test process has no Next runtime.
    if (specifier === 'server-only') return { url: 'data:text/javascript,export {};', shortCircuit: true };
    if (specifier.startsWith('@/') || specifier.startsWith('.')) {
      const base = specifier.startsWith('@/') ? new URL(`src/${specifier.slice(2)}`, root) : new URL(specifier, context.parentURL);
      for (const suffix of ['', '.ts']) {
        const url = new URL(base.href + suffix);
        if (url.pathname.endsWith('.ts') && existsSync(fileURLToPath(url))) return { url: url.href, shortCircuit: true };
      }
    }
    return nextResolve(specifier, context);
  },
});
