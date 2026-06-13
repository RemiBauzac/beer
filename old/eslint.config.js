import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import importPlugin from 'eslint-plugin-import';
import nPlugin from 'eslint-plugin-n';
import promisePlugin from 'eslint-plugin-promise';
import globals from 'globals';

export default tseslint.config(
  { ignores: ['app/lib/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  importPlugin.flatConfigs.recommended,
  nPlugin.configs['flat/recommended'],
  promisePlugin.configs['flat/recommended'],
  {
    files: ['app/**/*.js', 'app/**/*.jsx'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      quotes: ['error', 'single'],
      semi: ['error', 'always'],
      indent: ['error', 2],
      'no-multi-spaces': ['error'],
      'space-before-function-paren': ['error', {
        anonymous: 'never',
        named: 'never',
        asyncArrow: 'never',
      }],
      eqeqeq: ['error', 'smart'],
      'no-var': ['error'],
      'no-return-assign': ['error', 'always'],
      'no-console': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'n/no-unsupported-features/node-builtins': 'off',
      '@typescript-eslint/no-this-alias': 'off',
    },
  },
  {
    files: ['app/sw/*.js'],
    languageOptions: {
      globals: {
        ...globals.serviceworker,
        zip: 'readonly',
        FileDecryptor: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { varsIgnorePattern: '^FileDecryptor$' }],
    },
  },
);
