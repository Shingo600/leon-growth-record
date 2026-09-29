const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const originalResolve = Module._resolveFilename;
const originalLoad = Module._load;
const originalFetch = global.fetch;
const env = { ...process.env };

// Use the project's compiler so tests need no extra dependency or emitted artifacts.
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true }
}).outputText, filename);
Module._resolveFilename = function (name, ...args) {
  return originalResolve.call(this, name.startsWith('@/') ? path.join(root, name.slice(2)) : name, ...args);
};
let rpcResult = { data: { allowed: true, remaining: 9 }, error: null };
let rpcCalls = 0;
let lastRpc;
let tableResult = { data: [], error: null };
let tableScopes = [];
Module._load = function (name, ...args) {
  if (name === '@supabase/supabase-js') return { createClient: () => ({
    rpc: async (name, args) => { rpcCalls++; lastRpc = { name, args }; return rpcResult; },
    from: () => {
      const chain = {
        select: () => chain,
        eq: (column, value) => { if (column === 'workspace_id') tableScopes.push(value); return chain; },
        order: () => chain,
        limit: async () => tableResult,
        maybeSingle: async () => tableResult
      };
      return chain;
    }
  }) };
  return originalLoad.call(this, name, ...args);
};
const { safeUrl, parseSearch, parseBackup } = require('../lib/addons/outings/validation.ts');
const { parseSearchResponse, searchPlaces } = require('../lib/addons/outings/provider.ts');
const { body, authorize } = require('../lib/addons/outings/server.ts');
const { POST } = require('../app/api/addons/outings/search/route.ts');
const favoriteRoutes = require('../app/api/addons/outings/favorites/route.ts');
const statusRoute = require('../app/api/addons/outings/status/route.ts');
const { createSyncSessionToken } = require('../lib/sync-auth.ts');
const input = { area: '横浜市', genre: 'ドッグラン', filters: ['大型犬OK'], note: '', requestId: '11111111-1111-4111-8111-111111111111' };
const source = 'https://example.org/dog-park';
const place = { name: 'テスト施設', area: '横浜市', genre: 'ドッグラン', description: 'テスト用の説明', dogStatus: 'yes', dogPolicy: '犬同伴可', dogSourceUrl: source, sourceUrls: [source], conditions: { '大型犬OK': { status: 'yes', detail: '大型犬用エリア', sourceUrl: source } } };
function answer(places = [place], sources = [source]) {
  return { status: 'completed', output: [
    { type: 'web_search_call', status: 'completed', action: { sources: sources.map(url => ({ url, title: 'テスト出典' })) } },
    { type: 'message', content: [{ type: 'output_text', text: JSON.stringify({ places }), annotations: [] }] }
  ] };
}
function request(payload = input, authenticated = true) {
  return new Request('https://app.example/api/addons/outings/search', { method: 'POST', headers: {
    origin: 'https://app.example', 'content-type': 'application/json',
    cookie: authenticated ? `leon-sync-session=${createSyncSessionToken('test-only-passcode')}` : ''
  }, body: JSON.stringify(payload) });
}
function configured() {
  Object.assign(process.env, { LEON_SYNC_PASSCODE: 'test-only-passcode', LEON_WORKSPACE_ID: 'test-workspace',
    SUPABASE_URL: 'https://test-project.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'test-only-key',
    OPENAI_API_KEY: 'test-only-ai-key', OUTINGS_ADDON_ENABLED: 'true', OUTINGS_DAILY_LIMIT: '10' });
}
after(() => { global.fetch = originalFetch; Module._load = originalLoad; Module._resolveFilename = originalResolve; process.env = env; });

test('unsafe schemes, credentials, loopback and private literal hosts are rejected', () => {
  for (const url of ['javascript:alert(1)', 'data:text/html,x', 'file:///a', 'https://user:pass@example.org',
    'http://127.0.0.1', 'http://2130706433', 'http://0x7f000001', 'http://192.168.1.1', 'http://[::1]',
    'http://[::ffff:127.0.0.1]', 'http://localhost', 'https://example.local', 'https://example.org:8443', 'https://example.org\n']) assert.equal(safeUrl(url), null, url);
  assert.equal(safeUrl('https://example.org/a?utm_source=x&id=1#part'), 'https://example.org/a?id=1');
});
test('all seven genres and five filters work, malformed requests fail', () => {
  const { genres, filters } = require('../lib/addons/outings/types.ts');
  assert.equal(genres.length, 7);
  for (const genre of genres) assert.equal(parseSearch({ ...input, genre, filters: [...filters] }).genre, genre);
  for (const patch of [{ area: '' }, { genre: 'unknown' }, { filters: ['unknown'] }, { requestId: 'bad' }, { note: 'a'.repeat(501) }]) assert.throws(() => parseSearch({ ...input, ...patch }));
});
test('only real tool-source URLs survive and unsupported claims become unknown', () => {
  assert.equal(parseSearchResponse(answer(), input, '2026-09-28T00:00:00Z')[0].needsCheck, false);
  assert.equal(parseSearchResponse(answer([{ ...place, sourceUrls: ['https://invented.example.org'] }]), input, new Date().toISOString()).length, 0);
  const uncertain = { ...place, dogSourceUrl: '', conditions: { '大型犬OK': { status: 'yes', detail: '未確認', sourceUrl: '' } } };
  const result = parseSearchResponse(answer([uncertain]), input, new Date().toISOString())[0];
  assert.equal(result.needsCheck, true); assert.equal(result.conditions[0].status, 'unknown');
});
test('known disallowed facilities and different genres are excluded', () => {
  for (const patch of [{ dogStatus: 'no' }, { genre: '宿泊' }, { conditions: { '大型犬OK': { status: 'no' } } }]) {
    assert.equal(parseSearchResponse(answer([{ ...place, ...patch }]), input, new Date().toISOString()).length, 0);
  }
});
test('no silent fallback to model knowledge, partial output, or malformed JSON', () => {
  assert.throws(() => parseSearchResponse({ ...answer(), status: 'incomplete' }, input, ''));
  assert.throws(() => parseSearchResponse({ status: 'completed', output: answer().output.slice(1) }, input, ''));
  const broken = answer(); broken.output[1].content[0].text = 'not JSON';
  assert.throws(() => parseSearchResponse(broken, input, ''));
  assert.deepEqual(parseSearchResponse(answer([]), input, ''), []);
});
test('favorites import validates every URL and never imports a normal app backup', () => {
  const favorite = { name: '場所', area: '横浜', genre: 'ドッグラン', url: source, memo: '', searchedAt: '2026-09-28T00:00:00Z' };
  assert.equal(parseBackup({ app: 'leon-outings', version: 1, favorites: [favorite] }).length, 1);
  assert.throws(() => parseBackup({ app: 'leon-outings', version: 1, favorites: [{ ...favorite, url: 'javascript:alert(1)' }] }));
  assert.throws(() => parseBackup({ appName: 'レオン成長記録', data: {} }));
});
test('body limits apply even without a content-length header', async () => {
  const req = new Request('https://app.example', { method: 'POST', body: JSON.stringify({ text: 'x'.repeat(100) }) });
  await assert.rejects(body(req, 30), error => error.status === 413);
});
test('cross-origin mutations and unauthenticated calls are rejected', async () => {
  configured();
  assert.throws(() => authorize(new Request('https://app.example', { headers: { cookie: `leon-sync-session=${createSyncSessionToken('test-only-passcode')}`, origin: 'https://evil.example', 'content-type': 'application/json' } }), true), e => e.status === 403);
  rpcCalls = 0; const response = await POST(request(input, false));
  assert.equal(response.status, 401); assert.equal(rpcCalls, 0);
});
test('disabled and invalid-input search never reserves quota or calls AI', async () => {
  configured(); rpcCalls = 0; let calls = 0; global.fetch = async () => { calls++; throw new Error('Unexpected AI call'); };
  process.env.OUTINGS_ADDON_ENABLED = 'false'; assert.equal((await POST(request())).status, 503);
  process.env.OUTINGS_ADDON_ENABLED = 'true'; assert.equal((await POST(request({ ...input, area: '' }))).status, 400);
  assert.equal(rpcCalls, 0); assert.equal(calls, 0);
});
test('database failure, quota exhaustion and duplicate requests fail closed', async () => {
  configured(); let calls = 0; global.fetch = async () => { calls++; throw new Error('Unexpected AI call'); };
  for (const [value, expected] of [
    [{ error: { message: 'db down' }, data: null }, 503],
    [{ error: null, data: { allowed: false, reason: 'limit' } }, 429],
    [{ error: null, data: { allowed: false, reason: 'duplicate' } }, 409]
  ]) { rpcResult = value; assert.equal((await POST(request())).status, expected); }
  assert.equal(calls, 0);
});
test('provider receives only search fields, forced search and a tool limit', async () => {
  global.fetch = async (url, options) => {
    assert.equal(url, 'https://api.openai.com/v1/responses');
    const payload = JSON.parse(options.body);
    assert.equal(payload.store, false); assert.equal(payload.tool_choice, 'required'); assert.equal(payload.max_tool_calls, 1);
    assert.deepEqual(Object.keys(JSON.parse(payload.input)).sort(), ['area', 'filters', 'genre', 'note']);
    return Response.json(answer());
  };
  const result = await searchPlaces(input, 'test-key', 'gpt-4.1-mini'); assert.equal(result.places.length, 1);
});
test('successful requests consume quota once; provider failures are not retried', async () => {
  configured(); rpcResult = { data: { allowed: true, remaining: 9 }, error: null }; rpcCalls = 0;
  let calls = 0; global.fetch = async () => { calls++; return Response.json(answer()); };
  const response = await POST(request()); assert.equal(response.status, 200);
  assert.equal((await response.json()).remaining, 9); assert.equal(rpcCalls, 1); assert.equal(calls, 1);
  assert.match(response.headers.get('cache-control'), /no-store/);
  global.fetch = async () => { calls++; return Response.json({ error: 'secret upstream diagnostic' }, { status: 500 }); };
  const failure = await POST(request()); const payload = await failure.json();
  assert.equal(failure.status, 502); assert.equal(payload.remaining, 9); assert.equal(calls, 2);
  assert.ok(!JSON.stringify(payload).includes('secret upstream'));
});

test('favorites require authentication and reject invalid imports before a database write', async () => {
  configured(); rpcCalls = 0;
  assert.equal((await favoriteRoutes.GET(request({}, false))).status, 401);
  assert.equal((await favoriteRoutes.POST(request({ backup: { appName: 'normal-backup' } }))).status, 400);
  assert.equal((await favoriteRoutes.DELETE(request({ id: '../another-family' }))).status, 400);
  assert.equal(rpcCalls, 0);
});

test('favorites normalize IDs and use only the server workspace for all reads and writes', async () => {
  configured(); tableScopes = []; tableResult = { data: [], error: null }; rpcResult = { data: null, error: null };
  const favorite = { name: '場所', area: '横浜', genre: 'ドッグラン', url: source, memo: '', searchedAt: '2026-09-29T00:00:00Z', workspaceId: 'attacker-choice' };
  assert.equal((await favoriteRoutes.POST(request({ favorite, workspaceId: 'attacker-choice' }))).status, 200);
  assert.equal(lastRpc.name, 'mutate_outing_favorites');
  assert.equal(lastRpc.args.p_workspace, 'test-workspace');
  const firstId = lastRpc.args.p_items[0].id;
  assert.match(firstId, /^[a-f0-9]{64}$/);
  assert.ok(!JSON.stringify(lastRpc).includes('attacker-choice'));
  assert.equal((await favoriteRoutes.POST(request({ favorite: { ...favorite, url: `${source}?utm_source=test` } }))).status, 200);
  assert.equal(lastRpc.args.p_items[0].id, firstId);
  assert.deepEqual(tableScopes, ['test-workspace', 'test-workspace']);
});

test('favorites limit failure does not return a successful save or leak database diagnostics', async () => {
  configured(); rpcResult = { data: null, error: { message: 'OUTINGS_FAVORITES_LIMIT private-diagnostic' } };
  const response = await favoriteRoutes.POST(request({ backup: { app: 'leon-outings', version: 1, favorites: [] } }));
  assert.equal(response.status, 503);
  const payload = await response.json(); assert.match(payload.message, /200/); assert.ok(!payload.message.includes('private-diagnostic'));
});

test('favorite removal sends only a validated ID to the scoped atomic mutation', async () => {
  configured(); rpcResult = { data: null, error: null }; tableResult = { data: [], error: null };
  const id = 'a'.repeat(64);
  assert.equal((await favoriteRoutes.DELETE(request({ id }))).status, 200);
  assert.deepEqual(lastRpc.args, { p_workspace: 'test-workspace', p_items: [], p_delete: id });
});

test('status fails closed for missing database tables and enables search only with configuration', async () => {
  configured(); tableResult = { data: null, error: { message: 'private-db-error' } };
  const failure = await (await statusRoute.GET(request())).json();
  assert.equal(failure.ready, false); assert.equal(failure.storageReady, false);
  assert.ok(!JSON.stringify(failure).includes('private-db-error'));
  tableResult = { data: { request_ids: ['one', 'two'] }, error: null };
  const ready = await (await statusRoute.GET(request())).json();
  assert.equal(ready.ready, true); assert.equal(ready.remaining, 8);
  delete process.env.OPENAI_API_KEY;
  const unconfigured = await (await statusRoute.GET(request())).json();
  assert.equal(unconfigured.ready, false); assert.equal(unconfigured.storageReady, true);
});
