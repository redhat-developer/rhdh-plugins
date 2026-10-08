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

/**
 * Unit tests for `resolveWorkflowDefinition`, extracted out of
 * `actions/executeWorkflow.ts` and `actions/getWorkflowSchema.ts`, which
 * both resolved a workflow's info/serviceUrl/definition (404-ing on any
 * miss) in an identical, duplicated block.
 */

import { NotFoundError } from '@backstage/errors';

import { OrchestratorService } from './OrchestratorService';
import { resolveWorkflowDefinition } from './resolveWorkflowDefinition';

describe('resolveWorkflowDefinition', () => {
  const mockOrchestratorService = {
    fetchWorkflowInfo: jest.fn(),
    fetchWorkflowDefinition: jest.fn(),
  } as unknown as OrchestratorService;

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('resolves the workflow info, service URL, and definition', async () => {
    (mockOrchestratorService.fetchWorkflowInfo as jest.Mock).mockResolvedValue({
      id: 'workflow1',
      serviceUrl: 'http://svc',
    });
    (
      mockOrchestratorService.fetchWorkflowDefinition as jest.Mock
    ).mockResolvedValue({ dataInputSchema: 'schema.json' });

    const result = await resolveWorkflowDefinition(
      mockOrchestratorService,
      'workflow1',
    );

    expect(result).toEqual({
      workflowInfo: { id: 'workflow1', serviceUrl: 'http://svc' },
      serviceUrl: 'http://svc',
      definition: { dataInputSchema: 'schema.json' },
    });
    expect(mockOrchestratorService.fetchWorkflowInfo).toHaveBeenCalledWith({
      definitionId: 'workflow1',
    });
    expect(
      mockOrchestratorService.fetchWorkflowDefinition,
    ).toHaveBeenCalledWith({ definitionId: 'workflow1' });
  });

  it('throws NotFoundError when the workflow does not exist', async () => {
    (mockOrchestratorService.fetchWorkflowInfo as jest.Mock).mockResolvedValue(
      undefined,
    );

    await expect(
      resolveWorkflowDefinition(mockOrchestratorService, 'missing'),
    ).rejects.toThrow(NotFoundError);
    expect(
      mockOrchestratorService.fetchWorkflowDefinition,
    ).not.toHaveBeenCalled();
  });

  it('throws NotFoundError when the workflow has no service URL configured', async () => {
    (mockOrchestratorService.fetchWorkflowInfo as jest.Mock).mockResolvedValue({
      id: 'workflow1',
    });

    await expect(
      resolveWorkflowDefinition(mockOrchestratorService, 'workflow1'),
    ).rejects.toThrow(NotFoundError);
    expect(
      mockOrchestratorService.fetchWorkflowDefinition,
    ).not.toHaveBeenCalled();
  });

  it('throws NotFoundError when the workflow definition cannot be fetched', async () => {
    (mockOrchestratorService.fetchWorkflowInfo as jest.Mock).mockResolvedValue({
      id: 'workflow1',
      serviceUrl: 'http://svc',
    });
    (
      mockOrchestratorService.fetchWorkflowDefinition as jest.Mock
    ).mockResolvedValue(undefined);

    await expect(
      resolveWorkflowDefinition(mockOrchestratorService, 'workflow1'),
    ).rejects.toThrow(NotFoundError);
  });
});
