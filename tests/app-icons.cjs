const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const context = { exports: {} };
vm.runInNewContext(ts.transpileModule(read('app/manifest.ts'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS }
}).outputText, context);
const manifest = context.exports.default();

test('manifest includes correctly sized PNG icons and a dedicated maskable variant', () => {
  assert.equal(manifest.icons.length, 3);
  for (const icon of manifest.icons) {
    const bytes = fs.readFileSync(path.join(root, 'public', icon.src));
    assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
    assert.equal(`${bytes.readUInt32BE(16)}x${bytes.readUInt32BE(20)}`, icon.sizes);
    assert.equal(icon.type, 'image/png');
  }
  assert.equal(manifest.icons.filter(icon => icon.purpose === 'maskable').length, 1);
  assert.match(manifest.icons.find(icon => icon.purpose === 'maskable').src, /maskable/);
});

test('Apple and browser metadata reference existing correctly sized PNGs', () => {
  const metadata = read('app/layout.tsx');
  for (const [name, size] of [['32', 32], ['apple-180', 180]]) {
    const file = `/icons/leon-20261014-${name}.png`;
    assert.ok(metadata.includes(file));
    const bytes = fs.readFileSync(path.join(root, 'public', file));
    assert.equal(bytes.readUInt32BE(16), size);
    assert.equal(bytes.readUInt32BE(20), size);
  }
  assert.ok(!metadata.includes('apple-touch-icon.svg'));
});

test('service worker caches all new icon assets with a new cache version', () => {
  const source = read('public/sw.js');
  assert.match(source, /leon-growth-record-v16/);
  for (const name of ['32', '192', '512', 'apple-180', 'maskable-512']) {
    assert.ok(source.includes(`/icons/leon-20261014-${name}.png`));
  }
  assert.ok(!source.includes('/icon-192.svg'));
});
