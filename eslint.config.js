import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import importPlugin from 'eslint-plugin-import';
import security from 'eslint-plugin-security';
import globals from 'globals';

export default [
  js.configs.recommended,

  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',

      // ✅ ADD THIS
      globals: {
        ...globals.node, // gives access to process, __dirname, etc.
      },
    },

    plugins: {
      import: importPlugin,
      security,
    },

    rules: {
      'no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      'no-undef': 'error',
      'no-extra-semi': 'error',
      'no-unreachable': 'error',
      'no-constant-condition': 'warn',

      eqeqeq: ['error', 'always'],
      curly: ['error', 'all'],
      'no-var': 'error',
      'prefer-const': 'error',
      'prefer-template': 'warn',

      'no-console': 'off',
      'no-empty': 'off',
      'no-useless-catch': 'off',

      'import/order': [
        'warn',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
          ],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'import/no-unresolved': 'off',
      'import/named': 'off',

      'security/detect-object-injection': 'off',
      'security/detect-non-literal-fs-filename': 'warn',
      'security/detect-non-literal-require': 'warn',

      'arrow-body-style': 'off',
      'prefer-arrow-callback': 'off',
    },
  },

  prettier,
];
