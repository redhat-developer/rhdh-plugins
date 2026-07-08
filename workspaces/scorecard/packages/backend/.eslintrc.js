module.exports = require('@backstage/cli/config/eslint-factory')(__dirname, {
  overrides: [
    {
      files: ['src/__fixtures__/**'],
      rules: {
        '@backstage/no-undeclared-imports': 'off',
      },
    },
  ],
});
