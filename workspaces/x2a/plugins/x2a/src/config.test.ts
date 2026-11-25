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
 * See the License for the specific language governing permissions and limitations under the License.
 *
 * @jest-environment node
 */

import { loadConfigSchema } from '@backstage/config-loader';
import { resolve } from 'node:path';

describe('x2a frontend configuration schema', () => {
  it('ships x2a.scm.authHosts.* to the frontend', async () => {
    const schema = await loadConfigSchema({
      dependencies: [],
      packagePaths: [resolve(__dirname, '../package.json')],
    });
    const data = {
      x2a: {
        scm: {
          authHosts: {
            github: 'ghe.example.com',
            gitlab: 'gitlab.example.com',
          },
        },
      },
    };

    // `@visibility` on an object is not inherited by its keys; the guard in
    // useRepoAuth would then see no auth host and refuse every host. Schema
    // errors (required keys of other packages) are not what this checks.
    expect(
      schema.process([{ context: 'test', data }], {
        visibility: ['frontend'],
        ignoreSchemaErrors: true,
      })[0].data,
    ).toEqual(data);
  });
});
