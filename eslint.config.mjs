import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import prettierConfig from 'eslint-config-prettier';
import globals from 'globals';

export default [
  {
    ignores: [
      'dist/',
      'node_modules/',
      'coverage/',
      '.husky/',
      'commitlint.config.js',
      'eslint.config.mjs',
      'dist/**',
      'node_modules/**',
      '**/generated/**',
    ],
  },
  js.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      'react-refresh/only-export-components': 'off',
      '@typescript-eslint/interface-name-prefix': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      // Disable type-aware rules — root config has no parserOptions.project
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
    },
  },
  // Browser globals for frontend source files
  {
    files: ['apps/frontend/src/**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
    },
  },
  // Disable no-undef for TypeScript files — TypeScript itself handles this far better
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      'no-undef': 'off',
    },
  },
  // Node globals for backend and Node.js config files
  {
    files: [
      'apps/backend/**/*.ts',
      '**/vite.config.*',
      '**/tailwind.config.*',
      '**/postcss.config.*',
    ],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  prettierConfig,
];
