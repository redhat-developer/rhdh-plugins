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

import { buildMocks, MOCK_PROJECT, NOW } from './__testUtils__';

describe('x2a-list-projects MCP tool', () => {
  it('returns paginated project list with defaults', async () => {
    const { getAction, x2aDatabase } = buildMocks();
    x2aDatabase.listProjects.mockResolvedValue({
      totalCount: 1,
      projects: [MOCK_PROJECT],
    });

    const action = getAction('x2a-list-projects');
    const result = await action({
      input: {},
      credentials: mockCredentials.user(),
      logger: mockServices.logger.mock(),
    });

    expect(result).toEqual({
      output: {
        totalCount: 1,
        items: [
          expect.objectContaining({
            id: 'proj-001',
            name: 'Legacy EAP Migration',
            abbreviation: 'LEM',
            createdAt: NOW.toISOString(),
            status: { state: 'new' },
          }),
        ],
      },
    });

    expect(x2aDatabase.listProjects).toHaveBeenCalledWith(
      {
        page: undefined,
        pageSize: undefined,
        sort: undefined,
        order: undefined,
      },
      expect.objectContaining({
        canViewAll: true,
        groupsOfUser: [],
      }),
    );
  });

  it('forwards pagination and sort parameters', async () => {
    const { getAction, x2aDatabase } = buildMocks();
    x2aDatabase.listProjects.mockResolvedValue({
      totalCount: 50,
      projects: [],
    });

    const action = getAction('x2a-list-projects');
    await action({
      input: { page: 2, pageSize: 10, sort: 'name', order: 'asc' },
      credentials: mockCredentials.user(),
      logger: mockServices.logger.mock(),
    });

    expect(x2aDatabase.listProjects).toHaveBeenCalledWith(
      { page: 2, pageSize: 10, sort: 'name', order: 'asc' },
      expect.any(Object),
    );
  });

  it('serializes Date createdAt to ISO string', async () => {
    const { getAction, x2aDatabase } = buildMocks();
    x2aDatabase.listProjects.mockResolvedValue({
      totalCount: 1,
      projects: [{ ...MOCK_PROJECT, createdAt: NOW }],
    });

    const action = getAction('x2a-list-projects');
    const result = await action({
      input: {},
      credentials: mockCredentials.user(),
      logger: mockServices.logger.mock(),
    });

    expect(result.output.items[0].createdAt).toBe('2025-06-01T12:00:00.000Z');
  });

  it('serializes string createdAt as-is', async () => {
    const { getAction, x2aDatabase } = buildMocks();
    x2aDatabase.listProjects.mockResolvedValue({
      totalCount: 1,
      projects: [{ ...MOCK_PROJECT, createdAt: '2025-01-01' }],
    });

    const action = getAction('x2a-list-projects');
    const result = await action({
      input: {},
      credentials: mockCredentials.user(),
      logger: mockServices.logger.mock(),
    });

    expect(result.output.items[0].createdAt).toBe('2025-01-01');
  });

  it('omits status when project has none', async () => {
    const { getAction, x2aDatabase } = buildMocks();
    const { status: _, ...projectWithoutStatus } = MOCK_PROJECT;
    x2aDatabase.listProjects.mockResolvedValue({
      totalCount: 1,
      projects: [projectWithoutStatus],
    });

    const action = getAction('x2a-list-projects');
    const result = await action({
      input: {},
      credentials: mockCredentials.user(),
      logger: mockServices.logger.mock(),
    });

    expect(result.output.items[0].status).toBeUndefined();
  });

  it('rejects an unauthorized user', async () => {
    const { getAction, permissionsSvc } = buildMocks();
    permissionsSvc.authorize.mockResolvedValue([
      { result: AuthorizeResult.DENY },
    ]);

    const action = getAction('x2a-list-projects');
    await expect(
      action({
        input: {},
        credentials: mockCredentials.user(),
        logger: mockServices.logger.mock(),
      }),
    ).rejects.toThrow(NotAllowedError);
  });
});
