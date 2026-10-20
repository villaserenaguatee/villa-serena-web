import { rm } from 'node:fs/promises';
import { basename, dirname } from 'node:path';

export default async function teardown() {
  const file = process.env.ISSUE48_RECEPTION_STATE_PATH;
  if (file && basename(file) === 'reception.json' && basename(dirname(file)).startsWith('issue48-e2e-')) {
    await rm(dirname(file), { recursive: true, force: true });
  }
}
