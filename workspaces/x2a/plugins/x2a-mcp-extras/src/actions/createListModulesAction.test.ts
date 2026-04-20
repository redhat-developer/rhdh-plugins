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

import { buildMocks, MOCK_PROJECT } from './__testUtils__';

describe('x2a-list-modules MCP tool', () => {
  it('returns modules for a project the user can access', async () => {
    const { getAction, x2aDatabase } = buildMocks();
    x2aDatabase.getProject.mockResolvedValue(MOCK_PROJECT);
    x2aDatabase.listModules.mockResolvedValue([
      {
        id: 'mod-1',
        name: 'App',
        sourcePath: '/app',
        projectId: 'proj-001',
        status: 'pending',
      },
    ]);

    const action = getAction('x2a-list-modules');
    const result = await action({
      input: { projectId: 'proj-001' },
      credentials: mockCredentials.user(),
      logger: mockServices.logger.mock(),
    });

    expect(x2aDatabase.getProject).toHaveBeenCalledWith(
      { projectId: 'proj-001', skipEnrichment: true },
      expect.any(Object),
    );
    expect(x2aDatabase.listModules).toHaveBeenCalledWith({
      projectId: 'proj-001',
    });
    expect(result.output).toEqual({
      projectId: 'proj-001',
      projectName: 'Legacy EAP Migration',
      projectDetailsUrl: 'http://localhost:3000/x2a/projects/proj-001',
      items: [
        {
          id: 'mod-1',
          name: 'App',
          sourcePath: '/app',
          projectId: 'proj-001',
          status: 'pending',
          moduleDetailsUrl:
            'http://localhost:3000/x2a/projects/proj-001/modules/mod-1',
        },
      ],
    });
  });

  it('throws NotFoundError when project does not exist', async () => {
    const { getAction, x2aDatabase } = buildMocks();
    x2aDatabase.getProject.mockResolvedValue(undefined);

    const action = getAction('x2a-list-modules');
    await expect(
      action({
        input: { projectId: 'nonexistent' },
        credentials: mockCredentials.user(),
        logger: mockServices.logger.mock(),
      }),
    ).rejects.toThrow(NotFoundError);
    expect(x2aDatabase.listModules).not.toHaveBeenCalled();
  });

  it('rejects an unauthorised user', async () => {
    const { getAction, permissionsSvc } = buildMocks();
    permissionsSvc.authorize.mockResolvedValue([
      { result: AuthorizeResult.DENY },
    ]);

    const action = getAction('x2a-list-modules');
    await expect(
      action({
        input: { projectId: 'proj-001' },
        credentials: mockCredentials.user(),
        logger: mockServices.logger.mock(),
      }),
    ).rejects.toThrow(NotAllowedError);
  });
});
