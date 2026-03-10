/* eslint-disable import/no-named-as-default-member */
/* eslint-disable import/no-unused-modules */
import markdown from '@eslint/markdown';
import { defineConfig } from 'eslint/config';
import customConfig from 'eslint-config-phun-ky';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
  {
    extends: [customConfig]
  },
  {
    files: ['**/*.md'],
    processor: markdown.processors.markdown,
    rules: {
      'no-irregular-whitespace': 'off',
      '@stylistic/indent': 'off'
    }
  },
  {
    files: ['**/*.md/*.js', '**/*.md/*.jsx', '**/*.md/*.ts', '**/*.md/*.tsx'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: false,
        ecmaFeatures: { jsx: true },
        sourceType: 'module'
      },
      globals: {
        ...globals.browser
      }
    },
    rules: {
      'import/no-unresolved': 'off',
      '@stylistic/indent': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'no-undef': 'off',
      '@stylistic/semi': 'off'
    }
  }
]);
