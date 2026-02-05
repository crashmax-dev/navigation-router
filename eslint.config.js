import antfu from '@antfu/eslint-config'

export default antfu({
  typescript: true,
  rules: {
    // js
    'no-nested-ternary': 'error',
    'max-params': ['error', 3],
    'ts/no-unused-expressions': ['error', {
      allowTernary: false,
    }],

    // imports
    'perfectionist/sort-imports': ['error', {
      groups: [
        'value-builtin',
        'value-external',
        ['value-internal', 'type-internal'],
        ['value-parent', 'value-sibling', 'value-index'],

        'type-import',
        ['type-parent', 'type-sibling', 'type-index'],

        'side-effect',
        'ts-equals-import',
        'unknown',
      ],
      newlinesBetween: 'ignore',
      order: 'asc',
      type: 'natural',
    }],

    // off
    'curly': 'off',
    'no-alert': 'off',
    'no-console': 'off',
    'no-cond-assign': 'off',
    'no-template-curly-in-string': 'off',
    'ts/no-redeclare': 'off',
    'ts/ban-ts-comment': 'off',
    'ts/method-signature-style': 'off',
    'ts/consistent-type-definitions': 'off',
    'node/prefer-global/process': 'off',
    'node/prefer-global/buffer': 'off',
    'antfu/if-newline': 'off',
    'antfu/no-top-level-await': 'off',
    'eslint-comments/no-unlimited-disable': 'off',
    'regexp/no-obscure-range': 'off',
    'regexp/no-super-linear-backtracking': 'off',

    // warns
    'no-unused-vars': 'warn',
    'unused-imports/no-unused-imports': 'warn',

    // errors
    'no-else-return': 'error',
  },
  stylistic: {
    overrides: {
      'style/implicit-arrow-linebreak': ['error', 'beside'],
      'style/nonblock-statement-body-position': ['error', 'beside'],
      'style/brace-style': ['warn', '1tbs'],
      'style/arrow-parens': 'off',
    },
  },
})
