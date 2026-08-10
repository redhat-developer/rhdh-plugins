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
import { actionsRegistryServiceMock } from '@backstage/backend-test-utils/alpha';
import { NotAllowedError } from '@backstage/errors';
import { AuthorizeResult } from '@backstage/plugin-permission-common';

import { OrchestratorService } from '../service/OrchestratorService';
import { testConditionTransformer as conditionTransformer } from './__fixtures__/testConditionTransformer';
import { createListInstancesAction } from './listInstances';

// RHIDP-14047: list-instances must support an optional status filter,
// output instance ids/workflow names/statuses/timestamps, enforce the read
// permission, restrict non-admin callers to their own instances, and throw
// NotAllowedError when access is denied outright.
describe('createListInstancesAction', () => {
  const logger = mockServices.logger.mock();
  const mockUserInfo = mockServices.userInfo.mock();

  const mockOrchestratorService = {
    getWorkflowIds: jest.fn(),
    fetchInstances: jest.fn(),
  } as unknown as OrchestratorService;

  const rawInstances = [
    {
      id: 'instance-1',
      processId: 'workflow1',
      processName: 'Onboard Employee',
      state: 'ACTIVE',
      start: '2026-01-01T00:00:00.000Z',
      endpoint: 'http://example.com',
      nodes: [],
      variables: { initiatorEntity: 'user:default/jdoe' },
    },
    {
      id: 'instance-2',
      processId: 'workflow2',
      processName: 'Offboard Employee',
      state: 'COMPLETED',
      start: '2026-01-02T00:00:00.000Z',
      end: '2026-01-02T00:05:00.000Z',
      endpoint: 'http://example.com',
      nodes: [],
      variables: { initiatorEntity: 'user:default/someone-else' },
    },
  ];

  beforeEach(() => {
    jest.resetAllMocks();
    mockUserInfo.getUserInfo.mockResolvedValue({
      userEntityRef: 'user:default/jdoe',
      ownershipEntityRefs: [],
    });
    (mockOrchestratorService.getWorkflowIds as jest.Mock).mockReturnValue([
      'workflow1',
      'workflow2',
    ]);
  });

  function allowAccess(
    mockPermissions: ReturnType<typeof mockServices.permissions.mock>,
  ) {
    mockPermissions.authorizeConditional.mockResolvedValue([
      { result: AuthorizeResult.ALLOW },
    ]);
  }

  it('returns instance ids, workflow names, statuses, and timestamps', async () => {
    const mockActionsRegistry = actionsRegistryServiceMock();
    const mockPermissions = mockServices.permissions.mock();
    allowAccess(mockPermissions);
    mockPermissions.authorize.mockResolvedValue([
      { result: AuthorizeResult.DENY },
    ]); // not admin-view
    (mockOrchestratorService.fetchInstances as jest.Mock).mockResolvedValue(
      rawInstances,
    );

    createListInstancesAction({
      actionsRegistry: mockActionsRegistry,
      permissions: mockPermissions,
      userInfo: mockUserInfo,
      orchestratorService: mockOrchestratorService,
      conditionTransformer,
      logger,
    });

    const result = await mockActionsRegistry.invoke({
      id: 'test:list-instances',
      input: {},
    });

    expect(result.output).toMatchObject({
      instances: [
        {
          instanceId: 'instance-1',
          workflowId: 'workflow1',
          workflowName: 'Onboard Employee',
          status: 'ACTIVE',
          startTime: '2026-01-01T00:00:00.000Z',
        },
        {
          instanceId: 'instance-2',
          workflowId: 'workflow2',
          workflowName: 'Offboard Employee',
          status: 'COMPLETED',
          startTime: '2026-01-02T00:00:00.000Z',
          endTime: '2026-01-02T00:05:00.000Z',
        },
      ],
    });
  });

  it('restricts non-admin callers to their own instances via an ownership filter', async () => {
    const mockActionsRegistry = actionsRegistryServiceMock();
    const mockPermissions = mockServices.permissions.mock();
    allowAccess(mockPermissions);
    mockPermissions.authorize.mockResolvedValue([
      { result: AuthorizeResult.DENY },
    ]); // not admin-view
    (mockOrchestratorService.fetchInstances as jest.Mock).mockResolvedValue([]);

    createListInstancesAction({
      actionsRegistry: mockActionsRegistry,
      permissions: mockPermissions,
      userInfo: mockUserInfo,
      orchestratorService: mockOrchestratorService,
      conditionTransformer,
      logger,
    });

    await mockActionsRegistry.invoke({
      id: 'test:list-instances',
      input: {},
      credentials: mockCredentials.user('user:default/jdoe'),
    });

    expect(mockOrchestratorService.fetchInstances).toHaveBeenCalledWith(
      expect.objectContaining({
        workflowIds: ['workflow1', 'workflow2'],
        filter: {
          field: 'variables',
          nested: {
            operator: 'EQ',
            value: 'user:default/jdoe',
            field: 'initiatorEntity',
          },
        },
      }),
    );
  });

  // Regression test for https://github.com/redhat-developer/rhdh-plugins/pull/4117#issuecomment-5240741356:
  // a static-token MCP caller (a service principal, never a user principal)
  // without instance admin-view must not crash UserInfoService.getUserInfo's
  // "Only user credentials are supported" check.
  it('falls back to the system initiator ref for a non-admin service-principal caller, without crashing', async () => {
    const mockActionsRegistry = actionsRegistryServiceMock();
    const mockPermissions = mockServices.permissions.mock();
    allowAccess(mockPermissions);
    mockPermissions.authorize.mockResolvedValue([
      { result: AuthorizeResult.DENY },
    ]); // not admin-view
    (mockOrchestratorService.fetchInstances as jest.Mock).mockResolvedValue([]);

    createListInstancesAction({
      actionsRegistry: mockActionsRegistry,
      permissions: mockPermissions,
      userInfo: mockUserInfo,
      orchestratorService: mockOrchestratorService,
      conditionTransformer,
      logger,
    });

    await mockActionsRegistry.invoke({
      id: 'test:list-instances',
      input: {},
      credentials: mockCredentials.service('mcp-clients'),
    });

    expect(mockOrchestratorService.fetchInstances).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: {
          field: 'variables',
          nested: {
            operator: 'EQ',
            value: 'user:default/system',
            field: 'initiatorEntity',
          },
        },
      }),
    );
    expect(mockUserInfo.getUserInfo).not.toHaveBeenCalled();
  });

  it('does not apply an ownership filter for callers with instance admin-view permission', async () => {
    const mockActionsRegistry = actionsRegistryServiceMock();
    const mockPermissions = mockServices.permissions.mock();
    allowAccess(mockPermissions);
    mockPermissions.authorize.mockResolvedValue([
      { result: AuthorizeResult.ALLOW },
    ]); // admin-view granted
    (mockOrchestratorService.fetchInstances as jest.Mock).mockResolvedValue([]);

    createListInstancesAction({
      actionsRegistry: mockActionsRegistry,
      permissions: mockPermissions,
      userInfo: mockUserInfo,
      orchestratorService: mockOrchestratorService,
      conditionTransformer,
      logger,
    });

    await mockActionsRegistry.invoke({
      id: 'test:list-instances',
      input: {},
    });

    expect(mockOrchestratorService.fetchInstances).toHaveBeenCalledWith(
      expect.objectContaining({
        workflowIds: ['workflow1', 'workflow2'],
        filter: undefined,
      }),
    );
  });

  it('filters by status', async () => {
    const mockActionsRegistry = actionsRegistryServiceMock();
    const mockPermissions = mockServices.permissions.mock();
    allowAccess(mockPermissions);
    mockPermissions.authorize.mockResolvedValue([
      { result: AuthorizeResult.ALLOW },
    ]); // admin-view granted, to isolate the status filter alone
    (mockOrchestratorService.fetchInstances as jest.Mock).mockResolvedValue([]);

    createListInstancesAction({
      actionsRegistry: mockActionsRegistry,
      permissions: mockPermissions,
      userInfo: mockUserInfo,
      orchestratorService: mockOrchestratorService,
      conditionTransformer,
      logger,
    });

    await mockActionsRegistry.invoke({
      id: 'test:list-instances',
      input: { status: 'ACTIVE' },
    });

    expect(mockOrchestratorService.fetchInstances).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: { field: 'state', operator: 'EQ', value: 'ACTIVE' },
      }),
    );
  });

  it('defaults to a bounded page (limit 50, offset 0) when pagination is not specified', async () => {
    const mockActionsRegistry = actionsRegistryServiceMock();
    const mockPermissions = mockServices.permissions.mock();
    allowAccess(mockPermissions);
    mockPermissions.authorize.mockResolvedValue([
      { result: AuthorizeResult.ALLOW },
    ]);
    (mockOrchestratorService.fetchInstances as jest.Mock).mockResolvedValue([]);

    createListInstancesAction({
      actionsRegistry: mockActionsRegistry,
      permissions: mockPermissions,
      userInfo: mockUserInfo,
      orchestratorService: mockOrchestratorService,
      conditionTransformer,
      logger,
    });

    await mockActionsRegistry.invoke({
      id: 'test:list-instances',
      input: {},
    });

    expect(mockOrchestratorService.fetchInstances).toHaveBeenCalledWith(
      expect.objectContaining({
        pagination: { limit: 50, offset: 0 },
      }),
    );
  });

  it('passes through caller-supplied limit and offset', async () => {
    const mockActionsRegistry = actionsRegistryServiceMock();
    const mockPermissions = mockServices.permissions.mock();
    allowAccess(mockPermissions);
    mockPermissions.authorize.mockResolvedValue([
      { result: AuthorizeResult.ALLOW },
    ]);
    (mockOrchestratorService.fetchInstances as jest.Mock).mockResolvedValue([]);

    createListInstancesAction({
      actionsRegistry: mockActionsRegistry,
      permissions: mockPermissions,
      userInfo: mockUserInfo,
      orchestratorService: mockOrchestratorService,
      conditionTransformer,
      logger,
    });

    await mockActionsRegistry.invoke({
      id: 'test:list-instances',
      input: { limit: 10, offset: 20 },
    });

    expect(mockOrchestratorService.fetchInstances).toHaveBeenCalledWith(
      expect.objectContaining({
        pagination: { limit: 10, offset: 20 },
      }),
    );
  });

  it('rejects a limit greater than the maximum page size', async () => {
    const mockActionsRegistry = actionsRegistryServiceMock();
    const mockPermissions = mockServices.permissions.mock();

    createListInstancesAction({
      actionsRegistry: mockActionsRegistry,
      permissions: mockPermissions,
      userInfo: mockUserInfo,
      orchestratorService: mockOrchestratorService,
      conditionTransformer,
      logger,
    });

    await expect(
      mockActionsRegistry.invoke({
        id: 'test:list-instances',
        input: { limit: 500 },
      }),
    ).rejects.toThrow(/Invalid input/);
    expect(mockOrchestratorService.fetchInstances).not.toHaveBeenCalled();
  });

  it('returns an empty array without querying instances when no workflows are authorized', async () => {
    const mockActionsRegistry = actionsRegistryServiceMock();
    const mockPermissions = mockServices.permissions.mock();
    // Conditionally allowed, but for a workflow that isn't in the cache -
    // i.e. the caller has *some* access, just not to any known workflow.
    mockPermissions.authorizeConditional.mockResolvedValue([
      {
        result: AuthorizeResult.CONDITIONAL,
        pluginId: 'orchestrator',
        resourceType: 'orchestrator-workflow',
        conditions: {
          rule: 'IS_ALLOWED_WORKFLOW_ID',
          resourceType: 'orchestrator-workflow',
          params: { workflowIds: ['workflow999'] },
        },
      },
    ]);
    // No deprecated per-workflow fallback for workflow1/workflow2 either.
    mockPermissions.authorize.mockResolvedValue([
      { result: AuthorizeResult.DENY },
    ]);

    createListInstancesAction({
      actionsRegistry: mockActionsRegistry,
      permissions: mockPermissions,
      userInfo: mockUserInfo,
      orchestratorService: mockOrchestratorService,
      conditionTransformer,
      logger,
    });

    const result = await mockActionsRegistry.invoke({
      id: 'test:list-instances',
      input: {},
    });

    expect(result.output).toMatchObject({ instances: [] });
    expect(mockOrchestratorService.fetchInstances).not.toHaveBeenCalled();
  });

  it('throws NotAllowedError when the read permission is denied outright', async () => {
    const mockActionsRegistry = actionsRegistryServiceMock();
    const mockPermissions = mockServices.permissions.mock();
    mockPermissions.authorizeConditional.mockResolvedValue([
      { result: AuthorizeResult.DENY },
    ]);

    createListInstancesAction({
      actionsRegistry: mockActionsRegistry,
      permissions: mockPermissions,
      userInfo: mockUserInfo,
      orchestratorService: mockOrchestratorService,
      conditionTransformer,
      logger,
    });

    await expect(
      mockActionsRegistry.invoke({
        id: 'test:list-instances',
        input: {},
      }),
    ).rejects.toThrow(NotAllowedError);
    expect(mockOrchestratorService.getWorkflowIds).not.toHaveBeenCalled();
  });
});
