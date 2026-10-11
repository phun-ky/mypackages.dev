/**
 * Static file server for the Playwright tests.
 *
 * Serves the build in `dist/` the way GitHub Pages does: a file, then the
 * `index.html` in a directory, and otherwise `404.html` with status 404. The
 * site relies on that last step for deep links (`404.html` redirects to
 * `/?p=<path>`), so the tests go through the same redirect as visitors. No
 * dependencies, so CI doesn't have to download a server on every run.
 *
 * Usage: node tests/e2e/server.mjs [port]
 */
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../dist'
);
const PORT = Number(process.argv[2] ?? process.env.PORT ?? 3000);
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.wasm': 'application/wasm',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8'
};

/**
 * Finds the file for a URL path in `dist/`: the file itself, or the
 * `index.html` in that directory.
 *
 * @param {string} urlPath - The decoded URL path.
 * @returns {Promise<string|undefined>} The file path, if any.
 */
const resolveFile = async (urlPath) => {
  const file = path.join(ROOT, urlPath);

  // Don't serve anything outside dist/
  if (file !== ROOT && !file.startsWith(ROOT + path.sep)) return;

  for (const candidate of [file, path.join(file, 'index.html')]) {
    const stats = await stat(candidate).catch(() => undefined);

    if (stats?.isFile()) return candidate;
  }
};
const send = (res, status, file) => {
  res.writeHead(status, {
    'Content-Type': TYPES[path.extname(file)] ?? 'application/octet-stream',
    'Cache-Control': 'no-store'
  });
  createReadStream(file).pipe(res);
};

createServer(async (req, res) => {
  const { pathname } = new URL(req.url ?? '/', 'http://localhost');
  const file = await resolveFile(decodeURIComponent(pathname));

  if (file) {
    send(res, 200, file);

    return;
  }

  const notFound = await resolveFile('/404.html');

  if (notFound) {
    send(res, 404, notFound);

    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' }).end('Not found');
}).listen(PORT, '127.0.0.1', () => {
  console.log(`Serving dist/ on http://127.0.0.1:${PORT}`);
});
