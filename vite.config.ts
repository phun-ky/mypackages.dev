import { defineConfig, type Plugin } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';

import { routes } from './src/lib/spa/router/routes';

// The dev server injects CSS as style elements, which the Content Security
// Policy in index.html refuses. Allow them while serving only; the build keeps
// the policy as written (#38).
const allowDevStyles = (): Plugin => ({
  name: 'allow-dev-styles',
  apply: 'serve',
  transformIndexHtml: (html) =>
    html.replace("style-src 'self';", "style-src 'self' 'unsafe-inline';")
});
/**
 * Writes the app's index.html for every static route, so GitHub Pages serves
 * each one with status 200 instead of from 404.html (#39). GitHub Pages
 * serves `/help` from `help.html`, and redirects it to `/help/` when `help/`
 * is a directory; which one wins when both exist isn't known, so a route that
 * is also a directory (it has child routes) gets `help/index.html` too, and
 * main.ts drops the trailing slash. 404.html becomes the app as well, for
 * package and user pages, with noindex since its status is 404.
 */
const writeRoutePages = (): Plugin => {
  let outDir = '';

  return {
    name: 'write-route-pages',
    apply: 'build',
    configResolved: (config) => {
      outDir = resolve(config.root, config.build.outDir);
    },
    closeBundle: async () => {
      const html = await readFile(join(outDir, 'index.html'), 'utf8');
      const paths = routes
        .map((route) => route.path as string)
        .filter((path) => path !== '/' && !path.includes(':'));
      const write = async (file: string, content: string) => {
        await mkdir(dirname(join(outDir, file)), { recursive: true });
        await writeFile(join(outDir, file), content);
      };

      for (const path of paths) {
        await write(`${path}.html`, html);

        if (paths.some((other) => other.startsWith(`${path}/`))) {
          await write(`${path}/index.html`, html);
        }
      }

      await write(
        '404.html',
        html.replace(
          '<meta charset="UTF-8" />',
          '<meta charset="UTF-8" />\n    <meta name="robots" content="noindex" />'
        )
      );
    }
  };
};

export default defineConfig({
  plugins: [tsconfigPaths(), allowDevStyles(), writeRoutePages()]
});
