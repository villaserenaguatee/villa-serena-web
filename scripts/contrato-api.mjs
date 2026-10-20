#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync, spawnSync } from 'node:child_process';
import { parseArgs } from 'node:util';

const webRoot = fileURLToPath(new URL('../', import.meta.url));
export function readContractConfig(root = webRoot) {
  const value = JSON.parse(readFileSync(resolve(root, 'api-contract.json'), 'utf8'));
  if (value.repository !== 'villaserenaguatee/villa-serena-docs' || !/^[a-f0-9]{40}$/.test(value.revision ?? '')) {
    throw new Error('api-contract.json debe fijar villa-serena-docs y un SHA completo de 40 caracteres.');
  }
  return { repository: value.repository, revision: value.revision };
}

export function invocation(args = [], env = process.env, root = webRoot) {
  const { values, positionals } = parseArgs({ args, allowPositionals: true, options: {
    check: { type: 'boolean', default: false }, 'docs-dir': { type: 'string' },
  } });
  if (positionals.length) throw new Error('Uso: pnpm generate:api [--docs-dir RUTA] [--check]');
  const config = readContractConfig(root);
  const directory = values['docs-dir'] || env.API_CONTRACT_DOCS_DIR;
  if (!directory) throw new Error('Indica el checkout de docs con API_CONTRACT_DOCS_DIR o --docs-dir. Consulta docs/CONTRATO_API.md.');
  const docs = resolve(root, directory);
  return { docs, config, command: process.execPath, args: [
    resolve(docs, 'scripts/contrato-api.mjs'), 'types', '--output', resolve(root, 'src/lib/api/schema.d.ts'),
    '--revision', config.revision, ...(values.check ? ['--check'] : []),
  ] };
}

export function verifyCheckout(docs, revision, git = (args, options) => execFileSync('git', ['-C', docs, ...args], options)) {
  const head = git(['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  const dirty = git(['status', '--porcelain', '--untracked-files=all', '--', 'openapi.yaml', 'scripts', 'package.json', 'pnpm-lock.yaml'], { encoding: 'utf8' }).trim();
  if (head !== revision || dirty) throw new Error('Docs no corresponde al SHA fijado o tiene cambios en contrato/herramientas. No se generaron tipos.');
  const source = readFileSync(resolve(docs, 'openapi.yaml'));
  const committed = git(['show', `${revision}:openapi.yaml`], {});
  if (!source.equals(committed)) throw new Error('Los bytes del contrato difieren del commit. Usa un checkout limpio con core.autocrlf=false para conservar LF y la huella reproducible.');
}

function main() {
  const plan = invocation(process.argv.slice(2));
  verifyCheckout(plan.docs, plan.config.revision);
  const result = spawnSync(plan.command, plan.args, { cwd: dirname(plan.args[0]), stdio: 'inherit', env: process.env });
  if (result.error) throw result.error;
  if (result.signal) throw new Error(`La generación terminó por señal ${result.signal}.`);
  process.exitCode = result.status ?? 1;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try { main(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
