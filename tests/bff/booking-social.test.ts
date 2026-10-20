import {test} from 'node:test';
import assert from 'node:assert/strict';
import {POST as start} from '@/app/api/auth/booking-social/[provider]/start/route';
import {GET as callback} from '@/app/api/auth/booking-social/[provider]/callback/route';
import {GET as profile} from '@/app/api/auth/booking-social/profile/route';
import {POST as translate} from '@/app/api/translate/route';

test('MVP: retired routes do not contact providers or issue cookies', async () => {
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => { calls++; throw new Error('External request forbidden'); };
  try {
    for (const handler of [start, callback, profile, translate]) {
      const response = await handler();
      assert.equal(response.status, 410);
      assert.equal(response.headers.get('set-cookie'), null);
      assert.equal(response.headers.get('location'), null);
      assert.equal(response.headers.get('cache-control'), 'no-store');
    }
    assert.equal(calls, 0);
  } finally { globalThis.fetch = original; }
});
