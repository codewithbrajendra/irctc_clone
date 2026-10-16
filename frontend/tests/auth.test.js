import { test } from 'node:test';
import assert from 'node:assert/strict';
class Storage {
  data = new Map();
  getItem(key) { return this.data.get(key) ?? null; }
  setItem(key, value) { this.data.set(key, String(value)); }
  removeItem(key) { this.data.delete(key); }
}
globalThis.localStorage = new Storage();
globalThis.sessionStorage = new Storage();
globalThis.window = new EventTarget();
const auth = await import('../src/api/client.js');
const token = seconds => `header.${btoa(JSON.stringify({ exp: Date.now() / 1000 + seconds }))}.signature`;
const response = (name = 'Brajendra') => ({ token: token(30), refreshToken: token(3600), user: { name, email: 'user@example.com', roles: [{ name: 'ROLE_ADMIN' }], password: 'must-not-persist' } });

test('auth lifecycle, storage selection, refresh and invalidation', async () => {
  auth.clearAuth();
  assert.equal(auth.hasSession(), false);
  localStorage.setItem('railway_access_token', 'invalid');
  localStorage.setItem('railway_refresh_token', 'invalid');
  assert.equal(await auth.ensureSession(), false);
  let changes = 0;
  const unsubscribe = auth.subscribeAuth(() => changes++);
  auth.saveAuth(response());
  assert.equal(auth.getCurrentUser().name, 'Brajendra');
  assert.equal(auth.getCurrentUser().password, undefined);
  assert.equal(auth.hasRole('ADMIN'), true);
  auth.saveAuth(response(), false);
  assert.equal(localStorage.getItem('railway_access_token'), null);
  assert.ok(sessionStorage.getItem('railway_access_token'));
  sessionStorage.setItem('railway_access_token', token(-1));
  let calls = 0;
  globalThis.fetch = async () => { calls++; return { ok: true, json: async () => response('Updated name') }; };
  assert.deepEqual(await Promise.all([auth.ensureSession(), auth.ensureSession()]), [true, true]);
  assert.equal(calls, 1);
  assert.equal(auth.getCurrentUser().name, 'Updated name');
  assert.equal(localStorage.getItem('railway_access_token'), null);
  sessionStorage.setItem('railway_access_token', token(-1));
  globalThis.fetch = async () => ({ ok: false });
  assert.equal(await auth.ensureSession(), false);
  assert.equal(auth.getCurrentUser(), null);
  assert.equal(auth.hasRole('ADMIN'), false);
  auth.saveAuth({ ...response(), user: { name: 'Normal', roles: [{ name: 'ROLE_NORMAL' }] } });
  assert.equal(auth.hasRole('ADMIN'), false);
  auth.clearAuth();
  assert.ok(changes > 0);
  unsubscribe();
});
