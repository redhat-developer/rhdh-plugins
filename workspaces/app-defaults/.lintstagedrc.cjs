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

'use strict';

const path = require('path');

/**
 * ESLint ignores config-style dotfiles by default; passing them on the CLI only
 * produces noise. Skip eslint/prettier for those; still format via other globs if needed.
 */
function skipLintStagedEslintPrettier(file) {
  const base = path.basename(file.replace(/\\/g, '/'));
  return base === '.eslintrc.js' || base === '.lintstagedrc.cjs';
}

module.exports = {
  '*.{js,jsx,ts,tsx,mjs,cjs}': filenames => {
    const filtered = filenames.filter(f => !skipLintStagedEslintPrettier(f));
    if (!filtered.length) {
      return [];
    }
    const quoted = filtered.map(f => JSON.stringify(f));
    return [
      `eslint --fix ${quoted.join(' ')}`,
      `prettier --write ${quoted.join(' ')}`,
    ];
  },
  '*.{json,md}': ['prettier --write'],
};
