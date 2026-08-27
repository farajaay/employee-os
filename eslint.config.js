import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'android', 'ios', 'node_modules'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    // The app runs in a browser (and, from M-20, in a WKWebView / Android
    // WebView). Without these, document/location/scrollTo all read as undefined.
    languageOptions: {
      globals: { ...globals.browser }
    }
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      parserOptions: { ecmaVersion: 2022, sourceType: 'module' }
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': 'error',
      eqeqeq: ['error', 'always'],
      'no-console': ['error', { allow: ['warn', 'error'] }]
    }
  },
  {
    // Node scripts, not browser code.
    files: ['scripts/**/*.mjs'],
    languageOptions: { globals: { ...globals.node } }
  },
  {
    // M-05 stage 1 moved the product's inline <script> here BYTE-IDENTICALLY —
    // the only diff against docs/baseline/index.upstream.html is the M-00
    // rename. Linting it would demand edits to code that must not change yet,
    // so style rules are off until stage 2 splits it into src/app/ and
    // src/features/. `supabase` is the CDN global that M-06 removes.
    files: ['src/main.js'],
    languageOptions: {
      globals: { ...globals.browser, supabase: 'readonly' }
    },
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'no-useless-escape': 'off',
      'no-empty': 'off'
    }
  }
);
