import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { invocation, readContractConfig, verifyCheckout } from '../../scripts/contrato-api.mjs';

const revision = 'f30ff74fe939d467728c51c31d7aca157b3be34e';
function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'vs-contract-consumer-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  writeFileSync(join(root, 'api-contract.json'), JSON.stringify({ repository: 'villaserenaguatee/villa-serena-docs', revision }));
  return root;
}
test('manifest and local/CI invocation use the same pinned revision without shell interpolation', t => {
  const root = fixture(t), directory = 'docs con espacios';
  const cli = invocation(['--docs-dir', directory], {}, root);
  const ci = invocation(['--check'], { API_CONTRACT_DOCS_DIR: directory }, root);
  assert.equal(cli.docs, resolve(root, directory));
  assert.deepEqual(ci.args, [...cli.args, '--check']);
  assert.equal(cli.config.revision, revision);
  assert.equal(cli.args[cli.args.indexOf('--revision') + 1], revision);
  assert.equal(cli.args[cli.args.indexOf('--output') + 1], resolve(root, 'src/lib/api/schema.d.ts'));
  assert.throws(() => invocation([], {}, root), /API_CONTRACT_DOCS_DIR/);
  assert.throws(() => invocation(['--revision', 'main'], {}, root));
});
test('manifest rejects moving branches, abbreviated SHAs and other repositories', t => {
  const root = fixture(t);
  for (const value of [{ repository: 'villaserenaguatee/villa-serena-docs', revision: 'main' },
    { repository: 'villaserenaguatee/villa-serena-docs', revision: 'f30ff74' },
    { repository: 'otro/docs', revision }]) {
    writeFileSync(join(root, 'api-contract.json'), JSON.stringify(value));
    assert.throws(() => readContractConfig(root), /SHA completo/);
  }
});
test('dirty contract/tools and wrong checkout fail before running docs code', t => {
  const root = fixture(t), docs = join(root, 'docs');mkdirSync(docs);
  const source = Buffer.from('openapi: 3.1.0\n');writeFileSync(join(docs, 'openapi.yaml'), source);
  const git = (head, dirty) => (args) => args[0] === 'rev-parse' ? head : args[0] === 'status' ? dirty : source;
  assert.doesNotThrow(() => verifyCheckout(docs, revision, git(revision, '')));
  assert.throws(() => verifyCheckout(docs, revision, git('0'.repeat(40), '')), /SHA fijado/);
  for (const dirty of [' M openapi.yaml', ' M scripts/contrato-api.mjs', '?? scripts/extra.mjs', ' M pnpm-lock.yaml']) {
    assert.throws(() => verifyCheckout(docs, revision, git(revision, dirty)), /cambios/);
  }
  writeFileSync(join(docs, 'openapi.yaml'), 'openapi: 3.1.0\r\n');
  assert.throws(() => verifyCheckout(docs, revision, git(revision, '')), /core.autocrlf=false/);
});
