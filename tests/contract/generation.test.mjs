import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, copyFileSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync, execFileSync } from 'node:child_process';
import { verifyCheckout, readContractConfig } from '../../scripts/contrato-api.mjs';

// Real generator integration; no API, mail, payment or application records.
test('canonical generation and check reject a tampered output without overwriting it', {
  skip: !process.env.API_CONTRACT_DOCS_DIR && 'Set API_CONTRACT_DOCS_DIR to run the real generator integration',
}, t => {
  const root = mkdtempSync(join(tmpdir(), 'vs contract generation '));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, 'scripts'));
  mkdirSync(join(root, 'src/lib/api'), { recursive: true });
  copyFileSync(new URL('../../scripts/contrato-api.mjs', import.meta.url), join(root, 'scripts/contrato-api.mjs'));
  copyFileSync(new URL('../../api-contract.json', import.meta.url), join(root, 'api-contract.json'));
  const env = { ...process.env, API_CONTRACT_DOCS_DIR: resolve(process.env.API_CONTRACT_DOCS_DIR) };
  const run = (...args) => spawnSync(process.execPath, [join(root, 'scripts/contrato-api.mjs'), ...args], { env, encoding: 'utf8' });
  const generated = run(); assert.equal(generated.status, 0, generated.stderr);
  const output = join(root, 'src/lib/api/schema.d.ts'), bytes = readFileSync(output);
  assert.match(bytes.toString(), /b1e4e8ecc10d6db74c170e7bdd12a02bd31b2cc98f8e3b7060d1fee04dd38e37/);
  assert.deepEqual(bytes, readFileSync(new URL('../../src/lib/api/schema.d.ts', import.meta.url)));
  const matching = run('--check'); assert.equal(matching.status, 0, matching.stderr);
  const tampered = Buffer.concat([bytes, Buffer.from('\n// altered fixture\n')]);
  writeFileSync(output, tampered);
  assert.notEqual(run('--check').status, 0);
  assert.deepEqual(readFileSync(output), tampered);
  const manifest = join(root, 'api-contract.json'), config = JSON.parse(readFileSync(manifest, 'utf8'));
  writeFileSync(manifest, JSON.stringify({ ...config, revision: '0'.repeat(40) }));
  const wrongRevision = run(); assert.notEqual(wrongRevision.status, 0);
  assert.match(wrongRevision.stderr, /SHA fijado/);
  assert.deepEqual(readFileSync(output), tampered);
});

test('real Git checkout rejects modified contract and tools before execution', {
  skip: !process.env.API_CONTRACT_DOCS_DIR && 'Set API_CONTRACT_DOCS_DIR for the real Git checkout test',
}, t => {
  const root = mkdtempSync(join(tmpdir(), 'vs contract checkout ')), docs = join(root, 'docs');
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const { revision } = readContractConfig();
  const git = (...args) => execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  git('-c', 'core.autocrlf=false', 'clone', '--shared', '--no-checkout', resolve(process.env.API_CONTRACT_DOCS_DIR), docs);
  git('-C', docs, '-c', 'core.autocrlf=false', 'checkout', '--detach', revision);
  assert.doesNotThrow(() => verifyCheckout(docs, revision));
  for (const relative of ['openapi.yaml', 'scripts/contrato-api.mjs']) {
    const file = join(docs, relative), original = readFileSync(file);
    writeFileSync(file, Buffer.concat([original, Buffer.from('\n# modified fixture\n')]));
    assert.throws(() => verifyCheckout(docs, revision), /cambios/);
    writeFileSync(file, original);
  }
  assert.doesNotThrow(() => verifyCheckout(docs, revision));
});
