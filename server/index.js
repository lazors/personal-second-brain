// Local API server for Second Brain.
//
// - In production (`npm start`) it serves the built `dist/` AND the API from
//   one process on localhost, so you just open http://localhost:6767.
// - In development the Vite dev server proxies `/api` here (see vite.config.ts),
//   so the UI hot-reloads while this process owns the data + integrations.
//
// Dependency-free: uses only Node's built-in modules (robust, nothing to
// install). The markdown files under ./brain are the source of truth.

import http from 'node:http';
import { promises as fs, watch as fsWatch } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MarkdownStore } from './store.js';

const PORT = Number(process.env.PORT) || 6767;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

const store = new MarkdownStore();

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

function send(res, status, body, headers = {}) {
  const payload =
    typeof body === 'string' || Buffer.isBuffer(body)
      ? body
      : JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    ...headers,
  });
  res.end(payload);
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return undefined;
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

async function handleApi(req, res, url) {
  const { pathname } = url;
  const method = req.method;

  try {
    if (pathname === '/api/health') {
      return send(res, 200, { ok: true, dataDir: store.dir });
    }

    if (pathname === '/api/events' && method === 'GET') {
      return handleEvents(req, res);
    }

    if (pathname === '/api/items' && method === 'GET') {
      const items = (await store.list()).map(stripInternal);
      return send(res, 200, { items });
    }

    if (pathname === '/api/items' && method === 'POST') {
      const item = await readBody(req);
      if (!item || !item.id || !item.type) {
        return send(res, 400, { error: 'item requires id and type' });
      }
      return send(res, 201, { item: stripInternal(await store.write(item)) });
    }

    if (pathname === '/api/items/bulk' && method === 'POST') {
      const body = await readBody(req);
      const incoming = Array.isArray(body?.items) ? body.items : [];
      if (body?.mode === 'replace') {
        for (const existing of await store.list()) await store.remove(existing.id);
      }
      for (const it of incoming) {
        if (it && it.id && it.type) await store.write(it);
      }
      const items = (await store.list()).map(stripInternal);
      return send(res, 200, { items });
    }

    const idMatch = pathname.match(/^\/api\/items\/([^/]+)$/);
    if (idMatch) {
      const id = decodeURIComponent(idMatch[1]);
      if (method === 'PUT') {
        const item = await readBody(req);
        if (!item || item.id !== id) {
          return send(res, 400, { error: 'body id must match url id' });
        }
        return send(res, 200, { item: stripInternal(await store.write(item)) });
      }
      if (method === 'DELETE') {
        const removed = await store.remove(id);
        return send(res, removed ? 200 : 404, { removed });
      }
    }

    return send(res, 404, { error: 'not found' });
  } catch (err) {
    return send(res, 500, { error: String(err?.message || err) });
  }
}

function stripInternal(item) {
  const { _path, ...rest } = item;
  void _path;
  return rest;
}

async function serveStatic(req, res, url) {
  let rel = decodeURIComponent(url.pathname);
  if (rel === '/') rel = '/index.html';
  const filePath = path.join(DIST, rel);
  // prevent path traversal
  if (!filePath.startsWith(DIST)) return send(res, 403, 'Forbidden');

  try {
    const data = await fs.readFile(filePath);
    const ext = path.extname(filePath);
    res.writeHead(200, {
      'Content-Type': CONTENT_TYPES[ext] || 'application/octet-stream',
    });
    res.end(data);
  } catch {
    // SPA fallback to index.html (hash routing means this is rarely needed)
    try {
      const index = await fs.readFile(path.join(DIST, 'index.html'));
      res.writeHead(200, { 'Content-Type': CONTENT_TYPES['.html'] });
      res.end(index);
    } catch {
      send(res, 404, 'Not found. Run `npm run build` first.');
    }
  }
}

// --- Live updates over Server-Sent Events ------------------------------------
//
// Clients subscribe to GET /api/events; when a .md file under the data dir
// changes (e.g. one dropped in via the bind-mount), we push a `change` event
// and the browser re-fetches. One-directional, dependency-free.

const sseClients = new Set();

function handleEvents(req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  res.write('retry: 2000\n\n');
  sseClients.add(res);
  req.on('close', () => sseClients.delete(res));
}

function broadcastChange() {
  for (const res of sseClients) {
    res.write('event: change\ndata: {}\n\n');
  }
}

/** Watch the data dir and push a (debounced) change event on .md edits. */
function startWatcher() {
  let timer = null;
  const fire = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(broadcastChange, 150);
  };
  try {
    fsWatch(store.dir, { recursive: true }, (_event, filename) => {
      if (!filename || String(filename).endsWith('.md')) fire();
    });
  } catch (err) {
    // Non-fatal: the app still works, just without live push.
    console.warn(`   file watcher unavailable: ${err?.message || err}`);
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  // permissive CORS for local dev convenience
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  if (url.pathname.startsWith('/api/')) return handleApi(req, res, url);
  return serveStatic(req, res, url);
});

server.listen(PORT, async () => {
  console.log(`🧠 Second Brain server on http://localhost:${PORT}`);
  console.log(`   data: ${store.dir}`);
  // Ensure the data dir exists so the watcher can attach on a fresh volume.
  await fs.mkdir(store.dir, { recursive: true }).catch(() => {});
  startWatcher();
});
