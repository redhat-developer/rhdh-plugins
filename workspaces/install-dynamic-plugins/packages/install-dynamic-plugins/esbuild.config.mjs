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
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const keytarStub = fileURLToPath(
  new URL('./esbuild-keytar-stub.cjs', import.meta.url),
);

await build({
  entryPoints: ['src/cli.ts'],
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'cjs',
  outfile: 'dist/install-dynamic-plugins.cjs',
  // @backstage/cli-node pulls in keytar (a native .node credential store) that
  // esbuild cannot bundle into a single file. The install command never reads
  // credentials, so alias keytar to no-ops to keep a single self-contained .cjs.
  alias: { keytar: keytarStub },
  // Minify the production bundle to reduce cold-start parse cost in the
  // init container. The external sourcemap is what `node --enable-source-maps`
  // consumes if a stack trace needs to be unminified during debugging.
  minify: true,
  sourcemap: 'external',
  legalComments: 'external',
  logLevel: 'info',
});
