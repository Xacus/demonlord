module.exports = {
  parserOptions: {
    sourceType: 'module',
  },

  env: {
    "browser": true,
    "commonjs": true,
    "es2021": true,
    "jquery": true
  },

  extends: [
    'eslint:recommended',
    '@typhonjs-fvtt/eslint-config-foundry.js/latest-0.8.x',
    'prettier',
  ],

  plugins: [],

  rules: {
    // Specify any specific ESLint rules.
    'no-shadow': ['error',{ builtinGlobals: true, hoist: 'all', allow: ['event'] },],
    "no-unused-vars": ["error", { "vars": "local", "args": "after-used", "ignoreRestSiblings": false, argsIgnorePattern: '^_'}]
  },

  globals: {
      "DocumentSheetConfig": true
  }
}
