import { defineConfig, type Plugin } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

// The dev server injects CSS as style elements, which the Content Security
// Policy in index.html refuses. Allow them while serving only; the build keeps
// the policy as written (#38).
const allowDevStyles = (): Plugin => ({
  name: 'allow-dev-styles',
  apply: 'serve',
  transformIndexHtml: (html) =>
    html.replace("style-src 'self';", "style-src 'self' 'unsafe-inline';")
});

export default defineConfig({
  plugins: [tsconfigPaths(), allowDevStyles()]
});
