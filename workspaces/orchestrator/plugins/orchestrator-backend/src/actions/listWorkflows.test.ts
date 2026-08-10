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
import { NotAllowedError } from '@backstage/errors';
import { AuthorizeResult } from '@backstage/plugin-permission-common';

import { OrchestratorService } from '../service/OrchestratorService';
import { testConditionTransformer as conditionTransformer } from './__fixtures__/testConditionTransformer';
import { createListWorkflowsAction } from './listWorkflows';

// RHIDP-14044: list-workflows must support optional name/status filters,
// output workflow names/IDs/statuses, enforce the read permission, and
// throw NotAllowedError when access is denied outright.
describe('createListWorkflowsAction', () => {
  const logger = mockServices.logger.mock();

  const overviews = [
    {
      workflowId: 'workflow1',
      name: 'Onboard Employee',
      lastRunStatus: 'ACTIVE',
    },
    {
      workflowId: 'workflow2',
      name: 'Offboard Employee',
      lastRunStatus: 'COMPLETED',
    },
    { workflowId: 'workflow3', name: 'Provision VM', lastRunStatus: 'ERROR' },
  ];

  const mockOrchestratorService = {
    fetchWorkflowOverviews: jest.fn(),
  } as unknown as OrchestratorService;

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns workflow ids, names, and statuses when access is fully allowed', async () => {
    const mockActionsRegistry = actionsRegistryServiceMock();
    const mockPermissions = mockServices.permissions.mock();
    mockPermissions.authorizeConditional.mockResolvedValue([
      { result: AuthorizeResult.ALLOW },
    ]);
    (
      mockOrchestratorService.fetchWorkflowOverviews as jest.Mock
    ).mockResolvedValue(overviews);

    createListWorkflowsAction({
      actionsRegistry: mockActionsRegistry,
      permissions: mockPermissions,
      orchestratorService: mockOrchestratorService,
      conditionTransformer,
      logger,
    });

    const result = await mockActionsRegistry.invoke({
      id: 'test:list-workflows',
      input: {},
    });

    expect(result.output).toMatchObject({
      workflows: [
        { workflowId: 'workflow1', name: 'Onboard Employee', status: 'ACTIVE' },
        {
          workflowId: 'workflow2',
          name: 'Offboard Employee',
          status: 'COMPLETED',
        },
        { workflowId: 'workflow3', name: 'Provision VM', status: 'ERROR' },
      ],
    });
  });

  it('filters by name (case-insensitive substring match)', async () => {
    const mockActionsRegistry = actionsRegistryServiceMock();
    const mockPermissions = mockServices.permissions.mock();
    mockPermissions.authorizeConditional.mockResolvedValue([
      { result: AuthorizeResult.ALLOW },
    ]);
    (
      mockOrchestratorService.fetchWorkflowOverviews as jest.Mock
    ).mockResolvedValue(overviews);

    createListWorkflowsAction({
      actionsRegistry: mockActionsRegistry,
      permissions: mockPermissions,
      orchestratorService: mockOrchestratorService,
      conditionTransformer,
      logger,
    });

    const result = await mockActionsRegistry.invoke({
      id: 'test:list-workflows',
      input: { name: 'employee' },
    });

    expect(result.output).toMatchObject({
      workflows: [{ workflowId: 'workflow1' }, { workflowId: 'workflow2' }],
    });
    expect((result.output as { workflows: unknown[] }).workflows).toHaveLength(
      2,
    );
  });

  it('filters by status', async () => {
    const mockActionsRegistry = actionsRegistryServiceMock();
    const mockPermissions = mockServices.permissions.mock();
    mockPermissions.authorizeConditional.mockResolvedValue([
      { result: AuthorizeResult.ALLOW },
    ]);
    (
      mockOrchestratorService.fetchWorkflowOverviews as jest.Mock
    ).mockResolvedValue(overviews);

    createListWorkflowsAction({
      actionsRegistry: mockActionsRegistry,
      permissions: mockPermissions,
      orchestratorService: mockOrchestratorService,
      conditionTransformer,
      logger,
    });

    const result = await mockActionsRegistry.invoke({
      id: 'test:list-workflows',
      input: { status: 'ERROR' },
    });

    expect(result.output).toMatchObject({
      workflows: [{ workflowId: 'workflow3', status: 'ERROR' }],
    });
    expect((result.output as { workflows: unknown[] }).workflows).toHaveLength(
      1,
    );
  });

  it('filters out workflows not covered by a conditional decision', async () => {
    const mockActionsRegistry = actionsRegistryServiceMock();
    const mockPermissions = mockServices.permissions.mock();
    mockPermissions.authorizeConditional.mockResolvedValue([
      {
        result: AuthorizeResult.CONDITIONAL,
        pluginId: 'orchestrator',
        resourceType: 'orchestrator-workflow',
        conditions: {
          rule: 'IS_ALLOWED_WORKFLOW_ID',
          resourceType: 'orchestrator-workflow',
          params: { workflowIds: ['workflow1'] },
        },
      },
    ]);
    // No deprecated per-workflow fallback for the remaining workflows.
    mockPermissions.authorize.mockResolvedValue([
      { result: AuthorizeResult.DENY },
    ]);
    (
      mockOrchestratorService.fetchWorkflowOverviews as jest.Mock
    ).mockResolvedValue(overviews);

    createListWorkflowsAction({
      actionsRegistry: mockActionsRegistry,
      permissions: mockPermissions,
      orchestratorService: mockOrchestratorService,
      conditionTransformer,
      logger,
    });

    const result = await mockActionsRegistry.invoke({
      id: 'test:list-workflows',
      input: {},
    });

    expect(result.output).toMatchObject({
      workflows: [{ workflowId: 'workflow1' }],
    });
    expect((result.output as { workflows: unknown[] }).workflows).toHaveLength(
      1,
    );
  });

  it('defaults to a bounded page (limit 50, offset 0) when pagination is not specified', async () => {
    const mockActionsRegistry = actionsRegistryServiceMock();
    const mockPermissions = mockServices.permissions.mock();
    mockPermissions.authorizeConditional.mockResolvedValue([
      { result: AuthorizeResult.ALLOW },
    ]);
    (
      mockOrchestratorService.fetchWorkflowOverviews as jest.Mock
    ).mockResolvedValue(overviews);

    createListWorkflowsAction({
      actionsRegistry: mockActionsRegistry,
      permissions: mockPermissions,
      orchestratorService: mockOrchestratorService,
      conditionTransformer,
      logger,
    });

    await mockActionsRegistry.invoke({
      id: 'test:list-workflows',
      input: {},
    });

    expect(mockOrchestratorService.fetchWorkflowOverviews).toHaveBeenCalledWith(
      { pagination: { limit: 50, offset: 0 } },
    );
  });

  it('passes through caller-supplied limit and offset', async () => {
    const mockActionsRegistry = actionsRegistryServiceMock();
    const mockPermissions = mockServices.permissions.mock();
    mockPermissions.authorizeConditional.mockResolvedValue([
      { result: AuthorizeResult.ALLOW },
    ]);
    (
      mockOrchestratorService.fetchWorkflowOverviews as jest.Mock
    ).mockResolvedValue(overviews);

    createListWorkflowsAction({
      actionsRegistry: mockActionsRegistry,
      permissions: mockPermissions,
      orchestratorService: mockOrchestratorService,
      conditionTransformer,
      logger,
    });

    await mockActionsRegistry.invoke({
      id: 'test:list-workflows',
      input: { limit: 5, offset: 15 },
    });

    expect(mockOrchestratorService.fetchWorkflowOverviews).toHaveBeenCalledWith(
      { pagination: { limit: 5, offset: 15 } },
    );
  });

  it('rejects a limit greater than the maximum page size', async () => {
    const mockActionsRegistry = actionsRegistryServiceMock();
    const mockPermissions = mockServices.permissions.mock();

    createListWorkflowsAction({
      actionsRegistry: mockActionsRegistry,
      permissions: mockPermissions,
      orchestratorService: mockOrchestratorService,
      conditionTransformer,
      logger,
    });

    await expect(
      mockActionsRegistry.invoke({
        id: 'test:list-workflows',
        input: { limit: 500 },
      }),
    ).rejects.toThrow(/Invalid input/);
    expect(
      mockOrchestratorService.fetchWorkflowOverviews,
    ).not.toHaveBeenCalled();
  });

  it('throws NotAllowedError when the read permission is denied outright', async () => {
    const mockActionsRegistry = actionsRegistryServiceMock();
    const mockPermissions = mockServices.permissions.mock();
    mockPermissions.authorizeConditional.mockResolvedValue([
      { result: AuthorizeResult.DENY },
    ]);

    createListWorkflowsAction({
      actionsRegistry: mockActionsRegistry,
      permissions: mockPermissions,
      orchestratorService: mockOrchestratorService,
      conditionTransformer,
      logger,
    });

    await expect(
      mockActionsRegistry.invoke({
        id: 'test:list-workflows',
        input: {},
      }),
    ).rejects.toThrow(NotAllowedError);
    expect(
      mockOrchestratorService.fetchWorkflowOverviews,
    ).not.toHaveBeenCalled();
  });
});
