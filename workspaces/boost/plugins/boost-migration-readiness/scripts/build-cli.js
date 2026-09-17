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

// `backstage-cli package build` (node-library role) only bundles the
// declared `main` entry point (src/index.ts). src/cli.ts is deliberately
// not re-exported from index.ts (it calls main() at module scope, which
// would run the CLI as a side effect of importing the library), so it
// needs its own bundling step to produce the `bin` target declared in
// package.json.
const { build } = require('esbuild');

build({
  entryPoints: ['src/cli.ts'],
  outfile: 'dist/cli.cjs.js',
  bundle: true,
  platform: 'node',
  format: 'cjs',
  // Bundle local (relative-import) modules only; leave npm packages
  // (e.g. the entity-provider-sdk) to be resolved from node_modules at
  // runtime, same as the node-library build output.
  packages: 'external',
  banner: { js: '#!/usr/bin/env node' },
  logLevel: 'info',
}).catch(() => {
  process.exit(1);
});
