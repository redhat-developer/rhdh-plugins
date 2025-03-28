/*
 * Copyright The Backstage Authors
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
const exec = require('child_process');

describe('marketplace-cli', () => {
  it('should not crash trying to run export-csv', () => {
    const output = exec.execSync(
      '../bin/marketplace-cli export-csv -p ../../../ -r',
      {
        cwd: __dirname,
        stdio: 'inherit',
      },
    );
    expect(output).toBeDefined();
  });
});
