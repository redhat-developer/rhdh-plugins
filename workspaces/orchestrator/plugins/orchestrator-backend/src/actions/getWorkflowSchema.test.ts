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

import { mockServices } from '@backstage/backend-test-utils';
import { actionsRegistryServiceMock } from '@backstage/backend-test-utils/alpha';
import { NotAllowedError, NotFoundError } from '@backstage/errors';
import { AuthorizeResult } from '@backstage/plugin-permission-common';

import { OrchestratorService } from '../service/OrchestratorService';
import { testConditionTransformer as conditionTransformer } from './__fixtures__/testConditionTransformer';
import { createGetWorkflowSchemaAction } from './getWorkflowSchema';

// RHIDP-14045: get-workflow-schema must return the workflow's input JSON
// schema (required/optional params) given a workflow ID, enforce the read
// permission, and explicitly document itself as a prerequisite for
// execute-workflow.
describe('createGetWorkflowSchemaAction', () => {
  const logger = mockServices.logger.mock();

  const mockOrchestratorService = {
    fetchWorkflowInfo: jest.fn(),
    fetchWorkflowDefinition: jest.fn(),
    fetchWorkflowInfoOnService: jest.fn(),
  } as unknown as OrchestratorService;

  beforeEach(() => {
    jest.resetAllMocks();
  });

  function allowAccess(
    mockPermissions: ReturnType<typeof mockServices.permissions.mock>,
  ) {
    mockPermissions.authorizeConditional.mockResolvedValue([
      { result: AuthorizeResult.ALLOW },
    ]);
  }

  it('describes itself as a prerequisite for execute-workflow', async () => {
    const mockActionsRegistry = actionsRegistryServiceMock();
    const mockPermissions = mockServices.permissions.mock();

    createGetWorkflowSchemaAction({
      actionsRegistry: mockActionsRegistry,
      permissions: mockPermissions,
      orchestratorService: mockOrchestratorService,
      conditionTransformer,
      logger,
    });

    const { actions } = await mockActionsRegistry.list();
    const action = actions.find(a => a.name === 'get-workflow-schema');
    expect(action?.description.toLowerCase()).toContain('execute-workflow');
  });

  it('returns the input JSON schema for the workflow', async () => {
    const mockActionsRegistry = actionsRegistryServiceMock();
    const mockPermissions = mockServices.permissions.mock();
    allowAccess(mockPermissions);
    (mockOrchestratorService.fetchWorkflowInfo as jest.Mock).mockResolvedValue({
      id: 'workflow1',
      serviceUrl: 'http://svc',
    });
    (
      mockOrchestratorService.fetchWorkflowDefinition as jest.Mock
    ).mockResolvedValue({
      dataInputSchema: 'schema.json',
    });
    (
      mockOrchestratorService.fetchWorkflowInfoOnService as jest.Mock
    ).mockResolvedValue({
      id: 'workflow1',
      inputSchema: {
        type: 'object',
        properties: { name: { type: 'string' } },
        required: ['name'],
      },
    });

    createGetWorkflowSchemaAction({
      actionsRegistry: mockActionsRegistry,
      permissions: mockPermissions,
      orchestratorService: mockOrchestratorService,
      conditionTransformer,
      logger,
    });

    const result = await mockActionsRegistry.invoke({
      id: 'test:get-workflow-schema',
      input: { workflowId: 'workflow1' },
    });

    expect(result.output).toMatchObject({
      workflowId: 'workflow1',
      inputSchema: {
        type: 'object',
        properties: { name: { type: 'string' } },
        required: ['name'],
      },
    });
  });

  it('returns an empty input schema when the workflow has no dataInputSchema', async () => {
    const mockActionsRegistry = actionsRegistryServiceMock();
    const mockPermissions = mockServices.permissions.mock();
    allowAccess(mockPermissions);
    (mockOrchestratorService.fetchWorkflowInfo as jest.Mock).mockResolvedValue({
      id: 'workflow1',
      serviceUrl: 'http://svc',
    });
    (
      mockOrchestratorService.fetchWorkflowDefinition as jest.Mock
    ).mockResolvedValue({});

    createGetWorkflowSchemaAction({
      actionsRegistry: mockActionsRegistry,
      permissions: mockPermissions,
      orchestratorService: mockOrchestratorService,
      conditionTransformer,
      logger,
    });

    const result = await mockActionsRegistry.invoke({
      id: 'test:get-workflow-schema',
      input: { workflowId: 'workflow1' },
    });

    expect(result.output).toMatchObject({
      workflowId: 'workflow1',
      inputSchema: {},
    });
    expect(
      mockOrchestratorService.fetchWorkflowInfoOnService,
    ).not.toHaveBeenCalled();
  });

  it('throws NotFoundError when the workflow does not exist', async () => {
    const mockActionsRegistry = actionsRegistryServiceMock();
    const mockPermissions = mockServices.permissions.mock();
    allowAccess(mockPermissions);
    (mockOrchestratorService.fetchWorkflowInfo as jest.Mock).mockResolvedValue(
      undefined,
    );

    createGetWorkflowSchemaAction({
      actionsRegistry: mockActionsRegistry,
      permissions: mockPermissions,
      orchestratorService: mockOrchestratorService,
      conditionTransformer,
      logger,
    });

    await expect(
      mockActionsRegistry.invoke({
        id: 'test:get-workflow-schema',
        input: { workflowId: 'missing' },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it('throws NotFoundError when the workflow definition cannot be fetched', async () => {
    const mockActionsRegistry = actionsRegistryServiceMock();
    const mockPermissions = mockServices.permissions.mock();
    allowAccess(mockPermissions);
    (mockOrchestratorService.fetchWorkflowInfo as jest.Mock).mockResolvedValue({
      id: 'workflow1',
      serviceUrl: 'http://svc',
    });
    (
      mockOrchestratorService.fetchWorkflowDefinition as jest.Mock
    ).mockResolvedValue(undefined);

    createGetWorkflowSchemaAction({
      actionsRegistry: mockActionsRegistry,
      permissions: mockPermissions,
      orchestratorService: mockOrchestratorService,
      conditionTransformer,
      logger,
    });

    await expect(
      mockActionsRegistry.invoke({
        id: 'test:get-workflow-schema',
        input: { workflowId: 'workflow1' },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it('throws NotAllowedError when workflow access is denied', async () => {
    const mockActionsRegistry = actionsRegistryServiceMock();
    const mockPermissions = mockServices.permissions.mock();
    mockPermissions.authorizeConditional.mockResolvedValue([
      { result: AuthorizeResult.DENY },
    ]);
    mockPermissions.authorize.mockResolvedValue([
      { result: AuthorizeResult.DENY },
    ]);

    createGetWorkflowSchemaAction({
      actionsRegistry: mockActionsRegistry,
      permissions: mockPermissions,
      orchestratorService: mockOrchestratorService,
      conditionTransformer,
      logger,
    });

    await expect(
      mockActionsRegistry.invoke({
        id: 'test:get-workflow-schema',
        input: { workflowId: 'workflow1' },
      }),
    ).rejects.toThrow(NotAllowedError);
    expect(mockOrchestratorService.fetchWorkflowInfo).not.toHaveBeenCalled();
  });
});
