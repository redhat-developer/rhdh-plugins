/*
 * Copyright Red Hat, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const muiV5StylesMessage =
  'Use @mui/material (sx/styled) or Backstage UI instead. @mui/styles is deprecated (legacy JSS) and is not compatible with React 18 / StrictMode.';

const materialUiMigrationEslintConfig = {
  restrictedImports: [
    {
      name: '@material-ui/core',
      message: 'Use @mui/material instead of Material UI v4.',
    },
    {
      name: '@material-ui/core/styles',
      message: muiV5StylesMessage,
    },
    {
      name: '@material-ui/lab',
      message: 'Use @mui/material instead of Material UI v4.',
    },
    {
      name: '@material-ui/styles',
      message: muiV5StylesMessage,
    },
    {
      name: '@mui/styles',
      message: muiV5StylesMessage,
    },
  ],
  // `*` does not match `/`, so `@material-ui/*` misses `@material-ui/core/styles`.
  restrictedImportPatterns: [
    '@material-ui/*',
    '@material-ui/*/*',
    '@mui/styles/*',
  ],
};

/**
 * Shared ESLint config for frontend packages in the intelligent-assistant workspace.
 */
module.exports = packageDir =>
  require('@backstage/cli/config/eslint-factory')(
    packageDir,
    materialUiMigrationEslintConfig,
  );
