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
import { NotAllowedError } from '@backstage/errors';
import { RUN_INIT_DEEP_LINK_HASH } from '@red-hat-developer-hub/backstage-plugin-x2a-common';

import { buildMocks, NOW } from './__testUtils__';

const createInput = {
  name: 'New Migration',
  description: 'Migrate the thing',
  sourceRepoUrl: 'https://github.com/acme/old',
  targetRepoUrl: 'https://github.com/acme/new',
  sourceRepoBranch: 'main',
  targetRepoBranch: 'main',
};

describe('x2a-create-project MCP tool', () => {
  it('creates a project and returns its fields', async () => {
    const { getAction, x2aDatabase } = buildMocks();
    const createdProject = {
      ...createInput,
      id: 'proj-new-001',
      ownedBy: 'user:default/mock',
      createdAt: NOW,
    };
    x2aDatabase.createProject.mockResolvedValue(createdProject);

    const action = getAction('x2a-create-project');
    const result = await action({
      input: createInput,
      credentials: mockCredentials.user(),
      logger: mockServices.logger.mock(),
    });

    expect(result).toEqual({
      output: {
        id: 'proj-new-001',
        name: 'New Migration',
        description: 'Migrate the thing',
        sourceRepoUrl: 'https://github.com/acme/old',
        targetRepoUrl: 'https://github.com/acme/new',
        sourceRepoBranch: 'main',
        targetRepoBranch: 'main',
        ownedBy: 'user:default/mock',
        createdAt: NOW.toISOString(),
        projectDetailsUrl: `http://localhost:3000/x2a/projects/proj-new-001${RUN_INIT_DEEP_LINK_HASH}`,
      },
    });

    expect(x2aDatabase.createProject).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'New Migration',
        sourceRepoUrl: 'https://github.com/acme/old',
      }),
      expect.objectContaining({
        credentials: expect.any(Object),
      }),
    );
  });

  it('passes ownedByGroup when user belongs to the group', async () => {
    const { getAction, x2aDatabase, catalog } = buildMocks();

    catalog.getEntityByRef.mockResolvedValue({
      kind: 'User',
      metadata: { name: 'mock', namespace: 'default' },
      apiVersion: 'backstage.io/v1alpha1',
      spec: {},
      relations: [{ type: 'memberOf', targetRef: 'group:default/team-a' }],
    });

    const createdProject = {
      ...createInput,
      id: 'proj-grp',
      ownedByGroup: 'group:default/team-a',
      ownedBy: 'user:default/mock',
      createdAt: NOW,
    };
    x2aDatabase.createProject.mockResolvedValue(createdProject);

    const action = getAction('x2a-create-project');
    await expect(
      action({
        input: { ...createInput, ownedByGroup: 'group:default/team-a' },
        credentials: mockCredentials.user(),
        logger: mockServices.logger.mock(),
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        output: expect.objectContaining({ id: 'proj-grp' }),
      }),
    );
  });

  it('rejects ownedByGroup when user does not belong to the group', async () => {
    const { getAction } = buildMocks();

    const action = getAction('x2a-create-project');
    await expect(
      action({
        input: { ...createInput, ownedByGroup: 'group:default/other-team' },
        credentials: mockCredentials.user(),
        logger: mockServices.logger.mock(),
      }),
    ).rejects.toThrow(NotAllowedError);
  });

  it('rejects an unauthorised user', async () => {
    const { getAction, permissionsSvc } = buildMocks();
    permissionsSvc.authorize.mockResolvedValue([
      { result: AuthorizeResult.DENY },
    ]);

    const action = getAction('x2a-create-project');
    await expect(
      action({
        input: createInput,
        credentials: mockCredentials.user(),
        logger: mockServices.logger.mock(),
      }),
    ).rejects.toThrow(NotAllowedError);
  });

  it('serialises string createdAt as-is', async () => {
    const { getAction, x2aDatabase } = buildMocks();
    x2aDatabase.createProject.mockResolvedValue({
      ...createInput,
      id: 'proj-str',
      ownedBy: 'user:default/mock',
      createdAt: 'not-a-date',
    });

    const action = getAction('x2a-create-project');
    const result = await action({
      input: createInput,
      credentials: mockCredentials.user(),
      logger: mockServices.logger.mock(),
    });

    expect(result.output.createdAt).toBe('not-a-date');
  });
});
