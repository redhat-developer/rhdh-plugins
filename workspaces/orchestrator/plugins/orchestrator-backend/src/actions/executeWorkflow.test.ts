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
import {
  InputError,
  NotAllowedError,
  NotFoundError,
  ServiceUnavailableError,
} from '@backstage/errors';
import { AuthorizeResult } from '@backstage/plugin-permission-common';

import Ajv from 'ajv';

import { OrchestratorService } from '../service/OrchestratorService';
import { testConditionTransformer as conditionTransformer } from './__fixtures__/testConditionTransformer';
import { createExecuteWorkflowAction } from './executeWorkflow';

// RHIDP-14046: execute-workflow must validate inputs against the workflow's
// own schema before executing, enforce the "use" permission, and return the
// new instance's ID and initial status.
describe('createExecuteWorkflowAction', () => {
  const logger = mockServices.logger.mock();
  const mockUserInfo = mockServices.userInfo.mock();

  const mockOrchestratorService = {
    fetchWorkflowInfo: jest.fn(),
    fetchWorkflowDefinition: jest.fn(),
    fetchWorkflowInfoOnService: jest.fn(),
    executeWorkflow: jest.fn(),
    fetchInstance: jest.fn(),
  } as unknown as OrchestratorService;

  beforeEach(() => {
    jest.resetAllMocks();
    mockUserInfo.getUserInfo.mockResolvedValue({
      userEntityRef: 'user:default/jdoe',
      ownershipEntityRefs: [],
    });
  });

  function allowAccess(
    mockPermissions: ReturnType<typeof mockServices.permissions.mock>,
  ) {
    mockPermissions.authorizeConditional.mockResolvedValue([
      { result: AuthorizeResult.ALLOW },
    ]);
  }

  function setUpWorkflow({
    dataInputSchema,
    inputSchema,
  }: {
    dataInputSchema?: string;
    inputSchema?: object;
  } = {}) {
    (mockOrchestratorService.fetchWorkflowInfo as jest.Mock).mockResolvedValue({
      id: 'workflow1',
      serviceUrl: 'http://svc',
    });
    (
      mockOrchestratorService.fetchWorkflowDefinition as jest.Mock
    ).mockResolvedValue({ dataInputSchema });
    (
      mockOrchestratorService.fetchWorkflowInfoOnService as jest.Mock
    ).mockResolvedValue({ id: 'workflow1', inputSchema });
  }

  it('executes the workflow and returns the instance id and status when there is no input schema', async () => {
    const mockActionsRegistry = actionsRegistryServiceMock();
    const mockPermissions = mockServices.permissions.mock();
    allowAccess(mockPermissions);
    setUpWorkflow();
    (mockOrchestratorService.executeWorkflow as jest.Mock).mockResolvedValue({
      id: 'instance-1',
    });
    (mockOrchestratorService.fetchInstance as jest.Mock).mockResolvedValue({
      id: 'instance-1',
      processId: 'workflow1',
      state: 'ACTIVE',
      nodes: [],
    });

    createExecuteWorkflowAction({
      actionsRegistry: mockActionsRegistry,
      permissions: mockPermissions,
      userInfo: mockUserInfo,
      orchestratorService: mockOrchestratorService,
      conditionTransformer,
      logger,
    });

    const result = await mockActionsRegistry.invoke({
      id: 'test:execute-workflow',
      input: { workflowId: 'workflow1', inputs: { name: 'test' } },
      credentials: mockCredentials.user('user:default/jdoe'),
    });

    expect(result.output).toMatchObject({
      instanceId: 'instance-1',
      status: 'ACTIVE',
    });
    expect(mockOrchestratorService.executeWorkflow).toHaveBeenCalledWith(
      expect.objectContaining({
        definitionId: 'workflow1',
        serviceUrl: 'http://svc',
        inputData: expect.objectContaining({
          workflowdata: { name: 'test' },
          initiatorEntity: 'user:default/jdoe',
        }),
      }),
    );
  });

  // Regression test for https://github.com/redhat-developer/rhdh-plugins/pull/4117#issuecomment-5240741356:
  // an MCP client authenticated via a static `backend.auth.externalAccess`
  // token is a service principal, never a user principal, so
  // UserInfoService.getUserInfo() would unconditionally throw "Only user
  // credentials are supported" if called directly.
  it('falls back to the system initiator ref instead of crashing when the caller is a service principal (e.g. a static MCP token)', async () => {
    const mockActionsRegistry = actionsRegistryServiceMock();
    const mockPermissions = mockServices.permissions.mock();
    allowAccess(mockPermissions);
    setUpWorkflow();
    (mockOrchestratorService.executeWorkflow as jest.Mock).mockResolvedValue({
      id: 'instance-1',
    });
    (mockOrchestratorService.fetchInstance as jest.Mock).mockResolvedValue({
      id: 'instance-1',
      processId: 'workflow1',
      state: 'ACTIVE',
      nodes: [],
    });

    createExecuteWorkflowAction({
      actionsRegistry: mockActionsRegistry,
      permissions: mockPermissions,
      userInfo: mockUserInfo,
      orchestratorService: mockOrchestratorService,
      conditionTransformer,
      logger,
    });

    const result = await mockActionsRegistry.invoke({
      id: 'test:execute-workflow',
      input: { workflowId: 'workflow1', inputs: { name: 'test' } },
      credentials: mockCredentials.service('mcp-clients'),
    });

    expect(result.output).toMatchObject({ instanceId: 'instance-1' });
    expect(mockOrchestratorService.executeWorkflow).toHaveBeenCalledWith(
      expect.objectContaining({
        inputData: expect.objectContaining({
          initiatorEntity: 'user:default/system',
        }),
      }),
    );
    expect(mockUserInfo.getUserInfo).not.toHaveBeenCalled();
  });

  it('validates inputs against the schema and executes when valid', async () => {
    const mockActionsRegistry = actionsRegistryServiceMock();
    const mockPermissions = mockServices.permissions.mock();
    allowAccess(mockPermissions);
    setUpWorkflow({
      dataInputSchema: 'schema.json',
      inputSchema: {
        type: 'object',
        properties: { name: { type: 'string' } },
        required: ['name'],
      },
    });
    (mockOrchestratorService.executeWorkflow as jest.Mock).mockResolvedValue({
      id: 'instance-1',
    });
    (mockOrchestratorService.fetchInstance as jest.Mock).mockResolvedValue({
      id: 'instance-1',
      processId: 'workflow1',
      state: 'ACTIVE',
      nodes: [],
    });

    createExecuteWorkflowAction({
      actionsRegistry: mockActionsRegistry,
      permissions: mockPermissions,
      userInfo: mockUserInfo,
      orchestratorService: mockOrchestratorService,
      conditionTransformer,
      logger,
    });

    const result = await mockActionsRegistry.invoke({
      id: 'test:execute-workflow',
      input: { workflowId: 'workflow1', inputs: { name: 'test' } },
      credentials: mockCredentials.user('user:default/jdoe'),
    });

    expect(result.output).toMatchObject({ instanceId: 'instance-1' });
    expect(mockOrchestratorService.executeWorkflow).toHaveBeenCalled();
  });

  it('throws InputError when inputs fail schema validation, without executing', async () => {
    const mockActionsRegistry = actionsRegistryServiceMock();
    const mockPermissions = mockServices.permissions.mock();
    allowAccess(mockPermissions);
    setUpWorkflow({
      dataInputSchema: 'schema.json',
      inputSchema: {
        type: 'object',
        properties: { name: { type: 'string' } },
        required: ['name'],
      },
    });

    createExecuteWorkflowAction({
      actionsRegistry: mockActionsRegistry,
      permissions: mockPermissions,
      userInfo: mockUserInfo,
      orchestratorService: mockOrchestratorService,
      conditionTransformer,
      logger,
    });

    await expect(
      mockActionsRegistry.invoke({
        id: 'test:execute-workflow',
        input: { workflowId: 'workflow1', inputs: { age: 42 } },
      }),
    ).rejects.toThrow(InputError);
    expect(mockOrchestratorService.executeWorkflow).not.toHaveBeenCalled();
  });

  it('falls back to a PENDING status when the new instance is not yet indexed', async () => {
    const mockActionsRegistry = actionsRegistryServiceMock();
    const mockPermissions = mockServices.permissions.mock();
    allowAccess(mockPermissions);
    setUpWorkflow();
    (mockOrchestratorService.executeWorkflow as jest.Mock).mockResolvedValue({
      id: 'instance-1',
    });
    (mockOrchestratorService.fetchInstance as jest.Mock).mockResolvedValue(
      undefined,
    );

    createExecuteWorkflowAction({
      actionsRegistry: mockActionsRegistry,
      permissions: mockPermissions,
      userInfo: mockUserInfo,
      orchestratorService: mockOrchestratorService,
      conditionTransformer,
      logger,
    });

    const result = await mockActionsRegistry.invoke({
      id: 'test:execute-workflow',
      input: { workflowId: 'workflow1', inputs: {} },
      credentials: mockCredentials.user('user:default/jdoe'),
    });

    expect(result.output).toMatchObject({
      instanceId: 'instance-1',
      status: 'PENDING',
    });
  });

  it('falls back to a PENDING status and logs a warning when fetching the initial status fails', async () => {
    const mockActionsRegistry = actionsRegistryServiceMock();
    const mockPermissions = mockServices.permissions.mock();
    allowAccess(mockPermissions);
    setUpWorkflow();
    (mockOrchestratorService.executeWorkflow as jest.Mock).mockResolvedValue({
      id: 'instance-1',
    });
    (mockOrchestratorService.fetchInstance as jest.Mock).mockRejectedValue(
      new Error('data index unavailable'),
    );

    createExecuteWorkflowAction({
      actionsRegistry: mockActionsRegistry,
      permissions: mockPermissions,
      userInfo: mockUserInfo,
      orchestratorService: mockOrchestratorService,
      conditionTransformer,
      logger,
    });

    const result = await mockActionsRegistry.invoke({
      id: 'test:execute-workflow',
      input: { workflowId: 'workflow1', inputs: {} },
      credentials: mockCredentials.user('user:default/jdoe'),
    });

    expect(result.output).toMatchObject({
      instanceId: 'instance-1',
      status: 'PENDING',
    });
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('instance-1'),
    );
  });

  it('throws ServiceUnavailableError when the workflow engine returns no execution response', async () => {
    const mockActionsRegistry = actionsRegistryServiceMock();
    const mockPermissions = mockServices.permissions.mock();
    allowAccess(mockPermissions);
    setUpWorkflow();
    (mockOrchestratorService.executeWorkflow as jest.Mock).mockResolvedValue(
      undefined,
    );

    createExecuteWorkflowAction({
      actionsRegistry: mockActionsRegistry,
      permissions: mockPermissions,
      userInfo: mockUserInfo,
      orchestratorService: mockOrchestratorService,
      conditionTransformer,
      logger,
    });

    await expect(
      mockActionsRegistry.invoke({
        id: 'test:execute-workflow',
        input: { workflowId: 'workflow1', inputs: {} },
        credentials: mockCredentials.user('user:default/jdoe'),
      }),
    ).rejects.toThrow(ServiceUnavailableError);
    expect(mockOrchestratorService.fetchInstance).not.toHaveBeenCalled();
  });

  it('caches the compiled Ajv validator across repeated calls for the same workflow schema', async () => {
    const compileSpy = jest.spyOn(Ajv.prototype, 'compile');
    try {
      const mockActionsRegistry = actionsRegistryServiceMock();
      const mockPermissions = mockServices.permissions.mock();
      allowAccess(mockPermissions);
      setUpWorkflow({
        dataInputSchema: 'schema.json',
        inputSchema: {
          type: 'object',
          properties: { name: { type: 'string' } },
          required: ['name'],
        },
      });
      (mockOrchestratorService.executeWorkflow as jest.Mock).mockResolvedValue({
        id: 'instance-1',
      });
      (mockOrchestratorService.fetchInstance as jest.Mock).mockResolvedValue({
        id: 'instance-1',
        processId: 'workflow1',
        state: 'ACTIVE',
        nodes: [],
      });

      createExecuteWorkflowAction({
        actionsRegistry: mockActionsRegistry,
        permissions: mockPermissions,
        userInfo: mockUserInfo,
        orchestratorService: mockOrchestratorService,
        conditionTransformer,
        logger,
      });

      // Prime the cache (may or may not compile, depending on cache state
      // left over from other tests sharing this workflowId/schema).
      await mockActionsRegistry.invoke({
        id: 'test:execute-workflow',
        input: { workflowId: 'workflow1', inputs: { name: 'first' } },
        credentials: mockCredentials.user('user:default/jdoe'),
      });
      compileSpy.mockClear();

      // A second call with the same workflowId/schema must reuse the cached
      // validator rather than recompiling - regardless of cache state above.
      await expect(
        mockActionsRegistry.invoke({
          id: 'test:execute-workflow',
          input: { workflowId: 'workflow1', inputs: { age: 42 } },
          credentials: mockCredentials.user('user:default/jdoe'),
        }),
      ).rejects.toThrow(InputError);

      expect(compileSpy).not.toHaveBeenCalled();
    } finally {
      compileSpy.mockRestore();
    }
  });

  it('throws NotFoundError when the workflow does not exist', async () => {
    const mockActionsRegistry = actionsRegistryServiceMock();
    const mockPermissions = mockServices.permissions.mock();
    allowAccess(mockPermissions);
    (mockOrchestratorService.fetchWorkflowInfo as jest.Mock).mockResolvedValue(
      undefined,
    );

    createExecuteWorkflowAction({
      actionsRegistry: mockActionsRegistry,
      permissions: mockPermissions,
      userInfo: mockUserInfo,
      orchestratorService: mockOrchestratorService,
      conditionTransformer,
      logger,
    });

    await expect(
      mockActionsRegistry.invoke({
        id: 'test:execute-workflow',
        input: { workflowId: 'missing', inputs: {} },
      }),
    ).rejects.toThrow(NotFoundError);
    expect(mockOrchestratorService.executeWorkflow).not.toHaveBeenCalled();
  });

  it('throws NotAllowedError when the use permission is denied', async () => {
    const mockActionsRegistry = actionsRegistryServiceMock();
    const mockPermissions = mockServices.permissions.mock();
    mockPermissions.authorizeConditional.mockResolvedValue([
      { result: AuthorizeResult.DENY },
    ]);
    mockPermissions.authorize.mockResolvedValue([
      { result: AuthorizeResult.DENY },
    ]);

    createExecuteWorkflowAction({
      actionsRegistry: mockActionsRegistry,
      permissions: mockPermissions,
      userInfo: mockUserInfo,
      orchestratorService: mockOrchestratorService,
      conditionTransformer,
      logger,
    });

    await expect(
      mockActionsRegistry.invoke({
        id: 'test:execute-workflow',
        input: { workflowId: 'workflow1', inputs: {} },
      }),
    ).rejects.toThrow(NotAllowedError);
    expect(mockOrchestratorService.fetchWorkflowInfo).not.toHaveBeenCalled();
  });
});
