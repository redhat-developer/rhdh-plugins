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
import { createMockActionContext } from '@backstage/plugin-scaffolder-node-test-utils';

import { createExampleAction } from './example';

describe('createExampleAction', () => {
  it('should call action', async () => {
    const action = createExampleAction();

    await expect(
      action.handler(
        createMockActionContext({
          input: {
            myParameter: 'test',
          },
        }),
      ),
    ).resolves.toBeUndefined();
  });

  it('should fail when passing foo', async () => {
    const action = createExampleAction();

    await expect(
      action.handler(
        createMockActionContext({
          input: {
            myParameter: 'foo',
          },
        }),
      ),
    ).rejects.toThrow("myParameter cannot be 'foo'");
  });
});
