module.exports = {
  ...require('@backstage/cli/config/eslint-factory')(__dirname),
  ignorePatterns: ['dist-scalprum/**', 'dist/**'],
};

