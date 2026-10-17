// Test-only TypeScript loader: no extra runtime dependency, no Next server required.
import { registerHooks } from 'node:module';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = new URL('../../', import.meta.url);
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === 'next/server') return nextResolve('next/server.js', context);
    // Next enforces this boundary in builds; the Node test process has no Next runtime.
    if (specifier === 'server-only') return { url: 'data:text/javascript,export {};', shortCircuit: true };
    if (specifier.startsWith('@/') || specifier.startsWith('.')) {
      const base = specifier.startsWith('@/') ? new URL(`src/${specifier.slice(2)}`, root) : new URL(specifier, context.parentURL);
      for (const suffix of ['', '.ts', '.tsx']) {
        const url = new URL(base.href + suffix);
        if (/\.tsx?$/.test(url.pathname) && existsSync(fileURLToPath(url))) return { url: url.href, shortCircuit: true };
      }
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (/\.tsx?$/.test(new URL(url).pathname)) {
      const source = readFileSync(new URL(url), 'utf8');
      return { format: 'module', shortCircuit: true, source: ts.transpileModule(source, {
        compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
      }).outputText };
    }
    return nextLoad(url, context);
  },
});
