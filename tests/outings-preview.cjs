// Local-only UI fixture: node tests/outings-preview.cjs (Next.js on port 3010).
// No database or AI calls. Never imported by the application.
const http = require('node:http');
const { createHash } = require('node:crypto');
const favorites = new Map();
const source = { url: 'https://example.org/dog-park', title: 'UI検証用の架空施設' };
const server = http.createServer(async (req, res) => {
  if (!req.url.startsWith('/api/addons/outings/')) {
    const upstream = http.request({ hostname: '127.0.0.1', port: 3010, path: req.url, method: req.method, headers: req.headers }, response => {
      res.writeHead(response.statusCode, response.headers); response.pipe(res);
    });
    upstream.on('error', () => { res.writeHead(502); res.end('Start Next.js on port 3010 first.'); });
    req.pipe(upstream); return;
  }
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  let body = '';
  for await (const part of req) { body += part; if (body.length > 1500000) { res.writeHead(413); res.end('{}'); return; } }
  const payload = body ? JSON.parse(body) : {};
  if (req.url.endsWith('/status')) {
    res.end(JSON.stringify({ enabled: true, authenticated: true, ready: true, storageReady: true, message: 'UI検証用データです。実際の施設ではありません。', cacheScope: 'ui-fixture' }));
  } else if (req.url.endsWith('/search')) {
    const searchedAt = new Date().toISOString();
    const { requestId, ...query } = payload;
    const base = { area: payload.area, genre: 'ドッグラン', searchedAt, description: '木陰でのんびり休める広場をイメージした表示サンプルです。', dogPolicy: '犬同伴可の表示例です。', sources: [source] };
    res.end(JSON.stringify({ query, searchedAt, places: [
      { ...base, name: '木もれびドッグガーデン（架空）', needsCheck: false, conditions: payload.filters.map(label => ({ label, status: 'yes', detail: '検証用の条件' })) },
      { ...base, name: '湖畔の遊歩道（架空）', needsCheck: true, dogPolicy: '犬同伴の利用条件は要確認です。', sources: [{ ...source, url: 'https://example.org/lakeside' }], conditions: payload.filters.map(label => ({ label, status: 'unknown', detail: '要確認' })) }
    ] }));
  } else if (req.url.endsWith('/favorites')) {
    if (req.method === 'POST') {
      for (const item of payload.backup?.favorites ?? [payload.favorite]) {
        const id = createHash('sha256').update(item.url).digest('hex');
        favorites.set(id, { ...item, id, savedAt: favorites.get(id)?.savedAt ?? new Date().toISOString() });
      }
    } else if (req.method === 'DELETE') favorites.delete(payload.id);
    res.end(JSON.stringify({ favorites: [...favorites.values()] }));
  } else { res.writeHead(404); res.end('{}'); }
});
server.listen(3011, '127.0.0.1', () => console.log('UI fixture: http://127.0.0.1:3011/outings (no live AI/database)'));
