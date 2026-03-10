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
import { createExecuteTemplateAction } from './createExecuteTemplateAction';
import { actionsRegistryServiceMock } from '@backstage/backend-test-utils/alpha';
import { mockServices } from '@backstage/backend-test-utils';
import { ScaffolderClient } from '@backstage/plugin-scaffolder-common';

describe('createExecuteTemplateAction', () => {
  const mockScaffolderClient = {
    scaffold: jest.fn(),
  } as unknown as ScaffolderClient;

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should scaffold a template and return the taskId', async () => {
    const mockActionsRegistry = actionsRegistryServiceMock();
    const mockAuth = mockServices.auth.mock();
    mockAuth.getPluginRequestToken.mockResolvedValue({ token: 'test-token' });
    (mockScaffolderClient.scaffold as jest.Mock).mockResolvedValue({
      taskId: 'task-abc-123',
    });

    createExecuteTemplateAction({
      actionsRegistry: mockActionsRegistry,
      scaffolderClient: mockScaffolderClient,
      auth: mockAuth,
    });

    const result = await mockActionsRegistry.invoke({
      id: 'test:execute-template',
      input: {
        templateRef: 'template:default/my-template',
        values: { name: 'my-app', owner: 'team-a' },
      },
    });

    expect(result.output).toEqual({ taskId: 'task-abc-123' });

    expect(mockScaffolderClient.scaffold).toHaveBeenCalledWith(
      {
        templateRef: 'template:default/my-template',
        values: { name: 'my-app', owner: 'team-a' },
      },
      { token: 'test-token' },
    );
  });

  it('should pass the caller credentials to the scaffolder service', async () => {
    const mockActionsRegistry = actionsRegistryServiceMock();
    const mockAuth = mockServices.auth.mock();
    mockAuth.getPluginRequestToken.mockResolvedValue({ token: 'test-token' });
    (mockScaffolderClient.scaffold as jest.Mock).mockResolvedValue({
      taskId: 'task-xyz',
    });

    createExecuteTemplateAction({
      actionsRegistry: mockActionsRegistry,
      scaffolderClient: mockScaffolderClient,
      auth: mockAuth,
    });

    await mockActionsRegistry.invoke({
      id: 'test:execute-template',
      input: {
        templateRef: 'template:default/my-template',
        values: {},
      },
    });

    expect(mockScaffolderClient.scaffold).toHaveBeenCalledWith(
      expect.anything(),
      { token: 'test-token' },
    );
  });

  it('should forward empty values to the scaffolder service', async () => {
    const mockActionsRegistry = actionsRegistryServiceMock();
    const mockAuth = mockServices.auth.mock();
    mockAuth.getPluginRequestToken.mockResolvedValue({ token: 'test-token' });
    (mockScaffolderClient.scaffold as jest.Mock).mockResolvedValue({
      taskId: 'task-empty',
    });

    createExecuteTemplateAction({
      actionsRegistry: mockActionsRegistry,
      scaffolderClient: mockScaffolderClient,
      auth: mockAuth,
    });

    const result = await mockActionsRegistry.invoke({
      id: 'test:execute-template',
      input: {
        templateRef: 'template:default/empty-template',
        values: {},
      },
    });

    expect(result.output).toEqual({ taskId: 'task-empty' });
    expect(mockScaffolderClient.scaffold).toHaveBeenCalledWith(
      {
        templateRef: 'template:default/empty-template',
        values: {},
      },
      { token: 'test-token' },
    );
  });

  it('should propagate errors from the scaffolder service', async () => {
    const mockActionsRegistry = actionsRegistryServiceMock();
    const mockAuth = mockServices.auth.mock();
    mockAuth.getPluginRequestToken.mockResolvedValue({ token: 'test-token' });
    (mockScaffolderClient.scaffold as jest.Mock).mockRejectedValue(
      new Error('Permission denied'),
    );

    createExecuteTemplateAction({
      actionsRegistry: mockActionsRegistry,
      scaffolderClient: mockScaffolderClient,
      auth: mockAuth,
    });

    await expect(
      mockActionsRegistry.invoke({
        id: 'test:execute-template',
        input: {
          templateRef: 'template:default/my-template',
          values: { name: 'my-app' },
        },
      }),
    ).rejects.toThrow('Permission denied');
  });
});
