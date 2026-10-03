const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const env = { ...process.env };
const originalLoad = Module._load;
const originalResolve = Module._resolveFilename;
const originalFetch = global.fetch;
const savedGlobals = { Image: global.Image, FileReader: global.FileReader, document: global.document };
require.extensions['.ts'] = (m, p) => m._compile(ts.transpileModule(fs.readFileSync(p, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true }
}).outputText, p);
Module._resolveFilename = function (name, ...args) {
  return originalResolve.call(this, name.startsWith('@/') ? path.join(root, name.slice(2)) : name, ...args);
};
let now = Date.now();
let attempts = 0;
let windowStarted = now;
let down = false;
let failDelete = false;
let authCalls = [];
let dataCalls = 0;
let converterCalls = 0;
const sessions = new Map();
const client = {
  rpc: async (name, args) => {
    authCalls.push({ name, args });
    if (down) return { data: null, error: { message: 'synthetic private diagnostic' } };
    if (name === 'reserve_sync_login_attempt') {
      if (now - windowStarted >= 300000) { attempts = 0; windowStarted = now; }
      if (attempts >= 10) return { data: { allowed: false, retry_after: 300 }, error: null };
      attempts++;
      return { data: { allowed: true, retry_after: 0 }, error: null };
    }
    const key = args.p_workspace + ':' + args.p_token_hash;
    if (name === 'issue_sync_session') sessions.set(key, { version: args.p_code_version, expires: now + 30 * 86400000 });
    if (name === 'validate_sync_session') {
      const row = sessions.get(key);
      return { data: Boolean(row && row.version === args.p_code_version && row.expires > now), error: null };
    }
    return { data: null, error: null };
  },
  from: name => {
    if (name === 'sync_sessions') {
      let scope;
      const chain = { delete: () => chain, eq: (column, value) => {
        if (column === 'workspace_id') { scope = value; return chain; }
        if (!down && !failDelete) sessions.delete(scope + ':' + value);
        return Promise.resolve({ error: down || failDelete ? { message: 'synthetic delete failure' } : null });
      } };
      return chain;
    }
    dataCalls++;
    const chain = { select: () => chain, eq: () => chain, order: () => chain,
      maybeSingle: async () => ({ data: null, error: null }),
      limit: async () => ({ data: [], error: null }),
      range: async () => ({ data: [], count: 0, error: null }),
      upsert: async () => ({ error: null }) };
    return chain;
  },
  storage: { listBuckets: async () => { dataCalls++; return { data: [], error: null }; },
    createBucket: async () => ({ error: null }) }
};
Module._load = function (name, ...args) {
  if (name === '@supabase/supabase-js') return { createClient: () => client };
  if (name === 'heic-convert') throw new Error('Server converter must not load');
  if (name === 'heic-convert/browser') return async () => { converterCalls++; return new Uint8Array([255, 216, 255]); };
  return originalLoad.call(this, name, ...args);
};
global.fetch = async () => { throw new Error('Tests must not access network'); };
Object.assign(process.env, { LEON_SYNC_PASSCODE: 'synthetic-shared-code', LEON_WORKSPACE_ID: 'synthetic-family',
  SUPABASE_URL: 'https://test-project.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'synthetic-server-key', OUTINGS_ADDON_ENABLED: 'true' });
const auth = require('../lib/sync-auth.ts');
const login = require('../app/api/snapshot/auth/route.ts');
const snapshot = require('../app/api/snapshot/route.ts');
const photos = require('../app/api/photo-upload/route.ts');
const album = require('../app/api/album/route.ts');
const download = require('../app/api/album/download/route.ts');
const favorites = require('../app/api/addons/outings/favorites/route.ts');
const search = require('../app/api/addons/outings/search/route.ts');
const status = require('../app/api/addons/outings/status/route.ts');
const converter = require('../app/api/convert-heic/route.ts');
const cloud = require('../lib/supabase.ts');
function request(route = '/api/snapshot/auth', method = 'POST', token, payload = { passcode: 'synthetic-shared-code' }, origin = 'https://app.example') {
  return new Request('https://app.example' + route, { method, headers: {
    origin, 'content-type': 'application/json', cookie: token ? auth.syncCookieName + '=' + token : ''
  }, ...(method === 'GET' ? {} : { body: JSON.stringify(payload) }) });
}
function reset() { attempts = 0; windowStarted = now; authCalls = []; down = false; failDelete = false; dataCalls = 0; }
function cookie(response) { return response.headers.get('set-cookie').match(/leon-sync-session=([^;]+)/)[1]; }
after(() => {
  global.fetch = originalFetch; Object.assign(global, savedGlobals);
  Module._load = originalLoad; Module._resolveFilename = originalResolve; process.env = env;
});
test('new sessions are unpredictable, code guesses and legacy/encoded cookies cannot authenticate', async () => {
  reset();
  const first = await login.POST(request());
  const second = await login.POST(request());
  assert.equal(first.status, 200); assert.equal(second.status, 200);
  const one = cookie(first), two = cookie(second);
  assert.match(one, /^v2\.[a-f0-9]{64}$/); assert.notEqual(one, two);
  assert.equal(await auth.verifySyncSessionToken(one), true);
  for (const token of [undefined, auth.hashSyncValue('synthetic-shared-code'), 'v2.' + auth.hashSyncValue('synthetic-shared-code'),
    one.replace('.', '%2E'), one.toUpperCase(), one + 'x', one + ';junk', 'v2.' + 'f'.repeat(64)]) {
    assert.equal(await auth.verifySyncSessionToken(token), false);
  }
  const stored = [...sessions.keys()].join(' ');
  assert.ok(!stored.includes(one)); assert.ok(!stored.includes('synthetic-shared-code'));
  assert.match(first.headers.get('set-cookie'), /HttpOnly/); assert.match(first.headers.get('set-cookie'), /SameSite=lax/i);
  assert.match(first.headers.get('cache-control'), /no-store/);
});
test('all protected API methods await authorization and reject legacy or unknown sessions before data access', async () => {
  const paths = [
    [snapshot.GET, '/api/snapshot', 'GET'], [snapshot.PUT, '/api/snapshot', 'PUT'],
    [photos.POST, '/api/photo-upload', 'POST'], [album.GET, '/api/album', 'GET'],
    [album.POST, '/api/album', 'POST'], [album.PATCH, '/api/album', 'PATCH'], [album.DELETE, '/api/album', 'DELETE'],
    [download.GET, '/api/album/download', 'GET'], [favorites.GET, '/api/addons/outings/favorites', 'GET'],
    [favorites.POST, '/api/addons/outings/favorites', 'POST'], [favorites.DELETE, '/api/addons/outings/favorites', 'DELETE'],
    [search.POST, '/api/addons/outings/search', 'POST']
  ];
  for (const token of [undefined, auth.hashSyncValue('synthetic-shared-code'), 'v2.' + 'f'.repeat(64)]) {
    for (const [handler, route, method] of paths) {
      reset(); assert.equal((await handler(request(route, method, token))).status, 401, route + ':' + method); assert.equal(dataCalls, 0);
    }
    const body = await (await status.GET(request('/api/addons/outings/status', 'GET', token))).json();
    assert.equal(body.authenticated, false);
  }
});
test('workspace-wide login budget survives client/header changes; blocks even a correct code until reset', async () => {
  reset();
  for (let i = 0; i < 10; i++) {
    const req = request(undefined, 'POST', undefined, { passcode: 'wrong-' + i, workspace_id: 'bypass-' + i });
    req.headers.set('x-forwarded-for', '192.0.2.' + i);
    assert.equal((await login.POST(req)).status, 401);
  }
  const blocked = await login.POST(request());
  assert.equal(blocked.status, 429); assert.equal(blocked.headers.get('retry-after'), '300');
  assert.ok(authCalls.every(call => call.args.p_workspace === 'synthetic-family'));
  now += 300001;
  assert.equal((await login.POST(request())).status, 200);
});
test('valid sessions remain usable while new login attempts are throttled', async () => {
  reset(); const token = cookie(await login.POST(request()));
  attempts = 10;
  assert.equal((await snapshot.GET(request('/api/snapshot', 'GET', token))).status, 200);
  assert.equal((await favorites.GET(request('/api/addons/outings/favorites', 'GET', token))).status, 200);
  const result = await (await status.GET(request('/api/addons/outings/status', 'GET', token))).json();
  assert.equal(result.authenticated, true);
  assert.ok(authCalls.slice(2).every(call => call.name !== 'reserve_sync_login_attempt'));
});
test('copied sessions expire on the server, are workspace/code/key bound and logout revokes only this device', async () => {
  reset(); const one = cookie(await login.POST(request())); const two = cookie(await login.POST(request()));
  assert.equal((await login.DELETE(request(undefined, 'DELETE', one))).status, 200);
  assert.equal(await auth.verifySyncSessionToken(one), false); assert.equal(await auth.verifySyncSessionToken(two), true);
  for (const key of ['LEON_SYNC_PASSCODE', 'LEON_WORKSPACE_ID', 'SUPABASE_SERVICE_ROLE_KEY']) {
    const saved = process.env[key]; process.env[key] = 'changed-synthetic-value';
    assert.equal(await auth.verifySyncSessionToken(two), false); process.env[key] = saved;
  }
  now += 30 * 86400000;
  assert.equal(await auth.verifySyncSessionToken(two), false);
});
test('database outages and failed revocation never become successful authorization/logout', async () => {
  reset(); const token = cookie(await login.POST(request()));
  failDelete = true;
  const failed = await login.DELETE(request(undefined, 'DELETE', token));
  assert.equal(failed.status, 503); assert.equal(failed.headers.get('set-cookie'), null);
  down = true;
  assert.equal(await auth.verifySyncSessionToken(token), false);
  assert.equal((await login.POST(request())).status, 503);
  global.fetch = async () => failed;
  assert.equal((await cloud.disconnectCloudSync()).ok, false);
  global.fetch = async () => { throw new Error('offline'); };
  assert.equal((await cloud.disconnectCloudSync()).ok, false);
  global.fetch = async () => Response.json({ ok: true });
  assert.equal((await cloud.disconnectCloudSync()).ok, true);
});
test('parallel successful logins cannot revive the old cookie; logout rejects a copy of the presented new session', async () => {
  reset();
  const old = cookie(await login.POST(request()));
  const responses = await Promise.all([login.POST(request(undefined, 'POST', old)), login.POST(request(undefined, 'POST', old))]);
  assert.ok(responses.every(response => response.status === 200));
  const current = cookie(responses[1]), independent = cookie(responses[0]);
  assert.equal(await auth.verifySyncSessionToken(old), false);
  assert.equal((await login.DELETE(request(undefined, 'DELETE', current))).status, 200);
  assert.equal(await auth.verifySyncSessionToken(current), false);
  // A separately issued login is not the cookie submitted to logout.
  assert.equal(await auth.verifySyncSessionToken(independent), true);
});
test('malformed/oversized/chunked login bodies and cross-origin requests do not consume guesses or mint cookies', async () => {
  reset();
  for (const passcode of [null, 123, {}, [], '', 'x'.repeat(513), 'x'.repeat(3000)]) {
    assert.equal((await login.POST(request(undefined, 'POST', undefined, { passcode }))).status, 400);
  }
  assert.equal((await login.POST(request(undefined, 'POST', undefined, undefined, 'https://evil.example'))).status, 403);
  assert.equal((await login.DELETE(request(undefined, 'DELETE', undefined, undefined, 'https://evil.example'))).status, 403);
  let cancelled = false;
  const stream = new ReadableStream({ start(c) { c.enqueue(new TextEncoder().encode('x'.repeat(3000))); }, cancel() { cancelled = true; } });
  const req = new Request('https://app.example/api/snapshot/auth', { method: 'POST', headers: { origin: 'https://app.example', 'content-type': 'application/json' }, body: stream, duplex: 'half' });
  assert.equal((await login.POST(req)).status, 400); assert.equal(cancelled, true); assert.equal(authCalls.length, 0);
});
test('retired HEIC endpoint never reads any body or invokes a server decoder', async () => {
  for (const body of [undefined, { formData: () => { throw new Error('must not parse'); } }, { headers: { get: () => '99999999999' }, arrayBuffer: () => { throw new Error('must not read'); } }]) {
    assert.equal((await converter.POST(body)).status, 410);
  }
});
test('JPEG and native/fallback HEIC preparation work without sync or server requests; oversized input is rejected', async () => {
  reset();
  const { prepareImageForStorage } = require('../lib/image-client.ts');
  const jpegUrl = 'data:image/jpeg;base64,/9j/';
  let fallback = false;
  global.FileReader = class { readAsDataURL(file) { this.result = file.type === 'image/heic' ? 'data:image/heic;base64,aGVpYw==' : jpegUrl; queueMicrotask(() => this.onload()); } };
  global.Image = class { set src(value) { this.width = 4032; this.height = 3024; queueMicrotask(() => value.startsWith('data:image/heic') && fallback ? this.onerror() : this.onload()); } };
  global.document = { createElement: () => ({ getContext: () => ({ fillRect() {}, drawImage() {} }), toDataURL: () => jpegUrl }) };
  global.fetch = async () => { throw new Error('Photo preparation must stay local'); };
  for (const native of [true, false]) {
    fallback = !native;
    const result = await prepareImageForStorage(new File(['synthetic'], 'photo.heic', { type: 'image/heic' }));
    assert.equal(result.dataUrl, jpegUrl); assert.equal(result.fileName, 'photo.jpg');
  }
  assert.equal(converterCalls, 1);
  assert.equal((await prepareImageForStorage(new File(['synthetic'], 'photo.jpg', { type: 'image/jpeg' }))).fileName, 'photo.jpg');
  await assert.rejects(prepareImageForStorage({ size: 21 * 1024 * 1024 }), /20MB/);
});
