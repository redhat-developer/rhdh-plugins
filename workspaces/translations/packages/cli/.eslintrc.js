const baseConfig = require('@backstage/cli/config/eslint-factory')(__dirname);

module.exports = {
  ...baseConfig,
  rules: {
    ...baseConfig.rules,
    // CLI packages need runtime dependencies in dependencies, not devDependencies
    '@backstage/no-undeclared-imports': 'off',
  },
  overrides: [
    ...(baseConfig.overrides || []),
    {
      files: ['src/**/*.ts'],
      rules: {
        '@backstage/no-undeclared-imports': 'off',
      },
    },
  ],
};

