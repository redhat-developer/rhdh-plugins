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
import { NotAllowedError, NotFoundError } from '@backstage/errors';
import { AuthorizeResult } from '@backstage/plugin-permission-common';

import { OrchestratorService } from '../service/OrchestratorService';
import { testConditionTransformer as conditionTransformer } from './__fixtures__/testConditionTransformer';
import { createGetInstanceAction } from './getInstance';

// RHIDP-14048: get-instance must return the workflow name, status, start
// time, end time, and output data for a single instance.
describe('createGetInstanceAction', () => {
  const logger = mockServices.logger.mock();

  const mockOrchestratorService = {
    fetchInstance: jest.fn(),
  } as unknown as OrchestratorService;

  const baseRawInstance = {
    id: 'instance-1',
    processId: 'my-workflow',
    processName: 'My Workflow',
    state: 'COMPLETED',
    start: '2026-01-01T00:00:00.000Z',
    end: '2026-01-01T00:05:00.000Z',
    endpoint: 'http://example.com',
    nodes: [],
    variables: {
      initiatorEntity: 'user:default/jdoe',
      workflowdata: { result: { message: 'done' } },
    },
  };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns the instance name, status, start/end time, and output data when access and ownership checks pass', async () => {
    const mockActionsRegistry = actionsRegistryServiceMock();
    const mockPermissions = mockServices.permissions.mock();
    const mockUserInfo = mockServices.userInfo.mock();
    mockUserInfo.getUserInfo.mockResolvedValue({
      userEntityRef: 'user:default/jdoe',
      ownershipEntityRefs: [],
    });
    mockPermissions.authorizeConditional.mockResolvedValue([
      { result: AuthorizeResult.ALLOW },
    ]);
    mockPermissions.authorize.mockResolvedValue([
      { result: AuthorizeResult.DENY },
    ]);
    (mockOrchestratorService.fetchInstance as jest.Mock).mockResolvedValue(
      baseRawInstance,
    );

    createGetInstanceAction({
      actionsRegistry: mockActionsRegistry,
      permissions: mockPermissions,
      userInfo: mockUserInfo,
      orchestratorService: mockOrchestratorService,
      conditionTransformer,
      logger,
    });

    const result = await mockActionsRegistry.invoke({
      id: 'test:get-instance',
      input: { instanceId: 'instance-1' },
      credentials: mockCredentials.user('user:default/jdoe'),
    });

    expect(result.output).toMatchObject({
      instanceId: 'instance-1',
      workflowId: 'my-workflow',
      workflowName: 'My Workflow',
      status: 'COMPLETED',
      startTime: '2026-01-01T00:00:00.000Z',
      endTime: '2026-01-01T00:05:00.000Z',
      output: { result: { message: 'done' } },
    });
  });

  it('returns only the required fields when optional data is absent', async () => {
    const mockActionsRegistry = actionsRegistryServiceMock();
    const mockPermissions = mockServices.permissions.mock();
    const mockUserInfo = mockServices.userInfo.mock();
    mockUserInfo.getUserInfo.mockResolvedValue({
      userEntityRef: 'user:default/jdoe',
      ownershipEntityRefs: [],
    });
    mockPermissions.authorizeConditional.mockResolvedValue([
      { result: AuthorizeResult.ALLOW },
    ]);
    mockPermissions.authorize.mockResolvedValue([
      { result: AuthorizeResult.DENY },
    ]);
    (mockOrchestratorService.fetchInstance as jest.Mock).mockResolvedValue({
      id: 'instance-1',
      processId: 'my-workflow',
      nodes: [],
      variables: { initiatorEntity: 'user:default/jdoe' },
    });

    createGetInstanceAction({
      actionsRegistry: mockActionsRegistry,
      permissions: mockPermissions,
      userInfo: mockUserInfo,
      orchestratorService: mockOrchestratorService,
      conditionTransformer,
      logger,
    });

    const result = await mockActionsRegistry.invoke({
      id: 'test:get-instance',
      input: { instanceId: 'instance-1' },
      credentials: mockCredentials.user('user:default/jdoe'),
    });

    expect(result.output).toMatchObject({
      instanceId: 'instance-1',
      workflowId: 'my-workflow',
      workflowName: undefined,
      output: undefined,
    });
  });

  it('throws NotFoundError when the instance does not exist', async () => {
    const mockActionsRegistry = actionsRegistryServiceMock();
    const mockPermissions = mockServices.permissions.mock();
    const mockUserInfo = mockServices.userInfo.mock();
    (mockOrchestratorService.fetchInstance as jest.Mock).mockResolvedValue(
      undefined,
    );

    createGetInstanceAction({
      actionsRegistry: mockActionsRegistry,
      permissions: mockPermissions,
      userInfo: mockUserInfo,
      orchestratorService: mockOrchestratorService,
      conditionTransformer,
      logger,
    });

    await expect(
      mockActionsRegistry.invoke({
        id: 'test:get-instance',
        input: { instanceId: 'missing' },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it('throws NotAllowedError when workflow access is denied', async () => {
    const mockActionsRegistry = actionsRegistryServiceMock();
    const mockPermissions = mockServices.permissions.mock();
    const mockUserInfo = mockServices.userInfo.mock();
    mockPermissions.authorizeConditional.mockResolvedValue([
      { result: AuthorizeResult.DENY },
    ]);
    // No conditional match and no deprecated per-workflow fallback granted.
    mockPermissions.authorize.mockResolvedValue([
      { result: AuthorizeResult.DENY },
    ]);
    (mockOrchestratorService.fetchInstance as jest.Mock).mockResolvedValue(
      baseRawInstance,
    );

    createGetInstanceAction({
      actionsRegistry: mockActionsRegistry,
      permissions: mockPermissions,
      userInfo: mockUserInfo,
      orchestratorService: mockOrchestratorService,
      conditionTransformer,
      logger,
    });

    await expect(
      mockActionsRegistry.invoke({
        id: 'test:get-instance',
        input: { instanceId: 'instance-1' },
      }),
    ).rejects.toThrow(NotAllowedError);
  });

  it('throws NotAllowedError when the instance was initiated by someone else', async () => {
    const mockActionsRegistry = actionsRegistryServiceMock();
    const mockPermissions = mockServices.permissions.mock();
    const mockUserInfo = mockServices.userInfo.mock();
    mockUserInfo.getUserInfo.mockResolvedValue({
      userEntityRef: 'user:default/someone-else',
      ownershipEntityRefs: [],
    });
    mockPermissions.authorizeConditional.mockResolvedValue([
      { result: AuthorizeResult.ALLOW },
    ]);
    mockPermissions.authorize.mockResolvedValue([
      { result: AuthorizeResult.DENY },
    ]);
    (mockOrchestratorService.fetchInstance as jest.Mock).mockResolvedValue(
      baseRawInstance,
    );

    createGetInstanceAction({
      actionsRegistry: mockActionsRegistry,
      permissions: mockPermissions,
      userInfo: mockUserInfo,
      orchestratorService: mockOrchestratorService,
      conditionTransformer,
      logger,
    });

    await expect(
      mockActionsRegistry.invoke({
        id: 'test:get-instance',
        input: { instanceId: 'instance-1' },
        credentials: mockCredentials.user('user:default/someone-else'),
      }),
    ).rejects.toThrow(NotAllowedError);
  });

  // Regression test for https://github.com/redhat-developer/rhdh-plugins/pull/4117#issuecomment-5240741356:
  // a static-token MCP caller (a service principal, never a user principal)
  // without instance admin-view must not crash UserInfoService.getUserInfo's
  // "Only user credentials are supported" check.
  it('denies access for a non-admin service-principal caller who did not initiate the instance, without crashing', async () => {
    const mockActionsRegistry = actionsRegistryServiceMock();
    const mockPermissions = mockServices.permissions.mock();
    const mockUserInfo = mockServices.userInfo.mock();
    mockPermissions.authorizeConditional.mockResolvedValue([
      { result: AuthorizeResult.ALLOW },
    ]);
    mockPermissions.authorize.mockResolvedValue([
      { result: AuthorizeResult.DENY },
    ]);
    (mockOrchestratorService.fetchInstance as jest.Mock).mockResolvedValue(
      baseRawInstance,
    );

    createGetInstanceAction({
      actionsRegistry: mockActionsRegistry,
      permissions: mockPermissions,
      userInfo: mockUserInfo,
      orchestratorService: mockOrchestratorService,
      conditionTransformer,
      logger,
    });

    await expect(
      mockActionsRegistry.invoke({
        id: 'test:get-instance',
        input: { instanceId: 'instance-1' },
        credentials: mockCredentials.service('mcp-clients'),
      }),
    ).rejects.toThrow(NotAllowedError);
    expect(mockUserInfo.getUserInfo).not.toHaveBeenCalled();
  });

  it('allows viewing another user instance when admin view permission is granted', async () => {
    const mockActionsRegistry = actionsRegistryServiceMock();
    const mockPermissions = mockServices.permissions.mock();
    const mockUserInfo = mockServices.userInfo.mock();
    mockUserInfo.getUserInfo.mockResolvedValue({
      userEntityRef: 'user:default/someone-else',
      ownershipEntityRefs: [],
    });
    mockPermissions.authorizeConditional.mockResolvedValue([
      { result: AuthorizeResult.ALLOW },
    ]);
    mockPermissions.authorize.mockResolvedValue([
      { result: AuthorizeResult.ALLOW },
    ]);
    (mockOrchestratorService.fetchInstance as jest.Mock).mockResolvedValue(
      baseRawInstance,
    );

    createGetInstanceAction({
      actionsRegistry: mockActionsRegistry,
      permissions: mockPermissions,
      userInfo: mockUserInfo,
      orchestratorService: mockOrchestratorService,
      conditionTransformer,
      logger,
    });

    const result = await mockActionsRegistry.invoke({
      id: 'test:get-instance',
      input: { instanceId: 'instance-1' },
    });

    expect(result.output).toMatchObject({ instanceId: 'instance-1' });
  });
});
