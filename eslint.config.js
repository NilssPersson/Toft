// Lint rules for Toft. The intent behind them is in the "Coding style" section of CLAUDE.md.
import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import astro from 'eslint-plugin-astro';
import prettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const BOOLEAN_PREFIXES = ['is', 'has', 'can', 'should', 'was', 'needs'];

/** Modules that make up the game app, which only /play may load. */
const GAME_APP_IMPORTS = [
  { regex: '^three(/|$)', message: 'three.js belongs to the game on /play only.' },
  { regex: '^@react-three/', message: '@react-three belongs to the game on /play only.' },
  { regex: '^zustand(/|$)', message: 'The store belongs to the game on /play only.' },
  { regex: '(^|/)(state|scene|ui)/', message: 'Game code stays on /play.' },
  { regex: '(^|/)(App|Game)\\.tsx$', message: 'Game code stays on /play.' },
];

/** src/game is pure: no UI, rendering, store or app code. */
const PURE_GAME_IMPORTS = [
  ...GAME_APP_IMPORTS,
  { regex: '^react(-dom)?(/|$)', message: 'src/game is pure: no React.' },
  { regex: '(^|/)(pages|layouts|site)/', message: 'src/game is pure: no app code.' },
];

const IMPURE_TIME_AND_RANDOM = [
  { object: 'Date', property: 'now', message: 'src/game is pure: take `now` as a parameter.' },
  { object: 'Math', property: 'random', message: 'src/game is pure: take a `roll` as a parameter.' },
  { object: 'performance', property: 'now', message: 'src/game is pure: take `now` as a parameter.' },
];

const BROWSER_GLOBALS = [
  'window',
  'document',
  'navigator',
  'localStorage',
  'sessionStorage',
  'performance',
  'setTimeout',
  'setInterval',
  'requestAnimationFrame',
].map((name) => ({ name, message: 'src/game is pure: no browser APIs or timers.' }));

export default defineConfig(
  { ignores: ['dist/', '.astro/', '.wrangler/', 'node_modules/', 'coverage/'] },

  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  ...astro.configs.recommended,

  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parserOptions: {
        projectService: { allowDefaultProject: ['eslint.config.js'] },
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // Size and shape: small functions, shallow nesting, few parameters.
  {
    rules: {
      'max-lines-per-function': ['error', { max: 40, skipBlankLines: true, skipComments: true }],
      complexity: ['error', 8],
      'max-depth': ['error', 3],
      'max-params': ['error', 3],
      'max-lines': ['error', { max: 250, skipBlankLines: true, skipComments: true }],
    },
  },

  // Names.
  {
    rules: {
      'id-length': ['error', { min: 2, exceptions: ['i', 'j', 'x', 'y', 'z', '_'], properties: 'never' }],
      '@typescript-eslint/naming-convention': [
        'error',
        { selector: 'typeLike', format: ['PascalCase'] },
        { selector: 'variable', format: ['camelCase', 'UPPER_CASE', 'PascalCase'], leadingUnderscore: 'allow' },
        { selector: 'function', format: ['camelCase', 'PascalCase'] },
        { selector: 'parameter', format: ['camelCase'], leadingUnderscore: 'allow' },
        { selector: ['variable', 'parameter'], types: ['boolean'], format: ['PascalCase'], prefix: BOOLEAN_PREFIXES },
      ],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },

  // Types.
  {
    rules: {
      '@typescript-eslint/explicit-function-return-type': [
        'error',
        { allowExpressions: true, allowTypedFunctionExpressions: true, allowHigherOrderFunctions: true },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'separate-type-imports' },
      ],
      '@typescript-eslint/switch-exhaustiveness-check': [
        'error',
        { considerDefaultExhaustiveForUnions: false, requireDefaultForNonUnion: true },
      ],
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
      '@typescript-eslint/no-confusing-void-expression': ['error', { ignoreArrowShorthand: true }],
    },
  },

  // React hooks.
  {
    files: ['**/*.tsx'],
    plugins: { 'react-hooks': reactHooks },
    rules: reactHooks.configs.recommended.rules,
  },

  // Astro frontmatter: `astro check` type-checks it; type-aware lint rules are unreliable there.
  {
    files: ['**/*.astro'],
    ...tseslint.configs.disableTypeChecked,
  },
  {
    files: ['**/*.js'],
    ...tseslint.configs.disableTypeChecked,
  },

  // Architecture: src/game is pure.
  {
    files: ['src/game/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', { patterns: PURE_GAME_IMPORTS }],
      'no-restricted-properties': ['error', ...IMPURE_TIME_AND_RANDOM],
      'no-restricted-syntax': [
        'error',
        { selector: "NewExpression[callee.name='Date']", message: 'src/game is pure: take `now` as a parameter.' },
      ],
      'no-restricted-globals': ['error', ...BROWSER_GLOBALS],
    },
  },

  // Architecture: game code stays on /play.
  {
    files: ['src/pages/**/*', 'src/layouts/**/*'],
    ignores: ['src/pages/play.astro'],
    rules: {
      'no-restricted-imports': ['error', { patterns: GAME_APP_IMPORTS }],
    },
  },

  // Tests: exempt from the size rules, and may use real time and randomness.
  {
    files: ['**/*.test.ts'],
    rules: {
      'max-lines-per-function': 'off',
      complexity: 'off',
      'max-depth': 'off',
      'max-params': 'off',
      'max-lines': 'off',
      'no-restricted-properties': 'off',
      'no-restricted-syntax': 'off',
    },
  },

  prettier,
);
