/**
 * Static file server for the Playwright tests.
 *
 * Serves the build in `dist/` the way GitHub Pages does, as measured on
 * mypackages.dev (#39): the file, then `<path>.html` (`/404` serves
 * `404.html`), then a directory without its trailing slash is redirected to
 * it (`/meta` gives 301 to `/meta/`), then the `index.html` in a directory,
 * and otherwise `404.html` with status 404. The build writes a page for every
 * static route, and `404.html` is the app for the rest. No dependencies, so CI
 * doesn't have to download a server on every run.
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
const statOf = (file) => stat(file).catch(() => undefined);
/**
 * Finds what to answer for a URL path in `dist/`: a file, or a redirect to
 * the path with a trailing slash when it names a directory.
 *
 * @param {string} urlPath - The decoded URL path.
 * @returns {Promise<{file?: string, redirect?: string}|undefined>} What to
 *   answer, if anything.
 */
const resolveFile = async (urlPath) => {
  const file = path.join(ROOT, urlPath);

  // Don't serve anything outside dist/
  if (file !== ROOT && !file.startsWith(ROOT + path.sep)) return;

  if ((await statOf(file))?.isFile()) return { file };

  if (!urlPath.endsWith('/') && (await statOf(`${file}.html`))?.isFile()) {
    return { file: `${file}.html` };
  }

  if ((await statOf(file))?.isDirectory()) {
    if (!urlPath.endsWith('/')) return { redirect: `${urlPath}/` };

    const index = path.join(file, 'index.html');

    if ((await statOf(index))?.isFile()) return { file: index };
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
  const { pathname, search } = new URL(req.url ?? '/', 'http://localhost');
  const found = await resolveFile(decodeURIComponent(pathname));

  if (found?.redirect) {
    res.writeHead(301, { Location: encodeURI(found.redirect) + search }).end();

    return;
  }

  if (found?.file) {
    send(res, 200, found.file);

    return;
  }

  const notFound = await resolveFile('/404.html');

  if (notFound?.file) {
    send(res, 404, notFound.file);

    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' }).end('Not found');
}).listen(PORT, '127.0.0.1', () => {
  console.log(`Serving dist/ on http://127.0.0.1:${PORT}`);
});
