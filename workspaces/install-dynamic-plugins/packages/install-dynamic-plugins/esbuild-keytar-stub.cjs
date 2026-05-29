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
// credentials — so we alias keytar to this stub at build time to keep the
// init-container artifact a single self-contained file.
//
// The stub throws on every method ON PURPOSE: install never reads or writes
// credentials, so if any of these is ever invoked it means a future
// @backstage/cli-node release started using keytar in a code path the install
// command reaches. Failing loudly here surfaces that during testing instead of
// silently returning a wrong (null) credential in an unattended init-container.
const stubbed = () => {
  throw new Error(
    'keytar was invoked but is stubbed out in the bundled install-dynamic-plugins CLI. ' +
      'A dependency now needs real credential storage in the install path — ' +
      'revisit the esbuild keytar alias.',
  );
};

module.exports = {
  getPassword: stubbed,
  setPassword: stubbed,
  deletePassword: stubbed,
  findCredentials: stubbed,
  findPassword: stubbed,
};
