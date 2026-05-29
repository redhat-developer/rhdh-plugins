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

// keytar is a native (.node) credential-store module pulled in transitively by
// @backstage/cli-node (for `@backstage/cli-module-auth`). esbuild cannot bundle
// native binaries into a single .cjs, and the install command never touches
// credentials — so we alias keytar to these no-ops at build time to keep the
// init-container artifact a single self-contained file.
module.exports = {
  getPassword: async () => null,
  setPassword: async () => {},
  deletePassword: async () => false,
  findCredentials: async () => [],
  findPassword: async () => null,
};
