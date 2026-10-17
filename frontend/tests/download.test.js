import { test } from 'node:test';
import assert from 'node:assert/strict';
class Storage {
  data = new Map();
  getItem(k) { return this.data.get(k) ?? null; }
  setItem(k, v) { this.data.set(k, String(v)); }
  removeItem(k) { this.data.delete(k); }
}
globalThis.localStorage = new Storage(); globalThis.sessionStorage = new Storage(); globalThis.window = new EventTarget();
const { saveAuth, apiDownload } = await import('../src/api/client.js');
const token = seconds => `h.${btoa(JSON.stringify({ exp: Date.now() / 1000 + seconds }))}.s`;
const login = () => saveAuth({ token: token(300), refreshToken: token(3600), user: { name: 'Test' } });

test('PDF download refreshes on 401, keeps Bearer auth and returns binary bytes', async () => {
  login(); let calls = []; const pdf = '%PDF-test';
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options });
    if (url.includes('/auth/refresh-token')) return new Response(JSON.stringify({ token: token(900), refreshToken: token(3600), user: { name: 'Test' } }), { status: 200 });
    if (calls.length === 1) return new Response(JSON.stringify({ message: 'Expired' }), { status: 401 });
    return new Response(pdf, { status: 200, headers: { 'Content-Type': 'application/pdf' } });
  };
  const blob = await apiDownload('/user/bookings/pnr/test/ticket.pdf');
  assert.equal(await blob.text(), pdf); assert.equal(calls.length, 3);
  assert.ok(calls[0].options.headers.Authorization.startsWith('Bearer '));
  assert.notEqual(calls[0].options.headers.Authorization, calls[2].options.headers.Authorization);
});
test('JSON errors and unexpected success content never become PDF downloads', async () => {
  login();
  globalThis.fetch = async () => new Response(JSON.stringify({ message: 'No booking found for this PNR in your account.' }), { status: 404 });
  await assert.rejects(apiDownload('/user/bookings/pnr/test/ticket.pdf'), /No booking found/);
  globalThis.fetch = async () => new Response('<html>Sign in</html>', { headers: { 'Content-Type': 'text/html' } });
  await assert.rejects(apiDownload('/user/bookings/pnr/test/ticket.pdf'), /did not return a PDF/);
});
