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

import { createMockActionContext } from '@backstage/plugin-scaffolder-node-test-utils';
import { JsonObject } from '@backstage/types';

import { createGetWorkflowParamsAction } from './getWorkflowParams';
import { getOrchestratorApi, getRequestConfigOption } from './utils';

jest.mock('axios', () => ({
  isAxiosError: (error: { isAxiosError?: boolean }) =>
    Boolean(error?.isAxiosError),
}));

jest.mock('./utils', () => ({
  ...jest.requireActual('./utils'),
  getOrchestratorApi: jest.fn(),
  getRequestConfigOption: jest.fn(),
}));

const mockedGetOrchestratorApi = jest.mocked(getOrchestratorApi);
const mockedGetRequestConfigOption = jest.mocked(getRequestConfigOption);

describe('createGetWorkflowParamsAction', () => {
  const discoveryService = {} as any;
  const authService = {} as any;
  const reqConfigOption = {
    headers: {
      Authorization: 'Bearer token',
    },
  };
  const mockApi = {
    getWorkflowOverviewById: jest.fn(),
    getWorkflowInputSchemaById: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetOrchestratorApi.mockResolvedValue(mockApi as any);
    mockedGetRequestConfigOption.mockResolvedValue(reqConfigOption as any);
  });

  it('throws when workflow_id is missing', async () => {
    const action = createGetWorkflowParamsAction(discoveryService, authService);
    const ctx = createMockActionContext({
      input: {},
    });

    await expect(action.handler(ctx as any)).rejects.toThrow(
      'Missing workflow_id required input parameter.',
    );
    expect(mockedGetOrchestratorApi).not.toHaveBeenCalled();
  });

  it('outputs fallback title, empty description, and indented parameters yaml', async () => {
    const workflowId = 'greeting';
    const inputSchema = {
      type: 'object',
      properties: {
        greeting: {
          type: 'string',
        },
      },
    } satisfies JsonObject;

    mockApi.getWorkflowOverviewById.mockResolvedValue({
      data: {
        name: '',
      },
    });
    mockApi.getWorkflowInputSchemaById.mockResolvedValue({
      data: {
        inputSchema,
      },
    });

    const action = createGetWorkflowParamsAction(discoveryService, authService);
    const ctx = createMockActionContext({
      input: {
        workflow_id: workflowId,
        indent: 4,
      },
    });

    await action.handler(ctx);

    expect(mockApi.getWorkflowOverviewById).toHaveBeenCalledWith(
      workflowId,
      reqConfigOption,
    );
    expect(mockApi.getWorkflowInputSchemaById).toHaveBeenCalledWith(
      workflowId,
      undefined,
      reqConfigOption,
    );
    expect(ctx.output).toHaveBeenCalledWith('title', workflowId);
    expect(ctx.output).toHaveBeenCalledWith('description', '');

    const parametersOutput = (ctx.output as jest.Mock).mock.calls.find(
      ([key]) => key === 'parameters',
    )?.[1];
    expect(parametersOutput).toContain('greeting:');
    expect(parametersOutput.startsWith('\n    -')).toBe(true);
  });

  it('outputs empty parameters when the schema does not define properties', async () => {
    mockApi.getWorkflowOverviewById.mockResolvedValue({
      data: {
        name: 'Greeting workflow',
        description: 'Collect greeting details',
      },
    });
    mockApi.getWorkflowInputSchemaById.mockResolvedValue({
      data: {
        inputSchema: {},
      },
    });

    const action = createGetWorkflowParamsAction(discoveryService, authService);
    const ctx = createMockActionContext({
      input: {
        workflow_id: 'greeting',
      },
    });

    await action.handler(ctx);

    expect(ctx.output).toHaveBeenCalledWith('title', 'Greeting workflow');
    expect(ctx.output).toHaveBeenCalledWith(
      'description',
      'Collect greeting details',
    );
    expect(ctx.output).toHaveBeenCalledWith('parameters', '{}');
  });

  it('throws when the workflow is not found', async () => {
    mockApi.getWorkflowOverviewById.mockResolvedValue({
      data: undefined,
    });

    const action = createGetWorkflowParamsAction(discoveryService, authService);
    const ctx = createMockActionContext({
      input: {
        workflow_id: 'missing-workflow',
      },
    });

    await expect(action.handler(ctx)).rejects.toThrow(
      'Can not find workflow missing-workflow',
    );
  });

  it('maps axios-shaped errors to orchestrator error details', async () => {
    mockApi.getWorkflowOverviewById.mockRejectedValue({
      isAxiosError: true,
      response: {
        data: {
          error: {
            message: 'Workflow service unavailable',
            name: 'UpstreamWorkflowError',
          },
        },
      },
    });

    const action = createGetWorkflowParamsAction(discoveryService, authService);
    const ctx = createMockActionContext({
      input: {
        workflow_id: 'greeting',
      },
    });

    await expect(action.handler(ctx)).rejects.toMatchObject({
      message: 'Workflow service unavailable',
      name: 'UpstreamWorkflowError',
    });
  });
});
