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

import { createRunWorkflowAction } from './runWorkflow';
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

describe('createRunWorkflowAction', () => {
  const discoveryService = {} as any;
  const authService = {} as any;
  const reqConfigOption = {
    headers: {
      Authorization: 'Bearer token',
    },
  };
  const mockApi = {
    executeWorkflow: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetOrchestratorApi.mockResolvedValue(mockApi as any);
    mockedGetRequestConfigOption.mockResolvedValue(reqConfigOption as any);
  });

  it('throws when the template entity is missing', async () => {
    const action = createRunWorkflowAction(discoveryService, authService);
    const ctx = createMockActionContext({
      input: {
        workflow_id: 'greeting',
        parameters: {},
      },
    });

    await expect(action.handler(ctx)).rejects.toThrow('No template entity');
    expect(mockedGetOrchestratorApi).not.toHaveBeenCalled();
  });

  it('throws when workflow_id is missing', async () => {
    const action = createRunWorkflowAction(discoveryService, authService);
    const ctx = createMockActionContext({
      input: {
        parameters: {},
      },
      templateInfo: {
        entityRef: 'component:default/sample-service',
      },
    });

    await expect(action.handler(ctx as any)).rejects.toThrow(
      "Missing required 'workflow_id' input. Ensure that the step invoking the 'orchestrator:workflow:run' action includes an explicit 'workflow_id' field in its input.",
    );
    expect(mockedGetOrchestratorApi).not.toHaveBeenCalled();
  });

  it('short-circuits dry runs before creating the orchestrator client', async () => {
    const loggerInfo = jest.fn();
    const action = createRunWorkflowAction(discoveryService, authService);
    const ctx = createMockActionContext({
      input: {
        workflow_id: 'greeting',
        parameters: {
          greeting: 'hello',
        },
      },
      templateInfo: {
        entityRef: 'component:default/sample-service',
      },
      logger: {
        ...createMockActionContext().logger,
        info: loggerInfo,
      },
    });
    (ctx as typeof ctx & { isDryRun: boolean }).isDryRun = true;

    await action.handler(ctx);

    expect(loggerInfo).toHaveBeenCalledWith('Dry run complete');
    expect(mockedGetOrchestratorApi).not.toHaveBeenCalled();
    expect(mockedGetRequestConfigOption).not.toHaveBeenCalled();
    expect(mockApi.executeWorkflow).not.toHaveBeenCalled();
  });

  it('executes the workflow and outputs the instance url derived from the template entity', async () => {
    mockApi.executeWorkflow.mockResolvedValue({
      data: {
        id: 'instance-123',
      },
    });

    const action = createRunWorkflowAction(discoveryService, authService);
    const ctx = createMockActionContext({
      input: {
        workflow_id: 'greeting',
        parameters: {
          greeting: 'hello',
        },
      },
      templateInfo: {
        entityRef: 'component:default/sample-service',
      },
    });

    await action.handler(ctx);

    expect(mockApi.executeWorkflow).toHaveBeenCalledWith(
      'greeting',
      {
        inputData: {
          greeting: 'hello',
        },
        targetEntity: 'component:default/sample-service',
      },
      reqConfigOption,
    );
    expect(ctx.output).toHaveBeenCalledWith(
      'instanceUrl',
      '/orchestrator/entity/default/component/sample-service/greeting/instance-123',
    );
  });

  it('uses an explicit target entity when provided', async () => {
    mockApi.executeWorkflow.mockResolvedValue({
      data: {
        id: 'instance-456',
      },
    });

    const action = createRunWorkflowAction(discoveryService, authService);
    const ctx = createMockActionContext({
      input: {
        workflow_id: 'greeting',
        target_entity: 'resource:prod/database',
        parameters: {
          greeting: 'hello',
        },
      },
      templateInfo: {
        entityRef: 'component:default/sample-service',
      },
    });

    await action.handler(ctx);

    expect(mockApi.executeWorkflow).toHaveBeenCalledWith(
      'greeting',
      expect.objectContaining({
        targetEntity: 'resource:prod/database',
      }),
      reqConfigOption,
    );
    expect(ctx.output).toHaveBeenCalledWith(
      'instanceUrl',
      '/orchestrator/entity/prod/resource/database/greeting/instance-456',
    );
  });

  it('maps axios-shaped execution errors', async () => {
    mockApi.executeWorkflow.mockRejectedValue({
      isAxiosError: true,
      response: {
        data: {
          error: {
            message: 'Workflow start failed',
            name: 'WorkflowExecutionError',
          },
        },
      },
    });

    const action = createRunWorkflowAction(discoveryService, authService);
    const ctx = createMockActionContext({
      input: {
        workflow_id: 'greeting',
        parameters: {},
      },
      templateInfo: {
        entityRef: 'component:default/sample-service',
      },
    });

    await expect(action.handler(ctx)).rejects.toMatchObject({
      message: 'Workflow start failed',
      name: 'WorkflowExecutionError',
    });
  });
});
