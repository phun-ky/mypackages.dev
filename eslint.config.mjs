import { defineConfig } from 'eslint/config';
import customConfig from 'eslint-config-phun-ky';
import globals from 'globals';

export default defineConfig([
  {
    // Generated files
    ignores: ['playwright-report/**', 'test-results/**']
  },
  {
    extends: [customConfig]
  },
  {
    // Agree with Prettier, which uses double quotes to avoid escapes and
    // indents object types in unions one level deeper
    rules: {
      '@stylistic/quotes': ['warn', 'single', { avoidEscape: true }],
      '@stylistic/indent': [
        'error',
        2,
        {
          MemberExpression: 1,
          SwitchCase: 1,
          ArrayExpression: 1,
          ObjectExpression: 1,
          offsetTernaryExpressions: true,
          ignoredNodes: [
            'TSUnionType TSTypeLiteral',
            'TSUnionType TSTypeLiteral *'
          ]
        }
      ]
    }
  },
  {
    // The shared config ignores tests/, but the e2e tests are code we
    // maintain, so lint them too
    ignores: ['!tests/**']
  },
  {
    // GitHub renders these, so parse task lists and tables like it does
    files: ['**/*.md'],
    language: 'markdown/gfm'
  },
  {
    // [Brackets] here are placeholders and notes, not links
    files: ['.github/ISSUE_TEMPLATE/*.md', 'TODO.md'],
    rules: {
      'markdown/no-missing-label-refs': 'off'
    }
  },
  {
    // Run in Node, not the browser
    files: ['tests/e2e/server.mjs', '*.config.{js,mjs,ts}'],
    languageOptions: {
      globals: globals.node
    }
  }
]);
