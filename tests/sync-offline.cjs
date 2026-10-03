const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const originalLoad = Module._load, originalResolve = Module._resolveFilename, originalFetch = global.fetch;
for (const extension of ['.ts', '.tsx']) require.extensions[extension] = (m, p) => m._compile(ts.transpileModule(fs.readFileSync(p, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true, jsx: ts.JsxEmit.ReactJSX }
}).outputText, p);
Module._resolveFilename = function (name, ...args) {
  return originalResolve.call(this, name.startsWith('@/') ? path.join(root, name.slice(2)) : name, ...args);
};
let currentBank, index, context, uploads = 0;
const banks = { provider: [], form: [], card: [] };
const react = {
  createContext: () => ({ Provider() {} }), useContext: () => context,
  useMemo: fn => fn(), useRef: value => ({ current: value }), useEffect() {},
  useState: initial => {
    const bank = currentBank, slot = index++;
    if (!(slot in bank)) bank[slot] = typeof initial === 'function' ? initial() : initial;
    return [bank[slot], value => { bank[slot] = typeof value === 'function' ? value(bank[slot]) : value; }];
  }
};
Module._load = function (name, ...args) {
  if (name === 'react') return react;
  if (name === 'react/jsx-runtime') return { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) };
  if (name === 'next/navigation') return { useRouter: () => ({ push() {} }) };
  if (name === '@/lib/shared-photo') return { uploadSharedPhoto: async () => { uploads++; throw new Error('offline'); } };
  return originalLoad.call(this, name, ...args);
};
const { AppProvider } = require('../components/app-provider.tsx');
const { RecordForm } = require('../components/record-form.tsx');
const { SyncStatusCard } = require('../components/sync-status-card.tsx');
function render(bank, fn) { currentBank = banks[bank]; index = 0; return fn(); }
function provider() { context = render('provider', () => AppProvider({ children: null })).props.value; return context; }
function text(node) {
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (Array.isArray(node)) return node.map(text).join('');
  return typeof node === 'object' ? text(node.props?.children) : String(node);
}
function find(node, predicate) {
  if (!node || typeof node !== 'object') return undefined;
  if (Array.isArray(node)) return node.map(child => find(child, predicate)).find(Boolean);
  if (predicate(node)) return node;
  return find(node.props?.children, predicate);
}
after(() => { Module._load = originalLoad; Module._resolveFilename = originalResolve; global.fetch = originalFetch; });
test('failed server logout still permits local photo records and offers a truthful revocation retry', async () => {
  global.fetch = async url => Response.json(url === '/api/snapshot' ? { data: null } : { ok: true });
  assert.equal(await provider().connectSync('synthetic-only-code'), true);
  assert.equal(provider().storageMode, 'cloud');
  global.fetch = async () => { throw new Error('offline'); };
  await context.disconnectSync();
  assert.equal(provider().storageMode, 'local');
  assert.equal(context.syncLogoutPending, true); assert.equal(context.syncStatus, 'error');
  assert.match(context.syncMessage, /未完了/);
  const card = render('card', () => SyncStatusCard());
  const retry = find(card, node => node.type === 'button' && text(node) === 'ログアウトを再試行');
  assert.ok(retry);
  const form = render('form', () => RecordForm({ initialRecord: {
    id: 'synthetic-photo', date: '2026-10-03', taijyuu: 25, appetite: '良い', energyLevel: '元気',
    poopCondition: '良い', photoUrl: 'data:image/jpeg;base64,/9j/', memo: 'synthetic', createdAt: '2026-10-03T00:00:00Z'
  }, redirectOnSubmit: false }));
  await form.props.onSubmit({ preventDefault() {} });
  assert.equal(uploads, 0);
  assert.equal(provider().data.records[0].photoUrl, 'data:image/jpeg;base64,/9j/');
  global.fetch = async () => Response.json({ ok: true });
  await retry.props.onClick();
  assert.equal(provider().syncLogoutPending, false); assert.equal(context.storageMode, 'local');
  assert.equal(context.saveError, ''); assert.equal(context.syncStatus, 'idle');
  const complete = render('card', () => SyncStatusCard());
  assert.equal(find(complete, node => node.type === 'button' && text(node) === 'ログアウトを再試行'), undefined);
});
