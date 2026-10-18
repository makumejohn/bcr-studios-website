import test from 'node:test';
import assert from 'node:assert/strict';
import { clearSessionCookie, hasValidSession, makeSessionCookie, safeEqual } from './security.js';

test('session cookie is valid until its expiry and then expires', () => {
  const now = 1_800_000_000_000;
  const cookie = makeSessionCookie('a-long-test-secret', false, now);
  assert.equal(hasValidSession(cookie, 'a-long-test-secret', now + 1000), true);
  assert.equal(hasValidSession(cookie, 'a-different-secret', now + 1000), false);
  assert.equal(hasValidSession(cookie, 'a-long-test-secret', now + 8 * 60 * 60 * 1000 + 1000), false);
});

test('invalid and cleared cookies do not authenticate', () => {
  assert.equal(hasValidSession('bcr_upload_session=broken', 'secret'), false);
  assert.match(clearSessionCookie(), /Max-Age=0/);
});

test('safeEqual compares strings without rejecting unequal lengths', () => {
  assert.equal(safeEqual('same', 'same'), true);
  assert.equal(safeEqual('short', 'a much longer password'), false);
});
