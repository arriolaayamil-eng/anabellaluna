module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    'react-app',
    'react-app/jest',
    'airbnb',
    'airbnb/hooks',
  ],
  parserOptions: {
    ecmaFeatures: { jsx: true },
    ecmaVersion: 12,
    sourceType: 'module',
  },
  plugins: ['react'],
  rules: {
    // Off — not needed with React 17+ JSX transform
    'react/react-in-jsx-scope': 0,
    // Off — we use .jsx and .js freely
    'react/jsx-filename-extension': 0,
    // Off — no prop-types, we trust TS-like patterns
    'react/prop-types': 0,
    // Off — component definition style is flexible
    'react/function-component-definition': 0,
    // Off — linebreak style varies by OS
    'linebreak-style': 0,
    // Off — state-in-constructor not relevant for hooks
    'react/state-in-constructor': 0,
    // Off — named exports are fine
    'import/prefer-default-export': 0,
    // Off — file extensions in imports not required
    'import/extensions': 0,
    // Off — object-curly-newline is too opinionated
    'object-curly-newline': 0,
    // Off — one expression per line too strict for JSX
    'react/jsx-one-expression-per-line': 0,
    // Off — click events on non-interactive elements (pragmatic)
    'jsx-a11y/click-events-have-key-events': 0,
    // Off — alt-text handled manually
    'jsx-a11y/alt-text': 0,
    // Off — autofocus is intentional in forms
    'jsx-a11y/no-autofocus': 0,
    // Off — static element interactions (pragmatic)
    'jsx-a11y/no-static-element-interactions': 0,
    // Off — array index keys are fine for static lists
    'react/no-array-index-key': 0,

    // Off — style preferences, not bugs
    'no-console': 'off',
    'no-alert': 'off',
    'no-nested-ternary': 'off',
    'react/jsx-props-no-spreading': 'off',
    'react/no-unstable-nested-components': 'off',
    'import/no-cycle': 'off',
    'jsx-a11y/label-has-associated-control': 'off',

    // Error — keep strict
    'max-len': [2, 550],
    'no-multiple-empty-lines': ['error', { max: 1, maxEOF: 1 }],
    'no-underscore-dangle': ['error', {
      allow: ['_d', '_dh', '_h', '_id', '_m', '_n', '_t', '_text'],
    }],
    'jsx-a11y/control-has-associated-label': 'off',
    'jsx-a11y/anchor-is-valid': ['error', {
      components: ['Link'],
      specialLink: ['to', 'hrefLeft', 'hrefRight'],
      aspects: ['noHref', 'invalidHref', 'preferButton'],
    }],
  },
};
