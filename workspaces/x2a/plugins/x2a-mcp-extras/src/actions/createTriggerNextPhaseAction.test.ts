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
import { mockCredentials, mockServices } from '@backstage/backend-test-utils';
import { AuthorizeResult } from '@backstage/plugin-permission-common';
import { NotAllowedError, NotFoundError } from '@backstage/errors';

import { RUN_NEXT_DEEP_LINK_HASH } from '@red-hat-developer-hub/backstage-plugin-x2a-common';

import { buildMocks, MOCK_PROJECT } from './__testUtils__';

describe('x2a-trigger-next-phase MCP tool', () => {
  it('returns the project details URL for a valid project', async () => {
    const { getAction, x2aDatabase } = buildMocks();
    x2aDatabase.getProject.mockResolvedValue(MOCK_PROJECT);

    const action = getAction('x2a-trigger-next-phase');
    const result = await action({
      input: { projectId: 'proj-001' },
      credentials: mockCredentials.user(),
      logger: mockServices.logger.mock(),
    });

    expect(result).toEqual({
      output: {
        projectId: 'proj-001',
        name: 'Legacy EAP Migration',
        projectDetailsUrl: `http://localhost:3000/x2a/projects/proj-001${RUN_NEXT_DEEP_LINK_HASH}`,
      },
    });
  });

  it('throws NotFoundError when project does not exist', async () => {
    const { getAction, x2aDatabase } = buildMocks();
    x2aDatabase.getProject.mockResolvedValue(undefined);

    const action = getAction('x2a-trigger-next-phase');
    await expect(
      action({
        input: { projectId: 'nonexistent' },
        credentials: mockCredentials.user(),
        logger: mockServices.logger.mock(),
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it('rejects an unauthorised user', async () => {
    const { getAction, permissionsSvc } = buildMocks();
    permissionsSvc.authorize.mockResolvedValue([
      { result: AuthorizeResult.DENY },
    ]);

    const action = getAction('x2a-trigger-next-phase');
    await expect(
      action({
        input: { projectId: 'proj-001' },
        credentials: mockCredentials.user(),
        logger: mockServices.logger.mock(),
      }),
    ).rejects.toThrow(NotAllowedError);
  });
});
